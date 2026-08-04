import { Tabbar ,ActionSheet} from '@nutui/nutui-react'
import { IconFont } from '@nutui/icons-react'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
//+ 阿里 iconfont 字符图标样式
import '@/assets/iconfont.css'
import './index.less'

/** 路由路径 → Tab 索引 映射 */
const ROUTE_TO_TAB_INDEX: Record<string, number> = {
  'home': 0,
  'activity': 1,
  'message': 3,
  'profile': 4,
}

/** 从当前页面路径推导应该高亮的 tab 索引 */
function getCurrentTabIndex(): number {
  try {
    const pages = Taro.getCurrentPages()
    if (pages.length > 0) {
      const route = pages[pages.length - 1]?.route?.toLowerCase() || ''
      for (const [key, index] of Object.entries(ROUTE_TO_TAB_INDEX)) {
        if (route.includes(key)) return index
      }
    }
  } catch (_) { /* ignore */ }
  return 0
}

const TabList = () => {
  const [currentIndex, setCurrentIndex] = useState(() => getCurrentTabIndex())

 
  const [isVisible, setIsVisible] = useState(false)
  const [val,setVal] = useState('')
  const tabNavigate = (index: number) => {
    if (index === 0) {
      Taro.switchTab({ url: '/pages/Home/index' })
    } else if (index === 1) {
      Taro.switchTab({ url: '/pages/Activity/index' })
    }else if(index===2){
      setIsVisible(true)
    }else if (index === 3) {
      Taro.switchTab({ url: '/pages/Message/index' })
    } else if (index === 4) {
      Taro.switchTab({ url: '/pages/Profile/index' })
    }
    setCurrentIndex(index)
  }
  
  const options=[
    {
      name:'发笔记'
    },
    {
      name: '写攻略',
    
    },
    {
      name: '发起活动',
     
    }
  ]
  const handleSelect=(item:any)=>{
    setVal(item.name)
    setIsVisible(false)
    // 根据 option name 跳转到对应的发布页
    switch (item.name) {
      case '发笔记':
        Taro.navigateTo({ url: '/pages/PublishNote/index' })
        break
      case '写攻略':
        Taro.navigateTo({ url: '/pages/PublishGuide/index' })
        break
      case '发起活动':
        Taro.navigateTo({ url: '/pages/PublishActivity/index' })
        break
    }
  }
   // 每次 TabList 挂载时同步 tab 高亮状态
  useEffect(() => {
    setCurrentIndex(getCurrentTabIndex())
  }, [])
  return (
    <div className='tab-container '>
      <Tabbar value={currentIndex} fixed={true} activeColor="#428a46 !important" inactiveColor="#bfbfbf !important" onSwitch={tabNavigate}>
        <Tabbar.Item title="社区" icon={
          <IconFont name="community" fontClassName="iconfont" classPrefix="icon" />
        }/>
        <Tabbar.Item title="活动" icon={
          <IconFont name="activity" fontClassName="iconfont" classPrefix="icon" />
        } />
        <Tabbar.Item className="publish" title="+"  />
        <Tabbar.Item title="消息" icon={
          <IconFont name="message" fontClassName="iconfont" classPrefix="icon" />
        } value={3} />
        <Tabbar.Item title="我的" icon={
          <IconFont name="wode" fontClassName="iconfont" classPrefix="icon" />
        } />
      </Tabbar>
      {/* 发布动作面板 */}
      <ActionSheet
        className='action-sheet'
        visible={isVisible}
        cancelText="取消"
        options={options}
        onSelect={handleSelect}
        onCancel={()=>{setIsVisible(false)}}
        
      />
         </div>
  )
}

export default TabList