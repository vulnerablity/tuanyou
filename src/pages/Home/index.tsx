//+ 社区首页组件
//+ Q5+Q6：PostWaterfall 组件（原 NoteList 语义化重命名，笔记/攻略图片/视频混合）
//+ Q7：useReachBottom 上拉加载更多；usePullDownRefresh 下拉刷新
import SearchBar from '@/components/SearchBar'
import Banner from '@/components/Banner'
import { PostWaterfall } from '@/components/PostWaterfall'
import { Tabs } from '@nutui/nutui-react'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import type { RootState, AppDispatch } from '@/store'
import { fetchFeed, resetFeed, softSyncFeed, updateFeedItem, selectFeed } from '@/store/modules/home'
import type { FeedItem } from '@/types'
//+ 说明：点赞/收藏 API 由 PostWaterfall 组件内部调用（含乐观 UI），
//+ 此处仅做 store 同步，不重复 dispatch thunk，避免双重请求

import './index.less'

//+ 静态配置（分类、排序列表）：移出组件避免每次渲染重建，稳定 useCallback 依赖
const CATEGORIES = ['全部', '徒步', '露营', '骑行', '登山', '跑步', '攀岩', '溯溪']
const SORTS = ['推荐', '最新', '最热']

const Home = () => {
  const dispatch: AppDispatch = useDispatch()

  //+ 从home store获取Feed流状态
  //+ feed 改为 selector 派生（pageCache 扁平化），其余字段直接从 state 读取
  const feed = useSelector(selectFeed)
  const {
    feedLoading,
    feedHasMore,
    feedPage
  } = useSelector((state: RootState) => state.home)

  //+ 滚动容器 ref：用于监听容器级滚动触底加载下一页 + 恢复滚动位置
  //+ 原因：.home-content 是 overflow-y:auto 的容器级滚动，外层 .home-container height:100vh overflow:hidden
  //+       导致页面级 useReachBottom 在 H5 端无法触发；改为容器 onScroll，与 Activity 列表一致
  const scrollRef = useRef<HTMLDivElement>(null)

  //+ 滚动位置记忆：进入详情前记录 scrollTop，返回后恢复，避免"弹窗回来丢位置"
  const savedScrollTopRef = useRef(0)

  //+ 分类参数统一：'全部' 传 0（后端/Mock 把 0 视为不筛选），其余传分类索引；避免首屏与加载更多传参不一致
  const getCategoryParam = useCallback((name: string) =>
    name === '全部' ? 0 : CATEGORIES.indexOf(name), [])

  //+ useState管理局部UI状态
  const [categoryName, setCategoryName] = useState('全部')
  const [sortName, setSortName] = useState('推荐')

  //+ 加载 Feed 第一页（分类/排序变化时、下拉刷新时调用）
  const loadFirstPage = useCallback(() => {
    //+ 切换分类/排序/刷新：回到顶部并清空位置记忆（避免恢复到旧分类的位置）
    savedScrollTopRef.current = 0
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    dispatch(resetFeed())
    dispatch(fetchFeed({
      category: getCategoryParam(categoryName),
      sort: sortName,
      page: 1,
      size: 10
    }))
  }, [dispatch, categoryName, sortName, getCategoryParam])

  //+ 加载Feed流（配置加载完成后 / 分类排序变化时）— 刷新第一页
  useEffect(() => {
    loadFirstPage()
  }, [loadFirstPage])

  //+ 加载下一页（上拉触底）
  const loadNextPage = useCallback(() => {
    if (feedLoading || !feedHasMore) return
    dispatch(fetchFeed({
      category: getCategoryParam(categoryName),
      sort: sortName,
      page: feedPage + 1,
      size: 10
    }))
  }, [dispatch, categoryName, sortName, feedLoading, feedHasMore, feedPage, getCategoryParam])

  //+ 容器级滚动监听：距底 50px 触发加载下一页；同时记忆 scrollTop 用于返回恢复
  //+ 与 Activity 列表页一致；原 useReachBottom 在容器滚动布局下不生效，已移除
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    savedScrollTopRef.current = scrollTop
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    if (distanceToBottom < 50 && !feedLoading && feedHasMore) {
      loadNextPage()
    }
  }

  //+ 问题2修复：从详情返回首页时使用软同步，不回到顶部、不打乱顺序
  //+ 首次进入页面时 useEffect 已调 loadFirstPage，这里跳过；只有"从其他页面返回"时触发软同步
  //+ 必须用 useRef（原为普通对象，每次渲染重建导致永为 false，softSyncFeed 从未触发）
  const loadedOnceRef = useRef(false)
  useDidShow(() => {
    if (loadedOnceRef.current) {
      dispatch(softSyncFeed({
        category: getCategoryParam(categoryName),
        sort: sortName,
        page: 1,
        size: 10
      }))
      //+ 恢复滚动位置：软同步只 patch/-prepend，不重置列表，scrollTop 可安全恢复
      //+ rAF 等待数据 patch 渲染后再复位，避免被同步渲染冲掉
      if (scrollRef.current) {
        const top = savedScrollTopRef.current
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = top
        })
      }
    } else {
      loadedOnceRef.current = true
    }
  })

  //+ Q7：taro下拉刷新（重新加载第一页）
  usePullDownRefresh(async () => {
    savedScrollTopRef.current = 0
    dispatch(resetFeed())
    await dispatch(fetchFeed({
      category: getCategoryParam(categoryName),
      sort: sortName,
      page: 1,
      size: 10
    }))
    Taro.stopPullDownRefresh()
  })

  //+ Q8：首页卡片点赞回调（组件已调 API + 乐观 UI，这里仅同步 home store，保证下次渲染/刷新数据一致）
  const handleToggleLike = (item: FeedItem, newIsLiked: boolean, newLikeCount: number) => {
    dispatch(updateFeedItem({
      id: item.id,
      patch: { isLiked: newIsLiked, likeCount: newLikeCount }
    }))
  }

  return (
    <div className='home-container'>
      {/* 头部导航栏：固定不动 */}
      <div className='home-header'>
        <SearchBar />
      </div>

      {/* 中间内容区域：占剩余空间，可滚动 */}
      <div className='home-content' ref={scrollRef} onScroll={handleScroll}>
        {/* 轮播图区域 */}
        <div className='home-banner'>
          <Banner />
        </div>

        {/* 筛选区域 */}
        <div className='home-filter'>
          {/* 分类筛选 */}
          <Tabs
            className='category-tabs'
            value={categoryName}
            onChange={(value) => setCategoryName(value as string)}
          >
            {CATEGORIES.map((item, index) => (
              <Tabs.TabPane key={index} title={item} value={item} />
            ))}
          </Tabs>

          {/* 排序方式 */}
          <Tabs
            className='sort-tabs'
            value={sortName}
            activeType='button'
            onChange={(value) => setSortName(value as string)}
          >
            {SORTS.map((item, index) => (
              <Tabs.TabPane key={index} title={item} value={item} />
            ))}
          </Tabs>
        </div>

        {/* Feed流列表：使用统一的 PostWaterfall 组件 */}
        
        <div className='home-feed'>
          <PostWaterfall
            feed={feed}
            loading={feedLoading}
            hasMore={feedHasMore}
            onLoadMore={loadNextPage}
            emptyText='暂无内容，去发布第一篇吧'
            onItemClick={()=>{}}
            onToggleLike={handleToggleLike}
          />
        </div>
      </div>
    </div>
  )
}

export default Home
