//+ Favorite 我的收藏列表页
//+ 结构：HeaderNavBar + Tabs（笔记/攻略，激活色#428a46） + 瀑布流列表
//+ 收藏图标：收藏态用 icon-shoucangfill，取消收藏用 icon-shoucang（空心）
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import { fetchFavoriteNotes, fetchFavoriteStrategys } from '@/store/modules/profile'
import type { FeedItem, ProfilePostItem } from '@/types'
import type { AppDispatch } from '@/store'
import './index.less'

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

//+ 单个收藏卡片（复用首页瀑布流布局，但点赞位置换成收藏图标）
const FavoriteCard = ({
  item,
  isFavorite,
  onToggleFavorite,
  onClick,
}: {
  item: FeedItem
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  onClick: () => void
}) => {
  const coverImg = item.images[0] || ''

  const handleFavClick = (e: any) => {
    e.stopPropagation()
    onToggleFavorite(item.id)
  }

  return (
    <div className="fav-item" onClick={onClick}>
      <div className="fav-cover">
        <img src={coverImg} alt={item.title} />
        {item.tags.length > 0 && (
          <div className="fav-tag">{item.tags[0]}</div>
        )}
      </div>
      <div className="fav-info">
        <div className="fav-title">{item.title}</div>
        <div className="fav-meta">
          <img className="fav-avatar" src={item.member.avatar} alt="" />
          <span className="fav-name">{item.member.nickname}</span>
          <span className="fav-like" onClick={handleFavClick}>
            {isFavorite ? (
              <span className="iconfont icon-shoucangfill fav-icon-fill"></span>
            ) : (
              <span className="iconfont icon-shoucang fav-icon"></span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

const Favorite = () => {
  const dispatch: AppDispatch = useDispatch()
  const [activeTab, setActiveTab] = useState(0)
  
  //+ 笔记收藏列表
  const [noteList, setNoteList] = useState<FeedItem[]>([])
  const [noteLoading, setNoteLoading] = useState(false)
  const [noteHasMore, setNoteHasMore] = useState(true)
  const notePageRef = useRef(1)
  
  //+ 攻略收藏列表
  const [guideList, setGuideList] = useState<FeedItem[]>([])
  const [guideLoading, setGuideLoading] = useState(false)
  const [guideHasMore, setGuideHasMore] = useState(true)
  const guidePageRef = useRef(1)
  
  //+ 全局收藏 ID 列表（用于快速判断状态）
  const [favIds, setFavIds] = useState<string[]>([])

  //+ 加载笔记收藏
  const loadFavoriteNotes = useCallback(async (page: number = 1, append: boolean = false) => {
    if (noteLoading) return
    setNoteLoading(true)
    try {
      const res: any = await dispatch(fetchFavoriteNotes({ page, size: 10 }))
      if (res.meta.requestStatus === 'fulfilled') {
        const data = res.payload
        const items: FeedItem[] = (data.list || []).map(toFeedItem)
        setNoteList(prev => append ? [...prev, ...items] : items)
        notePageRef.current = data.page
        setNoteHasMore(data.page < data.total_page)
      }
    } catch (e) {
      console.error('加载收藏笔记失败:', e)
    } finally {
      setNoteLoading(false)
    }
  }, [dispatch, noteLoading])

  //+ 加载攻略收藏
  const loadFavoriteStrategys = useCallback(async (page: number = 1, append: boolean = false) => {
    if (guideLoading) return
    setGuideLoading(true)
    try {
      const res: any = await dispatch(fetchFavoriteStrategys({ page, size: 10 }))
      if (res.meta.requestStatus === 'fulfilled') {
        const data = res.payload
        const items: FeedItem[] = (data.list || []).map(toFeedItem)
        setGuideList(prev => append ? [...prev, ...items] : items)
        guidePageRef.current = data.page
        setGuideHasMore(data.page < data.total_page)
      }
    } catch (e) {
      console.error('加载收藏攻略失败:', e)
    } finally {
      setGuideLoading(false)
    }
  }, [dispatch, guideLoading])

  //+ 初始化：加载第一页数据
  const loadFirstPage = useCallback(() => {
    loadFavoriteNotes(1, false)
    loadFavoriteStrategys(1, false)
  }, [loadFavoriteNotes, loadFavoriteStrategys])

  //+ 页面显示时加载数据
  useDidShow(() => {
    loadFirstPage()
  })

  //+ 下拉刷新
  usePullDownRefresh(() => {
    loadFirstPage()
    Taro.stopPullDownRefresh()
  })

  //+ 更新收藏 ID 列表（当列表变化时）
  useEffect(() => {
    const allIds = [...noteList.map(i => i.id), ...guideList.map(i => i.id)]
    setFavIds(prev => {
      //+ 合并并去重
      const set = new Set([...prev, ...allIds])
      return Array.from(set)
    })
  }, [noteList, guideList])

  const currentList = useMemo(() => {
    return activeTab === 0 ? noteList : guideList
  }, [activeTab, noteList, guideList])

  //+ 切换收藏（乐观更新，暂未对接后端）
  const handleToggleFavorite = (id: string) => {
    const isFav = favIds.includes(id)
    if (isFav) {
      setFavIds(prev => prev.filter(x => x !== id))
      Taro.showToast({ title: '已取消收藏', icon: 'success' })
    } else {
      setFavIds(prev => [...prev, id])
    }
  }

  //+ 加载更多
  const handleLoadMore = () => {
    if (activeTab === 0) {
      if (noteLoading || !noteHasMore) return
      loadFavoriteNotes(notePageRef.current + 1, true)
    } else {
      if (guideLoading || !guideHasMore) return
      loadFavoriteStrategys(guidePageRef.current + 1, true)
    }
  }

  //+ 跳转详情
  const handleItemClick = (item: FeedItem) => {
    const pagePath = item.type === 'guide' ? '/pages/GuideDetail/index' : '/pages/NoteDetail/index'
    Taro.navigateTo({ url: `${pagePath}?id=${item.id}&type=${item.type}` })
  }

  const currentLoading = activeTab === 0 ? noteLoading : guideLoading
  const currentHasMore = activeTab === 0 ? noteHasMore : guideHasMore

  return (
    <div className="favorite-page">
      <HeaderNavBar title="我的收藏" fixed={false} cancel={false} />

      <div className="favorite-body">
        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(Number(v))}
          activeColor="#428a46"
          className="favorite-tabs"
        >
          <Tabs.TabPane title="笔记" value={0} />
          <Tabs.TabPane title="攻略" value={1} />
        </Tabs>

        <div className="fav-waterfall">
          {currentList.length === 0 && !currentLoading ? (
            <div className="empty-state">还没有收藏的{activeTab === 0 ? '笔记' : '攻略'}</div>
          ) : (
            <>
              <div className="fav-column">
                {currentList.filter((_, i) => i % 2 === 0).map(item => (
                  <FavoriteCard
                    key={item.id}
                    item={item}
                    isFavorite={favIds.includes(item.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
              <div className="fav-column">
                {currentList.filter((_, i) => i % 2 === 1).map(item => (
                  <FavoriteCard
                    key={item.id}
                    item={item}
                    isFavorite={favIds.includes(item.id)}
                    onToggleFavorite={handleToggleFavorite}
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
            </>

            
          )}
            
        </div>
      </div>
    </div>
  )
}

export default Favorite
