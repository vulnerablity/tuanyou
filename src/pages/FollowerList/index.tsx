//+ FollowerList 粉丝列表页（结构与关注列表一致）
//+ 结构：HeaderNavBar（无取消文字，固定头部） + 粉丝列表 + 关注/已关注按钮切换
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Button } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import Avatar from '@/components/Avatar'
import type { UserPublic } from '@/types'
//+ 复用 FollowList 的样式
import '../FollowList/index.less'

//+ 生成静态粉丝数据
const generateFansUsers = (): UserPublic[] => {
  const nicknames = ['追风少年', '山野过客', '徒步女孩', '山顶常客', '露营爱好者A', '骑行小王', '爱钓鱼的老李', '爬山的兔子', '星空仰望者']
  const bios = [
    '关注你好久了，求互关~',
    '从第一篇笔记开始关注你',
    '一起爬过武功山还记得吗',
    '打卡同款路线',
    '收藏了你全部攻略',
    '你的每篇笔记我都点赞！',
    '新手一枚，多指教',
    '下次户外组队求带',
    '同款装备握个爪',
  ]
  return nicknames.map((name, i) => ({
    id: `fan-${i + 1}`,
    phone: '',
    nickname: name,
    avatar: `https://picsum.photos/100?random=${40 + i}`,
    bio: bios[i],
    bgImg: `https://picsum.photos/400/200?random=${50 + i}`,
    memberType: 1,
    publishCount: Math.floor(Math.random() * 30),
    followCount: Math.floor(Math.random() * 150) + 5,
    fansCount: Math.floor(Math.random() * 300) + 20,
    //+ 粉丝：部分已回关，部分未回关
    isFollowed: i % 3 === 0,
  }))
}

const staticFansList = generateFansUsers()

const FollowerList = () => {
  const [list, setList] = useState<UserPublic[]>(staticFansList)

  //+ 切换回关状态
  const handleToggleFollow = (e: any, id: string, currentStatus: boolean) => {
    e.stopPropagation()
    setList(prev => prev.map(user =>
      user.id === id ? { ...user, isFollowed: !currentStatus } : user
    ))
    const text = currentStatus ? '已取消关注' : '回关成功'
    Taro.showToast({ title: text, icon: 'success' })
  }

  const handleUserClick = (user: UserPublic) => {
    Taro.showToast({ title: `查看 ${user.nickname}`, icon: 'none' })
  }

  return (
    <div className="follow-list-page">
      <HeaderNavBar title="粉丝" fixed={false} cancel={false} />

      <div className="list-wrapper">
        {list.length === 0 ? (
          <div className="empty-state">还没有粉丝哦</div>
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
                {user.isFollowed ? '已关注' : '回关'}
              </Button>
            </div>
          ))
        )}
      </div>

      
    </div>
  )
}

export default FollowerList
