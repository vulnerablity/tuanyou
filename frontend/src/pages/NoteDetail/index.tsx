//+ 笔记详情页（仅处理笔记 type=note）
//+ 攻略详情请见 /pages/GuideDetail（独立模块，不复用本页；但其评论区可直接复用 CommentSection，传 contentType='guide' 即可）
//+ 完整点赞/收藏/关注链路（通过 note 模块 thunk，单次 API 调用）
import HeaderNavBar from '@/components/HeaderNavBar'
import DetailBanner from '@/components/DetailBanner'
import DetailInfo from '@/components/DetailInfo'
import CommentInput, { type CommentInputReplyTarget, type CommentInputSendPayload } from '@/components/CommentInput'
import CommentSection from '@/components/CommentSection'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { Dialog } from '@nutui/nutui-react'
import { fetchNoteDetail, toggleLike as toggleNoteLike, toggleFavorite as toggleNoteFavorite, patchNoteDetail, deleteNote } from '@/store/modules/note'
import { toggleProfileFollow } from '@/store/modules/profile'
import { updateFeedItem } from '@/store/modules/home'
import {
  fetchComments, loadMoreComments, createComment,
  toggleCommentLike, deleteComment, fetchReplies,
  resetComments, findCommentById
} from '@/store/modules/comment'
import { COMMENT_TARGET_TYPE } from '@/types'
import { useAuthGuard } from '@/components/AuthRoute'
import { useCommentPolling } from '@/hooks/useCommentPolling'
import { routerNavigateBack, routerSwitchTab } from '@/router'
import './index.less'

//+ 操作冷却（ms）：完成后计时，防止接口响应极快时用户连续点击产生串行无效请求
const COOLDOWN_MS = 800
//+ 滑动触底阈值（px）：距底部提前触发评论下一页，用户无停顿感
const BOTTOM_THRESHOLD = 300

//+ 判断是否为 AbortController 主动取消（RTK rejected action 的 error.name === 'AbortError'）
function isAbortError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError'
}

//+ 从未知错误中提取可读 message（兼容 Error 实例与 RTK SerializedError plain object）
function errMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === 'object') {
    const m = (err as { message?: string }).message
    if (typeof m === 'string' && m) return m
  }
  return fallback
}

