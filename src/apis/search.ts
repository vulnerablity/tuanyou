//+ 搜索API接口封装（对接真实后端接口）
//+ 热门搜索：GET /hot-searches
//+ 全量搜索（内容/活动统一接口）：GET /search，通过 type=content/activity 区分
import { get } from '@/utils/request'
import type { FeedItem, ActivityListItem, PageResult } from '@/types'

//+ 获取热门搜索关键词
//+ GET /hot-searches → data: string[]
export function getHotKeywordsAPI() {
  return get<string[]>('/hot-searches')
}

//+ 全量搜索（内容：笔记+攻略）
//+ GET /search?keyword=xxx&type=content&page=1&size=10
export function searchContentAPI(params: {
  keyword: string
  page: number
  size: number
}) {
  return get<PageResult<FeedItem>>('/search', {
    keyword: params.keyword,
    type: 'content',
    page: String(params.page),
    size: String(params.size)
  })
}

//+ 全量搜索（活动）
//+ GET /search?keyword=xxx&type=activity&page=1&size=10
export function searchActivitiesAPI(params: {
  keyword: string
  page: number
  size: number
}) {
  return get<PageResult<ActivityListItem>>('/search', {
    keyword: params.keyword,
    type: 'activity',
    page: String(params.page),
    size: String(params.size)
  })
}
