//+ Like 我的点赞列表页
//+ 结构：HeaderNavBar + Tabs（笔记/攻略） + 瀑布流列表
//+ 点赞图标：点赞态用 icon-likefill，取消点赞用 icon-like（空心）
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import { fetchLikedNotes, fetchLikedStrategys } from '@/store/modules/profile'
import type { FeedItem, ProfilePostItem } from '@/types'
import type { AppDispatch } from '@/store'
//+ 复用 Favorite 的样式（瀑布流卡片结构一样）
import './index.less'
import '../Favorite/index.less'

//+ 将 ProfilePostItem 转换为 FeedItem
const toFeedItem = (item: ProfilePostItem): FeedItem => {
  return {
    id: item.id,
    title: item.title,
    images: [item.coverImg],
    videoUrl: '',
    tags: item.tag ? [item.tag] : [],
    member: {
      nickname: item.author.nickname,
      avatar: item.author.avatar
    },
    likeCount: item.likeCount,
    isLiked: item.isLiked,
    type: item.type === 'strategy' ? 'guide' : item.type
  }
}

//+ 单个点赞卡片（与收藏卡片结构一致，只换图标）
const LikeCard = ({
  item,
  isLiked,
  onToggleLike,
  onClick,
}: {
  item: FeedItem
  isLiked: boolean
  onToggleLike: (id: string) => void
  onClick: () => void
}) => {
  const coverImg = item.images[0] || ''

  const handleLikeClick = (e: any) => {
    e.stopPropagation()
    onToggleLike(item.id)
  }

  return (
    <div className="like-item" onClick={onClick}>
      <div className="like-cover">
        <img src={coverImg} alt={item.title} />
        {item.tags.length > 0 && (
          <div className="like-tag">{item.tags[0]}</div>
        )}
      </div>
      <div className="like-info">
        <div className="like-title">{item.title}</div>
        <div className="like-meta">
          <img className="like-avatar" src={item.member.avatar} alt="" />
          <span className="like-name">{item.member.nickname}</span>
          <span className="like-like" onClick={handleLikeClick}>
            {isLiked ? (
              <span className="iconfont icon-likefill like-icon-fill"></span>
            ) : (
              <span className="iconfont icon-like like-icon"></span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

const Like = () => {
  const dispatch: AppDispatch = useDispatch()
  const [activeTab, setActiveTab] = useState(0)
  
  //+ 笔记点赞列表
  const [noteList, setNoteList] = useState<FeedItem[]>([])
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteHasMore, setNoteHasMore] = useState(true)
  const notePageRef = useRef(1)
  
  //+ 攻略点赞列表
  const [guideList, setGuideList] = useState<FeedItem[]>([])
  const [guideLoading, setGuideLoading] = useState(false)
  const [guideHasMore, setGuideHasMore] = useState(true)
  const guidePageRef = useRef(1)
  
  //+ 全局点赞 ID 列表
  const [likedIds, setLikedIds] = useState<string[]>([])

  //+ 加载笔记点赞
  const loadLikedNotes = useCallback(async (page: number = 1, append: boolean = false) => {
    if (noteLoading) return
    setNoteLoading(true)
    try {
      const res: any = await dispatch(fetchLikedNotes({ page, size: 10 }))
      if (res.meta.requestStatus === 'fulfilled') {
        const data = res.payload
        const items: FeedItem[] = (data.list || []).map(toFeedItem)
        setNoteList(prev => append ? [...prev, ...items] : items)
        notePageRef.current = data.page
        setNoteHasMore(data.page < data.total_page)
      }
    } catch (e) {
      console.error('加载点赞笔记失败:', e)
    } finally {
      setNoteLoading(false)
    }
  }, [dispatch, noteLoading])

  //+ 加载攻略点赞
  const loadLikedStrategys = useCallback(async (page: number = 1, append: boolean = false) => {
    if (guideLoading) return
    setGuideLoading(true)
    try {
      const res: any = await dispatch(fetchLikedStrategys({ page, size: 10 }))
      if (res.meta.requestStatus === 'fulfilled') {
        const data = res.payload
        const items: FeedItem[] = (data.list || []).map(toFeedItem)
        setGuideList(prev => append ? [...prev, ...items] : items)
        guidePageRef.current = data.page
        setGuideHasMore(data.page < data.total_page)
      }
    } catch (e) {
      console.error('加载点赞攻略失败:', e)
    } finally {
      setGuideLoading(false)
    }
  }, [dispatch, guideLoading])

  //+ 初始化：加载第一页数据
  const loadFirstPage = useCallback(() => {
    loadLikedNotes(1, false)
    loadLikedStrategys(1, false)
  }, [loadLikedNotes, loadLikedStrategys])

  //+ 页面显示时加载数据
  useDidShow(() => {
    loadFirstPage()
  })

  //+ 下拉刷新
  usePullDownRefresh(() => {
    loadFirstPage()
    Taro.stopPullDownRefresh()
  })

  //+ 更新点赞 ID 列表
  useEffect(() => {
    const allIds = [...noteList.map(i => i.id), ...guideList.map(i => i.id)]
    setLikedIds(prev => {
      const set = new Set([...prev, ...allIds])
      return Array.from(set)
    })
  }, [noteList, guideList])

  const currentList = useMemo(() => {
    return activeTab === 0 ? noteList : guideList
  }, [activeTab, noteList, guideList])

  //+ 切换点赞（乐观更新，暂未对接后端）
  const handleToggleLike = (id: string) => {
    const isLiked = likedIds.includes(id)
    if (isLiked) {
      setLikedIds(prev => prev.filter(x => x !== id))
      Taro.showToast({ title: '已取消点赞', icon: 'success' })
    } else {
      setLikedIds(prev => [...prev, id])
    }
  }

  //+ 加载更多
  const handleLoadMore = () => {
    if (activeTab === 0) {
      if (noteLoading || !noteHasMore) return
      loadLikedNotes(notePageRef.current + 1, true)
    } else {
      if (guideLoading || !guideHasMore) return
      loadLikedStrategys(guidePageRef.current + 1, true)
    }
  }

  const handleItemClick = (item: FeedItem) => {
    const pagePath = item.type === 'guide' ? '/pages/GuideDetail/index' : '/pages/NoteDetail/index'
    Taro.navigateTo({ url: `${pagePath}?id=${item.id}&type=${item.type}` })
  }

  const currentLoading = activeTab === 0 ? noteLoading : guideLoading
  const currentHasMore = activeTab === 0 ? noteHasMore : guideHasMore

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

        <div className="like-waterfall">
          {currentList.length === 0 && !currentLoading ? (
            <div className="empty-state">还没有点赞的{activeTab === 0 ? '笔记' : '攻略'}</div>
          ) : (
            <div className="like-waterfall-content">
              <div className="like-column">
                {currentList.filter((_, i) => i % 2 === 0).map(item => (
                  <LikeCard
                    key={item.id}
                    item={item}
                    isLiked={likedIds.includes(item.id)}
                    onToggleLike={handleToggleLike}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
              <div className="like-column">
                {currentList.filter((_, i) => i % 2 === 1).map(item => (
                  <LikeCard
                    key={item.id}
                    item={item}
                    isLiked={likedIds.includes(item.id)}
                    onToggleLike={handleToggleLike}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
              
              {/* 加载更多 */}
              {currentHasMore && (
                <div className="load-more" onClick={handleLoadMore}>
                  {currentLoading ? '加载中...' : '加载更多'}
                </div>
              )}
              {!currentHasMore && currentList.length > 0 && (
                <div className="no-more">已加载全部</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Like
