//+ 社区首页组件
//+ 使用首页专用store管理轮播和Feed流数据
//+ 使用公共组件：NoteList渲染Feed列表
import SearchBar from '@/components/SearchBar'
import TabList from '@/components/TabList'
import Banner from '@/components/Banner'
import NoteList from '@/components/NoteList'
import { Tabs } from '@nutui/nutui-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { fetchFeed, resetFeed } from '@/store/modules/home'

import './index.less'

const Home = () => {
  //+ Redux dispatch
  const dispatch: AppDispatch = useDispatch()
  
  //+ 从home store获取Feed流状态
  const { 
    feed, 
    feedLoading, 
    feedHasMore, 
    feedPage, 
    feedTotalPage 
  } = useSelector((state: RootState) => state.home)
  
  //+ 静态配置（分类、排序列表）
const categories=["全部","徒步","露营","骑行","登山","跑步","攀岩","溯溪"]
const sorts=["推荐","最新","最热"]
  
  //+ useState管理局部UI状态
  const [categoryName, setCategoryName] = useState('全部')
  const [sortName, setSortName] = useState('推荐')
  const [loadingMore, setLoadingMore] = useState(false)
  

  
  //+ 加载Feed流（配置加载完成后）
  useEffect(() => { 
    dispatch(resetFeed())
    
    dispatch(fetchFeed({
      category: categoryName === '全部' ? undefined : categories.indexOf(categoryName),
      sort: sortName,
      page: 1,
      size: 10
    }))
  }, [dispatch, categoryName, sortName])
  
  //+ 加载更多
  const loadMore = () => {
    if (loadingMore || !feedHasMore) return
    setLoadingMore(true)
    
    dispatch(fetchFeed({
      category: categoryName === '全部' ? undefined : categories.indexOf(categoryName),
      sort: sortName,
      page: feedPage + 1,
      size: 10
    })).finally(() => {
      setLoadingMore(false)
    })
  }

  
  return (
    <div className="home-container">
      {/* 头部导航栏：固定不动 */}
      <div className="home-header">
        <SearchBar />
      </div>
      
      {/* 中间内容区域：占剩余空间，可滚动 */}
      <div className="home-content">
        {/* 轮播图区域 */}
        <div className="home-banner">
          <Banner />
        </div>
        
        {/* 筛选区域 */}
        <div className="home-filter">
          {/* 分类筛选 */}
          <Tabs
            className="category-tabs"
            value={categoryName}
            onChange={(value) => setCategoryName(value as string)}
          >
            {categories.map((item,index) => (
              <Tabs.TabPane key={index} title={item} value={item} />
            ))}
          </Tabs>
          
          {/* 排序方式 */}
          <Tabs
            className="sort-tabs"
            value={sortName}
            activeType="button"
            onChange={(value) => setSortName(value as string)}
          >
            {sorts.map((item,index) => (
              <Tabs.TabPane key={index} title={item} value={item} />
            ))}
          </Tabs>
        </div>
        
        {/* Feed流列表：使用公共组件 */}
        <div className="home-feed">
          <NoteList
            feed={feed}
            loading={feedLoading}
            hasMore={feedHasMore}
            onLoadMore={loadMore}
            emptyText="暂无内容，去发布第一篇吧"
          />
        </div>
      </div>
    </div>
  )
}

export default Home
