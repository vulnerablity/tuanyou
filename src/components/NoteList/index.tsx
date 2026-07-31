//+ 公共笔记列表组件（Feed流瀑布流）
//+ 卡片布局：封面（Tag左上角 + 视频图标居中）+ 标题 + 头像昵称点赞
//+ 图片 3:4 比例，视频 16:9 比例，严格两列布局
import { Loading } from '@nutui/nutui-react'
import Taro from '@tarojs/taro'
import Tag from '@/components/Tag'
import type { FeedItem } from '@/types'
import { useState } from 'react'
import { toggleNoteLikeAPI } from '@/apis/note'
import './index.less'

//+ 组件Props接口
interface NoteListProps {
  //+ Feed流数据
  feed: FeedItem[]
  //+ 加载状态
  loading?: boolean
  //+ 是否还有更多
  hasMore?: boolean
  //+ 加载更多回调
  onLoadMore?: () => void
  //+ 点击卡片回调
  onItemClick?: (item: FeedItem) => void
  //+ 空状态文案
  emptyText?: string
}

//+ 渲染单个Feed卡片
const FeedCard = ({ item, onClick }: { item: FeedItem; onClick?: () => void }) => {
  //+ 封面图：第一张图片作为封面
  const coverImg = item.images[0] || ''
  //+ 判断是否为视频内容
  const isVideo = !!item.videoUrl

  //+ 点赞状态（乐观更新，避免刷新整个列表）
  const [localLiked, setLocalLiked] = useState(item.isLiked)
  const [localLikeCount, setLocalLikeCount] = useState(item.likeCount)

  //+ 点赞/取消点赞（阻止冒泡，不触发卡片跳转）
  const handleLikeClick = (e: any) => {
    e.stopPropagation()
    //+ 乐观更新UI
    const newLiked = !localLiked
    setLocalLiked(newLiked)
    setLocalLikeCount(newLiked ? localLikeCount + 1 : localLikeCount - 1)
    //+ 异步调用API
    toggleNoteLikeAPI(item.id)
  }

  //+ 点击跳转详情（note→NoteDetail, guide→GuideDetail）
  const handleClick = () => {
    if (onClick) {
      // console.log('onClick', onClick)
      
// 调用父组件传入的自定义点击回调函数，用于接管卡片点击行为（如跳转自定义页面或执行其他业务逻辑）
// 当父组件没有传入 onClick 时，会走下方默认的详情页跳转逻辑

// onClick()

    
      const pagePath = item.type === 'guide'
        ? '/pages/GuideDetail/index'
        : '/pages/NoteDetail/index'
      const typeLabel = item.type === 'guide' ? '攻略' : '笔记'
      
      Taro.navigateTo({ url: `${pagePath}?id=${item.id}&type=${typeLabel}` })
    }
  }

  return (
    <div className="feed-item" onClick={handleClick}>
      <div className="feed-cover">
        <img
          src={isVideo ? (item.videoUrl || coverImg) : coverImg}
          alt={item.title}
          className={isVideo ? 'cover-video' : 'cover-image'}
        />
        {/* 左上角分类标签：取 tags[0] */}
        {item.tags.length > 0 && (
          <div className="feed-tag-wrapper">
            <Tag tagName={item.tags[0]} />
          </div>
        )}
        {/* 视频播放图标（居中） */}
        {isVideo && (
          <div className="feed-play-icon">
            <span>▶</span>
          </div>
        )}
      </div>
      <div className="feed-info">
        <div className="feed-title">{item.title}</div>
        <div className="feed-meta">
          <img
            className="user-avatar"
            src={item.member.avatar}
            alt={item.member.nickname}
          />
          <span className="user-name">{item.member.nickname}</span>
          <span className={`feed-likes ${localLiked ? 'is-liked' : ''}`} onClick={handleLikeClick}>
           <span className="like-icon"> {localLiked ? '♥' : '♡'} </span> {localLikeCount}
          </span>
        </div>
      </div>
    </div>
  )
}

//+ Feed列表组件
const NoteList = ({
  feed,
  loading = false,
  hasMore = false,
  onLoadMore,
  onItemClick,
  emptyText = '暂无内容'
}: NoteListProps) => {
  //+ 加载中且无数据
  if (loading && feed.length === 0) {
    return (
      <div className="note-list-loading">
        <Loading>加载中...</Loading>
      </div>
    )
  }

  //+ 空状态
  if (feed.length === 0) {
    return (
      <div className="note-list-empty">
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="note-list-container">
      {/* 瀑布流布局 */}
      <div className="waterfall-container">
        <div className="waterfall-column">
          {feed.filter((_, i) => i % 2 === 0).map(item => (
            <FeedCard
              key={item.id}
              item={item}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </div>
        <div className="waterfall-column">
          {feed.filter((_, i) => i % 2 === 1).map(item => (
            <FeedCard
              key={item.id}
              item={item}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </div>
      </div>

      {/* 加载更多 */}
      {hasMore && onLoadMore && (
        <div className="note-list-load-more" onClick={onLoadMore}>
          {loading ? <Loading>加载中...</Loading> : <span>加载更多</span>}
        </div>
      )}

      {/* 没有更多 */}
      {!hasMore && feed.length > 0 && (
        <div className="note-list-no-more">
          <span>已加载全部</span>
        </div>
      )}
    </div>
  )
}

export default NoteList