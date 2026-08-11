//+ 通用互动消息项组件（点赞/收藏/关注）
//+ 布局：头像左侧 → 内容右侧（昵称+图标 / 内容 / 时间）
//+ 未读：右上角绿色实心小圆点 + 浅绿色背景
//+ 内容超2行：省略号 + 展开/收起
//+ props 驱动，后期接入链路时组件不改
import { useState } from 'react'
import { IconFont } from '@nutui/icons-react'
import '@/assets/iconfont.css'
import Avatar from '@/components/Avatar'
import { formatMessageTime } from '@/utils/formatMessageTime'
import type { InteractionMessage } from '@/types/entity'

interface InteractionItemProps {
  item: InteractionMessage
  onMarkRead?: (id: string) => void
}

//+ 消息类型 → 图标映射
const TYPE_ICON_MAP: Record<string, string> = {
  like: 'like',
  favorite: 'shoucang',
  follow: 'wode',
}

const InteractionItem = ({ item, onMarkRead }: InteractionItemProps) => {
  //+ 展开/收起状态
  const [expanded, setExpanded] = useState(false)

  //+ 拼接完整内容：互动描述 + 目标标题
  const fullContent = item.targetTitle
    ? `${item.content} ${item.targetTitle}`
    : item.content

  //+ 简易判断：内容超过40字认为可能超过2行
  const mayOverflow = fullContent.length > 40

  //+ 点击任意功能，只要未读就触发 onMarkRead（只触发一次）
  const tryMarkRead = () => {
    if (!item.read) {
      onMarkRead?.(item.id)
    }
  }

  const handleClick = () => {
    tryMarkRead()
  }

  return (
    <div
      className={`message-item ${!item.read ? 'unread' : ''}`}
      onClick={handleClick}
    >
      {/* 左侧头像 */}
      <div className='message-item-avatar'>
        <Avatar url={item.member.avatar} size='40' />
      </div>

      {/* 右侧内容 */}
      <div className='message-item-body'>
        {/* 第一行：昵称 + 图标 */}
        <div className='message-item-nickname-row'>
          <span className='message-item-nickname'>{item.member.nickname}</span>
          <IconFont
            name={TYPE_ICON_MAP[item.type] || 'xiaoxi'}
            fontClassName='iconfont'
            classPrefix='icon'
            className='message-item-type-icon'
          />
        </div>

        {/* 第二行：内容（超2行省略 + 展开/收起） */}
        <div className={`message-item-content ${expanded ? 'expanded' : 'collapsed'}`}>
          {fullContent}
        </div>
        {mayOverflow && (
          <span
            className='message-item-expand-btn'
            onClick={(e) => {
              e.stopPropagation()
              tryMarkRead()
              setExpanded(!expanded)
            }}
          >
            {expanded ? '收起' : '展开'}
          </span>
        )}

        {/* 第三行：时间（按同日/同年/不同年规则显示） */}
        <div className='message-item-time'>{formatMessageTime(item.createdAt)}</div>
      </div>

      {/* 未读绿色小圆点 */}
      {!item.read && <span className='message-item-unread-dot' />}
    </div>
  )
}

export default InteractionItem
