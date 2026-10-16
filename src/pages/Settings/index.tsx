//+ 设置页面
//+ 功能：消息通知开关；编辑资料、修改密码、修改手机号、注销账号等入口
//+ 标签使用习惯：NutUI 组件（Switch/Button/Dialog）+ 原生 HTML + IconFont 图标
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import Taro from '@tarojs/taro'
import { Switch, Dialog } from '@nutui/nutui-react'
import { ArrowRight } from '@nutui/icons-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import { fetchLogout } from '@/store/modules/user'
import type { AppDispatch } from '@/store'
import { routerNavigateTo, routerReLaunch } from '@/router'
import type { RouteKey } from '@/router'
import { useAuthGuard } from '@/components/AuthRoute'
import './index.less'

//+ 开关项配置
const switchItems = [
  { key: 'notification', label: '消息通知', default: true, icon: 'icon-xiaoxitongzhi' },
  // { key: 'location', label: '位置服务', default: false ,icon:'icon-weizhifuwu'},
]

//+ 跳转项配置（route 走 @/router 包装；空串表示占位入口，点击提示开发中）
//+ 编辑资料 / 修改密码 / 修改手机号 / 注销账号 为账号管理入口
const navigateItems: { key: string; label: string; icon: string; route: RouteKey | '' }[] = [
  { key: 'editUserInfo', label: '编辑资料', icon: 'icon-bianjiziliao', route: 'EDIT_PROFILE' },
  { key: 'changePassword', label: '修改密码', icon: 'icon-bianjiziliao', route: 'CHANGE_PASSWORD' },
  { key: 'changePhone', label: '修改手机号', icon: 'icon-bianjiziliao', route: 'CHANGE_PHONE' },
  { key: 'privacy', label: '隐私设置', icon: 'icon-yinsishezhi', route: '' },
  { key: 'help', label: '帮助与反馈', icon: 'icon-bangzhuyufankui', route: '' },
  { key: 'about', label: '关于团游', icon: 'icon-guanyu', route: '' },
]

//+ 底部按钮配置
//+ 注销账号跳转 CancelAccount 页完成手机号验证码 + 密码双重校验
const bottomButtons = [
  { key: 'logout', label: '退出登录', type: 'warning' },
  { key: 'cancelAccount', label: '注销账号', type: 'danger' },
]

const Settings = () => {
  useAuthGuard()
  const dispatch: AppDispatch = useDispatch<AppDispatch>()
  //+ 开关状态
  const [switchState, setSwitchState] = useState<Record<string, boolean>>(
    () => switchItems.reduce((acc, item) => ({ ...acc, [item.key]: item.default }), {})
  )
  //+ 退出确认弹窗
  const [logoutVisible, setLogoutVisible] = useState(false)
  //+ 退出登录进行中（防重复点击）
  const [logoutLoading, setLogoutLoading] = useState(false)

  //+ 开关切换
  const handleSwitchChange = (key: string, value: boolean) => {
    setSwitchState(prev => ({ ...prev, [key]: value }))
    Taro.showToast({ title: '功能开发中', icon: 'none' })
    //+ TODO: 后期对接用户设置接口
  }

  //+ 点击跳转项
  const handleNavigate = (item: (typeof navigateItems)[number]) => {
    if (item.route) {
      routerNavigateTo(item.route)
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  //+ 点击底部按钮
  const handleBottomClick = (item: (typeof bottomButtons)[number]) => {
    if (item.key === 'logout') {
      setLogoutVisible(true)
    } else if (item.key === 'cancelAccount') {
      //+ 注销账号：跳转独立页面完成手机号验证码 + 密码双重校验
      routerNavigateTo('CANCEL_ACCOUNT')
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  //+ 确认退出：调后端退出接口 → 清本地登录态 → 跳登录页
  //+ fetchLogout 无论成功/失败都会清理本地 token 与 userInfo，故统一跳转
  const handleLogoutConfirm = async () => {
    if (logoutLoading) return
    setLogoutVisible(false)
    setLogoutLoading(true)
    try {
      await dispatch(fetchLogout())
      Taro.showToast({ title: '已退出登录', icon: 'success' })
      setTimeout(() => {
        //+ reLaunch 清空页面栈，避免返回到需登录页面
        routerReLaunch('LOGIN')
      }, 1000)
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <div className='settings-page'>
      <HeaderNavBar title='设置' fixed={false} cancel={false} />

      <div className='settings-content'>
        {/* 开关模块 */}
        <div className='section'>
          {switchItems.map((item) => (
            <div key={item.key} className='section-item'>
              <span className={`item-icon iconfont ${item.icon} item-label`}>{item.label}</span>
              <Switch
                checked={switchState[item.key]}
                onChange={(v) => handleSwitchChange(item.key, v)}
              />
            </div>
          ))}
        </div>

        {/* 跳转入口模块 */}
        <div className='section'>
          {navigateItems.map((item) => (
            <div
              key={item.key}
              className='section-item clickable'
              onClick={() => handleNavigate(item)}
            >
              <span className={`item-icon iconfont ${item.icon} item-label`}>{item.label}</span>
              <ArrowRight className='item-arrow' />
            </div>
          ))}
        </div>

        {/* 底部按钮区 */}
        <div className='bottom-section'>
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
        <div className='version-info'>
          <span>团游 v1.0.0</span>
        </div>
      </div>

      {/* 退出确认弹窗 */}
      <Dialog
        visible={logoutVisible}
        title='确认退出登录吗？'
        content='退出后需要重新登录才能使用'
        confirmText='确认退出'
        cancelText='取消'
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutVisible(false)}
      />
    </div>
  )
}

export default Settings
