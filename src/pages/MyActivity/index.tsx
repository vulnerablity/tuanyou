//+ MyActivity 我的活动页
//+ 结构：HeaderNavBar + Tabs（我发布的 / 我参与的，激活色#428a46） + 活动卡片列表
//+ 活动卡片参考活动列表页布局：封面 + 标题 + 时间地点 + 状态标签 + 人数
import { useState, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import type { Activity } from '@/types'
import './index.less'

//+ 活动状态颜色映射
const STATUS_COLOR: Record<string, string> = {
  '报名中': '#2e7d32',
  '进行中': '#1976d2',
  '已结束': '#999',
}

//+ 生成活动数据
const generateActivities = (mode: 'publish' | 'join'): Activity[] => {
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
  const addresses = mode === 'publish'
    ? ['萍乡市·武功山', '上饶市·婺源篁岭', '湖州市·莫干山', '杭州市·临安天目山']
    : ['黄山市·黄山风景区', '湖州市·安吉天荒坪', '杭州市·千岛湖', '杭州市·九溪', '湖州市·龙王山']

  return titles.map((title, i) => ({
    id: `act-${mode}-${i + 1}`,
    title,
    coverImg: `https://picsum.photos/400/250?random=${200 + i + (mode === 'join' ? 30 : 0)}`,
    category: categories[i % categories.length],
    address: addresses[i],
    activityContent: `${title}活动内容...`,
    startTime: `2026-09-${String(10 + i).padStart(2, '0')} 07:30:00`,
    endTime: `2026-09-${String(11 + i).padStart(2, '0')} 18:00:00`,
    signUpStart: `2026-08-01 00:00:00`,
    signUpEnd: `2026-09-${String(8 + i).padStart(2, '0')} 23:59:00`,
    maxPeople: 10 + i * 5,
    currentPeople: Math.min(8 + i * 4, 10 + i * 5),
    price: [0, 99, 150, 198, 288][i],
    difficulty: ['入门', '中等', '中等', '中高等', '高等'][i],
    activityStatus: statuses[i % statuses.length],
    joined: mode === 'join',
    leader: {
      id: mode === 'publish' ? 'me' : `leader-${i + 1}`,
      nickname: mode === 'publish' ? '我' : ['老驴户外', '安吉向导', '骑行队长', '九溪领队', '龙王登山'][i],
      avatar: `https://picsum.photos/100?random=${250 + i + (mode === 'join' ? 50 : 0)}`,
    },
    members: [],
  }))
}

const staticPublished = generateActivities('publish')
const staticJoined = generateActivities('join')

//+ 单张活动卡片
const ActivityCard = ({
  item,
  onClick,
}: {
  item: Activity
  onClick: () => void
}) => {
  const progressPercent = Math.min((item.currentPeople / item.maxPeople) * 100, 100)
  const statusColor = STATUS_COLOR[item.activityStatus as string ] || '#999'

  return (
    <div className="my-activity-card" onClick={onClick}>
      <div className="card-cover">
        <img src={item.coverImg} alt={item.title} />
        {/* 状态标签 */}
        <div className="card-status" style={{ backgroundColor: statusColor }}>
          {item.activityStatus}
        </div>
        {/* 分类标签 */}
        <div className="card-category">{item.category}</div>
      </div>
      <div className="card-content">
        <div className="card-title">{item.title}</div>
        <div className="card-info">
          <span className="info-row">
            <span className="info-icon">📍</span>
            {item.address}
          </span>
          <span className="info-row">
            <span className="info-icon">🕒</span>
            {item.startTime.slice(0, 16).replace('T', ' ')}
          </span>
        </div>
        <div className="card-footer">
          <div className="progress">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="footer-bottom">
            <span className="people-text">
              已报 {item.currentPeople}/{item.maxPeople}
            </span>
            <span className="price-text">
              {item.price === 0 ? '免费' : `¥${item.price}/人`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const MyActivity = () => {
  //+ Tab: 0=我发布的 1=我参与的
  const [activeTab, setActiveTab] = useState(0)
  const [published] = useState(staticPublished)
  const [joined] = useState(staticJoined)

  const currentList = useMemo(() => {
    return activeTab === 0 ? published : joined
  }, [activeTab, published, joined])

  const handleItemClick = (item: Activity) => {
    Taro.navigateTo({ url: `/pages/ActivityDetail/index?id=${item.id}` })
  }

  return (
    <div className="my-activity-page">
      <HeaderNavBar title="我的活动" fixed={true} cancel={false} />

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

        <div className="activity-list">
          {currentList.length === 0 ? (
            <div className="empty-state">
              {activeTab === 0 ? '还没有发布活动' : '还没有参与任何活动'}
            </div>
          ) : (
            currentList.map(item => (
              <ActivityCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default MyActivity
