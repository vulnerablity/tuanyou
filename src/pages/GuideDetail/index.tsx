//+ 攻略详情页（仅处理攻略 type=guide）
//+ 与笔记详情结构对称，routeInfo 路线信息在此页面内联渲染
//+ 完整点赞/收藏/关注/删除链路（通过 guide 模块 thunk，单次 API 调用）
import HeaderNavBar from '@/components/HeaderNavBar'
import DetailBanner from '@/components/DetailBanner'
import CommentInput, { type CommentInputReplyTarget, type CommentInputSendPayload } from '@/components/CommentInput'
import CommentSection from '@/components/CommentSection'
import Avatar from '@/components/Avatar'
import Button from '@/components/Button'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { useEffect, useCallback, useState } from 'react'
import Taro from '@tarojs/taro'
import { Dialog } from '@nutui/nutui-react'
import { fetchGuideDetail, toggleLike as toggleGuideLike, toggleFavorite as toggleGuideFavorite, patchGuideDetail, deleteGuide } from '@/store/modules/guide'
import { toggleProfileFollow } from '@/store/modules/profile'
import { updateFeedItem } from '@/store/modules/home'
import type { Comment } from '@/types/entity'
import './index.less'

const GuideDetail = () => {
  const dispatch: AppDispatch = useDispatch()

  //+ 详情数据（仅攻略）
  const guideDetail = useSelector((state: RootState) => state.guide.guideDetail)
  //+ 当前用户ID（用于判断 isSelf，本人不显示关注按钮）
  const userId = useSelector((state: RootState) => state.user.userInfo?.id || '')
  const userAvatar = useSelector((state: RootState) => state.user.userInfo?.avatar || '')
  const userNickname = useSelector((state: RootState) => state.user.userInfo?.nickname || '我')

  //+ 路由参数：id（攻略ID）
  const router = Taro.getCurrentInstance().router
  const id = router?.params?.id || ''

  //+ 协调状态：CommentSection 点"回复"时设置 replyTarget → 传入 CommentInput 打开回复模式弹层
  const [replyTarget, setReplyTarget] = useState<CommentInputReplyTarget | null>(null)

  //+ 协调状态：CommentInput 发送成功后，构造新的 Comment 对象，通过 prop 塞给 CommentSection 自动追加
  const [newComment, setNewComment] = useState<Comment | null>(null)

  //+ 删除确认弹窗控制
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchGuideDetail({ id }))
    }
  }, [dispatch, id])

  const isVideo = !!guideDetail?.videoUrl
  const authorId = guideDetail?.author?.id || ''
  const isSelf = !!userId && !!authorId && String(userId) === String(authorId)
  const isFollowed = guideDetail?.isFollowed ?? false

  //+ 点赞（guide 模块 thunk → 单次 API；fulfilled 后 store 自动同步详情）
  //+ 同时同步 home store 中对应卡片的点赞状态，返回首页时卡片图标和数字一致
  const handleToggleLike = useCallback(async (nextIsLiked: boolean) => {
    if (!guideDetail?.id) return
    try {
      const action = await dispatch(toggleGuideLike(guideDetail.id))
      const ok = (action as any)?.meta?.requestStatus === 'fulfilled'
      if (ok) {
        const payload = (action as any)?.payload || {}
        const finalLiked = typeof payload.isLiked === 'boolean' ? payload.isLiked : nextIsLiked
        const finalCount = typeof payload.likeCount === 'number' ? payload.likeCount : (guideDetail.likeCount || 0) + (finalLiked ? 1 : -1)
        dispatch(updateFeedItem({ id: guideDetail.id, patch: { isLiked: finalLiked, likeCount: finalCount } }))
      }
      Taro.showToast({ title: nextIsLiked ? '点赞成功' : '已取消点赞', icon: 'success' })
    } catch (err) {
      console.warn('[GuideDetail] 点赞失败:', err)
    }
  }, [guideDetail, dispatch])

  //+ 收藏（同时同步 home store，保证返回首页后卡片状态一致）
  const handleToggleFavorite = useCallback(async (nextIsFavorited: boolean) => {
    if (!guideDetail?.id) return
    try {
      const action = await dispatch(toggleGuideFavorite(guideDetail.id))
      const ok = (action as any)?.meta?.requestStatus === 'fulfilled'
      if (ok) {
        const payload = (action as any)?.payload || {}
        const finalFav = typeof payload.isFavorited === 'boolean' ? payload.isFavorited : nextIsFavorited
        dispatch(updateFeedItem({ id: guideDetail.id, patch: { isFavorited: finalFav } }))
      }
      Taro.showToast({ title: nextIsFavorited ? '收藏成功' : '已取消收藏', icon: 'success' })
    } catch (err) {
      console.warn('[GuideDetail] 收藏失败:', err)
    }
  }, [guideDetail, dispatch])

  //+ 关注/取消关注（统一走 profile/toggleProfileFollow，POST /personal/follow/{id}）
  const handleToggleFollow = useCallback(async (authorUserId: string, nextIsFollowed: boolean) => {
    if (!authorUserId) return
    try {
      const action = await dispatch(toggleProfileFollow(authorUserId))
      const ok = (action as any)?.meta?.requestStatus === 'fulfilled'
      if (ok) {
        const payload = (action as any)?.payload || {}
        const finalIsFollowed = typeof payload.isFollowed === 'boolean'
          ? payload.isFollowed
          : nextIsFollowed
        dispatch(patchGuideDetail({ isFollowed: finalIsFollowed }))
        Taro.showToast({ title: finalIsFollowed ? '关注成功' : '已取消关注', icon: 'success' })
      } else {
        Taro.showToast({ title: (action as any)?.payload || '操作失败', icon: 'none' })
      }
    } catch (err) {
      console.warn('[GuideDetail] 关注失败:', err)
    }
  }, [dispatch])

  //+ 点击关注按钮（本地回调）
  const handleFollowClick = () => {
    if (isSelf || !authorId) return
    handleToggleFollow(authorId, !isFollowed)
  }

  // ---------- 协调：评论系统回复 / 发送链路 ----------

  //+ CommentSection 点"回复" → 设置 replyTarget → CommentInput 自动弹"回复 @XXX"
  const handleRequestReply = useCallback((target: CommentInputReplyTarget) => {
    setReplyTarget(target)
  }, [])

  //+ CommentInput 回复模式下点击关闭 ✕ 或关闭弹层时 → 清空 replyTarget 回到一级模式
  const handleCancelReply = useCallback(() => {
    setReplyTarget(null)
  }, [])

  //+ CommentInput 点击"发送"（一级或回复模式）→ 构造新的 Comment 对象塞给 CommentSection
  const handleSendComment = useCallback((payload: CommentInputSendPayload) => {
    const tempId = `local-${Date.now()}`
    const newOne: Comment = {
      id: tempId,
      member: {
        id: userId || 'me',
        nickname: userNickname,
        avatar: userAvatar
      },
      content: payload.content,
      likeCount: 0,
      isLiked: false,
      replyToId: payload.replyToId,
      replyToName: payload.replyToName,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      canDelete: true,
      replies: []
    }
    setNewComment(newOne)
    //+ 发送后切回一级模式
    setReplyTarget(null)
  }, [userId, userAvatar, userNickname])

  //+ 头部 more 按钮点击：弹出 ActionSheet 选择删除
  const handleMoreClick = useCallback(() => {
    Taro.showActionSheet({
      itemList: ['删除攻略'],
      success: (res) => {
        if (res.tapIndex === 0) {
          setDeleteVisible(true)
        }
      }
    })
  }, [])

  //+ 确认删除攻略
  const handleDeleteConfirm = useCallback(async () => {
    if (!id || deleteLoading) return
    setDeleteLoading(true)
    Taro.showLoading({ title: '删除中...', mask: true })
    try {
      const action = await dispatch(deleteGuide(id))
      const ok = (action as any)?.meta?.requestStatus === 'fulfilled'
      Taro.hideLoading()
      if (ok) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        setDeleteVisible(false)
        //+ 删除成功后返回上一页
        setTimeout(() => {
          Taro.navigateBack({ delta: 1 }).catch(() => {
            Taro.switchTab({ url: '/pages/Home/index' })
          })
        }, 500)
      } else {
        Taro.showToast({ title: (action as any)?.payload || '删除失败', icon: 'none' })
      }
    } catch (err) {
      Taro.hideLoading()
      console.warn('[GuideDetail] 删除失败:', err)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    } finally {
      setDeleteLoading(false)
    }
  }, [id, deleteLoading, dispatch])

  return (
    <div className='guide-detail-container'>
      {/* 顶部标题和返回箭头 */}
      <HeaderNavBar
        title='详情'
        backPageNum={1}
        fixed={false}
        more={!!(guideDetail?.isOwner ?? isSelf)}
        onMoreClick={handleMoreClick}
      />
      <div className='guide-detail-content'>
        {/* 轮播图/视频 */}
        {isVideo
          ? <DetailBanner videoUrl={guideDetail?.videoUrl} />
          : <DetailBanner images={guideDetail?.images} />
        }

        {/* 攻略详情区（内联：标题→作者→路线信息→正文→标签） */}
        <div className="guide-detail-info">
          {/* 标题 */}
          <p className="g-info-title">{guideDetail?.title}</p>

          {/* 头像+昵称+时间+关注 */}
          <div className="g-info-header">
            <div className="g-info-header-left">
              <Avatar url={guideDetail?.author?.avatar || ''} size="small" />
              <div className="g-info-header-left-content">
                <span className="g-nickname">{guideDetail?.author?.nickname || ''}</span>
                <span className="g-publish-time">{(guideDetail?.publishTime || '').split('T')[0]}</span>
              </div>
            </div>
            {!isSelf && authorId && (
              <Button
                content={isFollowed ? '已关注' : '+ 关注'}
                onClick={handleFollowClick}
                isFollowed={isFollowed}
              />
            )}
          </div>

          {/* 路线信息（攻略专属） */}
          {guideDetail?.routeInfo && (
            <div className="g-route-info">
              <p className="g-route-info-title">路线信息</p>
              <div className="g-route-info-grid">
                <div className="g-route-info-item">
                  <span className="g-route-info-label">距离</span>
                  <span className="g-route-info-value">{guideDetail.routeInfo.distance || '-'}</span>
                </div>
                <div className="g-route-info-item">
                  <span className="g-route-info-label">时长</span>
                  <span className="g-route-info-value">{guideDetail.routeInfo.duration || '-'}</span>
                </div>
                <div className="g-route-info-item">
                  <span className="g-route-info-label">难度</span>
                  <span className="g-route-info-value">{guideDetail.routeInfo.difficulty || '-'}</span>
                </div>
                <div className="g-route-info-item">
                  <span className="g-route-info-label">交通</span>
                  <span className="g-route-info-value">{guideDetail.routeInfo.transport || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 正文内容 */}
          <p className="g-info-content">{guideDetail?.content}</p>

          {/* 标签 */}
          <div className="g-info-tags">
            {guideDetail?.tags?.map((tag: string) => (
              <span key={tag} className="g-tag" onClick={() => { }}>
                <span className="g-tag-icon">#</span>{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 评论列表（两级评论展示 + 删除弹层 + 点击回复触发 onRequestReply） */}
        <CommentSection
          contentId={id}
          contentType='guide'
          onRequestReply={handleRequestReply}
          externalNewComment={newComment}
        />

        {/* 底部互动栏：点赞/收藏/转发 + Popup 输入一级评论或回复模式下"回复 @XXX" */}
        <CommentInput
          detail={guideDetail}
          replyTarget={replyTarget}
          onCancelReply={handleCancelReply}
          onSendComment={handleSendComment}
          actions={{
            isLiked: guideDetail?.isLiked,
            likeCount: guideDetail?.likeCount,
            isFavorited: guideDetail?.isFavorited,
            favoriteCount: guideDetail?.collectCount,
            onToggleLike: handleToggleLike,
            onToggleFavorite: handleToggleFavorite
          }}
        />
      </div>

      {/* 删除确认弹窗 */}
      <Dialog
        visible={deleteVisible}
        title='确认删除攻略？'
        content='删除后无法恢复，确定删除该攻略吗？'
        confirmText='删除'
        cancelText='取消'
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteVisible(false)}
      />
    </div>
  )
}

export default GuideDetail
