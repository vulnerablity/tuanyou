//+ API 协议域类型：枚举/常量/映射、分页响应、请求/响应 DTO、统一响应结构
//+ 不包含任何业务实体（实体放 entity.ts）
import type { ActivityListItem } from './entity'

//+ 用户角色：member=普通会员，leader=领队
export type UserRole = 'member' | 'leader'

//+ 分类ID→名称映射（后端返回数字ID，前端映射为中文）
export const CATEGORY_MAP: Record<number, string> = {
  1: '徒步',
  2: '露营',
  3: '骑行',
  4: '登山',
  5: '跑步',
  6: '攀岩',
  7: '溯溪',
}

//+ 根据分类ID获取名称
export function getCategoryName(categoryId?: number): string {
  if (!categoryId) return ''
  return CATEGORY_MAP[categoryId] || ''
}

//+ 分页响应数据结构（通用）
//+ total_page 可选：真实后端只返回 total+size，需前端自行计算；Mock 会返回 total_page
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  total_page?: number
}

//+ 活动列表分页响应 data 结构（调用方 import ActivityListResult from '@/types' 时保持一致）
export interface ActivityListResult extends PageResult<ActivityListItem> {}

//+ 个人主页信息（GET /personal 返回）
export interface ProfileInfo {
  id: string
  nickname: string
  avatar: string
  bio: string
  bgImg: string
  publishCount: number
  followCount: number
  fansCount: number
}

//+ 编辑个人信息请求参数（PUT /personal body）
export interface ProfileUpdate {
  avatar: string
  nickname: string
  bio: string
  bgImg: string
}

//+ 统一响应数据结构
//+ 注：请求封装层（utils/request）也有同名 ResponseData<T>，二者结构一致；
//+     如需在调用方与 request.ts 共用此结构，可直接 import ApiResponse 并重命名为 ResponseData。
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// ========== 评论模块协议域 ==========

//+ 评论目标类型常量：1=笔记，2=攻略
export const COMMENT_TARGET_TYPE = {
  NOTE: 1,
  GUIDE: 2
} as const

//+ 后端评论 DTO（对齐接口文档字段：user/replyToNickname/replyCount）
//+ 前端 Comment 实体使用 member/replyToName，由 apis/comment.ts 适配器转换
export interface CommentUserDTO {
  id: string
  nickname: string
  avatar: string
}
export interface CommentDTO {
  id: string
  user: CommentUserDTO
  content: string
  likeCount: number
  isLiked: boolean
  //+ 一级评论为空字符串，二级评论为一级评论 ID
  replyToId: string | ''
  //+ 一级评论为空字符串，二级评论为被回复用户昵称
  replyToNickname: string | ''
  createdAt: string
  //+ 一级评论才有：二级评论总数
  replyCount?: number
  //+ 一级评论才有：热度最高的二级评论（最多2条）
  replies?: CommentDTO[]
  canDelete: boolean
}

//+ 评论列表分页响应（data 结构）
export interface CommentListResult extends PageResult<CommentDTO> {}

//+ 发表评论请求参数
export interface CreateCommentParams {
  targetType: number
  targetId: number | string
  content: string
  //+ 被回复的一级评论 ID；空=一级评论
  replyToId?: number | string
  //+ 被回复的用户 ID；回复二级评论时必传
  replyToMemberId?: number | string
}

//+ 评论列表查询参数
export interface CommentQueryParams {
  targetType: number
  targetId: number | string
  page: number
  size: number
}

//+ 二级评论列表查询参数
export interface CommentRepliesQueryParams {
  parentId: number | string
  page: number
  size: number
}
