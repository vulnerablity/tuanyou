import { Tag as NutuiTagComponent } from '@nutui/nutui-react'
import './index.less'

interface TagProps {
  //+ 标签文案
  tagName?: string
  //+ 透传给 NutUI Tag 的额外 className（如 banner-tag）
  className?: string
}

//+ 全局统一小标签组件：统一 .tag 样式，避免各处裸用 NutUI Tag
const Tag = ({ tagName = '', className = '' }: TagProps) => {
  return (
    <NutuiTagComponent className={`tag ${className}`}>{tagName}</NutuiTagComponent>
  )
}

export default Tag
