//+ 笔记/攻略模块Mock数据和路由
import { randomInt, randomItem, randomDate, createPageResponse, successResponse, errorResponse } from './utils'
import { mockUsers } from './user'

//+ 分类列表
const categories = ['徒步', '露营', '骑行', '登山', '跑步', '攀岩', '溯溪', '自驾', '装备', '摄影']

//+ 标签列表
const tags: Record<string, string[]> = {
  '徒步': ['徒步', '户外', '登山', '徒步路线', '徒步装备'],
  '露营': ['露营', '帐篷', '户外露营', '露营美食', '露营装备'],
  '骑行': ['骑行', '自行车', '骑行路线', '长途骑行', '山地车'],
  '登山': ['登山', '雪山', '高山', '登山装备', '登顶'],
  '跑步': ['跑步', '晨跑', '夜跑', '马拉松', '跑步打卡'],
  '攀岩': ['攀岩', '室内攀岩', '户外攀岩', '攀岩装备'],
  '溯溪': ['溯溪', '溪水', '清凉', '户外玩水'],
  '自驾': ['自驾', '自驾游', '公路旅行', '房车'],
  '装备': ['装备', '户外装备', '徒步装备', '露营装备'],
  '摄影': ['摄影', '户外摄影', '风景摄影', '人像摄影']
}

//+ 标题模板
const noteTitles: Record<string, string[]> = {
  '徒步': ['徒步攻略', '徒步日记', '徒步体验', '徒步路线推荐', '徒步装备分享'],
  '露营': ['露营日记', '露营装备', '露营地点推荐', '露营美食', '露营体验'],
  '骑行': ['骑行路线', '骑行日记', '骑行体验', '长途骑行', '骑行装备'],
  '登山': ['登山攻略', '登山日记', '登顶记录', '登山体验', '雪山攀登'],
  '跑步': ['跑步打卡', '跑步日记', '跑步路线', '马拉松训练', '跑步心得'],
  '攀岩': ['攀岩体验', '攀岩训练', '攀岩攻略', '攀岩装备'],
  '溯溪': ['溯溪体验', '溯溪攻略', '溯溪路线'],
  '自驾': ['自驾路线', '自驾游', '公路旅行', '房车旅行'],
  '装备': ['装备分享', '装备推荐', '装备评测'],
  '摄影': ['摄影分享', '摄影攻略', '风景摄影']
}

//+ 内容模板
const contents = [
  '这次的行程非常棒，风景如画，推荐给大家！',
  '分享一下这次的体验，希望对大家有帮助。',
  '详细的攻略来了，包含路线规划和装备推荐。',
  '第一次尝试，感觉非常不错，以后还要再来！',
  '记录一下这次的旅程，留下美好的回忆。',
  '装备分享，性价比很高，适合新手入门。',
  '路线推荐，避开人流高峰，享受宁静时光。',
  '体验分享，从零基础到完成，成就感满满。',
  '详细记录，包含每一天的行程安排。',
  '风景太美了，值得一去再去！'
]

//+ 路线信息模板（攻略专用）
const routeInfos = [
  { distance: '10km', duration: '1天', difficulty: '简单', transport: '徒步' },
  { distance: '15km', duration: '1天', difficulty: '中等', transport: '徒步' },
  { distance: '20km', duration: '2天', difficulty: '中等', transport: '大巴' },
  { distance: '30km', duration: '2天', difficulty: '困难', transport: '自驾' },
  { distance: '50km', duration: '3天', difficulty: '困难', transport: '大巴' },
  { distance: '100km', duration: '3天', difficulty: '困难', transport: '自行车' },
  { distance: '8km', duration: '半天', difficulty: '简单', transport: '徒步' },
  { distance: '12km', duration: '1天', difficulty: '中等', transport: '自驾' }
]

//+ 笔记详情模板
export const mockNoteDetailPost: Record<string, any> = {
  
  "id": "1",
  "type": "笔记",
  "author": {
    "id": "1",
    "nickname": "山林旅人",
    "avatar": "https://picsum.photos/seed/user1-avatar/100/100"
  },
  "title": "骑行路线推荐78",
  "coverImg": "https://picsum.photos/seed/post5-cover/300/400",
  "images": [
    "https://picsum.photos/seed/post5-img1/800/450",
    "https://picsum.photos/seed/post5-img2/800/450",
    "https://picsum.photos/seed/post5-img3/800/450"
  ],
  "isFollowed":false,
  "videoUrl": "",
  "content": "详细的攻略来了，包含路线规划和装备推荐。",
  "viewCount": 2341,
  "likeCount": 189,
  "collectCount": 76,
  "commentCount": 45,
  "isLiked": false,
  "isFavorited": false,
  "category": "骑行",
  "tags": ["骑行", "自行车", "骑行路线", "长途骑行"],
  "status": 1,
  "publishTime": "2026-04-15T08:30:00",
  // "routeInfo": {
  //   "distance": "150km",
  //   "duration": "2天",
  //   "difficulty": "中等",
  //   "transport": "自行车"
  // }

}



