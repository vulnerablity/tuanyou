//+ 标签API接口封装
import { get } from '@/utils/request'
import type { Tag } from '@/types'

//+ 获取标签列表
//+ 返回所有启用（status=1）的标签，按 id 升序
//+ 供笔记/攻略发布时选择：返回的 tagName 原样传给 POST /notes 或 POST /guides 的 tags 字段
export function getTagsAPI() {
  return get<Tag[]>('/common/tags')
}
