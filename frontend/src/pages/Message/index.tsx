//+ 消息页面（TabBar 页面，索引 3）
//+ 布局：固定头部（标题+全部已读 + Tab切换） + 可滑动消息列表
//+ 互动消息：点赞/收藏/关注/评论（评论含回复输入框+回复列表交互）
//+ 系统通知：单向推送消息
//+ 数据源：Redux store（message slice），通过 thunks 驱动 API
//+ 分页：容器级滚动（ref + onScroll），非 Taro useReachBottom
//+ 删除：左滑消息项露出红色删除按钮（SwipeAction 组件）
//+ SSE：场景1（非消息页）→ 全局弹窗；场景2（消息页）→ 提示条
//+ 下拉刷新：容器级下拉手势，重置分页拉取最新首页
import { useState, useCallback, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { PullToRefresh } from '@nutui/nutui-react'
import type { AppDispatch, RootState } from '@/store'
import {
  fetchInteractions,
  loadMoreInteractions,
  fetchSystemMessages,
  loadMoreSystemMessages,
  fetchUnreadCount,
  markMessageRead,
  markAllMessagesRead,
  replyInteraction,
  deleteMessage,
  setCurrentTab,
  setShowNewMessageTip,
  setPendingJumpTab,
} from '@/store/modules/message'
import { useAuthGuard } from '@/components/AuthRoute'
import MessageHeader from './components/MessageHeader'
import MessageTabs from './components/MessageTabs'
import InteractionItem from './components/InteractionItem'
import CommentMessageItem from './components/CommentMessageItem'
import SystemMessageItem from './components/SystemMessageItem'
import MessageSkeleton from './components/MessageSkeleton'
import './index.less'

const Message = () => {
  useAuthGuard()
  const dispatch = useDispatch<AppDispatch>()

  //+ 从 store 读取消息列表和分页状态
  const interactionList = useSelector((state: RootState) => state.message.interactionList)
  const systemList = useSelector((state: RootState) => state.message.systemList)
  const interactionUnread = useSelector((state: RootState) => state.message.interactionUnread)
  const systemUnread = useSelector((state: RootState) => state.message.systemUnread)
  const interactionHasMore = useSelector((state: RootState) => state.message.interactionHasMore)
  const systemHasMore = useSelector((state: RootState) => state.message.systemHasMore)
  const interactionLoadingMore = useSelector((state: RootState) => state.message.interactionLoadingMore)
  const systemLoadingMore = useSelector((state: RootState) => state.message.systemLoadingMore)
  const interactionLoading = useSelector((state: RootState) => state.message.interactionLoading)
  const systemLoading = useSelector((state: RootState) => state.message.systemLoading)
  const showNewMessageTip = useSelector((state: RootState) => state.message.showNewMessageTip)
  const pendingJumpTab = useSelector((state: RootState) => state.message.pendingJumpTab)

  //+ Tab：0=互动 1=系统通知
  const [activeTab, setActiveTab] = useState(0)

  //+ SwipeAction 互斥：记录当前展开的消息 id，同时只有一项展开
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null)

  //+ 列表容器 ref（用于滚动分页 + 下拉刷新 + 滚动位置控制）
  const listRef = useRef<HTMLDivElement>(null)

  //+ 下拉刷新状态
  const [refreshing, setRefreshing] = useState(false)

  //+ 页面首次加载：拉取互动消息、系统通知、未读数
  useEffect(() => {
    dispatch(fetchInteractions({ page: 1, size: 10 }))
    dispatch(fetchSystemMessages({ page: 1, size: 10 }))
    dispatch(fetchUnreadCount())
  }, [dispatch])

  //+ 同步当前 tab 到 store（SSE 判断用）
  useEffect(() => {
    dispatch(setCurrentTab(activeTab))
  }, [activeTab, dispatch])

  //+ 弹窗跳转处理：Message 页面挂载时，若有 pendingJumpTab 则切 tab + 置顶
  useEffect(() => {
    if (pendingJumpTab !== null) {
      setActiveTab(pendingJumpTab)
      //+ 滚动到顶部
      if (listRef.current) {
        listRef.current.scrollTop = 0
      }
      dispatch(setPendingJumpTab(null))
    }
  }, [pendingJumpTab, dispatch])

  //+ 滚动分页：容器级滚动监听
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = target
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (activeTab === 0 && interactionHasMore && !interactionLoadingMore) {
        dispatch(loadMoreInteractions())
      } else if (activeTab === 1 && systemHasMore && !systemLoadingMore) {
        dispatch(loadMoreSystemMessages())
      }
    }
  }, [activeTab, interactionHasMore, systemHasMore, interactionLoadingMore, systemLoadingMore, dispatch])

  //+ 下拉刷新
  const handleRefresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    if (activeTab === 0) {
      await dispatch(fetchInteractions({ page: 1, size: 10 }))
    } else {
      await dispatch(fetchSystemMessages({ page: 1, size: 10 }))
    }
    //+ 刷新成功后关闭新消息提示条
    dispatch(setShowNewMessageTip(false))
    //+ 刷新未读数
    dispatch(fetchUnreadCount())
    setRefreshing(false)
  }, [activeTab, refreshing, dispatch])

  //+ 全部已读
  const handleMarkAllRead = useCallback(() => {
    const currentUnread = activeTab === 0 ? interactionUnread : systemUnread
    if (currentUnread === 0) return
    const tab = activeTab === 0 ? 'interaction' : 'system'
    dispatch(markAllMessagesRead({ tab })).then(() => {
      dispatch(fetchUnreadCount())
    })
  }, [activeTab, interactionUnread, systemUnread, dispatch])

  //+ 单条标记已读
  const handleMarkInteractionRead = useCallback((id: string) => {
    dispatch(markMessageRead({ id, tab: 'interaction' }))
  }, [dispatch])

  const handleMarkSystemRead = useCallback((id: string) => {
    dispatch(markMessageRead({ id, tab: 'system' }))
  }, [dispatch])

  //+ 回复评论消息
  const handleReply = useCallback((messageId: string, replyContent: string) => {
    dispatch(replyInteraction({ id: messageId, content: replyContent }))
  }, [dispatch])

  //+ 删除消息
  const handleDelete = useCallback((id: string, tab: 'interaction' | 'system') => {
    dispatch(deleteMessage({ id, tab }))
    //+ 关闭已展开的滑动项
    setOpenSwipeId(null)
  }, [dispatch])

  //+ 滑动展开回调：互斥关闭其他项
  const handleSwipeOpen = useCallback((id: string) => {
    setOpenSwipeId(id)
  }, [])

  //+ Tab 切换
  const handleTabChange = useCallback((tab: number) => {
    setActiveTab(tab)
    //+ 切换 tab 时关闭已展开的滑动项
    setOpenSwipeId(null)
  }, [])

  //+ 骨架屏显示条件：首次加载且列表为空
  const showInteractionSkeleton = interactionLoading && interactionList.length === 0
  const showSystemSkeleton = systemLoading && systemList.length === 0

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

      {/* 新消息提示条（场景2.1：当前 tab 收到同类型新消息） */}
      {showNewMessageTip && (
        <div
          className='message-new-tip'
          onClick={handleRefresh}
        >
          有新消息，下拉刷新查看
        </div>
      )}

      {/* 可滑动消息列表（容器级滚动分页 + 下拉刷新） */}
      <div className='message-list-wrapper'>
        <PullToRefresh
          disabled={refreshing}
          onRefresh={handleRefresh}
          completeDelay={30}
        >
          <div
            className='message-list-container'
            ref={listRef}
            onScroll={handleScroll}
          >
          {activeTab === 0 ? (
            showInteractionSkeleton ? (
              <MessageSkeleton />
            ) : interactionList.length === 0 ? (
              <div className='message-empty'>暂无互动消息</div>
            ) : (
              interactionList.map(item =>
                item.type === 'comment' ? (
                  <CommentMessageItem
                    key={item.id}
                    item={item}
                    onMarkRead={handleMarkInteractionRead}
                    onReply={handleReply}
                    onDelete={(id) => handleDelete(id, 'interaction')}
                    swipeOpen={openSwipeId === item.id}
                    onSwipeOpen={() => handleSwipeOpen(item.id)}
                  />
                ) : (
                  <InteractionItem
                    key={item.id}
                    item={item}
                    onMarkRead={handleMarkInteractionRead}
                    onDelete={(id) => handleDelete(id, 'interaction')}
                    swipeOpen={openSwipeId === item.id}
                    onSwipeOpen={() => handleSwipeOpen(item.id)}
                  />
                )
              )
            )
          ) : (
            showSystemSkeleton ? (
              <MessageSkeleton />
            ) : systemList.length === 0 ? (
              <div className='message-empty'>暂无系统通知</div>
            ) : (
              systemList.map(item => (
                <SystemMessageItem
                  key={item.id}
                  item={item}
                  onMarkRead={handleMarkSystemRead}
                  onDelete={(id) => handleDelete(id, 'system')}
                  swipeOpen={openSwipeId === item.id}
                  onSwipeOpen={() => handleSwipeOpen(item.id)}
                />
              ))
            )
          )}

            {/* 加载更多指示器 */}
            {activeTab === 0 && interactionLoadingMore && (
              <div className='message-loading-more'>加载中...</div>
            )}
            {activeTab === 1 && systemLoadingMore && (
              <div className='message-loading-more'>加载中...</div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  )
}

export default Message
