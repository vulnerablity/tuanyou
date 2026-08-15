//+ 消息模块Mock数据与路由
//+ 对齐 docs/默认模块.md：
//+   GET    /messages/interactions          互动消息列表（分页）
//+   GET    /messages/system                系统通知列表（分页）
//+   GET    /messages/unread-count          未读消息数
//+   PUT    /messages/{id}/read             标记单条已读
//+   PUT    /messages/read-all              标记全部已读
//+   POST   /messages/interactions/{id}/reply  回复互动消息
//+   DELETE /messages/{id}                  删除消息
//+ 数据格式为后端 DTO（msgType/content/sendTime/isRead/sender）
//+ 由 apis/message.ts 适配器转换为前端 InteractionMessage / SystemMessage 实体
//+ 可变缓存：支持已读/回复/删除后状态持久（页面内多次请求结果一致）
import { randomInt, randomItem, successResponse, errorResponse, createPageResponse } from './utils'
import { mockUsers } from './user'
import type { MessageDTO } from '@/types'

//+ 生成 "YYYY-MM-DD HH:mm:ss" 格式时间（n 分钟前）
function minutesAgo(m: number): string {
  const d = new Date(Date.now() - m * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

//+ 互动消息内容模板（含目标标题《》，用于 normalizeInteraction 提取）
const interactionTemplates: Array<{ type: number; content: string }> = [
  { type: 1, content: '赞了你的笔记《千岛湖环线骑行攻略》' },
  { type: 1, content: '赞了你的攻略《青海湖自驾三日游详细路线》' },
  { type: 1, content: '收藏了你的笔记《雨崩村徒步：梅里雪山脚下的世外桃源》' },
  { type: 1, content: '收藏了你的攻略《华山攀岩安全指南》' },
  { type: 1, content: '关注了你' },
  { type: 1, content: '你的《千岛湖环线骑行攻略》收到了一条新评论：这个路线太棒了！请问路上有补给点吗？' },
  { type: 1, content: '你的《青海湖日出》收到了一条新评论：图片拍得真好看！' },
  { type: 1, content: '你的《雨崩村徒步：梅里雪山脚下的世外桃源》收到了一条新评论：雨崩真的像世外桃源，梅里雪山太神圣了' },
  { type: 1, content: '赞了你的笔记《西湖晨跑偶遇白鹭》' },
  { type: 1, content: '收藏了你的笔记《黄山云海日出全记录》' },
  { type: 1, content: '关注了你' },
  { type: 1, content: '你的《上海滨江骑行道40公里全攻略》收到了一条新评论：南浦大桥那段风景最漂亮' },
]

//+ 系统通知内容模板
const systemTemplates: string[] = [
  '欢迎使用途游！在这里你可以记录旅途中的点点滴滴，分享你的旅行故事给更多热爱出行的人。',
  '你的笔记《千岛湖环线骑行攻略》已通过审核，现在其他用户可以看到了。',
  '系统将于 2026-08-15 凌晨 2:00-4:00 进行维护升级，届时将无法访问，请提前做好安排。',
  '你的账号安全等级已提升。',
  '你报名的活动《四姑娘山大峰攀登》将于 2026-08-20 开始',
  '系统维护通知：本周日 02:00-04:00 服务器升级，期间部分功能不可用',
  '你已成功报名活动《四姑娘山大峰攀登》，名额有限请按时参加',
  '活动《四姑娘山大峰攀登》2026-08-20 开始，欢迎报名参加',
]

//+ 生成互动消息缓存（msgType=1）
function seedInteractions(): MessageDTO[] {
  const count = randomInt(8, 15)
  const result: MessageDTO[] = []
  for (let i = 0; i < count; i++) {
    const tpl = randomItem(interactionTemplates)
    const sender = mockUsers[(i + 1) % mockUsers.length]
    const isRead = i < count / 2 ? 1 : 0 //+ 一半已读一半未读
    result.push({
      id: String(100 + i),
      msgType: 1,
      content: tpl.content,
      sendTime: minutesAgo(randomInt(10, 600) + i * 30),
      isRead,
      sender: { id: sender.id, nickname: sender.nickname, avatar: sender.avatar }
    })
  }
  //+ 按时间倒序
  result.sort((a, b) => b.sendTime.localeCompare(a.sendTime))
  return result
}

//+ 生成系统消息缓存（msgType=2）
function seedSystemMessages(): MessageDTO[] {
  const count = randomInt(5, 10)
  const result: MessageDTO[] = []
  for (let i = 0; i < count; i++) {
    const content = systemTemplates[i % systemTemplates.length]
    const isRead = i < count / 2 ? 1 : 0
    //+ 部分系统消息有 sender（如报名通知），部分没有
    const hasSender = Math.random() > 0.6
    const sender = hasSender ? (() => {
      const u = mockUsers[(i + 3) % mockUsers.length]
      return { id: u.id, nickname: u.nickname, avatar: u.avatar }
    })() : null
    result.push({
      id: String(200 + i),
      msgType: 2,
      content,
      sendTime: minutesAgo(randomInt(30, 800) + i * 60),
      isRead,
      sender
    })
  }
  result.sort((a, b) => b.sendTime.localeCompare(a.sendTime))
  return result
}

//+ 可变缓存（模块级单例，页面内多次请求结果一致）
let interactionCache: MessageDTO[] | null = null
let systemCache: MessageDTO[] | null = null

function getInteractionCache(): MessageDTO[] {
  if (!interactionCache) interactionCache = seedInteractions()
  return interactionCache
}

function getSystemCache(): MessageDTO[] {
  if (!systemCache) systemCache = seedSystemMessages()
  return systemCache
}

//+ 在两个缓存中按 id 查找消息
function findMessageAnywhere(id: string): MessageDTO | null {
  const all = [...getInteractionCache(), ...getSystemCache()]
  return all.find(m => m.id === id) || null
}

//+ 消息模块Mock路由映射
export const messageMockRoutes: Record<string, (data?: any, url?: string) => any> = {
  //+ 获取互动消息列表（分页）
  'GET /api/v1/messages/interactions': (data) => {
    const page = Number(data?.page) || 1
    const size = Math.min(Number(data?.size) || 10, 100)
    const list = getInteractionCache()
    return successResponse(createPageResponse(list, page, size))
  },

  //+ 获取系统通知列表（分页）
  'GET /api/v1/messages/system': (data) => {
    const page = Number(data?.page) || 1
    const size = Math.min(Number(data?.size) || 10, 100)
    const list = getSystemCache()
    return successResponse(createPageResponse(list, page, size))
  },

  //+ 获取未读消息数
  'GET /api/v1/messages/unread-count': () => {
    const interactions = getInteractionCache().filter(m => m.isRead === 0).length
    const system = getSystemCache().filter(m => m.isRead === 0).length
    return successResponse({
      total: interactions + system,
      interactions,
      system
    })
  },

  //+ 标记单条消息已读
  'PUT /api/v1/messages/:id/read': (_, url) => {
    const id = (url as string).split('/').slice(-2, -1)[0] || ''
    const msg = findMessageAnywhere(id)
    if (!msg) return errorResponse('消息不存在', 404)
    msg.isRead = 1
    return successResponse({})
  },

  //+ 标记全部消息已读
  'PUT /api/v1/messages/read-all': () => {
    let updated = 0
    getInteractionCache().forEach(m => {
      if (m.isRead === 0) { m.isRead = 1; updated++ }
    })
    getSystemCache().forEach(m => {
      if (m.isRead === 0) { m.isRead = 1; updated++ }
    })
    return successResponse({ updated })
  },

  //+ 回复互动消息（评论回复）
  'POST /api/v1/messages/interactions/:id/reply': (data, url) => {
    const id = (url as string).split('/').slice(-2, -1)[0] || ''
    const msg = findMessageAnywhere(id)
    if (!msg) return errorResponse('消息不存在', 404)
    const content = String(data?.content ?? '').trim()
    if (!content) return errorResponse('回复内容不能为空', 400)
    if (content.length > 300) return errorResponse('回复内容最长 300 字', 400)
    //+ 返回回复结果（不影响缓存列表，仅返回新回复的 DTO）
    return successResponse({
      id: String(randomInt(1000, 9999)),
      replyToId: id,
      content,
      sendTime: minutesAgo(0)
    })
  },

  //+ 删除消息
  'DELETE /api/v1/messages/:id': (_, url) => {
    const id = (url as string).split('/').pop() || ''
    //+ 从互动缓存中删除
    let removed = false
    const interactions = getInteractionCache()
    const iIdx = interactions.findIndex(m => m.id === id)
    if (iIdx >= 0) {
      interactions.splice(iIdx, 1)
      removed = true
    }
    //+ 从系统缓存中删除
    if (!removed) {
      const systems = getSystemCache()
      const sIdx = systems.findIndex(m => m.id === id)
      if (sIdx >= 0) {
        systems.splice(sIdx, 1)
        removed = true
      }
    }
    if (!removed) return errorResponse('消息不存在', 404)
    return successResponse({})
  }
}
