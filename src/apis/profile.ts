//+ 个人中心模块API接口封装
//+ 对接后端 /personal/* 系列接口（服务于 Profile/我的 页面；统一解包返回 data）
import { apiGet, apiPost, apiPut } from '@/utils/request'
import type {
  ProfileInfo,
  ProfileUpdate,
  ProfilePostItem,
  FollowItem,
  FanItem,
  ActivityListItem,
  PageResult
} from '@/types'

//+ 分页请求参数
export type PageParams = {
  page: number
  size: number
}

//+ 关注切换响应（POST /personal/follow/{followeeId} data）
export type ToggleFollowResult = {
  isFollowed: boolean
}

//+ GET /personal 获取主页信息
export function getProfileInfo(): Promise<ProfileInfo> {
  return apiGet<ProfileInfo>('/personal')
}

//+ PUT /personal 编辑个人部分信息
export function updateProfileInfo(params: ProfileUpdate): Promise<ProfileInfo> {
  return apiPut<ProfileInfo>('/personal', params)
}

//+ GET /personal/notes 获取笔记列表
export function getProfileNotes(params: PageParams): Promise<PageResult<ProfilePostItem>> {
  return apiGet<PageResult<ProfilePostItem>>('/personal/notes', params)
}

//+ GET /personal/strategys 获取攻略列表
export function getProfileStrategys(params: PageParams): Promise<PageResult<ProfilePostItem>> {
  return apiGet<PageResult<ProfilePostItem>>('/personal/strategys', params)
}

//+ GET /personal/follow 获取关注列表
export function getProfileFollow(params: PageParams): Promise<PageResult<FollowItem>> {
  return apiGet<PageResult<FollowItem>>('/personal/follow', params)
}

//+ GET /personal/fans 获取粉丝列表
export function getProfileFans(params: PageParams): Promise<PageResult<FanItem>> {
  return apiGet<PageResult<FanItem>>('/personal/fans', params)
}

//+ GET /personal/favorite-note 获取收藏笔记列表
export function getFavoriteNotes(params: PageParams): Promise<PageResult<ProfilePostItem>> {
  return apiGet<PageResult<ProfilePostItem>>('/personal/favorite-note', params)
}

//+ GET /personal/favorite-strategy 获取收藏攻略列表
export function getFavoriteStrategys(params: PageParams): Promise<PageResult<ProfilePostItem>> {
  return apiGet<PageResult<ProfilePostItem>>('/personal/favorite-strategy', params)
}

//+ GET /personal/liked-notes 获取点赞笔记列表
export function getLikedNotes(params: PageParams): Promise<PageResult<ProfilePostItem>> {
  return apiGet<PageResult<ProfilePostItem>>('/personal/liked-notes', params)
}

//+ GET /personal/liked-strategy 获取点赞攻略列表
export function getLikedStrategys(params: PageParams): Promise<PageResult<ProfilePostItem>> {
  return apiGet<PageResult<ProfilePostItem>>('/personal/liked-strategy', params)
}

//+ GET /personal/publish-activity 发布的活动
export function getPublishActivity(params: PageParams): Promise<PageResult<ActivityListItem>> {
  return apiGet<PageResult<ActivityListItem>>('/personal/publish-activity', params)
}

//+ GET /personal/join-activity 参加的活动
export function getJoinActivity(params: PageParams): Promise<PageResult<ActivityListItem>> {
  return apiGet<PageResult<ActivityListItem>>('/personal/join-activity', params)
}

//+ POST /personal/follow/{followeeId} 关注/取关（切换式）
//+ 调用一次翻转一次，返回最新 isFollowed，前端无需判断当前状态
export function toggleFollow(followeeId: string, signal?: AbortSignal | null): Promise<ToggleFollowResult> {
  return apiPost<ToggleFollowResult>(`/personal/follow/${followeeId}`, undefined, signal)
}