//+ 生成笔记或攻略
function generatePost(id: number, user: typeof mockUsers[0], isGuide: boolean) {
  //+ id param converted to string in return object
  const category = randomItem(categories)
  const isVideo = !isGuide && Math.random() > 0.7
  const imageCount = isVideo ? 0 : randomInt(1, 5)
  const categoryTags = tags[category] || tags['徒步']
  const titleTemplates = noteTitles[category] || noteTitles['徒步']
  
  //+ 生成图片URL
  const images: string[] = []
  for (let j = 0; j < imageCount; j++) {
    images.push(`https://picsum.photos/seed/post${id}-img${j + 1}/300/400`)
  }
  
  //+ 视频封面图（16:9）
  const videoUrl = isVideo ? `https://picsum.photos/seed/post${id}-video/400/225` : ''
  const coverImg = isVideo 
    ? `https://picsum.photos/seed/post${id}-video/400/225`
    : (images[0] || `https://picsum.photos/seed/post${id}-cover/300/400`)
  
  //+ 生成标签
  const postTags = [category]
  while (postTags.length < randomInt(2, 4)) {
    const tag = randomItem(categoryTags)
    if (!postTags.includes(tag)) {
      postTags.push(tag)
    }
  }
  
  return {
    id: String(id),
    //+ type为后端检索字段：笔记/攻略，视频通过videoUrl判断
    type: isGuide ? '攻略' as const : '笔记' as const,
    author: {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar
    },
    title: `${randomItem(titleTemplates)}${randomInt(1, 100)}`,
    coverImg,
    images,
    videoUrl,
    content: randomItem(contents),
    viewCount: randomInt(50, 5000),
    likeCount: randomInt(10, 500),
    collectCount: randomInt(5, 200),
    commentCount: randomInt(1, 100),
    isLiked: false,
    isFavorited: false,
    category,
    tags: postTags,
    status: 1,
    publishTime: randomDate(30),
    routeInfo: isGuide ? randomItem(routeInfos) : undefined
  }
}



//+ 生成所有笔记和攻略数据
let postId = 1
export const mockPosts: ReturnType<typeof generatePost>[] = []

//+ 为每个用户生成笔记和攻略
mockUsers.forEach(user => {
  //+ 生成笔记（1-10个）
  const noteCount = randomInt(1, 10)
  for (let i = 0; i < noteCount; i++) {
    mockPosts.push(generatePost(postId++, user, false))
  }
  
  //+ 生成攻略（1-10个）
  const guideCount = randomInt(1, 10)
  for (let i = 0; i < guideCount; i++) {
    mockPosts.push(generatePost(postId++, user, true))
  }
})

//+ Mock路由映射：笔记模块
export const noteMockRoutes: Record<string, (data?: any, url?: string) => any> = {
  //+ 获取笔记/攻略列表（瀑布流）

  'GET /api/v1/notes': (data) => {
    const page = data?.page || 1
    const size = data?.size || 10
    
    //+ 使用动态生成的mockPosts数据
    let filteredPosts = [...mockPosts]
    
    //+ 根据分类筛选
    const category = data?.category
    if (category && category !== '全部') {
      filteredPosts = filteredPosts.filter(n => n.category === category)
    }
    
    //+ 根据类型筛选（type为后端检索字段：笔记/攻略）
    //+ 视频筛选通过videoUrl判断，type仍为'笔记'
    const type = data?.type
    if (type && type !== '全部') {
      if (type === '视频') {
        //+ 视频筛选：有videoUrl的笔记
        filteredPosts = filteredPosts.filter(n => n.videoUrl)
      } else {
        filteredPosts = filteredPosts.filter(n => n.type === type)
      }
    }
    
    //+ 排序
    const sort = data?.sort || '推荐'
    if (sort === '最新') {
      filteredPosts.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
    } else if (sort === '最热') {
      filteredPosts.sort((a, b) => b.viewCount - a.viewCount)
    }
    
    return successResponse(createPageResponse(filteredPosts, page, size))
  },

  //+ 获取笔记详情
  'GET /api/v1/notes/:id': (_, url) => {
    const id = (url as string).split('/').pop() || '1'
    const mockNote = mockNoteDetailPost
    if (mockNote) {
      console.log("成功获取笔记详情",mockNote)
      return successResponse(mockNote)
    }
    console.log("笔记不存在",id)
    return errorResponse('笔记不存在')
  },

  //+ 发布笔记
  'POST /api/v1/notes': (data) => {
    const newPost = {
      id: String(postId++),
      type: '笔记' as const,
      author: mockUsers[0],
      title: data?.title || '新笔记',
      coverImg: data?.images?.[0] || '',
      images: data?.images || [],
      videoUrl: data?.videoUrl || '',
      content: data?.content || '',
      viewCount: 0,
      likeCount: 0,
      collectCount: 0,
      commentCount: 0,
      isLiked: false,
      isFavorited: false,
      category: data?.category || '徒步',
      tags: data?.tags || [],
      status: 1,
      publishTime: randomDate(0),
      routeInfo: undefined
    }
    mockPosts.unshift(newPost)
    return successResponse(newPost)
  },

  //+ 笔记点赞/取消点赞
  'POST /api/v1/notes/:id/like': (_, url) => {
    const id = (url as string).split('/')[2] || '1'
    const note = mockPosts.find(n => n.id === id)
    if (note) {
      note.isLiked = !note.isLiked
      note.likeCount += note.isLiked ? 1 : -1
      return successResponse({
        isLiked: note.isLiked,
        likeCount: note.likeCount
      })
    }
    return errorResponse('笔记不存在')
  },

  //+ 笔记收藏/取消收藏
  'POST /api/v1/notes/:id/favorite': (_, url) => {
    const id = (url as string).split('/')[2] || '1'
    const note = mockPosts.find(n => n.id === id)
    if (note) {
      note.isFavorited = !note.isFavorited
      note.collectCount += note.isFavorited ? 1 : -1
      return successResponse({
        isFavorited: note.isFavorited
      })
    }
    return errorResponse('笔记不存在')
  }
}
