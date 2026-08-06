//+ Like 我的点赞列表页
//+ 结构：HeaderNavBar + Tabs（笔记/攻略） + 瀑布流列表
//+ 点赞图标：点赞态用 icon-likefill，取消点赞用 icon-like（空心）
import { useState, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import type { FeedItem } from '@/types'
//+ 复用 Favorite 的样式（瀑布流卡片结构一样）
import './index.less'
import '../Favorite/index.less'

//+ 生成点赞数据
const generateLikeData = (type: 'note' | 'guide'): FeedItem[] => {
  const titles = type === 'note'
    ? ['云南雨崩徒步｜神瀑下的心愿', '稻城亚丁｜从你的全世界路过', '四姑娘山大峰｜人生第一座雪山', '北疆禾木村｜中国最美秋色', '梅里北坡｜雪山冰川徒步之旅']
    : ['户外服装清洗保养指南（亲测有效）', '露营睡袋温标怎么选？避坑指南', '登山杖选择&使用技巧全解析', '户外防晒攻略｜再也不怕晒黑', '户外水处理方法汇总｜喝放心水']
  return titles.map((title, i) => ({
    id: `like-${type}-${i + 1}`,
    title,
    images: [`https://picsum.photos/400/500?random=${100 + i + (type === 'guide' ? 50 : 0)}`],
    videoUrl: '',
    tags: type === 'note'
      ? [['雨崩', '神瀑'], ['稻城亚丁', '电影取景'], ['四姑娘山', '雪山'], ['北疆', '秋色'], ['梅里', '冰川']][i]
      : [['保养', '清洗'], ['睡袋', '温标'], ['登山杖', '技巧'], ['防晒', '护肤'], ['水', '安全']][i],
    member: {
      nickname: type === 'note' ? ['滇藏行者', '甘孜向导', '雪山猎人', '北疆旅拍', '梅里导游'][i] : ['生活小能手', '露营研究员', '登山俱乐部', '护肤博主', '安全科普'][i],
      avatar: `https://picsum.photos/100?random=${130 + i + (type === 'guide' ? 20 : 0)}`,
    },
    likeCount: Math.floor(Math.random() * 1000) + 100,
    isLiked: true,
    type,
    category: (i % 7) + 1,
  }))
}

const staticLikeNotes = generateLikeData('note')
const staticLikeGuides = generateLikeData('guide')

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
  const [activeTab, setActiveTab] = useState(0)
  //+ 点赞 ID：默认全部已点赞
  const [likedIds, setLikedIds] = useState<string[]>(() => [
    ...staticLikeNotes.map(n => n.id),
    ...staticLikeGuides.map(g => g.id),
  ])
  const [localLikeNotes] = useState(staticLikeNotes)
  const [localLikeGuides] = useState(staticLikeGuides)

  const currentList = useMemo(() => {
    const ids = new Set(likedIds)
    const srcList = activeTab === 0 ? localLikeNotes : localLikeGuides
    return srcList.filter(item => ids.has(item.id))
  }, [activeTab, likedIds, localLikeNotes, localLikeGuides])

  //+ 切换点赞
  const handleToggleLike = (id: string) => {
    const isLiked = likedIds.includes(id)
    if (isLiked) {
      setLikedIds(prev => prev.filter(x => x !== id))
      Taro.showToast({ title: '已取消点赞', icon: 'success' })
    } else {
      setLikedIds(prev => [...prev, id])
    }
  }

  const handleItemClick = (item: FeedItem) => {
    const pagePath = item.type === 'guide' ? '/pages/GuideDetail/index' : '/pages/NoteDetail/index'
    Taro.navigateTo({ url: `${pagePath}?id=${item.id}&type=${item.type}` })
  }

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
          {currentList.length === 0 ? (
            <div className="empty-state">还没有点赞的{activeTab === 0 ? '笔记' : '攻略'}</div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Like
