//+ 消息页面（TabBar 页面，索引 3）
//+ 布局：固定头部（标题+全部已读 + Tab切换） + 可滑动消息列表
//+ 互动消息：点赞/收藏/关注/评论（评论含回复输入框+回复列表交互）
//+ 系统通知：单向推送消息
//+ 当前阶段：UI + 交互逻辑，静态数据填充，props 驱动设计
//+ 后期接入链路：替换 useState 数据为 store dispatch，组件层不改
//+ 技术方案：分层混合（互动轮询 + 系统SSE），预留 props 接口
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Taro from '@tarojs/taro'
import type { InteractionMessage, SystemMessage } from '@/types/entity'
import type { AppDispatch } from '@/store'
import {
  setUnreadCounts,
  clearAllUnread,
  decrementInteractionUnread,
  decrementSystemUnread,
} from '@/store/modules/message'
import MessageHeader from './components/MessageHeader'
import MessageTabs from './components/MessageTabs'
import InteractionItem from './components/InteractionItem'
import CommentMessageItem from './components/CommentMessageItem'
import SystemMessageItem from './components/SystemMessageItem'
import { interactionMockData, systemMockData } from './mock'
import './index.less'

const Message = () => {
  const dispatch = useDispatch<AppDispatch>()

  //+ Tab：0=互动 1=系统通知
  const [activeTab, setActiveTab] = useState(0)

  //+ 互动消息列表（后期替换为 store dispatch）
  const [interactionList, setInteractionList] = useState<InteractionMessage[]>(interactionMockData)
  //+ 系统通知列表
  const [systemList, setSystemList] = useState<SystemMessage[]>(systemMockData)

  //+ 未读数计算
  const interactionUnread = useMemo(
    () => interactionList.filter(m => !m.read).length,
    [interactionList]
  )
  const systemUnread = useMemo(
    () => systemList.filter(m => !m.read).length,
    [systemList]
  )

  //+ 未读数变化时同步到 store（TabBar 红点联动）
  useEffect(() => {
    dispatch(setUnreadCounts({ interactionUnread, systemUnread }))
  }, [interactionUnread, systemUnread, dispatch])

  //+ 页面卸载前清空 store（避免红点持久残留；后期接入全局轮询可移除）
  useEffect(() => {
    return () => {
      dispatch(setUnreadCounts({ interactionUnread: 0, systemUnread: 0 }))
    }
  }, [dispatch])

  //+ 全部已读：将当前 tab 的所有消息标记为已读
  const handleMarkAllRead = useCallback(() => {
    if (activeTab === 0) {
      setInteractionList(prev => prev.map(m => ({ ...m, read: true })))
      dispatch(clearAllUnread({ tab: 'interaction' }))
    } else {
      setSystemList(prev => prev.map(m => ({ ...m, read: true })))
      dispatch(clearAllUnread({ tab: 'system' }))
    }
    Taro.showToast({ title: '已全部标记为已读', icon: 'none' })
  }, [activeTab, dispatch])

  //+ 单条互动消息标记已读
  const handleMarkInteractionRead = useCallback((id: string) => {
    let changed = false
    setInteractionList(prev => prev.map(m => {
      if (m.id === id && !m.read) {
        changed = true
        return { ...m, read: true }
      }
      return m
    }))
    if (changed) {
      dispatch(decrementInteractionUnread())
    }
  }, [dispatch])

  //+ 单条系统通知标记已读
  const handleMarkSystemRead = useCallback((id: string) => {
    let changed = false
    setSystemList(prev => prev.map(m => {
      if (m.id === id && !m.read) {
        changed = true
        return { ...m, read: true }
      }
      return m
    }))
    if (changed) {
      dispatch(decrementSystemUnread())
    }
  }, [dispatch])

  //+ 回复评论消息（后期对接链路时替换为 API 调用）
  const handleReply = useCallback((messageId: string, _replyContent: string) => {
    Taro.showToast({ title: '回复成功', icon: 'none' })
  }, [])

  //+ Tab 切换
  const handleTabChange = useCallback((tab: number) => {
    setActiveTab(tab)
  }, [])

  return (
    <div className='message-page'>
      {/* 固定区域：标题 + 全部已读 */}
      <MessageHeader onMarkAllRead={handleMarkAllRead} />

      {/* 固定区域：Tab 切换 + 未读数红点 */}
      <MessageTabs
        activeTab={activeTab}
        onChange={handleTabChange}
        interactionUnread={interactionUnread}
        systemUnread={systemUnread}
      />

      {/* 可滑动消息列表 */}
      <div className='message-list-container'>
        {activeTab === 0 ? (
          //+ 互动消息列表
          interactionList.length === 0 ? (
            <div className='message-empty'>暂无互动消息</div>
          ) : (
            interactionList.map(item =>
              item.type === 'comment' ? (
                <CommentMessageItem
                  key={item.id}
                  item={item}
                  onMarkRead={handleMarkInteractionRead}
                  onReply={handleReply}
                />
              ) : (
                <InteractionItem
                  key={item.id}
                  item={item}
                  onMarkRead={handleMarkInteractionRead}
                />
              )
            )
          )
        ) : (
          //+ 系统通知列表
          systemList.length === 0 ? (
            <div className='message-empty'>暂无系统通知</div>
          ) : (
            systemList.map(item => (
              <SystemMessageItem
                key={item.id}
                item={item}
                onMarkRead={handleMarkSystemRead}
              />
            ))
          )
        )}
      </div>
    </div>
  )
}

export default Message
