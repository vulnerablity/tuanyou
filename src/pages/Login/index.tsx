//+ 登录页面
//+ 支持密码登录和验证码登录两种方式
//+ 底部提供"忘记密码"跳转入口
import { Form, Button, Input } from '@nutui/nutui-react'
import { Navigator } from '@tarojs/components'
import { useDispatch } from 'react-redux'
import Taro from '@tarojs/taro'
import { fetchLogin } from '@/store/modules/user'
import type { AppDispatch } from '@/store'
import { useState,useRef} from 'react'
//+ 导入公共认证样式
import '@/styles/auth.less'
import './index.less'

type LoginMode = 'password' | 'code'

const Login = () => {
  const dispatch: AppDispatch = useDispatch<AppDispatch>()

  //+ 登录模式：password=密码登录，code=验证码登录
  const [loginMode, setLoginMode] = useState<LoginMode>('password')

  const formRef = useRef<any>(null)

  //+ 切换登录模式
  const toggleMode = () => {
    setLoginMode(prev => prev === 'password' ? 'code' : 'password')
  }

  //+ 登录表单提交
  const onFinish = async (values: { phone: string; password?: string; code?: string }) => {
    try {
      const params: any = {
        phone: values.phone,
        type: loginMode === 'code' ? 'code' : 'password',
      }
      if (loginMode === 'code') {
        params.code = values.code
      } else {
        params.password = values.password
      }

      const result: any = await dispatch(fetchLogin(params))

      if (result.type === 'user/fetchLogin/fulfilled') {
        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        })
        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/Home/index' })
        }, 1500)
      }
    } catch (error) {
      console.error('登录失败:', error)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-logo">
        <img src='http://192.168.10.7:89/logo.png' alt="logo" />
        <p>探索自然，结伴前行</p>
      </div>

      <Form
        className="auth-form"
        ref={formRef}
        onFinish={onFinish}
        footer={
          <Button type="primary" nativeType="submit" className="auth-submit-btn">
            {loginMode === 'password' ? '登录' : '验证码登录'}
          </Button>
        }
      >
        <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]} className="auth-form-item">
          <Input placeholder="请输入手机号" type="tel" className="auth-input" />
        </Form.Item>

        {/* 密码登录模式 */}
        {loginMode === 'password' && (
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} className="auth-form-item">
            <Input placeholder="请输入密码" type="password" className="auth-input" />
          </Form.Item>
        )}

        {/* 验证码登录模式 */}
        {loginMode === 'code' && (
          <Form.Item name="code" rules={[{ required: true, message: '请输入验证码' }]} className="auth-form-item">
            <Input placeholder="请输入验证码" type="number" className="auth-input" />
          </Form.Item>
        )}
        
      </Form>

      <div className="auth-actions">
        <span className="auth-action-text"><Navigator url="/forgot-password" className="auth-link-text">忘记密码?</Navigator></span>
        <span className="auth-action-text" onClick={toggleMode}>
          {loginMode === 'password' ? '短信登录' : '密码登录'}
        </span>
      </div>

      <div className="auth-link">
        <div className="auth-link-row">
          还没有账号？
          <Navigator url="/register" className="auth-link-text">立即注册</Navigator>
        </div>
        
      </div>
    </div>
  )
}

export default Login