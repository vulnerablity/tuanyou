//+ MyActivity 我的活动页
//+ Q2 需求：Tab懒加载，默认先加载"我发布的"；每次切Tab实时刷新
//+ Q7 需求：useReachBottom 上拉加载 + usePullDownRefresh 下拉刷新
//+ 结构：HeaderNavBar + Tabs（我发布的 / 我参与的） + ActivityCard 列表
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import ActivityCard from '@/components/ActivityCard'
import { usePagedList } from '@/hooks/usePagedList'
import { fetchPublishActivity, fetchJoinActivity } from '@/store/modules/profile'
import type { ActivityListItem, PageResult } from '@/types'
import type { AppDispatch } from '@/store'
import './index.less'

const MyActivity = () => {
  const dispatch: AppDispatch = useDispatch()
  //+ Tab: 0=我发布的 1=我参与的
  const [activeTab, setActiveTab] = useState(0)

  //+ 两个独立分页实例：发布/参与（互相独立，互不干扰）
  const publishPaged = usePagedList<ActivityListItem>({
    size: 10,
    fetcher: useCallback(
      async ({ page, size }) => {
        const action = await dispatch(fetchPublishActivity({ page, size }))
        const payload: PageResult<ActivityListItem> | undefined = (action as any)?.payload
        if (!payload) return { code: -1, data: { list: [], total: 0, page, size, total_page: 0 } }
        return { code: 0, data: payload }
      },
      [dispatch]
    )
  })

  const joinPaged = usePagedList<ActivityListItem>({
    size: 10,
    fetcher: useCallback(
      async ({ page, size }) => {
        const action = await dispatch(fetchJoinActivity({ page, size }))
        const payload: PageResult<ActivityListItem> | undefined = (action as any)?.payload
        if (!payload) return { code: -1, data: { list: [], total: 0, page, size, total_page: 0 } }
        return { code: 0, data: payload }
      },
      [dispatch]
    )
  })

  const currentPaged = activeTab === 0 ? publishPaged : joinPaged
  const currentList = useMemo(() => currentPaged.list, [currentPaged.list])
  const { loading, hasMore } = currentPaged

  //+ 页面显示时，仅加载当前Tab（默认是"我发布的"）
  useDidShow(() => {
    currentPaged.loadFirstPage()
  })

  //+ Q2：每次切 Tab，实时刷新新 Tab 第一页（即便之前加载过也重请求）
  useEffect(() => {
    ;(activeTab === 0 ? publishPaged : joinPaged).loadFirstPage()
  }, [activeTab, publishPaged, joinPaged])

  //+ Q7：下拉刷新（当前Tab）
  usePullDownRefresh(async () => {
    await currentPaged.refresh()
    Taro.stopPullDownRefresh()
  })

  //+ Q7：上拉加载更多（当前Tab）
  useReachBottom(() => {
    currentPaged.loadMore()
  })

  //+ 点击卡片：跳转详情
  const handleCardClick = (activity: ActivityListItem) => {
    Taro.navigateTo({ url: `/pages/ActivityDetail/index?id=${activity.id}` })
  }

  //+ 点击报名：跳转详情页完成报名
  const handleSignup = (activity: ActivityListItem) => {
    Taro.navigateTo({ url: `/pages/ActivityDetail/index?id=${activity.id}` })
  }

  return (
    <div className="my-activity-page">
      <HeaderNavBar title="我的活动" fixed={false} cancel={false} />

      <div className="my-activity-body">
        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(Number(v))}
          activeColor="#428a46"
          className="my-activity-tabs"
        >
          <Tabs.TabPane title="我发布的" value={0} />
          <Tabs.TabPane title="我参与的" value={1} />
        </Tabs>

        <div className="my-activity-list">
          {currentList.length === 0 && !loading ? (
            <div className="empty-state">
              {activeTab === 0 ? '还没有发布活动' : '还没有参与任何活动'}
            </div>
          ) : (
            currentList.map(item => (
              <ActivityCard
                key={item.id}
                activity={item}
                onClick={handleCardClick}
                onSignup={handleSignup}
              />
            ))
          )}

          {/* 加载更多提示 */}
          {hasMore && currentList.length > 0 && (
            <div className="load-more" onClick={() => currentPaged.loadMore()}>
              {loading ? '加载中...' : '加载更多'}
            </div>
          )}
          {!hasMore && currentList.length > 0 && (
            <div className="no-more">已加载全部</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyActivity
