import React from 'react'
import {Button as NutuiButton} from '@nutui/nutui-react'
import './index.less'

type NutuiButtonProps = React.ComponentProps<typeof NutuiButton>

//+ 自定义 Button：兼容原有的 content/isFollowed 语义，同时透传 NutUIButton 全部原生属性
//+ 包括 loading / disabled / className / type 等
const Button: React.FC<Partial<NutuiButtonProps> & {
  content?: string
  isFollowed?: boolean
  children?: React.ReactNode
}> = ({ content, isFollowed, className, disabled, children, onClick, ...rest }) => {
  //+ 向后兼容：原项目 Button 仅支持 (content, onClick, isFollowed)
  //+ isFollowed=true 时展示 disabled 外观（不拦截 onClick，由外部自行判断）
  const isFollowedDisabledCls = isFollowed ? 'disabled' : ''
  return (
    <NutuiButton
      {...rest}
      disabled={disabled}
      className={`nutui-button ${isFollowedDisabledCls} ${className || ''}`}
      onClick={onClick}
    >
      {children ?? content}
    </NutuiButton>
  )
}

export default Button
