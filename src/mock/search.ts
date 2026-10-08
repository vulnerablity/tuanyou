//+ 搜索模块Mock数据和路由（对接真实后端接口）
//+ 热门搜索：GET /hot-searches
//+ 全量搜索：GET /search，通过 type=content/activity 区分内容和活动
import type { FeedItem, ActivityListItem } from '@/types'
import { createPageResponse, successResponse, toNumber } from './utils'
import type { MockHandler, MockData } from './utils'
import { mockFeed } from './home'
import { mockActivities } from './activity'

//+ 热门搜索关键词
export const mockHotKeywords = [
  '徒步', '露营', '骑行', '武功山', '千岛湖', '越野跑', '攀岩'
]

//+ 搜索内容（笔记+攻略），按关键词匹配标题/标签
function filterContentByKeyword(keyword: string): FeedItem[] {
  if (!keyword) return []
  const kw = keyword.toLowerCase()
  return mockFeed.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(kw)
    const tagMatch = item.tags.some(t => t.toLowerCase().includes(kw))
    return titleMatch || tagMatch
  })
}

//+ 搜索活动，按关键词匹配标题/分类/地址
function filterActivitiesByKeyword(keyword: string): ActivityListItem[] {
  const kw = (keyword || '').toLowerCase()
  return mockActivities.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(kw)
    const categoryMatch = item.category.toLowerCase().includes(kw)
    const addressMatch = item.address.toLowerCase().includes(kw)
    return titleMatch || categoryMatch || addressMatch
  })
}

//+ Mock路由映射：搜索模块（与真实后端接口对齐）
export const searchMockRoutes: Record<string, MockHandler> = {
  //+ 全量搜索热度关键词
  //+ GET /hot-searches → data: string[]
  'GET /api/v1/hot-searches': () => successResponse(mockHotKeywords),

  //+ 全量搜索（统一接口，通过 type 区分内容/活动）
  //+ GET /search?keyword=xxx&type=content|activity&page=1&size=10
  'GET /api/v1/search': (data?: MockData) => {
    const keyword = String(data?.keyword || '')
    const type = String(data?.type || 'content')
    const page = toNumber(data?.page, 1)
    const size = toNumber(data?.size, 10)

    if (type === 'activity') {
      //+ 搜索活动
      const filtered = filterActivitiesByKeyword(keyword)
      return successResponse(createPageResponse(filtered, page, size))
    } else {
      //+ 默认：搜索内容（笔记+攻略）
      const filtered = filterContentByKeyword(keyword)
      return successResponse(createPageResponse(filtered, page, size))
    }
  }
}
