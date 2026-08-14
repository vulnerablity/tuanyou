//+ 评论模块Mock数据与路由
//+ 对齐 docs/默认模块.md：POST/GET /comments、POST /comments/like/:id、DELETE /comments/:id、GET /comments/replies/:id
//+ 数据格式为后端 DTO（user/replyToNickname/replyCount），由 apis/comment.ts 适配器转换为前端 Comment 实体
//+ 可变缓存：支持发表/点赞/删除后状态持久（页面内多次请求结果一致）
import { randomInt, randomItem, successResponse, errorResponse, createPageResponse } from './utils'
import { mockUsers } from './user'
import type { CommentDTO } from '@/types'

//+ 目标类型常量（与 types/api.ts COMMENT_TARGET_TYPE 一致）
const NOTE = 1
const GUIDE = 2

//+ 当前登录用户（mockUsers[0] 模拟当前登录用户，用于 canDelete 判定）
const currentUser = mockUsers[0]

//+ 后端 DTO 结构（与 types/api.ts CommentDTO 对齐，含 mock 内部定位字段 _targetType/_targetId）
interface CommentUserDTO { id: string; nickname: string; avatar: string }
interface MockCommentDTO {
  id: string
  user: CommentUserDTO
  content: string
  likeCount: number
  isLiked: boolean
  replyToId: string | ''
  replyToNickname: string | ''
  createdAt: string
  replyCount?: number
  replies?: MockCommentDTO[]
  canDelete: boolean
  //+ mock 内部字段：定位所属目标（不返回给前端，序列化前剔除）
  _targetType: number
  _targetId: string
}

//+ 一级评论缓存：key = `${targetType}_${targetId}` → 一级评论数组
const commentCache = new Map<string, MockCommentDTO[]>()

//+ 自增评论 ID
let commentIdSeq = 5000
function nextCommentId() { return String(++commentIdSeq) }

//+ 评论内容模板
const firstLevelContents = [
  '千岛湖环线太美了！沿着湖边骑行，微风拂面，整个人都治愈了。',
  '今天在西湖边晨跑，偶遇一群白鹭，感觉像在画中跑步。',
  '周末去爬了黄山，虽然累但云海真的绝了！强烈推荐！',
  '上海滨江骑行道太适合周末休闲骑了，从杨浦到徐汇全程40公里。',
  '第一次参加越野跑，10公里差点没坚持下来，但冲线那一刻太爽了！',
  '装备分享，这双越野鞋性价比很高，适合新手入门。',
  '路线推荐，避开人流高峰，享受宁静时光。',
  '风景太美了，值得一去再去！'
]
const replyContents = [
  '镇上租车很方便，提前在平台预订就好。',
  '推荐电动车，骑起来不累，环湖公路有专门慢行道。',
  '有没有具体的路线推荐？打算周末去。',
  '几点去人比较少？我也想试试。',
  '我建议上山索道，下山徒步，保护膝盖又能体验风景。',
  '住山上还是山下？想看日出的话有什么建议？',
  '南浦大桥那段风景最漂亮，可以看到整个陆家嘴。',
  '求问有没有租车点？还没买自行车。',
  '记得做好拉伸，越野跑对肌肉要求很高，别受伤了。',
  '下次可以带点能量胶，到后半程体力跟不上会好很多。'
]

