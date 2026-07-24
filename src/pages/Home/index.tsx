//+ 首页组件
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '@nutui/nutui-react'
import { getUserInfo, logout } from '@/store/modules/user'
import { useAuthCheck } from '@/components/AuthRoute'
import { goToLogin } from '@/router'
import Taro from '@tarojs/taro'
import './index.less'

const Home = () => {
  const dispatch: any = useDispatch()
  const { userInfo, isLoggedIn } = useSelector((state: any) => state.user)
  const isAuth = useAuthCheck()

  useEffect(() => {
    if (isAuth) {
      dispatch(getUserInfo())
    }
  }, [isAuth, dispatch])

  //+ 退出登录
  const handleLogout = () => {
    dispatch(logout())
    Taro.showToast({
      title: '已退出登录',
      icon: 'success'
    })
    setTimeout(() => {
      goToLogin()
    }, 1000)
  }

  if (!isAuth) {
    return null
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>徒游</h1>
        <p>探索自然，结伴前行</p>
      </div>

      <div className="user-info">
        {userInfo ? (
          <>
            <div className="avatar">
              <img src={userInfo.avatar || 'http://192.168.10.7:89/logo.png'} alt="头像" />
            </div>
            <div className="nickname">{userInfo.nickname}</div>
            <div className="phone">{userInfo.phone}</div>
            <div className="role">
              {userInfo.role === 'leader' ? '领队' : '会员'}
            </div>
          </>
        ) : (
          <div className="loading">加载中...</div>
        )}
      </div>

      <div className="menu-list">
        <div className="menu-item">我的活动</div>
        <div className="menu-item">我的收藏</div>
        <div className="menu-item">消息通知</div>
        <div className="menu-item">设置</div>
      </div>

      <div className="logout-section">
        <Button type="danger" block onClick={handleLogout}>
          退出登录
        </Button>
      </div>
    </div>
  )
}

export default Home
