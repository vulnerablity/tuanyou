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
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
  total_page: number
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
