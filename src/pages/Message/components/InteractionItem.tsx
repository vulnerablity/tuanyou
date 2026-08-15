//+ 通用互动消息项组件（点赞/收藏/关注）
//+ 布局：头像左侧 → 内容右侧（昵称+图标 / 内容 / 时间）
//+ 未读：右上角绿色实心小圆点 + 浅绿色背景
//+ 内容超2行：省略号 + 展开/收起
//+ 删除：外层 SwipeAction 包裹，左滑露出红色删除按钮
//+ props 驱动，后期接入链路时组件不改
import { useState } from 'react'
import { IconFont } from '@nutui/icons-react'
import { Ellipsis } from '@nutui/nutui-react'
import '@/assets/iconfont.css'
import Avatar from '@/components/Avatar'
import SwipeAction from '@/components/SwipeAction'
import { formatMessageTime } from '@/utils/formatMessageTime'
import type { InteractionMessage } from '@/types/entity'

interface InteractionItemProps {
  item: InteractionMessage
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
  //+ 父组件控制的展开状态（互斥：同时只有一项展开）
  swipeOpen?: boolean
  onSwipeOpen?: () => void
}

//+ 消息类型 → 图标映射
const TYPE_ICON_MAP: Record<string, string> = {
  like: 'like',
  favorite: 'shoucang',
  follow: 'wode',
}

const InteractionItem = ({ item, onMarkRead, onDelete, swipeOpen, onSwipeOpen }: InteractionItemProps) => {
  const [expanded, setExpanded] = useState(false)

  const fullContent = item.targetTitle
    ? `${item.content} ${item.targetTitle}`
    : item.content

  const mayOverflow = fullContent.length > 40

  const tryMarkRead = () => {
    if (!item.read) {
      onMarkRead?.(item.id)
    }
  }

  const handleClick = () => {
    tryMarkRead()
  }

  const handleDelete = () => {
    onDelete?.(item.id)
  }

  return (
    <SwipeAction
      onDelete={handleDelete}
      onSwipeOpen={onSwipeOpen}
      open={swipeOpen}
    >
      <div
        className={`message-item ${!item.read ? 'unread' : ''}`}
        onClick={handleClick}
      >
        <div className='message-item-avatar'>
          <Avatar url={item.member.avatar} size='40' />
        </div>

        <div className='message-item-body'>
          <div className='message-item-nickname-row'>
            <Ellipsis className='message-item-nickname' content={item.member.nickname} rows={1} />
            <IconFont
              name={TYPE_ICON_MAP[item.type] || 'xiaoxi'}
              fontClassName='iconfont'
              classPrefix='icon'
              className='message-item-type-icon'
            />
          </div>

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

          <div className='message-item-time'>{formatMessageTime(item.createdAt)}</div>
        </div>

        {!item.read && <span className='message-item-unread-dot' />}
      </div>
    </SwipeAction>
  )
}

export default InteractionItem
