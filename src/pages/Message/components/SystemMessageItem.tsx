//+ 系统通知消息项组件
//+ 布局：左侧圆形图标盒子（浅绿背景+绿色图标，无论已读/未读）→ 右侧内容+时间+展开/收起
//+ 未读：浅绿色背景 + 右上角绿色实心小圆点
//+ 内容超2行：省略号，时间后面显示展开/收起（始终显示，确保长内容、短内容都可以展开查看完整）
//+ props 驱动，后期接入链路时组件不改
import { useState } from 'react'
import { IconFont } from '@nutui/icons-react'
import '@/assets/iconfont.css'
import { formatMessageTime } from '@/utils/formatMessageTime'
import type { SystemMessage } from '@/types/entity'

interface SystemMessageItemProps {
  item: SystemMessage
  onMarkRead?: (id: string) => void
}

const SystemMessageItem = ({ item, onMarkRead }: SystemMessageItemProps) => {
  const [expanded, setExpanded] = useState(false)

  //+ 只要内容超过 2 行（按 32 字粗估）就给展开/收起能力，始终显示展开/收起按钮
  //+ 避免"看起来不太长，但换行后变多行"导致没展开的情况
  const mayOverflow = item.content.length > 20

  //+ 点击任意功能，只要未读就触发 onMarkRead
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
      className={`message-item system-message-item ${!item.read ? 'unread' : ''}`}
      onClick={handleClick}
    >
      {/* 左侧圆形图标盒子：无论已读/未读都是浅绿背景+绿色图标 */}
      <div className='system-icon-box'>
        <IconFont
          name='xiaoxitongzhi'
          fontClassName='iconfont'
          classPrefix='icon'
          className='system-icon'
        />
      </div>

      {/* 右侧内容 */}
      <div className='message-item-body'>
        {/* 内容（超2行省略） */}
        <div className={`message-item-content ${expanded ? 'expanded' : 'collapsed'}`}>
          {item.content}
        </div>

        {/* 时间 + 展开/收起 */}
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

      {/* 未读绿色小圆点 */}
      {!item.read && <span className='message-item-unread-dot' />}
    </div>
  )
}

export default SystemMessageItem
