//+ Favorite 我的收藏列表页
//+ 结构：HeaderNavBar + Tabs（笔记/攻略，激活色#428a46） + 瀑布流列表
//+ 收藏图标：收藏态用 icon-shoucangfill，取消收藏用 icon-shoucang（空心）
import { useState, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import type { FeedItem } from '@/types'
import './index.less'

//+ 生成收藏数据
const generateFavoriteData = (type: 'note' | 'guide'): FeedItem[] => {
  const titles = type === 'note'
    ? ['秋季最美徒步路线｜北京周边赏红叶', '婺源篁岭晒秋｜一日游徒步路线', '泰山夜爬攻略｜看日出最佳机位', '武功山金顶｜云海草甸露营记', '雁荡山｜奇峰异石徒步一日']
    : ['新手露营装备清单｜百元级入门必买', '骑行头盔选购指南｜千元内推荐', '徒步鞋 vs 登山鞋怎么选？', '入门级帐篷推荐（附对比表）', '户外急救包必备物品TOP20']
  return titles.map((title, i) => ({
    id: `fav-${type}-${i + 1}`,
    title,
    images: [`https://picsum.photos/400/500?random=${60 + i + (type === 'guide' ? 20 : 0)}`],
    videoUrl: '',
    tags: type === 'note'
      ? [['徒步', '赏秋'], ['婺源', '一日游'], ['泰山', '日出'], ['武功山', '云海'], ['雁荡山', '徒步']][i]
      : [['装备', '入门'], ['头盔', '骑行'], ['鞋子', '装备'], ['帐篷', '推荐'], ['急救', '安全']][i],
    member: {
      nickname: type === 'note' ? ['山系老王', '婺源小导游', '泰山扛把子', '云海追梦', '奇峰摄影'][i] : ['装备党', '骑行家', '选鞋达人', '露营小能手', '户外救援'][i],
      avatar: `https://picsum.photos/100?random=${80 + i + (type === 'guide' ? 30 : 0)}`,
    },
    likeCount: Math.floor(Math.random() * 500) + 20,
    isLiked: false,
    type,
    category: (i % 7) + 1,
  }))
}

const staticFavNotes = generateFavoriteData('note')
const staticFavGuides = generateFavoriteData('guide')

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
  const [activeTab, setActiveTab] = useState(0)
  //+ 收藏状态：默认全部已收藏（收藏页嘛）
  const [favIds, setFavIds] = useState<string[]>(() => [
    ...staticFavNotes.map(n => n.id),
    ...staticFavGuides.map(g => g.id),
  ])
  const [localFavNotes, setLocalFavNotes] = useState(staticFavNotes)
  const [localFavGuides, setLocalFavGuides] = useState(staticFavGuides)

  const currentList = useMemo(() => {
    const ids = new Set(favIds)
    const srcList = activeTab === 0 ? localFavNotes : localFavGuides
    //+ 仅显示还在收藏中的
    return srcList.filter(item => ids.has(item.id))
  }, [activeTab, favIds, localFavNotes, localFavGuides])

  //+ 切换收藏
  const handleToggleFavorite = (id: string) => {
    const isFav = favIds.includes(id)
    if (isFav) {
      setFavIds(prev => prev.filter(x => x !== id))
      Taro.showToast({ title: '已取消收藏', icon: 'success' })
    } else {
      setFavIds(prev => [...prev, id])
    }
  }

  //+ 跳转详情
  const handleItemClick = (item: FeedItem) => {
    const pagePath = item.type === 'guide' ? '/pages/GuideDetail/index' : '/pages/NoteDetail/index'
    Taro.navigateTo({ url: `${pagePath}?id=${item.id}&type=${item.type}` })
  }

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
          {currentList.length === 0 ? (
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Favorite
