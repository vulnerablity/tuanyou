//+ Content 页面 - 用户发布的笔记和攻略
//+ 结构：HeaderNavBar + Tab（笔记/攻略，激活色#428a46） + 瀑布流列表 + 详情页删除按钮
//+ 标签使用习惯：NutUI 组件（Tabs/Dialog） + NoteList 复用瀑布流
import { useState, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Tabs, Dialog } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import NoteList from '@/components/NoteList'
import { fetchProfileNotes, fetchProfileStrategys } from '@/store/modules/profile'
import type { FeedItem, ProfilePostItem } from '@/types'
import type { RootState, AppDispatch } from '@/store'
import './index.less'

//+ 将 ProfilePostItem 转换为 NoteList 所需的 FeedItem
//+ 后端返回的 type: 'strategy' 需转为 FeedItem 的 'guide'
const toFeedItem = (item: ProfilePostItem): FeedItem => {
  return {
    id: item.id,
    title: item.title,
    images: [item.coverImg],
    videoUrl: '',
    tags: item.tag ? [item.tag] : [],
    member: {
      nickname: item.author.nickname,
      avatar: item.author.avatar
    },
    likeCount: item.likeCount,
    isLiked: item.isLiked,
    type: item.type === 'strategy' ? 'guide' : item.type
  }
}

const Content = () => {
  const dispatch: AppDispatch = useDispatch()
  //+ Tab激活态 0=笔记 1=攻略
  const [activeTab, setActiveTab] = useState<number>(0)
  //+ 删除弹窗控制
  const [deleteVisible, setDeleteVisible] = useState(false)

  //+ 从 profile store 获取笔记和攻略列表
  const { notes, strategys } = useSelector((state: RootState) => state.profile)

  //+ 加载首页数据
  const loadFirstPage = useCallback(() => {
    dispatch(fetchProfileNotes({ page: 1, size: 10 }))
    dispatch(fetchProfileStrategys({ page: 1, size: 10 }))
  }, [dispatch])

  //+ 页面显示时加载数据
  useDidShow(() => {
    loadFirstPage()
  })

  //+ 下拉刷新
  usePullDownRefresh(() => {
    loadFirstPage()
    Taro.stopPullDownRefresh()
  })

  //+ 当前列表数据（转成 FeedItem 格式供 NoteList 使用）
  const currentList = useMemo(() => {
    const rawList = activeTab === 0 ? notes.list : strategys.list
    return rawList.map(toFeedItem)
  }, [activeTab, notes.list, strategys.list])

  //+ 当前 Tab 的加载/分页状态
  const currentLoading = activeTab === 0 ? notes.loading : strategys.loading
  const currentHasMore = activeTab === 0 ? notes.hasMore : strategys.hasMore

  //+ 加载更多
  const handleLoadMore = useCallback(() => {
    if (currentLoading || !currentHasMore) return
    if (activeTab === 0) {
      dispatch(fetchProfileNotes({ page: notes.page + 1, size: 10 }))
    } else {
      dispatch(fetchProfileStrategys({ page: strategys.page + 1, size: 10 }))
    }
  }, [activeTab, currentLoading, currentHasMore, notes.page, strategys.page, dispatch])

  //+ 点击详情：传 isMine=1 标识详情页显示删除按钮
  const handleItemClick = (item: FeedItem) => {
    const pagePath = item.type === 'guide'
      ? '/pages/GuideDetail/index'
      : '/pages/NoteDetail/index'
    Taro.navigateTo({ url: `${pagePath}?id=${item.id}&type=${item.type}&isMine=1` })
  }

  //+ Tab 切换时重置对应列表的加载状态
  const handleTabChange = (v: number) => {
    setActiveTab(Number(v))
  }

  return (
    <div className="content-page">
      <HeaderNavBar
        title="我的内容"
        fixed={false}
        cancel={false}
      />

      <div className="content-body">
        {/* 顶部 Tab */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          activeColor="#428a46"
          className="content-tabs"
          activeType="card"
        >
          <Tabs.TabPane title="笔记" value={0} />
          <Tabs.TabPane title="攻略" value={1} />
        </Tabs>

        {/* 瀑布流列表 */}
        <div className="feed-wrapper">
          <NoteList
            feed={currentList}
            loading={currentLoading && currentList.length === 0}
            hasMore={currentHasMore}
            emptyText={activeTab === 0 ? '还没有发布笔记' : '还没有发布攻略'}
            onItemClick={handleItemClick}
            onLoadMore={handleLoadMore}
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
          //+ 本地模拟删除，真实删除需对接后端接口
          //+ 暂未实现删除接口，此处仅关闭弹窗
          setDeleteVisible(false)
          Taro.showToast({ title: '删除功能开发中', icon: 'none' })
        }}
        onCancel={() => {
          setDeleteVisible(false)
        }}
      />
    </div>
  )
}

export default Content
