//+ FollowList 关注列表页
//+ 结构：HeaderNavBar（无取消文字，固定头部） + 关注列表 + 关注按钮切换
//+ 标签使用习惯：NutUI Button + 原生 HTML（div/img/span）
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Button } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import Avatar from '@/components/Avatar'
import type { UserPublic } from '@/types'
import './index.less'

//+ 生成静态用户数据
const generateUsers = (): UserPublic[] => {
  const nicknames = ['山野清风', '星空漫步者', '户外小猫', '登山阿明', '骑行追风', '露营少女', '攀岩老王', '跑者阿杰']
  const bios = ['热爱户外，享受自然', '周末徒步爱好者', '一个喜欢露营的女孩子', '登山十年，足迹遍布全国', '环华骑行进行中', '美食露营两不误', '攀岩教练，欢迎约课', '半马选手，配速530']
  return nicknames.map((name, i) => ({
    id: `u-${i + 1}`,
    phone: '',
    nickname: name,
    avatar: `https://picsum.photos/100?random=${20 + i}`,
    bio: bios[i],
    bgImg: `https://picsum.photos/400/200?random=${30 + i}`,
    memberType: 1,
    publishCount: Math.floor(Math.random() * 50) + 1,
    followCount: Math.floor(Math.random() * 200) + 10,
    fansCount: Math.floor(Math.random() * 500) + 50,
    //+ 关注状态：一半已关注一半未关注
    isFollowed: i % 2 === 0,
  }))
}

const staticFollowList = generateUsers()

const FollowList = () => {
  const [list, setList] = useState<UserPublic[]>(staticFollowList)

  //+ 切换关注状态
  const handleToggleFollow = (e: any, id: string, currentStatus: boolean) => {
    e.stopPropagation()
    //+ 乐观更新
    setList(prev => prev.map(user =>
      user.id === id ? { ...user, isFollowed: !currentStatus } : user
    ))
    //+ 后期对接接口
    const text = currentStatus ? '已取消关注' : '关注成功'
    Taro.showToast({ title: text, icon: 'success' })
  }

  //+ 点击用户项：跳转个人主页（暂未开发）
  const handleUserClick = (user: UserPublic) => {
    //+ 后期跳转对应用户主页
    Taro.showToast({ title: `查看 ${user.nickname}`, icon: 'none' })
  }

  return (
    <div className="follow-list-page">
      <HeaderNavBar title="关注" fixed={true} cancel={false} />

      <div className="list-wrapper">
        {list.length === 0 ? (
          <div className="empty-state">还没有关注的人</div>
        ) : (
          list.map(user => (
            <div key={user.id} className="user-item" onClick={() => handleUserClick(user)}>
              <Avatar url={user.avatar} size="80" />
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
      </div>
    </div>
  )
}

export default FollowList
