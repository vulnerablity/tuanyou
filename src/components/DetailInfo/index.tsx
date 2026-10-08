//+ 详情页顶部信息组件（标题 + 作者 + 关注按钮 + 内容 + 标签 + 操作栏）
//+ Q8：支持点赞/收藏/关注按钮回调（乐观更新由父组件控制 store）
import { useMemo } from 'react'
import Taro from '@tarojs/taro'
import { RichText } from '@tarojs/components'
import { normalizeDetailHtml } from '@/utils/html'
import '@/components/MarkdownEditor/index.less'
import Avatar from '../Avatar'
import Button from '../Button'
import './index.less'

export interface DetailInfoActionProps {
  /** 关注状态 */
  isFollowed?: boolean
  /** 当前用户是否是作者本人（本人则不显示关注按钮） */
  isSelf?: boolean
  /** 作者用户ID（用于关注按钮） */
  authorId?: string
  /** 点击关注 */
  onToggleFollow?: (authorId: string, nextIsFollowed: boolean) => void
  /** 关注请求中（防止重复点击 + 视觉 loading） */
  followLoading?: boolean
}

//+ 详情数据最小结构（由页面透传 Note/Guide 详情，组件只消费以下字段）
interface DetailInfoData {
  title?: string
  content?: string
  avatar?: string
  author?: {
    id?: string
    nickname?: string
    avatar?: string
  }
  publishTime?: string
  tags?: string[]
}

export interface DetailInfoProps {
  detail?: DetailInfoData
  actions?: DetailInfoActionProps
}

const DetailInfo = ({ detail, actions }: DetailInfoProps) => {
  const {
    title,
    content,
    avatar,
    author,
    publishTime,
    tags,
  } = detail || {}

  const {
    isFollowed = false,
    isSelf = false,
    authorId,
    onToggleFollow,
    followLoading = false,
  } = actions || {}

  //+ 作者信息（保证 author?.id 存在，用于关注）
  const effectiveAuthorId = authorId || author?.id
  const nickname = author?.nickname || ''
  const avatarUrl = avatar || author?.avatar || ''

  const contentHtml = useMemo(() => normalizeDetailHtml(content), [content])
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB

  //+ 关注
  const handleFollowClick = () => {
    if (isSelf || !effectiveAuthorId) return
    onToggleFollow?.(effectiveAuthorId, !isFollowed)
  }

  return (
    <div className='detail-info'>
      {/* 标题 */}
      <p className='info-title'>
        {title}
      </p>
      {/* 头像+昵称+时间+关注 */}
      <div className='info-header'>
        <div className='info-header-left'>
          {/* 头像 */}
          <Avatar url={avatarUrl} size='small' />
          <div className='info-header-left-content'>
            {/* 昵称 */}
            <span className='nickname'>{nickname}</span>
            {/* 时间 */}
            <span className='publish-time'>{publishTime?.split('T')[0] || ''}</span>
          </div>
        </div>
        {/* 关注按钮：非本人显示 */}
        {!isSelf && effectiveAuthorId && (
          <Button
            content={isFollowed ? '已关注' : '+ 关注'}
            onClick={handleFollowClick}
            isFollowed={isFollowed}
            loading={followLoading}
            disabled={followLoading}
          />
        )}
      </div>
      {/* 内容 - Markdown 渲染 */}
      <div className='info-content md-content'>
        {isH5 ? (
          //+ markdown 已由 useMarkdownRender 消毒，H5 端需注入 HTML 渲染富文本
          // eslint-disable-next-line react/no-danger
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        ) : (
          <RichText nodes={contentHtml} />
        )}
      </div>
      {/* 标签 */}
      <div className='info-tags'>
        {tags?.map((tag) => (
          <span key={tag} className='tag'>
            <span className='tag-icon'>#</span>{tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default DetailInfo
