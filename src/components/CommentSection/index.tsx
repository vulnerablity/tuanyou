//+ 评论区组件（仅评论列表 + 删除弹层）
//+ 支持：两级评论展示、评论点赞、展开/收起（默认2条）、长按删除
//+ 点击"回复"按钮 → 通过 onRequestReply 回调通知父组件，父组件再调用 CommentInput（Popup 弹层）完成输入+提交
//+ 发送结果：父组件调用 CommentInput.onSendComment 成功后，构造 Comment 对象传入 externalNewComment，组件内部自动追加
//+ 复用于笔记详情 (NoteDetail) 和攻略详情 (GuideDetail)，通过 props 传入内容类型与事件回调
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import Taro, { useDidHide } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react'
import { ArrowDown, ArrowUp } from '@nutui/icons-react'
import Avatar from '@/components/Avatar'
import type { Comment } from '@/types/entity'
import './index.less'

// ==================== 对外 Props ====================

//+ 评论区对外参数，笔记/攻略详情通用
//+ contentId / contentType：后续对接后端创建评论/加载评论列表时使用
export interface CommentSectionProps {
  /** 内容ID，后续对接后端时用 */
  contentId: string
  /** 内容类型：note / guide，攻略详情直接传 'guide' 即可复用 */
  contentType: 'note' | 'guide'
  /** 初始数据，静态页时可传；不传则使用组件内置静态 Mock */
  initData?: Comment[]
  /** 点击"回复"按钮时触发：父组件应收到后将 replyTarget 传入 CommentInput.replyTarget */
  onRequestReply?: (target: {
    parentCommentId: string | null
    replyToId: string | null
    replyToName: string | null
  }) => void
  /** 父组件通过 CommentInput 发送成功后，把新构造的 Comment 通过该 prop 传入，组件内部会自动追加
   *  一级评论：追加到列表头部；二级评论：追加到对应 parentCommentId 的 replies 尾部
   */
  externalNewComment?: Comment | null
  /** 单条评论点赞回调 */
  onToggleCommentLike?: (commentId: string, nextLiked: boolean) => PromiseLike<void> | void
  onDeleteComment?: (commentId: string) => PromiseLike<void> | void
}

