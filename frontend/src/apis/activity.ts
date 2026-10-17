//+ 活动API接口封装（与 OpenAPI 文档对齐；统一解包返回 data）
import { apiGet, apiPost, apiDelete } from '@/utils/request'
import type { Activity, ActivityBanner, ActivityListResult, ActivityListItem } from '@/types'

//+ 活动列表查询参数（GET /activities）
//+ category 不传=全部，传中文字符串（徒步/露营/骑行/登山/跑步/攀岩/溯溪）
//+ date 不传=全部日期，传 YYYY-MM-DD 按活动开始日期筛选
export type ActivityQueryParams = {
  category?: string
  date?: string
  page: number
  size: number
}

//+ 报名切换响应（POST /activities/{id}/signup data）
export type ToggleActivitySignupResult = {
  isJoined: boolean
  currentPeople: number
}

//+ GET /activities/banners 获取活动Banner（活动页轮播入口）
export function getActivityBanners(): Promise<ActivityBanner[]> {
  return apiGet<ActivityBanner[]>('/activities/banners')
}

//+ GET /activities 获取活动列表
export function getActivityList(params: ActivityQueryParams): Promise<ActivityListResult> {
  return apiGet<ActivityListResult>('/activities', params)
}

//+ GET /activities/{id} 获取活动详情
export function getActivityDetail(id: string): Promise<Activity> {
  return apiGet<Activity>(`/activities/${id}`)
}

//+ POST /activities 创建活动（仅领队，与 API 文档 POST /activities 对齐）
//+ 字段使用 category（非 activityType），signUpStart/signUpEnd 由后端自动计算
export function createActivity(params: {
  title: string
  category: string
  coverImg: string
  address: string
  startTime: string
  endTime: string
  price: number
  maxPeople: number
  difficulty: string
  activityContent: string
  wechatQR: string
}): Promise<Activity> {
  return apiPost<Activity>('/activities', params)
}

//+ POST /activities/{id}/signup 报名/取消报名（切换式），返回最新报名状态与人数
export function toggleActivitySignup(id: string, signal?: AbortSignal | null): Promise<ToggleActivitySignupResult> {
  return apiPost<ToggleActivitySignupResult>(`/activities/${id}/signup`, undefined, signal)
}

//+ DELETE /activities/{id} 删除活动（领队）
export function deleteActivity(id: string): Promise<void> {
  return apiDelete<void>(`/activities/${id}`)
}

//+ GET /user/activities 获取我的活动
export function getMyActivities(): Promise<ActivityListItem[]> {
  return apiGet<ActivityListItem[]>('/user/activities')
}
