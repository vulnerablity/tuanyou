//+ 标签模块API接口封装
//+ 对接后端 /common/tags 接口（发布笔记/攻略时供用户选择标签）
import { apiGet } from '@/utils/request'
import type { Tag } from '@/types'

//+ GET /common/tags 获取标签列表
export function getTags(): Promise<Tag[]> {
  return apiGet<Tag[]>('/common/tags')
}
