//+ 标签模块Mock数据和路由
//+ 对接后端 GET /common/tags，返回所有启用（status=1）的标签，按 id 升序
import { successResponse } from './utils'

//+ 标签列表（启用状态，按 id 升序）
//+ 融合接口文档示例（千岛湖/环湖/徒步）与发布页历史可选标签
export const mockTags = [
  { id: 1, tagName: '千岛湖' },
  { id: 2, tagName: '环湖' },
  { id: 3, tagName: '徒步' },
  { id: 4, tagName: '户外' },
  { id: 5, tagName: '登山' },
  { id: 6, tagName: '徒步路线' },
  { id: 7, tagName: '徒步装备' },
  { id: 8, tagName: '露营' },
  { id: 9, tagName: '帐篷' },
  { id: 10, tagName: '户外露营' },
  { id: 11, tagName: '露营美食' },
  { id: 12, tagName: '露营装备' },
  { id: 13, tagName: '骑行' },
  { id: 14, tagName: '自行车' },
  { id: 15, tagName: '骑行路线' },
  { id: 16, tagName: '长途骑行' },
  { id: 17, tagName: '山地车' },
  { id: 18, tagName: '雪山' },
  { id: 19, tagName: '高山' },
  { id: 20, tagName: '登顶' },
  { id: 21, tagName: '晨跑' },
  { id: 22, tagName: '夜跑' },
  { id: 23, tagName: '马拉松' },
  { id: 24, tagName: '跑步打卡' },
  { id: 25, tagName: '室内攀岩' },
  { id: 26, tagName: '户外攀岩' },
  { id: 27, tagName: '攀岩装备' },
  { id: 28, tagName: '溪水' },
  { id: 29, tagName: '清凉' },
  { id: 30, tagName: '户外玩水' },
  { id: 31, tagName: '自驾游' },
  { id: 32, tagName: '公路旅行' },
  { id: 33, tagName: '房车' },
  { id: 34, tagName: '户外装备' },
  { id: 35, tagName: '装备评测' },
  { id: 36, tagName: '装备推荐' },
  { id: 37, tagName: '户外摄影' },
  { id: 38, tagName: '风景摄影' },
  { id: 39, tagName: '人像摄影' }
]

//+ Mock路由映射：标签模块
export const tagMockRoutes: Record<string, (data?: any, url?: string) => any> = {
  //+ 获取标签列表（前台发布笔记/攻略时供用户选择）
  'GET /api/v1/common/tags': () => successResponse(mockTags)
}
