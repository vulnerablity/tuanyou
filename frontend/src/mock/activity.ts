//+ 活动模块Mock数据和路由
//+ 用户分两类：mockUsers=会员，mockLeaders=领队
import type { ActivityBanner } from '@/types'
import { randomInt, randomItem, randomDate, randomFutureDate, createPageResponse, successResponse, errorResponse, toNumber } from './utils'
import type { MockHandler, MockData } from './utils'
import { mockUsers, mockLeaders } from './user'

//+ 活动Banner数据
export const mockBanners: ActivityBanner[] = [
  {
    id: '1',
    title: '武功山云海露营',
    coverImg: 'https://picsum.photos/seed/banner-camp/800/450',
    currentPeople: 8,
    maxPeople: 20,
    activityStatus: 1
  },
  {
    id: '2',
    title: '楠溪江溯溪一日游',
    coverImg: 'https://picsum.photos/seed/banner-stream/800/450',
    currentPeople: 6,
    maxPeople: 15,
    activityStatus: 1
  },
  {
    id: '3',
    title: '千岛湖环湖骑行',
    coverImg: 'https://picsum.photos/seed/banner-bike/800/450',
    currentPeople: 12,
    maxPeople: 25,
    activityStatus: 1
  },
  {
    id: '4',
    title: '哈巴雪山攀登',
    coverImg: 'https://picsum.photos/seed/banner-mountain/800/450',
    currentPeople: 4,
    maxPeople: 10,
    activityStatus: 1
  },
  {
    id: '5',
    title: '青海湖自驾之旅',
    coverImg: 'https://picsum.photos/seed/banner-drive/800/450',
    currentPeople: 15,
    maxPeople: 30,
    activityStatus: 1
  }
]

//+ 活动类型列表（与 API 文档一致：徒步/露营/骑行/登山/跑步/攀岩/溯溪）
const activityTypes = ['徒步', '露营', '骑行', '登山', '跑步', '攀岩', '溯溪']

//+ 难度等级（与 OpenAPI 枚举一致）
const difficulties = ['入门', '中等', '中高等', '高等']

//+ 活动状态（与 OpenAPI 一致，后端按时间自动计算）
const activityStatusList = ['报名中', '进行中', '已结束']

//+ 地址列表
const addresses = [
  '江西省萍乡市武功山',
  '浙江省温州市楠溪江',
  '浙江省杭州市千岛湖',
  '云南省迪庆州哈巴雪山',
  '青海省海北州青海湖',
  '四川省阿坝州四姑娘山',
  '新疆独库公路',
  '西藏林芝地区'
]

//+ 活动标题模板
const activityTitles = [
  '周末{type}活动',
  '{type}爱好者聚会',
  '新手{type}入门',
  '资深{type}挑战',
  '{type}攻略分享会',
  '{type}装备交流'
]

//+ 生成活动数据（leader 从 mockLeaders 取，members 从 mockUsers 取）
function generateActivity(id: number) {
  const type = randomItem(activityTypes)
  //+ 领队从 mockLeaders 中随机选取，提取 id/nickname/avatar/bio
  //+ bio/isFollowed 字段与真实后端对齐（活动详情接口 leader 携带）
  const leader = randomItem(mockLeaders)
  const leaderInfo = {
    id: leader.id,
    nickname: leader.nickname,
    avatar: leader.avatar,
    bio: leader.bio || '',
    isFollowed: Math.random() > 0.5
  }

  return {
    id: String(id),
    leader: leaderInfo,
    title: activityTitles[randomInt(0, activityTitles.length - 1)].replace('{type}', type),
    coverImg: `https://picsum.photos/seed/activity${id}/400/300`,
    //+ 与 API 文档统一使用 category 字段
    category: type,
    address: randomItem(addresses),
    activityContent: `这是一个关于${type}的精彩活动，欢迎大家报名参加！`,
    //+ startTime 用未来日期（0-14天），便于活动日历搜索页按日期筛选
    startTime: randomFutureDate(14),
    endTime: randomFutureDate(7),
    signUpStart: randomDate(30),
    signUpEnd: randomDate(1),
    maxPeople: randomInt(10, 30),
    currentPeople: randomInt(1, 15),
    price: randomItem([0, 50, 100, 200, 500]),
    difficulty: randomItem(difficulties),
    //+ activityStatus 为字符串（报名中/进行中/已结束）
    activityStatus: randomItem(activityStatusList),
    joined: Math.random() > 0.5,
    //+ 成员从 mockUsers（会员）中随机选取
    members: Array.from({ length: randomInt(1, 5) }, () => {
      const member = mockUsers[randomInt(0, mockUsers.length - 1)]
      return {
        id: member.id,
        nickname: member.nickname,
        avatar: member.avatar
      }
    }),
    //+ 是否为本人发布（领队id为'1'模拟当前登录用户）
    isOwner: leader.id === '1'
  }
}

