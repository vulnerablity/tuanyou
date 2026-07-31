//+ Mock数据汇总入口
//+ 合并所有模块的Mock路由

import { userMockRoutes } from './user'
import { noteMockRoutes } from './note'
import { activityMockRoutes } from './activity'
import { configMockRoutes } from './config'
import { homeMockRoutes } from './home'

//+ 合并所有Mock路由
export const mockRoutes: Record<string, (data?: any, url?: string) => any> = {
  ...userMockRoutes,
  ...noteMockRoutes,
  ...activityMockRoutes,
  ...configMockRoutes,
  ...homeMockRoutes
}

//+ 重新导出各模块的Mock数据供其他模块使用
export { mockUsers } from './user'
export { mockPosts ,mockNoteDetailPost} from './note'
export { mockBanners, mockActivities } from './activity'
export { mockCategories, mockSorts, mockTypes } from './config'
export { mockSlides, mockFeed } from './home'
export * from './utils'
