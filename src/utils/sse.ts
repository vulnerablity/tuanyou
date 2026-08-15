//+ SSE（Server-Sent Events）连接工具
//+ 基于 fetch + ReadableStream 实现，支持自定义 Authorization header
//+ （原生 EventSource 不支持自定义 header，后端要求 Authorization Bearer token）
//+
//+ 设计要点：
//+   1. 连接地址：/api/v1/messages/stream
//+   2. Token 传递：Authorization: Bearer <token> 请求头
//+   3. 自动重连：指数退避（1s → 2s → 4s → ... → 30s 上限）
//+   4. 消息解析：按 SSE 协议解析 event:/data: 行，支持多行 data
//+   5. 心跳处理：: 开头的注释行，忽略
//+   6. 重连成功回调：仅刷新未读数，不主动刷新列表
//+   7. Mock 模式降级：用 setTimeout 模拟推送，避免真实连接
//+
//+ 数据格式（对齐接口文档）：
//+   普通消息：event:like/follow/comment/collect/signup/...
//+             data:{"content":"消息正文","senderId":123}
//+   回复评论：event:comment-reply
//+             data:{"replyId":456,"replyToId":123,"content":"回复内容","senderId":789}
//+   未读数：event:unread
//+           data:{"total":5,"interactions":4,"system":1}
//+   心跳：:ping（注释行，忽略）
export type SSEEventHandler = (event: string, data: Record<string, any>) => void
export type SSEReconnectHandler = () => void

//+ 全局状态
let abortController: AbortController | null = null
let isConnecting = false
let isConnected = false
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000
const MAX_RECONNECT_DELAY = 30000
let eventHandlers: Set<SSEEventHandler> = new Set()
let reconnectHandlers: Set<SSEReconnectHandler> = new Set()
let currentToken: string | null = null

//+ Mock 模式下用 setTimeout 模拟 SSE 推送
let mockTimer: ReturnType<typeof setTimeout> | null = null
const isMock = process.env.TARO_APP_USE_MOCK === 'true'

//+ 获取 SSE 连接地址
function getStreamUrl(): string {
  const base = process.env.TARO_APP_API_BASE || 'http://localhost:84/api/v1'
  const cleanBase = base.replace(/\/api\/v1$/, '')
  return `${cleanBase}/api/v1/messages/stream`
}

//+ 解析一条完整的 SSE 消息（按空行分隔的块）
//+ 格式：event:xxx\ndata:{json}\n\n
function parseSSEChunk(chunk: string): { event: string; data: Record<string, any> } | null {
  const lines = chunk.split('\n')
  let event = 'message'
  const dataLines: string[] = []

  for (const line of lines) {
    //+ 忽略注释行（心跳 :ping）
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      //+ data: 后面的内容（去掉前缀和可选空格）
      dataLines.push(line.slice(5).replace(/^\s/, ''))
    }
  }

  if (dataLines.length === 0) return null

  try {
    const dataStr = dataLines.join('\n')
    const data = JSON.parse(dataStr)
    return { event, data }
  } catch {
    return null
  }
}

//+ ==================== Mock 模式：模拟 SSE 推送 ====================
const MOCK_EVENTS = [
  { event: 'like', data: { content: '赞了你的笔记《千岛湖环线骑行攻略》', senderId: 101 } },
  { event: 'follow', data: { content: '关注了你', senderId: 102 } },
  { event: 'comment', data: { content: '你的《雨崩村徒步》收到了一条新评论：风景太美了', senderId: 103 } },
  { event: 'collect', data: { content: '收藏了你的攻略《青海湖自驾三日游》', senderId: 104 } },
  { event: 'comment-reply', data: { replyId: 501, replyToId: 123, content: '回复了你：谢谢分享', senderId: 105 } },
  { event: 'signup', data: { content: '你报名的活动《四姑娘山大峰攀登》将于 2026-08-20 开始', senderId: null } },
  { event: 'signup-success', data: { content: '你已成功报名活动《四姑娘山大峰攀登》', senderId: null } },
  { event: 'activity-start', data: { content: '活动《四姑娘山大峰攀登》2026-08-20 开始', senderId: null } },
  { event: 'content-deleted', data: { content: '你的笔记《已删除的笔记》已被删除', senderId: null } },
  { event: 'content-offline', data: { content: '你的攻略《违规攻略》已被下架', senderId: null } },
] as const

