//+ 攻略模块Mock数据与路由
//+ 说明：从 mock/note.ts 拆分而来，攻略路由独立维护
//+ 复用：mockPosts（含笔记+攻略共享数据）从 note.ts 导入，保持单一数据源
//+ 交互（发布/删除/点赞/收藏）均真实修改模块级 mockPosts 内存数据，再次请求状态保持
import type { Post } from '@/types'
import { createPageResponse, successResponse, errorResponse, randomDate, toNumber } from './utils'
import type { MockHandler, MockData } from './utils'
import { mockUsers } from './user'
import { mockPosts, getNextPostId, mockNoteCommentsPost } from './note'

//+ 从 url 路径解析 :id（如 /api/v1/guides/123 → '123'）
function parseId(url?: string): string {
  return (url || '').split('/')[2] || '1'
}

//+ 攻略模块Mock路由映射
export const guideMockRoutes: Record<string, MockHandler> = {
  //+ 获取攻略列表
  'GET /api/v1/guides': (data?: MockData) => {
    const page = toNumber(data?.page, 1)
    const size = toNumber(data?.size, 10)
    let filtered = mockPosts.filter(n => n.type === 'guide')
    const category = data?.category
    if (category !== undefined && category !== null && category !== '全部' && category !== '') {
      const categoryId = toNumber(category, NaN)
      if (!Number.isNaN(categoryId)) filtered = filtered.filter(n => n.category === categoryId)
    }
    const sort = data?.sort || '推荐'
    if (sort === '最新') filtered.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
    else if (sort === '最热') filtered.sort((a, b) => b.viewCount - a.viewCount)
    return successResponse(createPageResponse(filtered, page, size))
  },

  //+ 获取攻略详情
  'GET /api/v1/guides/:id': (_data, url) => {
    const id = parseId(url)
    const guide = mockPosts.find(n => n.id === id && n.type === 'guide') || mockPosts.find(n => n.id === id)
    if (guide) return successResponse(guide)
    return errorResponse('攻略不存在')
  },

  //+ 发布攻略（真实 unshift 进 mockPosts，列表立即可见）
  'POST /api/v1/guides': (data?: MockData) => {
    const routeInfo = (data?.distance || data?.duration || data?.difficulty || data?.transport)
      ? {
          distance: String(data?.distance || ''),
          duration: String(data?.duration || ''),
          difficulty: String(data?.difficulty || ''),
          transport: String(data?.transport || '')
        }
      : undefined
    const images = Array.isArray(data?.images) ? (data!.images as string[]) : []
    const tags = Array.isArray(data?.tags) ? (data!.tags as string[]) : []
    const newGuide: Post = {
      id: String(getNextPostId()),
      type: 'guide',
      author: mockUsers[0],
      title: String(data?.title || '新攻略'),
      coverImg: images[0] || '',
      images,
      videoUrl: String(data?.videoUrl || ''),
      content: String(data?.content || ''),
      viewCount: 0,
      likeCount: 0,
      collectCount: 0,
      commentCount: 0,
      isLiked: false,
      isFavorited: false,
      isFollowed: false,
      category: toNumber(data?.category, 1),
      tags,
      status: 1,
      publishTime: randomDate(0),
      routeInfo,
      //+ 新创建攻略是本人发布
      isOwner: true
    }
    mockPosts.unshift(newGuide)
    return successResponse(newGuide)
  },

  //+ 删除攻略（真实从 mockPosts 移除）
  'DELETE /api/v1/guides/:id': (_data, url) => {
    const id = parseId(url)
    const idx = mockPosts.findIndex(n => n.id === id)
    if (idx >= 0) { mockPosts.splice(idx, 1); return successResponse({ message: '删除成功' }) }
    return errorResponse('攻略不存在')
  },

  //+ 攻略点赞/取消点赞（真实翻转 isLiked + likeCount）
  'POST /api/v1/guides/:id/like': (_data, url) => {
    const id = parseId(url)
    const guide = mockPosts.find(n => n.id === id)
    if (guide) {
      guide.isLiked = !guide.isLiked
      guide.likeCount += guide.isLiked ? 1 : -1
      return successResponse({ isLiked: guide.isLiked, likeCount: guide.likeCount })
    }
    return errorResponse('攻略不存在')
  },

  //+ 攻略收藏/取消收藏（真实翻转 isFavorited + collectCount）
  'POST /api/v1/guides/:id/favorite': (_data, url) => {
    const id = parseId(url)
    const guide = mockPosts.find(n => n.id === id)
    if (guide) {
      guide.isFavorited = !guide.isFavorited
      guide.collectCount += guide.isFavorited ? 1 : -1
      return successResponse({ isFavorited: guide.isFavorited })
    }
    return errorResponse('攻略不存在')
  },

  //+ 攻略评论列表
  'GET /api/v1/guides/:id/comments': (_data, url) => {
    const id = parseId(url)
    const guide = mockPosts.find(n => n.id === id)
    if (guide) return successResponse(mockNoteCommentsPost)
    return errorResponse('攻略不存在')
  }
}
