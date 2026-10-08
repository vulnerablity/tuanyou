//+ 攻略API接口封装（对齐笔记API结构；统一解包返回 data）
import { apiGet, apiPost, apiDelete } from '@/utils/request'
import type { Comment, PageResult, Post } from '@/types'

//+ 攻略列表查询参数（GET /guides）
export type GuideQueryParams = {
  category?: number
  sort?: string
  page: number
  size: number
}

//+ 点赞切换响应（POST /guides/{id}/like data）
export type ToggleGuideLikeResult = {
  isLiked: boolean
  likeCount: number
}

//+ 收藏切换响应（POST /guides/{id}/favorite data）
export type ToggleGuideFavoriteResult = {
  isFavorited: boolean
}

//+ GET /guides 获取攻略列表
export function getGuides(params: GuideQueryParams): Promise<PageResult<Post>> {
  return apiGet<PageResult<Post>>('/guides', params)
}

//+ GET /guides/{id} 获取攻略详情
export function getGuideDetail(id: string): Promise<Post> {
  return apiGet<Post>(`/guides/${id}`)
}

//+ POST /guides 发布攻略
export function createGuide(params: {
  title: string
  content: string
  images?: string[]
  videoUrl?: string
  category?: number
  tags?: string[]
  //+ 攻略专属字段（路线信息）
  distance?: string
  duration?: string
  difficulty?: string
  transport?: string
}): Promise<Post> {
  return apiPost<Post>('/guides', params)
}

//+ DELETE /guides/{id} 删除攻略
export function deleteGuide(id: string): Promise<void> {
  return apiDelete<void>(`/guides/${id}`)
}

//+ POST /guides/{id}/like 点赞/取消点赞攻略（切换式）
export function toggleGuideLike(id: string, signal?: AbortSignal | null): Promise<ToggleGuideLikeResult> {
  return apiPost<ToggleGuideLikeResult>(`/guides/${id}/like`, undefined, signal)
}

//+ POST /guides/{id}/favorite 收藏/取消收藏攻略（切换式）
export function toggleGuideFavorite(id: string, signal?: AbortSignal | null): Promise<ToggleGuideFavoriteResult> {
  return apiPost<ToggleGuideFavoriteResult>(`/guides/${id}/favorite`, undefined, signal)
}

//+ GET /guides/{id}/comments 获取攻略评论列表
export function getGuideComments(id: string): Promise<Comment[]> {
  return apiGet<Comment[]>(`/guides/${id}/comments`)
}
