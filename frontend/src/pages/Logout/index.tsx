//+ 退出登录页面
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Taro from '@tarojs/taro'
import { logout } from '@/store/modules/user'
import type { AppDispatch } from '@/store'
import { goToLogin } from '@/router'

const Logout = () => {
  const dispatch: AppDispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    //+ 执行退出登录
    dispatch(logout())
    Taro.showToast({
      title: '已退出登录',
      icon: 'success'
    })
    setTimeout(() => {
      goToLogin()
    }, 1000)
  }, [dispatch])

  return null
}

export default Logout
