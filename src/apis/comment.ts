//+ 评论模块API接口封装（统一解包返回 data；后端 DTO → 前端实体适配在本层完成）
//+ 对齐 docs/默认模块.md 接口文档：发表/列表/点赞/删除/二级评论加载更多
//+ 字段适配：后端 DTO 使用 user/replyToNickname，前端 Comment 实体使用 member/replyToName
//+           由 normalizeComment 在本层完成转换，store 与页面只感知 Comment 实体
import { apiGet, apiPost, apiDelete } from '@/utils/request'
import type {
  Comment,
  PageResult,
  CommentDTO,
  CommentListResult,
  CreateCommentParams,
  CommentQueryParams,
  CommentRepliesQueryParams
} from '@/types'

//+ 评论点赞切换响应（POST /comments/like/{id} data）
export type ToggleCommentLikeResult = {
  isLiked: boolean
  likeCount: number
}

//+ 适配器：后端 CommentDTO → 前端 Comment 实体
//+ user→member，replyToNickname→replyToName，空串→null
function normalizeComment(c: CommentDTO): Comment {
  return {
    id: c.id,
    member: { id: c.user.id, nickname: c.user.nickname, avatar: c.user.avatar },
    content: c.content,
    likeCount: c.likeCount,
    isLiked: c.isLiked,
    replyToId: c.replyToId || null,
    replyToName: c.replyToNickname || null,
    createdAt: c.createdAt,
    canDelete: c.canDelete,
    replyCount: c.replyCount,
    replies: c.replies ? c.replies.map(normalizeComment) : undefined
  }
}

//+ POST /comments 发表评论（一级或回复）
//+ 返回适配后的 Comment（带真实 id，供页面追加到列表）
//+ 字段适配：String ID → Number（接口文档要求 targetId/replyToId/replyToMemberId 为 integer）
export async function createComment(params: Omit<CreateCommentParams, 'targetId' | 'replyToId' | 'replyToMemberId'> & {
  targetId: number | string
  replyToId?: number | string
  replyToMemberId?: number | string
}): Promise<Comment> {
  const normalized: CreateCommentParams = {
    targetType: params.targetType,
    content: params.content,
    targetId: Number(params.targetId) || 0,
    ...(params.replyToId !== undefined && params.replyToId !== null
      ? { replyToId: Number(params.replyToId) || 0 }
      : {}),
    ...(params.replyToMemberId !== undefined && params.replyToMemberId !== null
      ? { replyToMemberId: Number(params.replyToMemberId) || 0 }
      : {})
  }
  const res = await apiPost<CommentDTO>('/comments', normalized as unknown as Record<string, unknown>)
  return normalizeComment(res)
}

//+ GET /comments 获取一级评论列表（分页）
//+ 展示规则由后端实现（前2条热评 + 其余按时间倒序），本层仅做分页与字段适配
//+ signal：支持 AbortSignal，用于切换详情页时 abort 上一个未完成请求，防止旧 fulfilled 覆盖新数据
export async function getComments(
  params: Omit<CommentQueryParams, 'targetId'> & { targetId: number | string },
  signal?: AbortSignal | null
): Promise<PageResult<Comment>> {
  const normalized: CommentQueryParams = {
    targetType: params.targetType,
    targetId: Number(params.targetId) || 0,
    page: params.page,
    size: params.size
  }
  const res = await apiGet<CommentListResult>('/comments', normalized as unknown as Record<string, unknown>, signal)
  return { ...res, list: res.list.map(normalizeComment) }
}

//+ POST /comments/like/{id} 点赞 / 取消点赞评论（切换式）
export function toggleCommentLike(id: string, signal?: AbortSignal | null): Promise<ToggleCommentLikeResult> {
  return apiPost<ToggleCommentLikeResult>(`/comments/like/${id}`, undefined, signal)
}

//+ DELETE /comments/{id} 删除评论（软删除，一级评论删除时连带其下二级评论）
export function deleteComment(id: string): Promise<void> {
  return apiDelete<void>(`/comments/${id}`)
}

//+ GET /comments/replies/{parentId} 获取二级评论列表（一级评论"展开"时加载更多）
//+ 排序规则由后端实现（前2条热度 + 其余时间倒序），列表项无嵌套 replies
export async function getCommentReplies(params: Omit<CommentRepliesQueryParams, 'parentId'> & { parentId: number | string }): Promise<PageResult<Comment>> {
  const res = await apiGet<CommentListResult>(`/comments/replies/${Number(params.parentId) || 0}`, {
    page: params.page,
    size: params.size
  })
  return { ...res, list: res.list.map(normalizeComment) }
}
