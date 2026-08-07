//+ FollowList 关注列表页
//+ 结构：HeaderNavBar（无取消文字，固定头部） + 关注列表 + 关注按钮切换
//+ 标签使用习惯：NutUI Button + 原生 HTML（div/img/span）
import { useState, useCallback, useRef } from 'react'
import { useDispatch } from 'react-redux'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import Avatar from '@/components/Avatar'
import { fetchFollowList } from '@/store/modules/profile'
import type { FollowItem, UserPublic } from '@/types'
import type { AppDispatch } from '@/store'
import './index.less'

//+ 将 FollowItem 转换为 UserPublic（供组件渲染使用）
//+ 后端用 followeeId/followerId 标识关系，前端统一用 id
const toUserPublic = (item: FollowItem): UserPublic => {
  return {
    id: item.followeeId,
    phone: '',
    nickname: item.nickname,
    avatar: item.avatar,
    bio: item.bio,
    bgImg: '',
    memberType: 1,
    publishCount: 0,
    followCount: 0,
    fansCount: 0,
    isFollowed: item.isFollowed
  }
}

const FollowList = () => {
  const dispatch: AppDispatch = useDispatch()
  const [list, setList] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(1)
  const sizeRef = useRef(10)

  //+ 加载数据
  const loadData = useCallback(async (page: number = 1, append: boolean = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res: any = await dispatch(fetchFollowList({ page, size: sizeRef.current }))
      if (res.meta.requestStatus === 'fulfilled') {
        const data = res.payload
        const newItems: UserPublic[] = (data.list || []).map(toUserPublic)
        setList(prev => append ? [...prev, ...newItems] : newItems)
        pageRef.current = data.page
        setHasMore(data.page < data.total_page)
      }
    } catch (e) {
      console.error('加载关注列表失败:', e)
    } finally {
      setLoading(false)
    }
  }, [dispatch, loading])

  //+ 页面显示时加载第一页
  useDidShow(() => {
    loadData(1, false)
  })

  //+ 加载更多
  const handleLoadMore = () => {
    if (!hasMore || loading) return
    loadData(pageRef.current + 1, true)
  }

  //+ 切换关注状态（乐观更新）
  const handleToggleFollow = (e: any, id: string, currentStatus: boolean) => {
    e.stopPropagation()
    setList(prev => prev.map(user =>
      user.id === id ? { ...user, isFollowed: !currentStatus } : user
    ))
    //+ 后期对接关注/取消关注接口
    const text = currentStatus ? '已取消关注' : '关注成功'
    Taro.showToast({ title: text, icon: 'success' })
  }

  //+ 点击用户项：跳转个人主页（暂未开发）
  const handleUserClick = (user: UserPublic) => {
    Taro.showToast({ title: `查看 ${user.nickname}`, icon: 'none' })
  }

  return (
    <div className="follow-list-page">
      <HeaderNavBar title="关注" fixed={false} cancel={false} />

      <div className="list-wrapper">
        {list.length === 0 && !loading ? (
          <div className="empty-state">还没有关注的人</div>
        ) : (
          list.map(user => (
            <div key={user.id} className="user-item" onClick={() => handleUserClick(user)}>
              <Avatar url={user.avatar} size="35" />
              <div className="user-info">
                <span className="user-nickname">{user.nickname}</span>
                <span className="user-bio">{user.bio}</span>
              </div>
              <Button
                className={`follow-btn ${user.isFollowed ? 'followed' : ''}`}
                type={user.isFollowed ? 'default' : 'primary'}
                size="small"
                onClick={(e) => handleToggleFollow(e, user.id, !!user.isFollowed)}
              >
                {user.isFollowed ? '已关注' : '关注'}
              </Button>
            </div>
          ))
        )}
        
        {/* 加载更多 */}
        {hasMore && list.length > 0 && (
          <div className="load-more" onClick={handleLoadMore}>
            {loading ? '加载中...' : '加载更多'}
          </div>
        )}
        {!hasMore && list.length > 0 && (
          <div className="no-more">已加载全部</div>
        )}
      </div>
    </div>
  )
}

export default FollowList