const NoteDetail = () => {
  useAuthGuard()
  const dispatch: AppDispatch = useDispatch()

  //+ 详情数据（仅笔记）
  const noteDetail = useSelector((state: RootState) => state.note.noteDetail)
  //+ 当前用户ID（用于判断 isSelf，本人不显示关注按钮）
  const userId = useSelector((state: RootState) => state.user.userInfo?.id || '')

  //+ 路由参数：id（笔记ID）
  const router = Taro.getCurrentInstance().router
  const id = router?.params?.id || ''

  //+ 评论点赞数轮询：15s 一次，只 patch likeCount 变化项，离开详情页自动清理
  useCommentPolling(COMMENT_TARGET_TYPE.NOTE, id)

  //+ 请求锁 + AbortController：key = `${op}:${id}`，值 = RTK dispatch promise
  //+ promise.abort() 会触发 RTK 内部 signal → 传入 API → request 层 abort 真实请求
  //+ 作用1：狂点时拦截（has(key) 即请求中）；作用2：快速交替点击时 abort 上一个过期请求
  const promiseRef = useRef<Map<string, { abort: () => void }>>(new Map())
  //+ 操作冷却：完成后计时，防止接口响应极快时用户连续点击产生串行无效请求
  const cooldownRef = useRef<Map<string, number>>(new Map())

  //+ 协调状态：CommentSection 点"回复"时设置 replyTarget → 传入 CommentInput 打开回复模式弹层
  const [replyTarget, setReplyTarget] = useState<CommentInputReplyTarget | null>(null)

  //+ 评论列表（来自 comment store，作为 CommentSection 的单一数据源）
  const commentList = useSelector((state: RootState) => state.comment.list)
  const commentHasMore = useSelector((state: RootState) => state.comment.hasMore)
  const commentLoadingMore = useSelector((state: RootState) => state.comment.loadingMore)

  //+ 删除确认弹窗控制
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  //+ 离开页面时 abort 所有未完成请求
  useEffect(() => {
    return () => {
      promiseRef.current.forEach(p => p.abort())
      promiseRef.current.clear()
      cooldownRef.current.clear()
    }
  }, [])

  useEffect(() => {
    if (id) {
      dispatch(fetchNoteDetail({ id, type: 'note' }))
      //+ 评论列表：切换目标时重置后拉取首页（targetType=1 笔记）
      dispatch(resetComments())
      //+ 保存 promise：组件卸载或 id 变化时 abort 旧请求
      //+ 防止旧请求的 fulfilled 晚于新请求到达，覆盖新页面的 totalComments/list（评论总数对不齐）
      const commentsPromise = dispatch(fetchComments({ targetType: COMMENT_TARGET_TYPE.NOTE, targetId: id }))
      return () => {
        commentsPromise.abort()
      }
    }
  }, [dispatch, id])

  const isVideo = !!noteDetail?.videoUrl
  const authorId = noteDetail?.author?.id || ''
  const isSelf = !!userId && !!authorId && String(userId) === String(authorId)

  //+ 点赞（note 模块 thunk → 单次 API；fulfilled 后 store 自动同步详情）
  //+ 同时同步 home store 中对应卡片的点赞状态，返回首页时卡片图标和数字一致
  //+ 性能优化：按资源ID请求锁 + AbortController 丢弃过期请求；store pending 阶段已做乐观 UI 翻转
  const handleToggleLike = useCallback(async (nextIsLiked: boolean) => {
    if (!noteDetail?.id) return
    const resKey = `like:${noteDetail.id}`
    //+ 操作冷却：接口响应极快时防串行狂点
    const cd = cooldownRef.current.get(resKey)
    if (cd && Date.now() < cd) return
    //+ Abort 上一个同资源请求（RTK promise.abort() → signal → API abort）
    const prev = promiseRef.current.get(resKey)
    if (prev) prev.abort()

    const dispatchPromise = dispatch(toggleNoteLike(noteDetail.id))
    promiseRef.current.set(resKey, dispatchPromise)
    let wasAborted = false
    try {
      const payload = await dispatchPromise.unwrap()
      const finalLiked = typeof payload.isLiked === 'boolean' ? payload.isLiked : nextIsLiked
      const finalCount = typeof payload.likeCount === 'number'
        ? payload.likeCount
        : (noteDetail.likeCount || 0) + (finalLiked ? 1 : -1)
      dispatch(updateFeedItem({ id: noteDetail.id, patch: { isLiked: finalLiked, likeCount: finalCount } }))
      Taro.showToast({ title: finalLiked ? '点赞成功' : '已取消点赞', icon: 'success' })
    } catch (err) {
      if (isAbortError(err)) {
        wasAborted = true
      } else {
        Taro.showToast({ title: errMessage(err, '操作失败'), icon: 'none' })
      }
    } finally {
      if (promiseRef.current.get(resKey) === dispatchPromise) {
        promiseRef.current.delete(resKey)
      }
      if (!wasAborted) {
        const expires = Date.now() + COOLDOWN_MS
        cooldownRef.current.set(resKey, expires)
        setTimeout(() => { if (cooldownRef.current.get(resKey) === expires) cooldownRef.current.delete(resKey) }, COOLDOWN_MS + 50)
      }
    }
  }, [noteDetail, dispatch])

  //+ 收藏（同时同步 home store，保证返回首页后卡片状态一致）
  //+ 性能优化：按资源ID请求锁 + AbortController；pending 阶段已乐观 UI 翻转
  const handleToggleFavorite = useCallback(async (nextIsFavorited: boolean) => {
    if (!noteDetail?.id) return
    const resKey = `fav:${noteDetail.id}`
    const cd = cooldownRef.current.get(resKey)
    if (cd && Date.now() < cd) return
    const prev = promiseRef.current.get(resKey)
    if (prev) prev.abort()

    const dispatchPromise = dispatch(toggleNoteFavorite(noteDetail.id))
    promiseRef.current.set(resKey, dispatchPromise)
    let wasAborted = false
    try {
      const payload = await dispatchPromise.unwrap()
      const finalFav = typeof payload.isFavorited === 'boolean' ? payload.isFavorited : nextIsFavorited
      dispatch(updateFeedItem({ id: noteDetail.id, patch: { isFavorited: finalFav } }))
      Taro.showToast({ title: finalFav ? '收藏成功' : '已取消收藏', icon: 'success' })
    } catch (err) {
      if (isAbortError(err)) {
        wasAborted = true
      } else {
        Taro.showToast({ title: errMessage(err, '操作失败'), icon: 'none' })
      }
    } finally {
      if (promiseRef.current.get(resKey) === dispatchPromise) {
        promiseRef.current.delete(resKey)
      }
      if (!wasAborted) {
        const expires = Date.now() + COOLDOWN_MS
        cooldownRef.current.set(resKey, expires)
        setTimeout(() => { if (cooldownRef.current.get(resKey) === expires) cooldownRef.current.delete(resKey) }, COOLDOWN_MS + 50)
      }
    }
  }, [noteDetail, dispatch])

  //+ 关注/取消关注（统一走 profile/toggleProfileFollow，POST /personal/follow/{id}）
  //+ 性能优化：按被关注 userId 请求锁 + AbortController
  const handleToggleFollow = useCallback(async (authorUserId: string, nextIsFollowed: boolean) => {
    if (!authorUserId) return
    const resKey = `follow:${authorUserId}`
    const cd = cooldownRef.current.get(resKey)
    if (cd && Date.now() < cd) return
    const prev = promiseRef.current.get(resKey)
    if (prev) prev.abort()

    const dispatchPromise = dispatch(toggleProfileFollow(authorUserId))
    promiseRef.current.set(resKey, dispatchPromise)
    let wasAborted = false
    try {
      const payload = await dispatchPromise.unwrap()
      const finalIsFollowed = typeof payload.isFollowed === 'boolean'
        ? payload.isFollowed
        : nextIsFollowed
      dispatch(patchNoteDetail({ isFollowed: finalIsFollowed }))
      Taro.showToast({ title: finalIsFollowed ? '关注成功' : '已取消关注', icon: 'success' })
    } catch (err) {
      if (isAbortError(err)) {
        wasAborted = true
      } else {
        Taro.showToast({ title: errMessage(err, '操作失败'), icon: 'none' })
      }
    } finally {
      if (promiseRef.current.get(resKey) === dispatchPromise) {
        promiseRef.current.delete(resKey)
      }
      if (!wasAborted) {
        const expires = Date.now() + COOLDOWN_MS
        cooldownRef.current.set(resKey, expires)
        setTimeout(() => { if (cooldownRef.current.get(resKey) === expires) cooldownRef.current.delete(resKey) }, COOLDOWN_MS + 50)
      }
    }
  }, [dispatch])

  //+ 关注按钮 loading：请求中（promiseRef.has）即置灰禁用
  const followLoading = useMemo(() => !!authorId && promiseRef.current.has(`follow:${authorId}`), [authorId])

  // ---------- 协调：评论系统回复 / 发送链路 ----------

  //+ CommentSection 点"回复" → 设置 replyTarget → CommentInput 自动弹"回复 @XXX"
  const handleRequestReply = useCallback((target: CommentInputReplyTarget) => {
    setReplyTarget(target)
  }, [])

  //+ CommentInput 回复模式下点击关闭 ✕ 或关闭弹层时 → 清空 replyTarget 回到一级模式
  const handleCancelReply = useCallback(() => {
    setReplyTarget(null)
  }, [])

  //+ CommentInput 点击"发送"（一级或回复模式）→ 调用 createComment thunk
  //+ createComment 用 rejectWithValue({ code, message })：失败时原样抛出，CommentInput 据此区分提示（2001=违禁词）
  const handleSendComment = useCallback(async (payload: CommentInputSendPayload) => {
    if (!id) return
    //+ API 入参：replyToId 为一级评论 ID（即 parentCommentId）；回复二级评论时需传 replyToMemberId
    let apiReplyToId: number | undefined
    let replyToMemberId: number | undefined
    if (payload.parentCommentId) {
      apiReplyToId = Number(payload.parentCommentId) || undefined
      //+ 回复二级评论时（replyToId 与 parentCommentId 不同）必传被回复用户 ID
      if (payload.replyToId && payload.replyToId !== payload.parentCommentId) {
        const replied = findCommentById(commentList, payload.replyToId)
        replyToMemberId = replied?.member.id ? Number(replied.member.id) || undefined : undefined
      }
    }
    try {
      await dispatch(createComment({
        targetType: COMMENT_TARGET_TYPE.NOTE,
        targetId: Number(id) || 0,
        content: payload.content,
        replyToId: apiReplyToId,
        replyToMemberId
      })).unwrap()
      //+ store 已追加新评论 → initData 同步展示；切回一级模式
      setReplyTarget(null)
    } catch (err) {
      //+ Abort 主动取消：静默，不抛错打扰输入框
      if (isAbortError(err)) return
      //+ rejectWithValue({ code, message }) 原样抛出：CommentInput 读取 err.code/err.message（2001=违禁词）
      throw err
    }
  }, [dispatch, id, commentList])

  //+ 加载更多一级评论（store 追加 → initData 同步）
  const handleLoadMoreComments = useCallback(async () => {
    await dispatch(loadMoreComments())
  }, [dispatch])

  // ---------- 滑动触底加载（一级评论）----------
  //+ 滚动容器 ref（.note-detail-content，实际滚动载体）
  const contentRef = useRef<HTMLDivElement | null>(null)
  //+ 正在加载中锁：onScroll 高频触发，防止重复请求
  const loadingLockRef = useRef(false)

  //+ 尝试加载下一页：所有条件满足才调用，否则跳过
  //+ 供 onScroll 和首屏 useEffect 复用
  const tryLoadNextPage = useCallback(async () => {
    if (loadingLockRef.current) return          //+ 同页请求中
    if (!commentHasMore) return                  //+ 没有更多
    if (commentLoadingMore) return               //+ store loadingMore 已在请求
    //+ 加锁，onScroll 后续事件不会再触发
    loadingLockRef.current = true
    try {
      await handleLoadMoreComments()
    } finally {
      loadingLockRef.current = false
    }
  }, [commentHasMore, commentLoadingMore, handleLoadMoreComments])

  //+ 滚动监听：距底部 <= threshold 时触发加载
  const handleScroll = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    //+ scrollHeight = 内容真实高度，clientHeight = 可见高度，scrollTop = 已滚动
    const remain = el.scrollHeight - el.scrollTop - el.clientHeight
    if (remain <= BOTTOM_THRESHOLD) {
      void tryLoadNextPage()
    }
  }, [tryLoadNextPage])

  //+ 首屏自动补满：评论数少未撑出滚动条 → 自动加载下一页直到出现滚动条或 hasMore=false
  useEffect(() => {
    const check = () => {
      const el = contentRef.current
      if (!el) return
      //+ 滚动条高度为 0（未撑满）且还有更多数据
      if (el.scrollHeight <= el.clientHeight + 1) {
        void tryLoadNextPage()
      }
    }
    //+ 初始 check + 每次评论列表 / hasMore 变化后再 check
    const timer = setTimeout(check, 80)
    return () => clearTimeout(timer)
  }, [commentList, commentHasMore, tryLoadNextPage])

  //+ 加载更多二级评论（store 追加到对应一级评论 → initData 同步）
  const handleLoadMoreReplies = useCallback(async (parentId: string): Promise<{ hasMore: boolean }> => {
    const payload = await dispatch(fetchReplies({ parentId })).unwrap()
    return { hasMore: payload.hasMore }
  }, [dispatch])

  //+ 评论点赞（失败 throw 触发 CommentSection 回滚）
  //+ 性能优化：操作冷却 + AbortController 丢弃过期请求
  const handleToggleCommentLike = useCallback(async (commentId: string) => {
    const resKey = `commentLike:${commentId}`
    const cd = cooldownRef.current.get(resKey)
    if (cd && Date.now() < cd) return
    const prev = promiseRef.current.get(resKey)
    if (prev) prev.abort()

    const dispatchPromise = dispatch(toggleCommentLike(commentId))
    promiseRef.current.set(resKey, dispatchPromise)
    let wasAborted = false
    try {
      await dispatchPromise.unwrap()
    } catch (err) {
      if (isAbortError(err)) {
        wasAborted = true
      } else {
        throw new Error(errMessage(err, '操作失败'))
      }
    } finally {
      if (promiseRef.current.get(resKey) === dispatchPromise) {
        promiseRef.current.delete(resKey)
      }
      if (!wasAborted) {
        const expires = Date.now() + COOLDOWN_MS
        cooldownRef.current.set(resKey, expires)
        setTimeout(() => { if (cooldownRef.current.get(resKey) === expires) cooldownRef.current.delete(resKey) }, COOLDOWN_MS + 50)
      }
    }
  }, [dispatch])

  //+ 删除评论（失败 throw 触发 CommentSection 提示）
  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      await dispatch(deleteComment(commentId)).unwrap()
    } catch (err) {
      if (isAbortError(err)) return
      throw new Error(errMessage(err, '删除失败'))
    }
  }, [dispatch])

  //+ 头部 more 按钮点击：弹出 ActionSheet 选择删除
  const handleMoreClick = useCallback(() => {
    Taro.showActionSheet({
      itemList: ['删除笔记'],
      success: (res) => {
        if (res.tapIndex === 0) {
          setDeleteVisible(true)
        }
      },
      //+ 用户点击取消时 Taro 会触发 fail，静默处理避免 Uncaught (in promise)
      fail: (err) => {
        if (!/cancel/i.test(err.errMsg || '')) {
          console.warn('[NoteDetail] showActionSheet fail:', err)
        }
      }
    })
  }, [])

  //+ 确认删除笔记
  const handleDeleteConfirm = useCallback(async () => {
    if (!id || deleteLoading) return
    setDeleteLoading(true)
    try {
      await dispatch(deleteNote(id)).unwrap()
      Taro.showToast({ title: '删除成功', icon: 'success' })
      setDeleteVisible(false)
      //+ 删除成功后返回上一页（栈为空时回退到首页 tab）
      setTimeout(() => {
        routerNavigateBack(1).catch(() => routerSwitchTab('HOME'))
      }, 500)
    } catch (err) {
      console.warn('[NoteDetail] 删除失败:', err)
      Taro.showToast({ title: errMessage(err, '删除失败'), icon: 'none' })
    } finally {
      setDeleteLoading(false)
    }
  }, [id, deleteLoading, dispatch])

  return (
    <div className='note-detail-container'>
      {/* 顶部标题和返回箭头 */}
      <HeaderNavBar
        title='详情'
        backPageNum={1}
        fixed={false}
        more={!!noteDetail?.isOwner}
        onMoreClick={handleMoreClick}
      />
      <div
        className='note-detail-content'
        ref={contentRef}
        onScroll={handleScroll}
      >
        {/* 轮播图/视频 */}
        {isVideo
          ? <DetailBanner videoUrl={noteDetail?.videoUrl} />
          : <DetailBanner images={noteDetail?.images} />
        }

        {/* 笔记详情（含点赞/收藏/关注） */}
        <DetailInfo
          detail={noteDetail ?? undefined}
          actions={{
            isFollowed: noteDetail?.isFollowed,
            isSelf,
            authorId,
            onToggleFollow: handleToggleFollow,
            followLoading,
          }}
        />

        {/* 评论列表（两级评论展示 + 删除弹层 + 分页加载更多 + 点击回复触发 onRequestReply） */}
        <CommentSection
          contentId={id}
          contentType='note'
          initData={commentList}
          hasMoreComments={commentHasMore}
          loadingMore={commentLoadingMore}
          onLoadMoreComments={handleLoadMoreComments}
          onLoadMoreReplies={handleLoadMoreReplies}
          onRequestReply={handleRequestReply}
          onToggleCommentLike={handleToggleCommentLike}
          onDeleteComment={handleDeleteComment}
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

      {/* 删除确认弹窗 */}
      <Dialog
        visible={deleteVisible}
        title='确认删除笔记？'
        content='删除后无法恢复，确定删除该笔记吗？'
        confirmText='删除'
        cancelText='取消'
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteVisible(false)}
      />
    </div>
  )
}

export default NoteDetail
