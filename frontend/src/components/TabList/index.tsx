import { Tabbar, ActionSheet } from '@nutui/nutui-react'
import { IconFont } from '@nutui/icons-react'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { useSelector } from 'react-redux'
import { getMemberInfo } from '@/apis/user'
import { routerNavigateTo, routerSwitchTab } from '@/router'
import type { RootState } from '@/store'
//+ 阿里 iconfont 字符图标样式
import '@/assets/iconfont.css'
import './index.less'

//+ ActionSheet 发布动作选项（NutUI options 为索引签名类型，用 type 别名以获得隐式索引签名兼容性）
type PublishOption = { name: string }

//+ 发布动作面板选项（模块级常量，避免每次渲染重建）
const PUBLISH_OPTIONS: PublishOption[] = [
  { name: '发笔记' },
  { name: '写攻略' },
  { name: '发起活动' }
]

/** 路由页面名 → Tab 索引 映射
 *  用页面文件名（路径倒数第二段，小写）做匹配 */
const PAGE_NAME_TO_TAB_INDEX: Record<string, number> = {
  'home': 0,
  'activity': 1,
  'message': 3,
  'profile': 4,
}

/** 从 URL 路径推导应该高亮的 tab 索引
 *  优先用 window.location.pathname（H5 下最准确，刷新后仍正确）
 *  降级用 Taro.getCurrentPages */
function getCurrentTabIndex(): number {
  let path = ''

  //+ 1. 优先用 window.location.pathname（H5 刷新后仍准确）
  if (typeof window !== 'undefined' && window.location) {
    path = window.location.pathname || ''
  }

  //+ 2. pathname 为空时降级用 getCurrentPages
  if (!path) {
    try {
      const pages = Taro.getCurrentPages()
      if (pages.length > 0) {
        path = pages[pages.length - 1]?.route || ''
      }
    } catch (_) { /* ignore */ }
  }

  if (!path) return 0

  //+ 解析页面名：取路径最后一段非空部分
  //+ /pages/Activity/index → 'index'？不对，要取倒数第二段
  //+ /pages/Activity/index → ['','pages','activity','index'] → 倒数第二段 'activity'
  //+ /activity（别名）→ ['','activity'] → 倒数第二段 '' ，降级用最后一段 'activity'
  const normalized = path.toLowerCase().replace(/^\//, '').replace(/\/$/, '')
  const parts = normalized.split('/')
  let pageName = ''
  if (parts.length >= 2) {
    pageName = parts[parts.length - 2]
    //+ 如果倒数第二段是 'pages'，说明路径只有 'pages/index' 这种异常格式，取最后一段
    if (pageName === 'pages') {
      pageName = parts[parts.length - 1]
    }
  } else {
    //+ 路径只有一段（别名访问，如 /activity）
    pageName = parts[0] || ''
  }

  return PAGE_NAME_TO_TAB_INDEX[pageName] !== undefined
    ? PAGE_NAME_TO_TAB_INDEX[pageName]
    : 0
}

const TabList = () => {
  const [currentIndex, setCurrentIndex] = useState(() => getCurrentTabIndex())

  //+ TabBar 消息 tab 未读红点：与消息页面未读数联动
  const unreadTotal = useSelector((state: RootState) => state.message.unreadTotal)
  //+ badge 格式：>0 显示数字（>99 显示"99+"），=0 不显示
  const messageBadge = unreadTotal > 0 ? (unreadTotal > 99 ? '99+' : `${unreadTotal}`) : undefined


  const [isVisible, setIsVisible] = useState(false)
  //+ tab 切换：0/1/3/4 为 tabBar 页走 switchTab；2 为中间"+"打开发布面板
  const tabNavigate = (index: number) => {
    if (index === 0) {
      routerSwitchTab('HOME')
    } else if (index === 1) {
      routerSwitchTab('ACTIVITY_LIST')
    } else if (index === 2) {
      setIsVisible(true)
    } else if (index === 3) {
      routerSwitchTab('MESSAGE')
    } else if (index === 4) {
      routerSwitchTab('PROFILE')
    }
    setCurrentIndex(index)
  }

  const handleSelect = async (item: { name: string | boolean }) => {
    setIsVisible(false)
    // 根据 option name 跳转到对应的发布页
    switch (item.name) {
      case '发笔记':
        routerNavigateTo('PUBLISH_NOTE')
        break
      case '写攻略':
        routerNavigateTo('PUBLISH_GUIDE')
        break
      case '发起活动':
        //+ 实时调用通用接口 /member/info 判断角色，不依赖本地可能过期的 store
        //+ 领队可发布活动，普通会员拦截并提示；前端拦截 + 后端 403 双重保险
        await handlePublishActivity()
        break
    }
  }

  //+ 发布活动：实时请求 /member/info 获取 role 字段判断领队/会员
  //+ 请求期间 showLoading + mask 防止用户连点；失败兜底提示不跳转
  const handlePublishActivity = async () => {
    Taro.showLoading({ title: '判断中...', mask: true })
    try {
      const res = await getMemberInfo()
      Taro.hideLoading()
      if (res.role === '领队') {
        routerNavigateTo('PUBLISH_ACTIVITY')
      } else {
        Taro.showToast({ title: '仅领队可发布活动', icon: 'none' })
      }
    } catch {
      Taro.hideLoading()
      Taro.showToast({ title: '网络异常，请重试', icon: 'none' })
    }
  }

  //+ 监听路由变化 + 挂载时同步高亮
  //+ 使用 popstate 事件捕获刷新和前进后退，配合挂载时的初始化
  //+ 比子组件里的 useDidShow 更可靠
  useEffect(() => {
    //+ 挂载时立即同步一次
    setCurrentIndex(getCurrentTabIndex())

    //+ 监听浏览器路由变化（H5 切页/刷新后 pop）
    const handlePopState = () => {
      setCurrentIndex(getCurrentTabIndex())
    }
    window.addEventListener('popstate', handlePopState)

    //+ 清理
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return (
    <div className='tab-container '>
      <Tabbar value={currentIndex} fixed activeColor='#428a46 !important' inactiveColor='#bfbfbf !important' onSwitch={tabNavigate}>
        <Tabbar.Item title='社区' icon={
          <IconFont name='community' fontClassName='iconfont' classPrefix='icon' />
        }
        />
        <Tabbar.Item title='活动' icon={
          <IconFont name='activity' fontClassName='iconfont' classPrefix='icon' />
        }
        />
        <Tabbar.Item className='publish' title='+'  />
        <Tabbar.Item title='消息' icon={
          <IconFont name='message' fontClassName='iconfont' classPrefix='icon' />
        } value={messageBadge} max={99}
        />
        <Tabbar.Item title='我的' icon={
          <IconFont name='wode' fontClassName='iconfont' classPrefix='icon' />
        }
        />
      </Tabbar>
      {/* 发布动作面板 */}
      <ActionSheet
        className='action-sheet'
        visible={isVisible}
        cancelText='取消'
        options={PUBLISH_OPTIONS}
        onSelect={handleSelect}
        onCancel={() => { setIsVisible(false) }}

      />
         </div>
  )
}

export default TabList