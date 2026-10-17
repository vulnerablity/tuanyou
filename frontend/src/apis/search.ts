//+ 搜索API接口封装（对接后端接口；统一解包返回 data）
//+ 热门搜索：GET /hot-searches
//+ 全量搜索（内容/活动统一接口）：GET /search，通过 type=content/activity 区分
//+ 搜索历史：GET /search/history、DELETE /search/history（全部）、DELETE /search/history/:id（单条）
import { apiGet, apiDelete } from '@/utils/request'
import type { FeedItem, ActivityListItem, PageResult } from '@/types'

//+ 搜索历史项
export interface SearchHistoryItem {
  id: string
  keyword: string
}

//+ 搜索请求参数
export type SearchParams = {
  keyword: string
  page: number
  size: number
}

//+ GET /hot-searches 获取热门搜索关键词 → data: string[]
export function getHotKeywords(): Promise<string[]> {
  return apiGet<string[]>('/hot-searches')
}

//+ GET /search?keyword=xxx&type=content&page=1&size=10 全量搜索（内容：笔记+攻略）
export function searchContent(params: SearchParams): Promise<PageResult<FeedItem>> {
  return apiGet<PageResult<FeedItem>>('/search', {
    keyword: params.keyword,
    type: 'content',
    page: String(params.page),
    size: String(params.size)
  })
}

//+ GET /search?keyword=xxx&type=activity&page=1&size=10 全量搜索（活动）
export function searchActivities(params: SearchParams): Promise<PageResult<ActivityListItem>> {
  return apiGet<PageResult<ActivityListItem>>('/search', {
    keyword: params.keyword,
    type: 'activity',
    page: String(params.page),
    size: String(params.size)
  })
}

//+ GET /search/history 获取搜索历史列表 → data: SearchHistoryItem[]
export function getSearchHistory(): Promise<SearchHistoryItem[]> {
  return apiGet<SearchHistoryItem[]>('/search/history')
}

//+ DELETE /search/history 清空全部搜索历史
export function clearSearchHistory(): Promise<void> {
  return apiDelete<void>('/search/history')
}

//+ DELETE /search/history/{id} 删除单条搜索历史
export function deleteSearchHistoryItem(id: string): Promise<void> {
  return apiDelete<void>(`/search/history/${id}`)
}
