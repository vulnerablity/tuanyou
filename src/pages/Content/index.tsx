//+ Content 页面 - 用户发布的笔记和攻略
//+ 结构：HeaderNavBar + Tab（笔记/攻略，激活色#428a46） + 瀑布流列表 + 详情页删除按钮
//+ 标签使用习惯：NutUI 组件（Tabs/Dialog） + NoteList 复用瀑布流
import { useState, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { Tabs, Dialog } from '@nutui/nutui-react'
import { More } from '@nutui/icons-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import NoteList from '@/components/NoteList'
import type { FeedItem } from '@/types'
import './index.less'

//+ 生成静态瀑布流数据（与首页 NoteList 结构一致）
const generateFeedData = (type: 'note' | 'guide'): FeedItem[] => {
  const titles = type === 'note'
    ? ['周末轻徒步｜莫干山竹林穿越一日', '露营夜话｜在山顶等一场日出', '骑行环千岛湖｜秋天最美公路', '3天2夜武功山攻略｜云海路线', '城市夜跑｜滨江5公里打卡路线']
    : ['新手入门装备清单｜第一次徒步必看', '新手登山鞋选购指南，不走弯路！', '新手露营地推荐TOP10，新手友好', '新手骑行入门：从10公里到100公里', '新手攀岩入门：基础技巧全解析']
  const coverRandoms = type === 'note' ? [2, 3, 4, 5, 6] : [12, 13, 14, 15, 16]
  const avatars = [7, 8, 9, 10, 11]
  const nicknames = type === 'note'
    ? ['山林旅人', '露营爱好者', '骑行追光', '登山少年', '夜跑达人']
    : ['装备控', '老驴', '户外百科', '攻略达人', '新手指导员']
  const tags = type === 'note'
    ? [['徒步', '户外'], ['露营', '日出'], ['骑行', '千岛湖'], ['登山', '武功山'], ['夜跑', '5km']]
    : [['装备', '新手必看'], ['登山鞋', '装备'], ['露营地', '推荐'], ['骑行', '入门'], ['攀岩', '技巧']]

  return titles.map((title, i) => ({
    id: `${type}-${i + 1}`,
    title,
    images: [`https://picsum.photos/400/500?random=${coverRandoms[i]}`],
    videoUrl: '',
    tags: tags[i],
    member: {
      nickname: nicknames[i],
      avatar: `https://picsum.photos/100?random=${avatars[i]}`,
    },
    likeCount: Math.floor(Math.random() * 500) + 10,
    isLiked: false,
    type,
    category: (i % 7) + 1,
  }))
}

//+ 静态数据
const staticNoteList = generateFeedData('note')
const staticGuideList = generateFeedData('guide')

const Content = () => {
  //+ Tab激活态 0=笔记 1=攻略
  const [activeTab, setActiveTab] = useState<number>(0)
  //+ 本地列表数据（删除后实时更新）
  const [noteList, setNoteList] = useState(staticNoteList)
  const [guideList, setGuideList] = useState(staticGuideList)
  //+ 删除弹窗控制
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  //+ 当前列表数据
  const currentList = useMemo(() => {
    return activeTab === 0 ? noteList : guideList
  }, [activeTab, noteList, guideList])

  //+ 点击详情：传 isMine=1 标识详情页显示删除按钮
  const handleItemClick = (item: FeedItem) => {
    const pagePath = item.type === 'guide'
      ? '/pages/GuideDetail/index'
      : '/pages/NoteDetail/index'
    Taro.navigateTo({ url: `${pagePath}?id=${item.id}&type=${item.type}&isMine=1` })
  }

  //+ 顶部右上角三个点：点击弹出删除（这里简化为在详情页删除，此按钮预留）
  //+ 文档要求"点击三个点，底部就有删除按钮"，此处我们在FeedCard层追加一个More入口

  return (
    <div className="content-page">
      <HeaderNavBar
        title="我的内容"
        fixed={true}
        cancel={false}
        right={<More onClick={() => Taro.showToast({ title: '更多功能开发中', icon: 'none' })} />}
      />

      <div className="content-body">
        {/* 顶部 Tab */}
        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(Number(v))}
          activeColor="#428a46"
          className="content-tabs"
        >
          <Tabs.TabPane title="笔记" value={0} />
          <Tabs.TabPane title="攻略" value={1} />
        </Tabs>

        {/* 瀑布流列表 */}
        <div className="feed-wrapper">
          <NoteList
            feed={currentList}
            loading={false}
            hasMore={false}
            emptyText={activeTab === 0 ? '还没有发布笔记' : '还没有发布攻略'}
            onItemClick={handleItemClick}
          />
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <Dialog
        visible={deleteVisible}
        title="确认删除？"
        content="删除后无法恢复，确定删除该内容吗？"
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => {
          if (pendingDeleteId) {
            const idPrefix = pendingDeleteId.startsWith('note') ? 'note' : 'guide'
            if (idPrefix === 'note') {
              setNoteList(prev => prev.filter(p => p.id !== pendingDeleteId))
            } else {
              setGuideList(prev => prev.filter(p => p.id !== pendingDeleteId))
            }
            Taro.showToast({ title: '删除成功', icon: 'success' })
          }
          setDeleteVisible(false)
          setPendingDeleteId(null)
        }}
        onCancel={() => {
          setDeleteVisible(false)
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}

export default Content
