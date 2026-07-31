import { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { useLaunch } from '@tarojs/taro'
import {Provider} from 'react-redux'
import store from '@/store'
import TabList from '@/components/TabList'
import Taro, { useRouter } from '@tarojs/taro'

// app.tsx
import '@nutui/nutui-react/dist/style.css'  // NutUI基础样式
import '@nutui/nutui-biz/dist/style.css'   // NutUI业务组件样式

import './app.less'


const TAB_BAR_PAGES = ['home', 'profile', 'message', 'activity'] as const

/** 根据页面路径判断是否应该显示 TabBar */
function shouldShowTabBar(path: string): boolean {
  const normalizedPath = path?.toLowerCase() || ''
  return TAB_BAR_PAGES.some(page => normalizedPath.includes(page))
}

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  const router = useRouter()
  const [showTabBar, setShowTabBar] = useState(true)

  // 每次页面渲染时，从页面栈获取当前路由并判断是否显示 TabBar
  // children 变化 = 页面切换，Taro 会重新渲染 App 的 children
  const updateTabBarVisibility = useCallback(() => {
    try {
      const pages = Taro.getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const currentPath = currentPage?.route || ''
        const shouldShow = shouldShowTabBar(currentPath)
        console.log('📱 当前页面路径:', currentPath, '| 显示 TabBar:', shouldShow)
        setShowTabBar(shouldShow)
        return
      }
    } catch (_) {
      // 首次渲染时 getCurrentPages 可能不可用，回退到 router.path
    }
    // 降级：使用 useRouter 的 path
    const initialPath = router?.path?.toLowerCase() || ''
    const shouldShow = shouldShowTabBar(initialPath)
    console.log('📱 降级路由判断:', initialPath, '| 显示 TabBar:', shouldShow)
    setShowTabBar(shouldShow)
  }, [router?.path])

  // 首次挂载 和 每次 children 变化时 都触发判断
  useEffect(() => {
    updateTabBarVisibility()
  }, [children, updateTabBarVisibility])
  
  // children 是将要会渲染的页面
  return (
    <Provider store={store}>
      <div className='app-container'>
        <div>{children}</div>
        {showTabBar && (
          <div className='app-tab-container'>
           <TabList />
        </div>)}
      </div>
        
        
   
    </Provider>
  )

}
  


export default App
