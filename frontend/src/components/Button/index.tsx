import type { ComponentProps, ReactNode } from 'react'
import { Button as NutuiButton } from '@nutui/nutui-react'
import './index.less'

type NutuiButtonProps = ComponentProps<typeof NutuiButton>

//+ 自定义 Button：兼容原有的 content/isFollowed 语义，同时透传 NutUIButton 全部原生属性
//+ 包括 loading / disabled / className / type 等
interface ButtonProps extends Partial<NutuiButtonProps> {
  //+ 按钮文案（children 优先；兼容旧调用点只传 content 的写法）
  content?: string
  //+ 是否已关注：true 时展示 disabled 外观（不拦截 onClick，由外部自行判断）
  isFollowed?: boolean
  children?: ReactNode
}

const Button = ({ content, isFollowed, className, disabled, children, onClick, ...rest }: ButtonProps) => {
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
