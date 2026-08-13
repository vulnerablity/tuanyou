//+ 搜索页面
//+ 功能：热门搜索（后端返回）、关键词搜索、内容/活动两栏Tab、复用PostWaterfall和ActivityCard
import { useState, useEffect, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { SearchBar as NutSearchBar, Tabs, Empty } from '@nutui/nutui-react'
import { ArrowLeft } from '@nutui/icons-react'
import { PostWaterfall } from '@/components/PostWaterfall'
import ActivityCard from '@/components/ActivityCard'
import type { FeedItem, ActivityListItem } from '@/types'
import {
  getHotKeywordsAPI,
  searchContentAPI,
  searchActivitiesAPI
} from '@/apis/search'
import { routerNavigateBack } from '@/router'
import './index.less'

const PAGE_SIZE = 10

const Search = () => {
  //+ 搜索关键词
  const [keyword, setKeyword] = useState('')
  //+ 是否已执行搜索（true=显示结果，false=显示热门搜索）
  const [searched, setSearched] = useState(false)
  //+ 当前Tab
  const [activeTab, setActiveTab] = useState<'content' | 'activity'>('content')

  //+ 热门搜索关键词
  const [hotKeywords, setHotKeywords] = useState<string[]>([])

  //+ 内容搜索结果（笔记+攻略）
  const [contentList, setContentList] = useState<FeedItem[]>([])
  const [contentLoading, setContentLoading] = useState(false)
  const [contentPage, setContentPage] = useState(1)
  const [contentHasMore, setContentHasMore] = useState(false)

  //+ 活动搜索结果
  const [activityList, setActivityList] = useState<ActivityListItem[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityPage, setActivityPage] = useState(1)
  const [activityHasMore, setActivityHasMore] = useState(false)

  //+ 获取热门搜索关键词
  const loadHotKeywords = useCallback(async () => {
    try {
      const res = await getHotKeywordsAPI()
      if (res.code === 0 || res.code === 200) {
        setHotKeywords(res.data || [])
      }
    } catch (_err) {
      //+ 失败时保留空数组，不阻塞UI
    }
  }, [])

  //+ 搜索内容（笔记+攻略）
  const searchContent = useCallback(async (kw: string, page: number = 1, append: boolean = false) => {
    setContentLoading(true)
    try {
      const res = await searchContentAPI({ keyword: kw, page, size: PAGE_SIZE })
      if (res.code === 0 || res.code === 200) {
        const { list, page: respPage, total_page } = res.data
        setContentList(append ? [...contentList, ...list] : list)
        setContentPage(respPage)
        setContentHasMore(respPage < total_page)
      }
    } catch (_err) {
      if (!append) {
        setContentList([])
      }
    } finally {
      setContentLoading(false)
    }
  }, [contentList])

  //+ 搜索活动
  const searchActivities = useCallback(async (kw: string, page: number = 1, append: boolean = false) => {
    setActivityLoading(true)
    try {
      const res = await searchActivitiesAPI({ keyword: kw, page, size: PAGE_SIZE })
      if (res.code === 0 || res.code === 200) {
        const { list, page: respPage, total_page } = res.data
        setActivityList(append ? [...activityList, ...list] : list)
        setActivityPage(respPage)
        setActivityHasMore(respPage < total_page)
      }
    } catch (_err) {
      if (!append) {
        setActivityList([])
      }
    } finally {
      setActivityLoading(false)
    }
  }, [activityList])

  //+ 重置：切回热门搜索页 + 清空所有搜索结果/分页状态
  const resetToHotSearch = useCallback(() => {
    setKeyword('')
    setSearched(false)
    setContentList([])
    setActivityList([])
    setContentPage(1)
    setActivityPage(1)
    setContentHasMore(false)
    setActivityHasMore(false)
  }, [])

  //+ 执行搜索（搜索按钮 / 点击热门关键词 / 回车）
  const handleSearch = useCallback((kw?: string) => {
    const targetKw = (kw ?? keyword ?? '').trim()
    if (!targetKw) {
      //+ 空关键词：切回【热门搜索】页
      resetToHotSearch()
      return
    }
    setKeyword(targetKw)
    setSearched(true)
    //+ 首次搜索：重置两个Tab的数据，然后搜索当前Tab
    setContentPage(1)
    setActivityPage(1)
    setContentList([])
    setActivityList([])
    //+ 两个都搜索，切换Tab时无需再加载
    searchContent(targetKw, 1, false)
    searchActivities(targetKw, 1, false)
  }, [keyword, resetToHotSearch, searchContent, searchActivities])

  //+ 在结果页时：如果把搜索框内容全部删掉，直接切回热门搜索页
  useEffect(() => {
    if (searched && keyword.trim() === '') {
      resetToHotSearch()
    }
  }, [keyword, searched, resetToHotSearch])

  //+ 点击热门搜索词
  const handleKeywordClick = (kw: string) => {
    handleSearch(kw)
  }

  //+ 返回
  const handleBack = () => {
    routerNavigateBack()
  }

  //+ 加载更多（内容）
  const handleLoadMoreContent = () => {
    if (!contentHasMore || contentLoading) return
    searchContent(keyword, contentPage + 1, true)
  }

  //+ 加载更多（活动）
  const handleLoadMoreActivity = () => {
    if (!activityHasMore || activityLoading) return
    searchActivities(keyword, activityPage + 1, true)
  }

  //+ 活动卡片点击跳转详情
  const handleActivityClick = (activity: ActivityListItem) => {
    Taro.navigateTo({ url: `/pages/ActivityDetail/index?id=${activity.id}` })
  }

  //+ 初始化：加载热门搜索
  useEffect(() => {
    loadHotKeywords()
  }, [loadHotKeywords])

  return (
    <div className="g-search-page">
      {/* 头部：返回 + 搜索框 + 搜索按钮 */}
      <div className="g-search-header">
        <div className="g-search-back" onClick={handleBack}>
          <ArrowLeft className="g-search-back-icon" />
        </div>
        <div className="g-search-bar-wrapper" onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') handleSearch()
        }}>
          <NutSearchBar
            className="g-search-bar"
            shape="round"
            placeholder="搜索笔记、攻略、活动"
            value={keyword}
            onChange={(v) => setKeyword(v)}
          />
        </div>
        <div className="g-search-btn" onClick={() => handleSearch()}>
          搜索
        </div>
      </div>

      {/* 主内容区 */}
      <div className="g-search-body">
        {!searched ? (
          //+ 未搜索：显示热门搜索
          <div className="g-search-hot">
            <div className="g-search-hot-title">热门搜索</div>
            <div className="g-search-hot-tags">
              {hotKeywords.map((kw, idx) => (
                <div
                  key={`${kw}-${idx}`}
                  className="g-search-hot-tag"
                  onClick={() => handleKeywordClick(kw)}
                >
                  {kw}
                </div>
              ))}
            </div>
          </div>
        ) : (
          //+ 已搜索：显示Tab + 搜索结果
          <div className="g-search-result">
            {/* Tab切换：内容 / 活动，显示搜索结果数量 */}
            <Tabs
              className="g-search-tabs"
              value={activeTab}
              onChange={(v) => setActiveTab(v as 'content' | 'activity')}
            >
              <Tabs.TabPane title="内容" value="content" />
              <Tabs.TabPane title="活动" value="activity" />
            </Tabs>

            {/* 搜索结果列表 */}
            <div className="g-search-result-body">
              {activeTab === 'content' ? (
                contentList.length === 0 && !contentLoading ? (
                  <div className="g-search-empty">
                    <Empty description="没有找到相关笔记" />
                  </div>
                ) : (
                  <PostWaterfall
                    feed={contentList}
                    loading={contentLoading}
                    hasMore={contentHasMore}
                    onLoadMore={handleLoadMoreContent}
                    emptyText="没有找到相关笔记"
                    onItemClick={() => {}}
                    onToggleLike={() => {}}
                  />
                )
              ) : (
                activityList.length === 0 && !activityLoading ? (
                  <div className="g-search-empty">
                    <Empty description="没有找到相关活动" />
                  </div>
                ) : (
                  <div className="g-search-activity-list">
                    {activityList.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onClick={handleActivityClick}
                        onSignup={handleActivityClick}
                        onCancelSignup={handleActivityClick}
                      />
                    ))}
                    {/* 加载更多 */}
                    {activityHasMore && (
                      <div className="g-search-load-more" onClick={handleLoadMoreActivity}>
                        {activityLoading ? '加载中...' : '加载更多'}
                      </div>
                    )}
                    {!activityHasMore && activityList.length > 0 && (
                      <div className="g-search-no-more">已加载全部</div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