//+ 生成 "YYYY-MM-DD HH:mm:ss" 格式时间（n 分钟前）
function minutesAgo(m: number): string {
  const d = new Date(Date.now() - m * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

//+ 构造一条评论 DTO
function makeComment(
  user: typeof mockUsers[0],
  content: string,
  likeCount: number,
  isLiked: boolean,
  replyToId: string | '',
  replyToNickname: string | '',
  createdAt: string,
  targetType: number,
  targetId: string
): MockCommentDTO {
  return {
    id: nextCommentId(),
    user: { id: user.id, nickname: user.nickname, avatar: user.avatar },
    content,
    likeCount,
    isLiked,
    replyToId,
    replyToNickname,
    createdAt,
    canDelete: user.id === currentUser.id,
    _targetType: targetType,
    _targetId: targetId
  }
}

//+ 为指定目标生成种子一级评论（含二级回复）
function seedComments(targetType: number, targetId: string): MockCommentDTO[] {
  //+ 决定生成数量（基于 targetId 哈希，保证同一目标稳定）
  const seed = Number(targetId) || 1
  const count = 3 + (seed % 5) //+ 3~7 条一级评论
  const result: MockCommentDTO[] = []

  for (let i = 0; i < count; i++) {
    const author = mockUsers[(seed + i) % mockUsers.length]
    const firstLevel = makeComment(
      author,
      randomItem(firstLevelContents),
      randomInt(0, 25),
      false,
      '',
      '',
      minutesAgo(randomInt(60, 600) + i * 30),
      targetType,
      targetId
    )

    //+ 生成 0~5 条二级回复
    const replyCount = randomInt(0, 5)
    const replies: MockCommentDTO[] = []
    for (let j = 0; j < replyCount; j++) {
      const replier = mockUsers[(seed + i + j + 1) % mockUsers.length]
      //+ 部分回复 @ 另一个二级评论作者
      const atAnother = j > 0 && Math.random() > 0.6
      const repliedUser = atAnother ? replies[j - 1].user : author
      replies.push(makeComment(
        replier,
        randomItem(replyContents),
        randomInt(0, 12),
        false,
        firstLevel.id,
        repliedUser.nickname,
        minutesAgo(randomInt(10, 300) - j * 5),
        targetType,
        targetId
      ))
    }
    //+ 二级回复按热度排序（模拟"热度最高"前置）
    replies.sort((a, b) => b.likeCount - a.likeCount)

    firstLevel.replyCount = replies.length
    firstLevel.replies = replies
    result.push(firstLevel)
  }

  //+ 一级评论按热度排序（模拟"前2条热评"前置）
  result.sort((a, b) => b.likeCount - a.likeCount)
  return result
}

//+ 获取或创建某目标的一级评论缓存
function getOrCreate(targetType: number, targetId: string): MockCommentDTO[] {
  const key = `${targetType}_${targetId}`
  if (!commentCache.has(key)) {
    commentCache.set(key, seedComments(targetType, targetId))
  }
  return commentCache.get(key)!
}

//+ 序列化一级评论（剔除内部字段，保留 replies 前2条热度 + replyCount）
function serializeFirstLevel(c: MockCommentDTO): CommentDTO {
  const allReplies = c.replies || []
  //+ 文档规则：热度最高二级评论点赞数 >10 时返回热度最高的2条，否则返回空数组
  const topReplyLikes = allReplies[0]?.likeCount || 0
  const inlineReplies = topReplyLikes > 10 ? allReplies.slice(0, 2) : []
  return {
    id: c.id,
    user: c.user,
    content: c.content,
    likeCount: c.likeCount,
    isLiked: c.isLiked,
    replyToId: c.replyToId,
    replyToNickname: c.replyToNickname,
    createdAt: c.createdAt,
    replyCount: c.replyCount ?? allReplies.length,
    replies: inlineReplies.map(serializeReply),
    canDelete: c.canDelete
  }
}

//+ 序列化二级评论（无嵌套 replies）
function serializeReply(c: MockCommentDTO): CommentDTO {
  return {
    id: c.id,
    user: c.user,
    content: c.content,
    likeCount: c.likeCount,
    isLiked: c.isLiked,
    replyToId: c.replyToId,
    replyToNickname: c.replyToNickname,
    createdAt: c.createdAt,
    canDelete: c.canDelete
  }
}

//+ 在所有缓存中按 id 查找评论（一级或二级），返回 { comment, parent? }
function findCommentAnywhere(id: string): { comment: MockCommentDTO; parent: MockCommentDTO | null } | null {
  for (const list of commentCache.values()) {
    for (const c of list) {
      if (c.id === id) return { comment: c, parent: null }
      const reply = c.replies?.find(r => r.id === id)
      if (reply) return { comment: reply, parent: c }
    }
  }
  return null
}

//+ 评论模块Mock路由映射
export const commentMockRoutes: Record<string, (data?: any, url?: string) => any> = {
  //+ 发表评论
  'POST /api/v1/comments': (data) => {
    const targetType = Number(data?.targetType)
    if (targetType !== NOTE && targetType !== GUIDE) {
      return errorResponse('参数错误：targetType 非 1/2', 2001)
    }
    const targetId = String(data?.targetId ?? '')
    const content = String(data?.content ?? '').trim()
    if (!content) return errorResponse('评论内容不能为空', 400)
    if (content.length > 300) return errorResponse('评论内容最长 300 字', 400)

    const list = getOrCreate(targetType, targetId)
    const replyToId = data?.replyToId ? String(data.replyToId) : ''

    if (replyToId) {
      //+ 二级回复：挂到对应一级评论下
      const parent = list.find(c => c.id === replyToId)
      if (!parent) return errorResponse('目标评论不存在', 404)
      //+ 被回复用户：优先 replyToMemberId，否则取一级评论作者
      const repliedUserId = data?.replyToMemberId ? String(data.replyToMemberId) : parent.user.id
      const repliedUser = mockUsers.find(u => u.id === repliedUserId) || parent.user
      const reply = makeComment(
        currentUser,
        content,
        0,
        false,
        parent.id,
        repliedUser.nickname,
        minutesAgo(0),
        targetType,
        targetId
      )
      parent.replies = [...(parent.replies || []), reply]
      parent.replyCount = (parent.replyCount || 0) + 1
      return successResponse(serializeReply(reply))
    }

    //+ 一级评论：置顶
    const firstLevel = makeComment(
      currentUser,
      content,
      0,
      false,
      '',
      '',
      minutesAgo(0),
      targetType,
      targetId
    )
    firstLevel.replyCount = 0
    firstLevel.replies = []
    list.unshift(firstLevel)
    return successResponse(serializeFirstLevel(firstLevel))
  },

  //+ 获取一级评论列表（分页）
  'GET /api/v1/comments': (data) => {
    const targetType = Number(data?.targetType)
    if (targetType !== NOTE && targetType !== GUIDE) {
      return errorResponse('参数错误：targetType 非 1/2', 2001)
    }
    const targetId = String(data?.targetId ?? '')
    const page = Number(data?.page) || 1
    const size = Math.min(Number(data?.size) || 15, 100)

    const list = getOrCreate(targetType, targetId)
    //+ 简化展示规则：按热度排序后分页（前2条即热评）
    const sorted = [...list].sort((a, b) => b.likeCount - a.likeCount)
    const serialized = sorted.map(serializeFirstLevel)
    return successResponse(createPageResponse(serialized, page, size))
  },

  //+ 点赞 / 取消点赞评论（切换式）
  'POST /api/v1/comments/like/:id': (_, url) => {
    const id = (url as string).split('/').pop() || ''
    const found = findCommentAnywhere(id)
    if (!found) return errorResponse('评论不存在', 404)
    const c = found.comment
    c.isLiked = !c.isLiked
    c.likeCount += c.isLiked ? 1 : -1
    return successResponse({ isLiked: c.isLiked, likeCount: c.likeCount })
  },

  //+ 删除评论（一级连带二级，二级仅自身）
  'DELETE /api/v1/comments/:id': (_, url) => {
    const id = (url as string).split('/').pop() || ''
    let removed = false
    for (const list of commentCache.values()) {
      //+ 尝试删除一级
      const idx = list.findIndex(c => c.id === id)
      if (idx >= 0) {
        list.splice(idx, 1)
        removed = true
        break
      }
      //+ 尝试删除二级
      for (const parent of list) {
        if (!parent.replies?.length) continue
        const ridx = parent.replies.findIndex(r => r.id === id)
        if (ridx >= 0) {
          parent.replies.splice(ridx, 1)
          parent.replyCount = Math.max(0, (parent.replyCount || 0) - 1)
          removed = true
          break
        }
      }
      if (removed) break
    }
    if (!removed) return errorResponse('评论不存在', 404)
    return successResponse({})
  },

  //+ 获取二级评论列表（加载更多，分页）
  'GET /api/v1/comments/replies/:id': (data, url) => {
    const parentId = (url as string).split('/').pop() || ''
    const page = Number(data?.page) || 1
    const size = Math.min(Number(data?.size) || 10, 100)

    //+ 找到一级评论
    let parent: MockCommentDTO | null = null
    for (const list of commentCache.values()) {
      const found = list.find(c => c.id === parentId)
      if (found) { parent = found; break }
    }
    if (!parent) return errorResponse('一级评论不存在', 404)

    const allReplies = [...(parent.replies || [])]
    //+ 简化排序：前2条按热度，其余按时间倒序
    const sorted = allReplies.sort((a, b) => b.likeCount - a.likeCount)
    const serialized = sorted.map(serializeReply)
    return successResponse(createPageResponse(serialized, page, size))
  }
}
