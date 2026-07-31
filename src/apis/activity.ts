//+ 活动API接口封装
import { get, post } from '@/utils/request'

//+ 获取首页活动Banner
export function getActivityBannersAPI() {
  return get('/activities/banners')
}

//+ 获取活动列表
export function getActivitiesAPI(params: {
  type?: string
  time?: string
  page: number
  size: number
}) {
  return get('/activities', params)
}

//+ 获取活动详情
export function getActivityDetailAPI(id: string) {
  return get(`/activities/${id}`)
}

//+ 创建活动（仅领队）
export function createActivityAPI(params: {
  title: string
  activityType: string
  cover?: string
  startTime: string
  endTime: string
  signUpStart: string
  signUpEnd: string
  address: string
  price?: number
  maxPeople?: number
  difficulty: string
  activityContent?: string
}) {
  return post('/activities', params)
}

//+ 报名/取消报名
export function toggleActivitySignupAPI(id: string) {
  return post(`/activities/${id}/signup`)
}

//+ 获取我的活动
export function getMyActivitiesAPI() {
  return get('/user/activities')
}