//+ 系统通知消息项组件
//+ 布局：左侧圆形图标盒子（浅绿背景+绿色图标）→ 右侧内容+时间+展开/收起
//+ 未读：浅绿色背景 + 右上角绿色实心小圆点
//+ 删除：外层 SwipeAction 包裹，左滑露出红色删除按钮
import { useState } from 'react'
import { IconFont } from '@nutui/icons-react'
import '@/assets/iconfont.css'
import SwipeAction from '@/components/SwipeAction'
import { formatMessageTime } from '@/utils/formatMessageTime'
import type { SystemMessage } from '@/types/entity'

interface SystemMessageItemProps {
  item: SystemMessage
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
  swipeOpen?: boolean
  onSwipeOpen?: () => void
}

const SystemMessageItem = ({ item, onMarkRead, onDelete, swipeOpen, onSwipeOpen }: SystemMessageItemProps) => {
  const [expanded, setExpanded] = useState(false)

  const mayOverflow = item.content.length > 20

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
        className={`message-item system-message-item ${!item.read ? 'unread' : ''}`}
        onClick={handleClick}
      >
        <div className='system-icon-box'>
          <IconFont
            name='xiaoxitongzhi'
            fontClassName='iconfont'
            classPrefix='icon'
            className='system-icon'
          />
        </div>

        <div className='message-item-body'>
          <div className={`message-item-content ${expanded ? 'expanded' : 'collapsed'}`}>
            {item.content}
          </div>

          <div className='message-item-time-row'>
            <span className='message-item-time'>{formatMessageTime(item.createdAt)}</span>
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
          </div>
        </div>

        {!item.read && <span className='message-item-unread-dot' />}
      </div>
    </SwipeAction>
  )
}

export default SystemMessageItem
