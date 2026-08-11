//+ 消息页面头部组件：左侧"消息"标题，右侧"全部已读"按钮
//+ props 驱动，后期接入链路时只需传入 onMarkAllRead 回调即可
interface MessageHeaderProps {
  onMarkAllRead: () => void
}

const MessageHeader = ({ onMarkAllRead }: MessageHeaderProps) => {
  return (
    <div className='message-header'>
      <span className='message-header-title'>消息</span>
      <span className='message-header-readall' onClick={onMarkAllRead}>
        全部已读
      </span>
    </div>
  )
}

export default MessageHeader
