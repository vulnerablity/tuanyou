//+ Like 我的点赞列表页
//+ Q2 Tab 懒加载：默认笔记，切攻略才请求；每次切Tab实时刷新
//+ Q3 布局统一：复用 PostWaterfall 双列瀑布流（与 Favorite/Content 对齐）
//+ Q7：useReachBottom 上拉加载 + usePullDownRefresh 下拉刷新
//+ Q8：取消点赞 → 真实API调用 → 立即从列表移除
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import { PostWaterfall } from '@/components/PostWaterfall'
import { usePagedList } from '@/hooks/usePagedList'
import { fetchLikedNotes, fetchLikedStrategys } from '@/store/modules/profile'
import { toFeedList } from '@/utils/postAdapter'
import type { ProfilePostItem, FeedItem, PageResult } from '@/types'
import type { AppDispatch } from '@/store'
import './index.less'

const Like = () => {
  const dispatch: AppDispatch = useDispatch()
  const [activeTab, setActiveTab] = useState(0)

  const notesPaged = usePagedList<ProfilePostItem>({
    size: 10,
    fetcher: useCallback(
      async ({ page, size }) => {
        const action = await dispatch(fetchLikedNotes({ page, size }))
        const payload: PageResult<ProfilePostItem> | undefined = (action as any)?.payload
        if (!payload) return { code: -1, data: { list: [], total: 0, page, size, total_page: 0 } }
        return { code: 0, data: payload }
      },
      [dispatch]
    )
  })

  const strategysPaged = usePagedList<ProfilePostItem>({
    size: 10,
    fetcher: useCallback(
      async ({ page, size }) => {
        const action = await dispatch(fetchLikedStrategys({ page, size }))
        const payload: PageResult<ProfilePostItem> | undefined = (action as any)?.payload
        if (!payload) return { code: -1, data: { list: [], total: 0, page, size, total_page: 0 } }
        return { code: 0, data: payload }
      },
      [dispatch]
    )
  })

  const currentPaged = activeTab === 0 ? notesPaged : strategysPaged
  // 点赞列表项本身 isLiked=true，取消后通过 onToggleLike 回调 removeItem
  const currentList: FeedItem[] = useMemo(() => {
    return toFeedList(currentPaged.list).map(f => ({ ...f, isLiked: true }))
  }, [currentPaged.list])

  useDidShow(() => {
    currentPaged.loadFirstPage()
  })

  useEffect(() => {
    ;(activeTab === 0 ? notesPaged : strategysPaged).loadFirstPage()
  }, [activeTab, notesPaged, strategysPaged])

  usePullDownRefresh(async () => {
    await currentPaged.refresh()
    Taro.stopPullDownRefresh()
  })

  useReachBottom(() => {
    currentPaged.loadMore()
  })

  //+ Q8：点赞切换回调（在"我的点赞"里，newIsLiked=false 代表取消，从列表移除）
  const handleToggleLike = (item: FeedItem, newIsLiked: boolean) => {
    if (!newIsLiked) {
      currentPaged.removeItem(p => p.id === item.id)
      Taro.showToast({ title: '已取消点赞', icon: 'success' })
    }
  }

  const handleItemClick = (item: FeedItem) => {
    const path = item.type === 'guide' ? '/pages/GuideDetail/index' : '/pages/NoteDetail/index'
    Taro.navigateTo({ url: `${path}?id=${item.id}&type=${item.type}` })
  }

  const { loading, hasMore } = currentPaged

  return (
    <div className="like-page">
      <HeaderNavBar title="我的点赞" fixed={false} cancel={false} />

      <div className="like-body">
        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(Number(v))}
          activeColor="#428a46"
          className="like-tabs"
        >
          <Tabs.TabPane title="笔记" value={0} />
          <Tabs.TabPane title="攻略" value={1} />
        </Tabs>

        {/* Q3：Like 布局与 Favorite 完全对齐，统一 PostWaterfall 双列 */}
        <PostWaterfall
          feed={currentList}
          loading={loading && currentList.length === 0}
          hasMore={hasMore}
          emptyText={activeTab === 0 ? '还没有点赞的笔记' : '还没有点赞的攻略'}
          onItemClick={handleItemClick}
          onLoadMore={() => currentPaged.loadMore()}
          onToggleLike={handleToggleLike}
        />
      </div>
    </div>
  )
}

export default Like
