//+ 活动模块Mock数据和路由
import { randomInt, randomItem, randomDate, createPageResponse, successResponse, errorResponse } from './utils'
import { mockUsers } from './user'

//+ 活动Banner数据
export const mockBanners = [
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

//+ 活动类型列表
const activityTypes = ['徒步', '露营', '骑行', '登山', '跑步', '攀岩', '溯溪', '自驾']

//+ 难度等级
const difficulties = ['简单', '中等', '困难', '挑战']

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

//+ 生成活动数据
function generateActivity(id: number) {
  const type = randomItem(activityTypes)
  const leader = randomItem(mockUsers)

  return {
    id: String(id),
    leader: {
      id: leader.id,
      nickname: leader.nickname,
      avatar: leader.avatar
    },
    title: activityTitles[randomInt(0, activityTitles.length - 1)].replace('{type}', type),
    coverImg: `https://picsum.photos/seed/activity${id}/400/300`,
    activityType: type,
    address: randomItem(addresses),
    activityContent: `这是一个关于${type}的精彩活动，欢迎大家报名参加！`,
    startTime: randomDate(14),
    endTime: randomDate(7),
    signUpStart: randomDate(30),
    signUpEnd: randomDate(1),
    maxPeople: randomInt(10, 30),
    currentPeople: randomInt(1, 15),
    price: randomItem([0, 50, 100, 200, 500]),
    difficulty: randomItem(difficulties),
    activityStatus: randomInt(0, 2),
    joined: Math.random() > 0.5,
    members: Array.from({ length: randomInt(1, 5) }, (_, i) => {
      const member = mockUsers[randomInt(0, mockUsers.length - 1)]
      return {
        id: member.id,
        nickname: member.nickname,
        avatar: member.avatar
      }
    })
  }
}

//+ 生成活动列表数据
export const mockActivities: ReturnType<typeof generateActivity>[] = Array.from({ length: 20 }, (_, i) => generateActivity(i + 1))

//+ Mock路由映射：活动模块
export const activityMockRoutes: Record<string, (data?: any, url?: string) => any> = {
  //+ 获取首页活动Banner
  'GET /api/v1/activities/banners': () => successResponse(mockBanners),

  //+ 获取活动列表
  'GET /api/v1/activities': (data) => {
    const page = data?.page || 1
    const size = data?.size || 10
    
    let filteredActivities = [...mockActivities]
    
    //+ 根据类型筛选
    const type = data?.type
    if (type && type !== '全部') {
      filteredActivities = filteredActivities.filter(a => a.activityType === type)
    }
    
    //+ 根据时间筛选
    const time = data?.time
    if (time && time !== '全部') {
      const now = new Date()
      if (time === '本周') {
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        filteredActivities = filteredActivities.filter(a => {
          const startTime = new Date(a.startTime)
          return startTime >= now && startTime <= weekEnd
        })
      } else if (time === '本月') {
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        filteredActivities = filteredActivities.filter(a => {
          const startTime = new Date(a.startTime)
          return startTime >= now && startTime <= monthEnd
        })
      }
    }
    
    return successResponse(createPageResponse(filteredActivities, page, size))
  },

  //+ 获取活动详情
  'GET /api/v1/activities/:id': (_, url) => {
    const id = (url as string).split('/').pop() || '1'
    const activity = mockActivities.find(a => a.id === id)
    if (activity) {
      return successResponse(activity)
    }
    return errorResponse('活动不存在')
  },

  //+ 创建活动（仅领队）
  'POST /api/v1/activities': (data) => {
    const newActivity = {
      id: String(mockActivities.length + 1),
      leader: mockUsers[0],
      title: data?.title || '新活动',
      coverImg: data?.cover || '',
      activityType: data?.activityType || '徒步',
      address: data?.address || '',
      activityContent: data?.activityContent || '',
      startTime: data?.startTime || randomDate(14),
      endTime: data?.endTime || randomDate(7),
      signUpStart: data?.signUpStart || randomDate(30),
      signUpEnd: data?.signUpEnd || randomDate(1),
      maxPeople: data?.maxPeople || 20,
      currentPeople: 0,
      price: data?.price || 0,
      difficulty: data?.difficulty || '简单',
      activityStatus: 1,
      joined: false,
      members: []
    }
    mockActivities.unshift(newActivity)
    return successResponse(newActivity)
  },

  //+ 报名/取消报名
  'POST /api/v1/activities/:id/signup': (_, url) => {
    const id = (url as string).split('/')[2] || '1'
    const activity = mockActivities.find(a => a.id === id)
    if (activity) {
      activity.joined = !activity.joined
      activity.currentPeople += activity.joined ? 1 : -1
      return successResponse({
        joined: activity.joined,
        currentPeople: activity.currentPeople
      })
    }
    return errorResponse('活动不存在')
  },

  //+ 获取我的活动
  'GET /api/v1/user/activities': () => {
    const myActivities = mockActivities.filter(a => a.joined)
    return successResponse(myActivities)
  }
}