// ==================== 时间格式化（与文档 4.5 规则一致）====================
//+ 接受后端 "2026-07-31 10:00:00" 格式字符串，或 10位秒 / 13位毫秒 时间戳
function formatCommentTime(raw: string | number): string {
  let time: number
  if (typeof raw === 'number') {
    time = raw < 10000000000 ? raw * 1000 : raw
  } else {
    //+ 兼容 YYYY-MM-DD HH:mm:ss
    time = new Date(raw.replace(/-/g, '/')).getTime()
  }
  if (!Number.isFinite(time)) return ''
  const now = Date.now()
  const diff = now - time

  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  //+ 昨天几点
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = startOfToday.getTime() - 24 * 60 * 60 * 1000
  if (time >= startOfYesterday && time < startOfToday.getTime()) {
    const h = String(new Date(time).getHours()).padStart(2, '0')
    const m = String(new Date(time).getMinutes()).padStart(2, '0')
    return `昨天${h}:${m}`
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const currentYear = new Date(now).getFullYear()
  return year === currentYear ? `${month}-${day}` : `${year}-${month}-${day}`
}

// ==================== 本地静态 Mock 数据（文档要求）====================
//+ 文档要求"局部静态数据填充"，此处封装成函数便于替换为后端拉取
function getStaticMock(): Comment[] {
  const _now = Date.now()
  const minutes = (m: number) => new Date(_now - m * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
  return [
    {
      id: 'c1',
      member: { id: 'u1', nickname: '跑步酱', avatar: 'https://picsum.photos/seed/u1/80/80' },
      content: '千岛湖环线太美了！请问租车方便吗？',
      likeCount: 12,
      isLiked: false,
      replyToId: null,
      replyToName: null,
      createdAt: minutes(40),
      canDelete: false,
      replies: [
        {
          id: 'c1-1',
          member: { id: 'u2', nickname: '山林旅人', avatar: 'https://picsum.photos/seed/u2/80/80' },
          content: '千岛湖镇上租车很方便，提前在平台预订就好',
          likeCount: 3,
          isLiked: false,
          replyToId: 'c1',
          replyToName: null,
          createdAt: minutes(38),
          canDelete: true
        },
        {
          id: 'c1-2',
          member: { id: 'u3', nickname: '露营达人Lisa', avatar: 'https://picsum.photos/seed/u3/80/80' },
          content: '推荐电动车，骑起来不累，环湖公路有专门慢行道',
          likeCount: 1,
          isLiked: false,
          replyToId: 'c1',
          replyToName: null,
          createdAt: minutes(35),
          canDelete: false
        },
        {
          id: 'c1-3',
          member: { id: 'u4', nickname: '骑行发烧友', avatar: 'https://picsum.photos/seed/u4/80/80' },
          content: '请问电动车续航够吗？一天能骑完吗？',
          likeCount: 0,
          isLiked: false,
          replyToId: 'c1',
          replyToName: '露营达人Lisa',
          createdAt: minutes(30),
          canDelete: false
        },
        {
          id: 'c1-4',
          member: { id: 'u5', nickname: '跑步达人', avatar: 'https://picsum.photos/seed/u5/80/80' },
          content: '如果体力可以的话，公路车更自由，一天骑80公里没问题',
          likeCount: 2,
          isLiked: false,
          replyToId: 'c1',
          replyToName: null,
          createdAt: minutes(25),
          canDelete: false
        },
        {
          id: 'c1-5',
          member: { id: 'u6', nickname: '自驾游侠', avatar: 'https://picsum.photos/seed/u6/80/80' },
          content: '上周刚去，我租的是SUV，带着折叠自行车，开到哪里骑到哪里',
          likeCount: 5,
          isLiked: true,
          replyToId: 'c1',
          replyToName: null,
          createdAt: minutes(10),
          canDelete: false
        }
      ]
    },
    {
      id: 'c2',
      member: { id: 'u7', nickname: '攀岩玩家', avatar: 'https://picsum.photos/seed/u7/80/80' },
      content: '图片拍得真好，是用什么相机拍的？',
      likeCount: 2,
      isLiked: false,
      replyToId: null,
      replyToName: null,
      createdAt: minutes(5),
      canDelete: true,
      replies: [
        {
          id: 'c2-1',
          member: { id: 'u8', nickname: '溯溪探索者', avatar: 'https://picsum.photos/seed/u8/80/80' },
          content: '同问，色彩真的很通透',
          likeCount: 0,
          isLiked: false,
          replyToId: 'c2',
          replyToName: null,
          createdAt: minutes(3),
          canDelete: false
        }
      ]
    },
    {
      id: 'c3',
      member: { id: 'u9', nickname: '登山爱好者', avatar: 'https://picsum.photos/seed/u9/80/80' },
      content: '求一下路线图和住宿推荐！打算这个周末去',
      likeCount: 4,
      isLiked: true,
      replyToId: null,
      replyToName: null,
      createdAt: minutes(2),
      canDelete: false,
      replies: []
    }
  ]
}

// ==================== 主组件 ====================

const DEFAULT_VISIBLE_REPLIES = 2

const CommentSection = (props: CommentSectionProps) => {
  const {
    initData,
    onRequestReply,
    externalNewComment,
    onToggleCommentLike,
    onDeleteComment,
  } = props

  // ---------- 状态 ----------
  //+ 评论列表：一级评论 + replies 数组（二级）
  const [comments, setComments] = useState<Comment[]>(initData?.length ? initData : getStaticMock())

  //+ 记录 externalNewComment 上次已消费的 id，避免 useEffect 重复追加
  const lastAppendIdRef = useRef<string | null>(null)

  //+ 一级评论的"展开/收起"状态：key=parentId，true=展开全部
  const [expandMap, setExpandMap] = useState<Record<string, boolean>>({})

  //+ 删除确认弹层：长按评论后显示
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    /** 父评论 id，若为一级评论则 null */
    parentId: string | null
  } | null>(null)

  // ---------- 派生 ----------
  //+ 总评论数：一级 + 所有二级
  const totalCount = useMemo(
    () => comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0),
    [comments]
  )

  // ---------- 副作用：接收父组件传入的新评论并追加 ----------
  useEffect(() => {
    if (!externalNewComment) return
    if (externalNewComment.id === lastAppendIdRef.current) return //+ 防止重复消费同一个
    lastAppendIdRef.current = externalNewComment.id

    setComments(prev => {
      if (!externalNewComment.replyToId) {
        //+ 新的一级评论 → 放最前
        return [externalNewComment, ...prev]
      }
      //+ 回复二级/一级 → 追加到对应父评论 replies 尾部
      //+ parentCommentId 的判定：通过 comment.replyToId 对应项拿到一级 ID
      //+ 策略：replyToId 对应评论若是一级 → parentId = replyToId；若是二级 → 找到其所在一级
      let parentId: string | null = null
      for (const p of prev) {
        if (p.id === externalNewComment.replyToId) { parentId = p.id; break }
        if (p.replies?.some(r => r.id === externalNewComment.replyToId)) { parentId = p.id; break }
      }
      if (!parentId) return [externalNewComment, ...prev] //+ 兜底作为一级
      return prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), externalNewComment] } : c)
    })
  }, [externalNewComment])

  // ---------- 工具：本地更新 ----------
  //+ 更新某条评论（一级或二级），返回新数组（不可变）
  const updateOne = useCallback((list: Comment[], id: string, patch: Partial<Comment> | ((c: Comment) => Comment)): Comment[] => {
    return list.map(c => {
      if (c.id === id) {
        return typeof patch === 'function' ? patch(c) : { ...c, ...patch }
      }
      if (c.replies?.length) {
        return { ...c, replies: c.replies.map(r => r.id === id ? (typeof patch === 'function' ? patch(r) : { ...r, ...patch }) : r) }
      }
      return c
    })
  }, [])

  // ---------- 交互：单条评论点赞 ----------
  const handleToggleCommentLike = useCallback(async (c: Comment) => {
    const nextLiked = !c.isLiked
    const nextCount = c.likeCount + (nextLiked ? 1 : -1)
    //+ 乐观更新
    setComments(prev => updateOne(prev, c.id, { isLiked: nextLiked, likeCount: nextCount }))
    try {
      await onToggleCommentLike?.(c.id, nextLiked)
    } catch (e) {
      //+ 后端失败 → 回滚
      setComments(prev => updateOne(prev, c.id, { isLiked: !nextLiked, likeCount: c.likeCount }))
      Taro.showToast({ title: '点赞失败', icon: 'none' })
    }
  }, [onToggleCommentLike, updateOne])

  // ---------- 交互：长按删除 ----------
  const handleLongPress = useCallback((c: Comment, parentId: string | null) => {
    if (!c.canDelete) return
    setDeleteTarget({ id: c.id, parentId })
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    const { id, parentId } = deleteTarget
    //+ 乐观移除
    setComments(prev => {
      if (!parentId) {
        //+ 删除一级评论 → 同时移除其下所有二级
        return prev.filter(c => c.id !== id)
      }
      //+ 删除二级评论
      return prev.map(c => c.id === parentId && c.replies ? { ...c, replies: c.replies.filter(r => r.id !== id) } : c)
    })
    setDeleteTarget(null)
    Taro.showToast({ title: '删除成功', icon: 'none' })
    try {
      await onDeleteComment?.(id)
    } catch (e) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
      //+ 回滚：真实项目此处建议重新拉取列表，简单起见此处省略
    }
  }, [deleteTarget, onDeleteComment])

  // ---------- 交互：点击回复按钮 → 通知父组件切换 CommentInput 为回复模式 ----------
  const handleOpenReply = useCallback((c: Comment, parentCommentId: string | null) => {
    onRequestReply?.({
      parentCommentId,
      replyToId: c.id,
      replyToName: c.member.nickname
    })
  }, [onRequestReply])

  // ---------- 交互：展开/收起二级评论 ----------
  const toggleExpand = useCallback((parentId: string) => {
    setExpandMap(prev => ({ ...prev, [parentId]: !prev[parentId] }))
  }, [])

  // ---------- 离开页面 → 关闭弹层（防止路由栈残留）----------
  useDidHide(() => {
    setDeleteTarget(null)
  })

  // ---------- 渲染：单条评论（一级/二级共用，通过 level 控制缩进/昵称格式）----------
  const renderComment = (c: Comment, level: 1 | 2, parentId: string | null) => {
    //+ 二级评论昵称格式：A @ B（replyToName 存在时）
    const nicknameRender = level === 2
      ? (
          <div className='comment-nickname'>
            <span className='nickname-self'>{c.member.nickname}</span>
            {c.replyToName && (
              <>
                <span className='nickname-at'> @ </span>
                <span className='nickname-target'>{c.replyToName}</span>
              </>
            )}
          </div>
        )
      : <div className='comment-nickname'>{c.member.nickname}</div>

    return (
      <View
        key={c.id}
        className={`comment-item comment-level-${level}`}
        onLongPress={() => handleLongPress(c, parentId)}
      >
        {/* 头像 */}
        <div className='comment-avatar'>
          <Avatar url={c.member.avatar} size='32' />
        </div>

        {/* 右侧内容 */}
        <div className='comment-right'>
          {nicknameRender}
          <div className='comment-content'>{c.content}</div>
          <div className='comment-meta'>
            <span className='comment-time'>{formatCommentTime(c.createdAt)}</span>
            <span className='comment-reply-btn' onClick={() => handleOpenReply(c, level === 1 ? c.id : parentId)}>
              回复
            </span>
            <span className='comment-like' onClick={() => handleToggleCommentLike(c)}>
              <span className={`like-icon ${c.isLiked ? 'liked' : ''}`}>
                {c.isLiked ? '❤' : '♡'}
              </span>
              <span className='like-count'>{c.likeCount || ''}</span>
            </span>
          </div>
        </div>
      </View>
    )
  }

  // ---------- 渲染：一级评论 + 二级 + 展开收起 ----------
  const renderLevel1 = (parent: Comment) => {
    const allReplies = parent.replies || []
    const expanded = !!expandMap[parent.id]
    const visibleReplies = expanded
      ? allReplies
      : allReplies.slice(0, DEFAULT_VISIBLE_REPLIES)
    const hasMore = allReplies.length > DEFAULT_VISIBLE_REPLIES
    const hasEverExpanded = expandMap[parent.id] === true //+ 首次展开后才显示"收起"

    return (
      <div key={parent.id} className='comment-level1-wrap'>
        {renderComment(parent, 1, null)}

        {/* 二级评论 */}
        {visibleReplies.length > 0 && (
          <div className='comment-replies-wrap'>
            {visibleReplies.map(r => renderComment(r, 2, parent.id))}
          </div>
        )}

        {/* 展开/收起控制 */}
        {hasMore && (
          <div className='comment-expand-row'>
            <span className='comment-expand-line'></span>
            {!hasEverExpanded ? (
              <span className='comment-expand-btn' onClick={() => toggleExpand(parent.id)}>
                展示更多
                  <ArrowDown className='comment-expand-icon'/>
                
              </span>
            ) : expanded ? (
              <span className='comment-expand-btn' onClick={() => toggleExpand(parent.id)}>
                收起<ArrowUp className='comment-expand-icon'/>
              </span>
            ) : (
              <span className='comment-expand-btn' onClick={() => toggleExpand(parent.id)}>
                展示更多<ArrowDown className='comment-expand-icon'/>
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='comment-section'>
      {/* 4.1 标题 */}
      <div className='comment-title'>评论（{totalCount}）</div>

      {/* 评论列表 */}
      <div className='comment-list'>
        {comments.length === 0 && (
          <div className='comment-empty'>暂无评论，说点什么吧~</div>
        )}
        {comments.map(renderLevel1)}
      </div>

      {/* 删除确认弹层 */}
      {deleteTarget && (
        <div className='delete-modal' onClick={() => setDeleteTarget(null)}>
          <div className='delete-panel' onClick={(e) => e.stopPropagation()}>
            <div className='delete-title'>确认删除该评论？</div>
            <div className='delete-sub'>删除后无法恢复，一级评论下的所有子评论都会删除</div>
            <div className='delete-actions'>
              <Button className='delete-cancel-btn' onClick={() => setDeleteTarget(null)} block>取消</Button>
              <Button className='delete-confirm-btn' type='primary' onClick={handleConfirmDelete} block>删除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentSection
