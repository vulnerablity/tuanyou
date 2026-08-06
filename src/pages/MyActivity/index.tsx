//+ MyActivity 我的活动页
//+ 结构：HeaderNavBar + Tabs（我发布的 / 我参与的，激活色#428a46） + 活动卡片列表
//+ 卡片复用 components/ActivityCard，渲染逻辑与活动列表页保持一致
import { useState, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import ActivityCard from '@/components/ActivityCard'
import type { ActivityListItem } from '@/types'
import './index.less'

//+ 生成活动数据（符合 ActivityListItem 类型）
const generateActivities = (mode: 'publish' | 'join'): ActivityListItem[] => {
  const publishTitles = [
    '武功山云海露营2天1夜',
    '婺源篁岭晒秋徒步一日',
    '莫干山竹海徒步（亲子友好）',
    '临安天目山古道穿越',
  ]
  const joinTitles = [
    '黄山日出徒步2天1夜',
    '安吉天荒坪露营观星',
    '千岛湖骑行环湖一日',
    '九溪十八涧徒步（新手线）',
    '龙王山登顶看云海',
  ]
  const titles = mode === 'publish' ? publishTitles : joinTitles
  const categories = ['徒步', '露营', '骑行', '登山', '溯溪']
  const statuses = ['报名中', '进行中', '已结束'] as const
  const difficulties = ['入门', '中等', '中等', '中高等', '高等']
  const addresses = mode === 'publish'
    ? ['萍乡市·武功山', '上饶市·婺源篁岭', '湖州市·莫干山', '杭州市·临安天目山']
    : ['黄山市·黄山风景区', '湖州市·安吉天荒坪', '杭州市·千岛湖', '杭州市·九溪', '湖州市·龙王山']

  return titles.map((title, i) => ({
    id: `act-${mode}-${i + 1}`,
    title,
    coverImg: `https://picsum.photos/400/250?random=${200 + i + (mode === 'join' ? 30 : 0)}`,
    category: categories[i % categories.length],
    address: addresses[i],
    startTime: `2026-09-${String(10 + i).padStart(2, '0')} 07:30`,
    endTime: `2026-09-${String(11 + i).padStart(2, '0')} 18:00`,
    signUpEnd: `2026-09-${String(8 + i).padStart(2, '0')} 23:59`,
    maxPeople: 10 + i * 5,
    currentPeople: Math.min(8 + i * 4, 10 + i * 5),
    price: [0, 99, 150, 198, 288][i],
    difficulty: difficulties[i],
    activityStatus: statuses[i % statuses.length],
    //+ 我参与的：已报名=true；我发布的：joined 沿用默认 false（发布者本身不展示报名态）
    joined: mode === 'join',
    leader: {
      id: mode === 'publish' ? 'me' : `leader-${i + 1}`,
      nickname: mode === 'publish' ? '我' : ['老驴户外', '安吉向导', '骑行队长', '九溪领队', '龙王登山'][i],
      avatar: `https://picsum.photos/100?random=${250 + i + (mode === 'join' ? 50 : 0)}`,
    },
  }))
}

const staticPublished = generateActivities('publish')
const staticJoined = generateActivities('join')

const MyActivity = () => {
  //+ Tab: 0=我发布的 1=我参与的
  const [activeTab, setActiveTab] = useState(0)
  const [published] = useState(staticPublished)
  const [joined] = useState(staticJoined)

  const currentList = useMemo(() => {
    return activeTab === 0 ? published : joined
  }, [activeTab, published, joined])

  //+ 点击卡片：跳转详情
  const handleCardClick = (activity: ActivityListItem) => {
    Taro.navigateTo({ url: `/pages/ActivityDetail/index?id=${activity.id}` })
  }

  //+ 点击报名：跳转详情页完成报名（与列表页一致）
  const handleSignup = (activity: ActivityListItem) => {
    Taro.navigateTo({ url: `/pages/ActivityDetail/index?id=${activity.id}` })
  }

  return (
    <div className="my-activity-page">
      <HeaderNavBar title="我的活动" fixed={false} cancel={false} />

      <div className="my-activity-body">
        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(Number(v))}
          activeColor="#428a46"
          className="my-activity-tabs"
        >
          <Tabs.TabPane title="我发布的" value={0} />
          <Tabs.TabPane title="我参与的" value={1} />
        </Tabs>

        <div className="my-activity-list">
          {currentList.length === 0 ? (
            <div className="empty-state">
              {activeTab === 0 ? '还没有发布活动' : '还没有参与任何活动'}
            </div>
          ) : (
            currentList.map(item => (
              <ActivityCard
                key={item.id}
                activity={item}
                onClick={handleCardClick}
                onSignup={handleSignup}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default MyActivity
