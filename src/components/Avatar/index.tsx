import { Avatar as NutuiAvatar } from '@nutui/nutui-react'
import './index.less'

interface AvatarProps {
  //+ 头像图片地址
  url: string
  //+ 头像尺寸（透传 NutUI Avatar size，如 'small' / '35' / '40'）
  size: string
}

//+ 全局统一头像组件：固定 cover 裁剪，避免各页面样式漂移
const Avatar = ({ url, size }: AvatarProps) => {
  return (
    <NutuiAvatar
      src={url}
      fit='cover'
      size={size}
    />
  )
}

export default Avatar
