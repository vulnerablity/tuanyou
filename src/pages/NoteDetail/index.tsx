//+ 笔记详情页（仅处理笔记 type=note）
//+ 攻略详情请见 /pages/GuideDetail（独立模块，不复用本页；但其评论区可直接复用 CommentSection，传 contentType='guide' 即可）
//+ Q8：完整点赞/收藏/关注链路（通过 note 模块 thunk，单次 API 调用）
import HeaderNavBar from '@/components/HeaderNavBar'
import DetailBanner from '@/components/DetailBanner'
import DetailInfo from '@/components/DetailInfo'
import CommentInput, { type CommentInputReplyTarget, type CommentInputSendPayload } from '@/components/CommentInput'
import CommentSection from '@/components/CommentSection'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { useEffect, useCallback, useState } from 'react'
import Taro from '@tarojs/taro'
import { fetchNoteDetail, toggleLike as toggleNoteLike, toggleFavorite as toggleNoteFavorite, patchNoteDetail } from '@/store/modules/note'
import { toggleProfileFollow } from '@/store/modules/profile'
import { updateFeedItem } from '@/store/modules/home'
import type { Comment } from '@/types/entity'
import './index.less'

const NoteDetail = () => {
  const dispatch: AppDispatch = useDispatch()

  //+ 详情数据（仅笔记）
  const noteDetail = useSelector((state: RootState) => state.note.noteDetail)
  //+ 当前用户ID（用于判断 isSelf，本人不显示关注按钮）
  const userId = useSelector((state: RootState) => state.user.userInfo?.id || '')
  const userAvatar = useSelector((state: RootState) => state.user.userInfo?.avatar || '')
  const userNickname = useSelector((state: RootState) => state.user.userInfo?.nickname || '我')

  //+ 路由参数：id（笔记ID）
  const router = Taro.getCurrentInstance().router
  const id = router?.params?.id || ''

  //+ 协调状态：CommentSection 点"回复"时设置 replyTarget → 传入 CommentInput 打开回复模式弹层
  const [replyTarget, setReplyTarget] = useState<CommentInputReplyTarget | null>(null)

  //+ 协调状态：CommentInput 发送成功后，构造新的 Comment 对象，通过 prop 塞给 CommentSection 自动追加
  //+ 用 id+时间戳 保证每次变化不同（id 相同时 externalNewComment useEffect 内的 ref 会去重）
  const [newComment, setNewComment] = useState<Comment | null>(null)

  useEffect(() => {

    if (id) {
      dispatch(fetchNoteDetail({ id, type: 'note' }))
    }
  }, [dispatch, id])

  const isVideo = !!noteDetail?.videoUrl
  const authorId = noteDetail?.author?.id || ''
  const isSelf = !!userId && !!authorId && String(userId) === String(authorId)

  //+ Q8：点赞（note 模块 thunk → 单次 API；fulfilled 后 store 自动同步详情）
  //+ 问题1修复：同时同步 home store 中对应卡片的点赞状态，返回首页时卡片图标和数字一致
  const handleToggleLike = useCallback(async (nextIsLiked: boolean) => {
    if (!noteDetail?.id) return
    try {
      const action = await dispatch(toggleNoteLike(noteDetail.id))
      const ok = (action as any)?.meta?.requestStatus === 'fulfilled'
      if (ok) {
        const payload = (action as any)?.payload || {}
        const finalLiked = typeof payload.isLiked === 'boolean' ? payload.isLiked : nextIsLiked
        const finalCount = typeof payload.likeCount === 'number' ? payload.likeCount : (noteDetail.likeCount || 0) + (finalLiked ? 1 : -1)
        dispatch(updateFeedItem({ id: noteDetail.id, patch: { isLiked: finalLiked, likeCount: finalCount } }))
      }
      Taro.showToast({ title: nextIsLiked ? '点赞成功' : '已取消点赞', icon: 'success' })
    } catch (err) {
      console.warn('[NoteDetail] 点赞失败:', err)
    }
  }, [noteDetail, dispatch])

  //+ Q8：收藏（同时同步 home store，保证返回首页后卡片状态一致）
  const handleToggleFavorite = useCallback(async (nextIsFavorited: boolean) => {
    if (!noteDetail?.id) return
    try {
      const action = await dispatch(toggleNoteFavorite(noteDetail.id))
      const ok = (action as any)?.meta?.requestStatus === 'fulfilled'
      if (ok) {
        const payload = (action as any)?.payload || {}
        const finalFav = typeof payload.isFavorited === 'boolean' ? payload.isFavorited : nextIsFavorited
        dispatch(updateFeedItem({ id: noteDetail.id, patch: { isFavorited: finalFav } }))
      }
      Taro.showToast({ title: nextIsFavorited ? '收藏成功' : '已取消收藏', icon: 'success' })
    } catch (err) {
      console.warn('[NoteDetail] 收藏失败:', err)
    }
  }, [noteDetail, dispatch])

  //+ Q8：关注/取消关注（统一走 profile/toggleProfileFollow，POST /personal/follow/{id}）
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
        dispatch(patchNoteDetail({ isFollowed: finalIsFollowed }))
        Taro.showToast({ title: finalIsFollowed ? '关注成功' : '已取消关注', icon: 'success' })
      } else {
        Taro.showToast({ title: (action as any)?.payload || '操作失败', icon: 'none' })
      }
    } catch (err) {
      console.warn('[NoteDetail] 关注失败:', err)
    }
  }, [dispatch])

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
  //+ 后续对接后端：在此调用对应 thunk，成功后再 setNewComment
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

  return (
    <div className='note-detail-container'>
      {/* 顶部标题和返回箭头 */}
      <HeaderNavBar title='详情' backPageNum={1} fixed={false} />
      <div className='note-detail-content'>
        {/* 轮播图/视频 */}
       
      {isVideo
        ? <DetailBanner  videoUrl={noteDetail?.videoUrl} />
        : <DetailBanner  images={noteDetail?.images} />
      }
     
      
      {/* 笔记详情（含点赞/收藏/关注） */}
      <DetailInfo
        detail={noteDetail}
        actions={{
          isFollowed: noteDetail?.isFollowed,
          isSelf,
          authorId,
          onToggleFollow: handleToggleFollow,
        }}
      />

      {/* 评论列表（两级评论展示 + 删除弹层 + 点击回复触发 onRequestReply） */}
      {/* 攻略详情后续接入时，只需传 contentType='guide' 即可复用 */}
      <CommentSection
        contentId={id}
        contentType='note'
        onRequestReply={handleRequestReply}
        externalNewComment={newComment}
      />

      {/* 底部互动栏：点赞/收藏/转发 + Popup 输入一级评论或回复模式下"回复 @XXX" */}
      <CommentInput
        detail={noteDetail}
        replyTarget={replyTarget}
        onCancelReply={handleCancelReply}
        onSendComment={handleSendComment}
        actions={{
          isLiked: noteDetail?.isLiked,
          likeCount: noteDetail?.likeCount,
          isFavorited: noteDetail?.isFavorited,
          favoriteCount: noteDetail?.collectCount,
          onToggleLike: handleToggleLike,
          onToggleFavorite: handleToggleFavorite
        }}
      />
      </div>

    </div>
  )
}

export default NoteDetail
