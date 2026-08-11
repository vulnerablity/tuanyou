//+ 评论消息项组件（互动消息中最复杂的类型）
//+ 布局：头像左侧 → 内容右侧（昵称+图标 / 内容 / [回复列表框] / [回复输入框] / 时间+回复+查看回复）
//+ 交互：
//+   1. 点击"回复" → 内容和时间之间插入输入框+发送+取消
//+   2. 点击"查看回复(N)" → 内容和时间之间插入灰色背景回复列表框
//+   3. 两者同时显示时：输入框在下，回复列表框在上
//+   4. replyCount=0 时不显示"查看回复"
//+   5. 收起回复只在"时间行"显示，回复列表框内部不再放重复的"收起回复"
//+ 文字样式：展开/收起/我/ta/回复/发送=绿色细体；取消=灰色；查看回复/收起回复=灰色
//+ props 驱动，后期接入链路时组件不改
import { useState } from 'react'
import { IconFont } from '@nutui/icons-react'
import '@/assets/iconfont.css'
import Avatar from '@/components/Avatar'
import { formatMessageTime } from '@/utils/formatMessageTime'
import type { InteractionMessage } from '@/types/entity'

interface CommentMessageItemProps {
  item: InteractionMessage
  onMarkRead?: (id: string) => void
  onReply?: (messageId: string, replyContent: string) => void
}

const CommentMessageItem = ({ item, onMarkRead, onReply }: CommentMessageItemProps) => {
  //+ 内容展开/收起
  const [contentExpanded, setContentExpanded] = useState(false)
  //+ 回复输入框显隐
  const [replyInputVisible, setReplyInputVisible] = useState(false)
  //+ 回复列表框显隐
  const [replyListVisible, setReplyListVisible] = useState(false)
  //+ 回复输入框内容
  const [replyText, setReplyText] = useState('')
  //+ 本地回复列表（发送回复后追加到此，乐观更新）
  const [localReplies, setLocalReplies] = useState(item.replies || [])

  const mayOverflow = item.content.length > 40
  const replyCount = localReplies.length

  //+ 点击任意功能，只要未读就触发 onMarkRead
  const tryMarkRead = () => {
    if (!item.read) {
      onMarkRead?.(item.id)
    }
  }

  const handleClick = () => {
    tryMarkRead()
  }

  //+ 点击"回复"按钮（绿色，与展开同颜色）
  const handleToggleReplyInput = (e: React.MouseEvent) => {
    e.stopPropagation()
    tryMarkRead()
    setReplyInputVisible(!replyInputVisible)
    if (!replyInputVisible) {
      setReplyText('')
    }
  }

  //+ 点击"查看回复"/"收起回复"
  const handleToggleReplyList = (e: React.MouseEvent) => {
    e.stopPropagation()
    tryMarkRead()
    setReplyListVisible(!replyListVisible)
  }

  //+ 发送回复
  const handleSendReply = (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = replyText.trim()
    if (!text) return
    tryMarkRead()
    //+ 乐观追加到本地回复列表
    const newReply = { id: `local-${Date.now()}`, author: 'me' as const, content: text }
    setLocalReplies([...localReplies, newReply])
    setReplyText('')
    setReplyInputVisible(false)
    //+ 回复列表自动展开（让用户看到刚发的回复）
    setReplyListVisible(true)
    onReply?.(item.id, text)
  }

  //+ 取消回复
  const handleCancelReply = (e: React.MouseEvent) => {
    e.stopPropagation()
    tryMarkRead()
    setReplyInputVisible(false)
    setReplyText('')
  }

  return (
    <div
      className={`message-item comment-message-item ${!item.read ? 'unread' : ''}`}
      onClick={handleClick}
    >
      {/* 左侧头像 */}
      <div className='message-item-avatar'>
        <Avatar url={item.member.avatar} size='40' />
      </div>

      {/* 右侧内容 */}
      <div className='message-item-body'>
        {/* 第一行：昵称 + 评论图标 */}
        <div className='message-item-nickname-row'>
          <span className='message-item-nickname'>{item.member.nickname}</span>
          <IconFont
            name='xiaoxi'
            fontClassName='iconfont'
            classPrefix='icon'
            className='message-item-type-icon'
          />
        </div>

        {/* 第二行：评论内容（超2行省略 + 展开/收起） */}
        <div className={`message-item-content ${contentExpanded ? 'expanded' : 'collapsed'}`}>
          {item.content}
        </div>
        {mayOverflow && (
          <span
            className='message-item-expand-btn'
            onClick={(e) => {
              e.stopPropagation()
              tryMarkRead()
              setContentExpanded(!contentExpanded)
            }}
          >
            {contentExpanded ? '收起' : '展开'}
          </span>
        )}

        {/* 回复列表框（灰色背景，在输入框上方）；注意：收起回复只在下方"时间行"显示，这里不放重复按钮 */}
        {replyListVisible && localReplies.length > 0 && (
          <div className='reply-list-box'>
            {localReplies.map((r) => (
              <div key={r.id} className='reply-list-row'>
                <span className='reply-author'>{r.author === 'me' ? '我' : 'ta'}</span>
                <span className='reply-content-text'>{r.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* 回复输入框（发送 + 取消） */}
        {replyInputVisible && (
          <div className='reply-input-box'>
            <input
              className='reply-input'
              placeholder='写回复...'
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onClick={(e) => {
                e.stopPropagation()
                tryMarkRead()
              }}
            />
            <span
              className={`reply-send-btn ${!replyText.trim() ? 'disabled' : ''}`}
              onClick={replyText.trim() ? handleSendReply : undefined}
            >
              发送
            </span>
            <span
              className='reply-cancel-btn'
              onClick={handleCancelReply}
            >
              取消
            </span>
          </div>
        )}

        {/* 时间行：时间 + 回复(绿色) + 查看回复(N)/收起回复(灰色) */}
        <div className='message-item-time-row'>
          <span className='message-item-time'>{formatMessageTime(item.createdAt)}</span>
          <span
            className='message-item-action-btn action-green'
            onClick={handleToggleReplyInput}
          >
            回复
          </span>
          {replyCount > 0 && (
            <span
              className='message-item-action-btn'
              onClick={handleToggleReplyList}
            >
              {replyListVisible ? '收起回复' : `查看回复(${replyCount})`}
            </span>
          )}
        </div>
      </div>

      {/* 未读绿色小圆点 */}
      {!item.read && <span className='message-item-unread-dot' />}
    </div>
  )
}

export default CommentMessageItem
