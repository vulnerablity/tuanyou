//+ 笔记API接口封装（统一解包：成功返回 data，业务错误抛 ApiError）
import { apiGet, apiPost, apiDelete } from '@/utils/request'
import type { Comment, PageResult, Post } from '@/types'

//+ 笔记列表查询参数（GET /notes）
export type NoteQueryParams = {
  category?: number
  sort?: string
  type?: string
  page: number
  size: number
}

//+ 点赞切换响应（POST /notes/{id}/like data）
export type ToggleNoteLikeResult = {
  isLiked: boolean
  likeCount: number
}

//+ 收藏切换响应（POST /notes/{id}/favorite data）
export type ToggleNoteFavoriteResult = {
  isFavorited: boolean
}

//+ GET /notes 获取笔记列表（瀑布流）
export function getNotes(params: NoteQueryParams): Promise<PageResult<Post>> {
  return apiGet<PageResult<Post>>('/notes', params)
}

//+ GET /notes/{id} 获取笔记详情
//+ type 为后端检索字段：note/guide，用于获取对应类型的详情数据
export function getNoteDetail(id: string, type?: string): Promise<Post> {
  return apiGet<Post>(`/notes/${id}`, type ? { type } : undefined)
}

//+ POST /notes 发布笔记
export function createNote(params: {
  title: string
  content: string
  images?: string[]
  videoUrl?: string
  category?: number
  tags?: string[]
}): Promise<Post> {
  return apiPost<Post>('/notes', params)
}

//+ POST /notes/{id}/like 点赞/取消点赞（切换式）
export function toggleNoteLike(id: string, signal?: AbortSignal | null): Promise<ToggleNoteLikeResult> {
  return apiPost<ToggleNoteLikeResult>(`/notes/${id}/like`, undefined, signal)
}

//+ POST /notes/{id}/favorite 收藏/取消收藏（切换式）
export function toggleNoteFavorite(id: string, signal?: AbortSignal | null): Promise<ToggleNoteFavoriteResult> {
  return apiPost<ToggleNoteFavoriteResult>(`/notes/${id}/favorite`, undefined, signal)
}

//+ GET /notes/{id}/comments 获取笔记评论列表
export function getNoteComments(id: string): Promise<Comment[]> {
  return apiGet<Comment[]>(`/notes/${id}/comments`)
}

//+ DELETE /notes/{id} 删除笔记
export function deleteNote(id: string): Promise<void> {
  return apiDelete<void>(`/notes/${id}`)
}