function startMockSSE(): void {
  if (mockTimer) return

  //+ 立即标记连接成功
  isConnecting = false
  isConnected = true
  reconnectDelay = 1000
  reconnectHandlers.forEach(handler => {
    try {
      handler()
    } catch (e) {
      console.error('[SSE-Mock] reconnect handler error:', e)
    }
  })

  //+ 推送一次：先消息事件，300ms 后 unread 事件（对齐推送顺序）
  const pushOnce = () => {
    const randomEvent = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)]
    console.log('[SSE-Mock] 推送消息事件:', randomEvent.event)
    eventHandlers.forEach(handler => {
      try {
        handler(randomEvent.event, { ...randomEvent.data })
      } catch (e) {
        console.error('[SSE-Mock] handler error:', e)
      }
    })
    setTimeout(() => {
      const mockUnread = {
        total: Math.floor(Math.random() * 10) + 1,
        interactions: Math.floor(Math.random() * 7) + 1,
        system: Math.floor(Math.random() * 3) + 1,
      }
      console.log('[SSE-Mock] 推送 unread 事件:', mockUnread)
      eventHandlers.forEach(handler => {
        try {
          handler('unread', mockUnread)
        } catch (e) {
          console.error('[SSE-Mock] unread handler error:', e)
        }
      })
    }, 300)
  }

  //+ 10 秒后首次推送，之后每 20-40 秒随机推送
  const scheduleNext = () => {
    const delay = 20000 + Math.random() * 20000
    mockTimer = setTimeout(() => {
      pushOnce()
      scheduleNext()
    }, delay)
  }

  setTimeout(() => {
    pushOnce()
    scheduleNext()
  }, 10000)
}

function stopMockSSE(): void {
  if (mockTimer) {
    clearTimeout(mockTimer)
    mockTimer = null
  }
  isConnected = false
}

//+ ==================== 真实模式：fetch + ReadableStream ====================
//+ 用 fetch 建立 SSE 连接，支持 Authorization header
//+ 通过 ReadableStream 读取响应体，按空行分割消息块
async function connectRealSSE(token: string): Promise<void> {
  abortController = new AbortController()
  const url = getStreamUrl()

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache',
      },
      signal: abortController.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('响应体为空')
    }

    console.log('[SSE] 连接成功')
    isConnecting = false
    isConnected = true
    reconnectDelay = 1000
    reconnectHandlers.forEach(handler => {
      try {
        handler()
      } catch (e) {
        console.error('[SSE] reconnect handler error:', e)
      }
    })

    //+ 读取流
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('[SSE] 流结束')
        break
      }

      buffer += decoder.decode(value, { stream: true })

      //+ 按空行（\n\n）分割消息块
      let separatorIndex: number
      while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 2)

        const parsed = parseSSEChunk(chunk)
        if (parsed) {
          eventHandlers.forEach(handler => {
            try {
              handler(parsed.event, parsed.data)
            } catch (e) {
              console.error('[SSE] handler error:', e)
            }
          })
        }
      }
    }

    //+ 流正常结束，标记断开并尝试重连
    isConnected = false
    scheduleReconnect()
  } catch (error: any) {
    console.warn('[SSE] 连接错误:', error?.message || error)
    isConnecting = false
    isConnected = false
    //+ AbortError 是主动断开，不重连
    if (error?.name !== 'AbortError') {
      scheduleReconnect()
    }
  }
}

//+ 调度重连（指数退避）
function scheduleReconnect(): void {
  if (reconnectTimer) return
  if (!currentToken) return

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (currentToken) {
      connectSSE(currentToken)
    }
    //+ 指数退避
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
  }, reconnectDelay)
}

//+ 建立 SSE 连接
export function connectSSE(token: string): void {
  if (!token) return
  currentToken = token

  //+ 关闭已存在的连接
  if (abortController || mockTimer) {
    disconnectSSE()
    //+ disconnectSSE 会清空 currentToken，重新设置
    currentToken = token
  }

  //+ Mock 模式：用 setTimeout 模拟推送，不走真实连接
  if (isMock) {
    console.log('[SSE] Mock 模式启动模拟推送')
    startMockSSE()
    return
  }

  //+ 真实模式：fetch + ReadableStream
  isConnecting = true
  connectRealSSE(token)
}

//+ 主动断开 SSE 连接
export function disconnectSSE(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  //+ Mock 模式清理
  stopMockSSE()
  //+ 真实模式清理：abort 请求
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  isConnecting = false
  isConnected = false
  reconnectDelay = 1000
  eventHandlers.clear()
  reconnectHandlers.clear()
  currentToken = null
}

//+ 注册事件处理器
export function onSSEEvent(handler: SSEEventHandler): () => void {
  eventHandlers.add(handler)
  return () => {
    eventHandlers.delete(handler)
  }
}

//+ 注册重连成功处理器
export function onSSEReconnect(handler: SSEReconnectHandler): () => void {
  reconnectHandlers.add(handler)
  return () => {
    reconnectHandlers.delete(handler)
  }
}

//+ 获取当前连接状态
export function getSSEState(): { connected: boolean; connecting: boolean } {
  return {
    connected: isConnected,
    connecting: isConnecting
  }
}