//+ 生成活动列表数据
export const mockActivities: ReturnType<typeof generateActivity>[] = Array.from({ length: 20 }, (_, i) => generateActivity(i + 1))

//+ Mock路由映射：活动模块
export const activityMockRoutes: Record<string, MockHandler> = {
  //+ 获取首页活动Banner
  'GET /api/v1/activities/banners': () => successResponse(mockBanners),

  //+ 获取活动列表（与 OpenAPI 对齐：按 category / date 筛选）
  'GET /api/v1/activities': (data?: MockData) => {
    const page = toNumber(data?.page, 1)
    const size = toNumber(data?.size, 10)

    let filteredActivities = [...mockActivities]

    //+ 根据分类筛选：'全部' 或不传 = 不过滤，其他按 category 精确匹配
    const category = data?.category
    if (category && category !== '全部') {
      filteredActivities = filteredActivities.filter(a => a.category === category)
    }

    //+ 根据日期筛选：传 date(YYYY-MM-DD) 时按 startTime 的日期部分匹配
    const date = data?.date
    if (date) {
      filteredActivities = filteredActivities.filter(a => {
        //+ startTime 格式 "YYYY-MM-DD HH:mm"，取前10位与 date 比较
        return a.startTime && a.startTime.slice(0, 10) === date
      })
    }

    return successResponse(createPageResponse(filteredActivities, page, size))
  },

  //+ 获取活动详情
  'GET /api/v1/activities/:id': (_data, url) => {
    const id = (url || '').split('/').pop() || '1'
    const activity = mockActivities.find(a => a.id === id)
    if (activity) {
      return successResponse(activity)
    }
    return errorResponse('活动不存在')
  },

  //+ 创建活动（仅领队，真实 unshift 进 mockActivities，列表立即可见）
  'POST /api/v1/activities': (data?: MockData) => {
    //+ 创建者为领队（mockLeaders[0]），只提取必要字段
    const creator = mockLeaders[0]
    const newActivity = {
      id: String(mockActivities.length + 1),
      leader: {
        id: creator.id,
        nickname: creator.nickname,
        avatar: creator.avatar,
        bio: creator.bio || '',
        isFollowed: false
      },
      title: String(data?.title || '新活动'),
      coverImg: String(data?.coverImg || ''),
      category: String(data?.category || '徒步'),
      address: String(data?.address || ''),
      activityContent: String(data?.activityContent || ''),
      startTime: String(data?.startTime || randomFutureDate(14)),
      endTime: String(data?.endTime || randomFutureDate(7)),
      //+ signUpStart/signUpEnd 由后端自动计算，Mock 仅占位
      signUpStart: new Date().toISOString().slice(0, 16).replace('T', ' '),
      signUpEnd: String(data?.startTime || randomDate(1)),
      maxPeople: toNumber(data?.maxPeople, 20),
      currentPeople: 0,
      price: toNumber(data?.price, 0),
      difficulty: String(data?.difficulty || '中等'),
      activityStatus: '报名中',
      joined: false,
      members: [] as { id: string; nickname: string; avatar: string }[],
      //+ 新创建活动是本人发布
      isOwner: true
    }
    mockActivities.unshift(newActivity)
    return successResponse(newActivity)
  },

  //+ 报名/取消报名（真实翻转 joined + currentPeople）
  'POST /api/v1/activities/:id/signup': (_, url) => {
    //+ URL 格式 /api/v1/activities/{id}/signup，提取 id 需去掉 /signup 后取末段
    const id = (url || '').replace('/signup', '').split('/').pop() || '1'
    const activity = mockActivities.find(a => a.id === id)
    if (activity) {
      activity.joined = !activity.joined
      activity.currentPeople += activity.joined ? 1 : -1
      return successResponse({
        isJoined: activity.joined,
        currentPeople: activity.currentPeople
      })
    }
    return errorResponse('活动不存在')
  },

  //+ 获取我的活动
  'GET /api/v1/user/activities': () => {
    const myActivities = mockActivities.filter(a => a.joined)
    return successResponse(myActivities)
  },

  //+ 删除活动（领队，真实从 mockActivities 移除）
  'DELETE /api/v1/activities/:id': (_data, url) => {
    const id = (url || '').split('/').pop() || '1'
    const idx = mockActivities.findIndex(a => a.id === id)
    if (idx >= 0) {
      mockActivities.splice(idx, 1)
      return successResponse({ message: '删除成功' })
    }
    return errorResponse('活动不存在')
  }
}
