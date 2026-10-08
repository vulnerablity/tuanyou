//+ 社区首页API接口封装（统一解包返回 data）
import { apiGet } from '@/utils/request'
import type { FeedItem, PageResult, SlideItem } from '@/types'

//+ Feed流查询参数（GET /feed）
export type FeedQueryParams = {
  category?: number
  sort?: string
  page: number
  size: number
}

//+ GET /slides 获取首页轮播（从笔记、攻略、活动中查询 is_slide=1 的内容）
export function getSlides(): Promise<SlideItem[]> {
  return apiGet<SlideItem[]>('/slides')
}

//+ GET /feed 获取Feed流列表（笔记/攻略混合瀑布流）
export function getFeed(params: FeedQueryParams): Promise<PageResult<FeedItem>> {
  return apiGet<PageResult<FeedItem>>('/feed', params)
}
