//+ 消息列表骨架屏组件（使用 NutUI 内置 Skeleton）
//+ NutUI Skeleton 实际 props：rows/size/width/height/shape/animated/duration/visible
//+ 不支持 avatar/avatarSize/avatarShape/title（文档与实际类型不符）
//+ 用多个 Skeleton 组合：圆形头像 + 多行文字
//+ 首次加载时展示，刷新/加载更多时不展示
import { Skeleton } from '@nutui/nutui-react'

const MessageSkeleton = () => {
  return (
    <div style={{ padding: '24px 32px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: '16px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {/* 头像骨架：圆形，80px */}
          <Skeleton
            visible={false}
            animated
            shape="circle"
            width="80px"
            height="80px"
            style={{ marginRight: '20px', flexShrink: 0 }}
          />
          {/* 右侧三行文字骨架 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Skeleton visible={false} animated rows={1} width="40%" />
            <Skeleton visible={false} animated rows={1} width="80%" />
            <Skeleton visible={false} animated rows={1} width="20%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default MessageSkeleton
