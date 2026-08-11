//+ 消息页面 Tab 切换组件：互动 / 系统通知
//+ 参考 NutUI Tabs 自定义 title 示例：title render prop + nut-tabs-titles-item 类名
//+ 文字右上方有红色未读数提示
//+ props 驱动，后期接入链路时只需传入 unreadCount 即可
import { Tabs ,Badge} from '@nutui/nutui-react'

interface MessageTabsProps {
  activeTab: number
  onChange: (tab: number) => void
  interactionUnread: number
  systemUnread: number
}

const MessageTabs = ({
  activeTab,
  onChange,
  interactionUnread,
  systemUnread,
}: MessageTabsProps) => {
  //+ Tab 列表配置（title / paneKey / 未读数）
  const list = [
    { title: '互动', paneKey: 0, unread: interactionUnread },
    { title: '系统通知', paneKey: 1, unread: systemUnread },
  ]

  return (
    <Tabs
      value={activeTab}
      className='message-tabs'
      title={() => list.map((item) => (
        <div
          key={item.paneKey}
          onClick={() => onChange(item.paneKey)}
          className={`nut-tabs-titles-item ${activeTab === item.paneKey ? 'nut-tabs-titles-item-active' : ''}`}
        >
          <Badge value={item.unread} max={99} top={12} right={0}>{item.title}</Badge>
          <span className='nut-tabs-titles-item-line' />
        </div>
      ))}
    >
      {list.map((item) => (
        <Tabs.TabPane key={item.paneKey} value={item.paneKey} />
      ))}
    </Tabs>
  )
}

export default MessageTabs
