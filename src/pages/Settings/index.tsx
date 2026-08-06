//+ 设置页面
//+ 功能：消息通知、位置服务开关；编辑资料、隐私设置、帮助与反馈、关于途右入口
//+ 标签使用习惯：NutUI 组件（Switch/Button/Dialog）+ 原生 HTML + IconFont 图标
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Switch, Dialog } from '@nutui/nutui-react'
import { ArrowRight } from '@nutui/icons-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import './index.less'

//+ 开关项配置
const switchItems = [
  { key: 'notification', label: '消息通知', default: true },
  { key: 'location', label: '位置服务', default: false },
]

//+ 跳转项配置
const navigateItems = [
  { key: 'editUserInfo', label: '编辑资料', path: '/pages/EditUserInfo/index' },
  { key: 'privacy', label: '隐私设置', path: '' },
  { key: 'help', label: '帮助与反馈', path: '' },
  { key: 'about', label: '关于途友', path: '' },
]

//+ 底部按钮配置
const bottomButtons = [
  { key: 'logout', label: '退出登录', type: 'warning' },
  { key: 'forgot', label: '忘记密码', type: 'default' },
  { key: 'delete', label: '注销账号', type: 'danger' },
]

const Settings = () => {
  //+ 开关状态
  const [switchState, setSwitchState] = useState<Record<string, boolean>>(
    () => switchItems.reduce((acc, item) => ({ ...acc, [item.key]: item.default }), {})
  )
  //+ 退出确认弹窗
  const [logoutVisible, setLogoutVisible] = useState(false)

  //+ 开关切换
  const handleSwitchChange = (key: string, value: boolean) => {
    setSwitchState(prev => ({ ...prev, [key]: value }))
    //+ 后期对接接口
    console.log(`[Settings] ${key} switched to ${value}`)
  }

  //+ 点击跳转项
  const handleNavigate = (item: typeof navigateItems[0]) => {
    if (item.path) {
      Taro.navigateTo({ url: item.path })
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  //+ 点击底部按钮
  const handleBottomClick = (item: typeof bottomButtons[0]) => {
    if (item.key === 'logout') {
      setLogoutVisible(true)
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  //+ 确认退出
  const handleLogoutConfirm = () => {
    setLogoutVisible(false)
    Taro.showToast({ title: '已退出登录', icon: 'success' })
    //+ 后期对接退出登录接口，清除 token，跳转登录页
    setTimeout(() => {
      Taro.reLaunch({ url: '/pages/Login/index' })
    }, 1000)
  }

  return (
    <div className="settings-page">
      <HeaderNavBar title="设置" fixed={true} cancel={true} />

      <div className="settings-content">
        {/* 开关模块 */}
        <div className="section">
          {switchItems.map((item, index) => (
            <div key={item.key} className="section-item">
              <span className="item-label">{item.label}</span>
              <Switch
                checked={switchState[item.key]}
                onChange={(v) => handleSwitchChange(item.key, v)}
                // activeColor="#2e7d32"
              />
            </div>
          ))}
        </div>

        {/* 跳转入口模块 */}
        <div className="section">
          {navigateItems.map((item, index) => (
            <div
              key={item.key}
              className="section-item clickable"
              onClick={() => handleNavigate(item)}
            >
              <span className="item-label">{item.label}</span>
              <ArrowRight className="item-arrow" />
            </div>
          ))}
        </div>

        {/* 底部按钮区 */}
        <div className="bottom-section">
          {bottomButtons.map(item => (
            <div
              key={item.key}
              className={`bottom-btn ${item.type}`}
              onClick={() => handleBottomClick(item)}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* 版本信息 */}
        <div className="version-info">
          <span>途友 v1.0.0</span>
        </div>
      </div>

      {/* 退出确认弹窗 */}
      <Dialog
        visible={logoutVisible}
        title="确认退出登录吗？"
        content="退出后需要重新登录才能使用"
        confirmText="确认退出"
        cancelText="取消"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutVisible(false)}
      />
    </div>
  )
}

export default Settings
