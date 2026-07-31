//+ 忘记密码/重置密码页面
//+ 步骤：输入手机号 → 发送验证码 → 输入验证码 → 设置新密码 → 完成
import { Form, Button, Input } from '@nutui/nutui-react'
import { ArrowLeft } from '@nutui/icons-react'
import { useDispatch } from 'react-redux'
import Taro from '@tarojs/taro'
import { fetchSendCode, fetchResetPassword } from '@/store/modules/user'
import type { AppDispatch } from '@/store'
import { useState, useRef } from 'react'
//+ 导入公共认证样式
import '@/styles/auth.less'
import './index.less'

const ForgotPassword = () => {
  const dispatch: AppDispatch = useDispatch<AppDispatch>()
  const formRef = useRef<any>(null)

  //+ 验证码发送状态
  const [codeCountdown, setCodeCountdown] = useState(0)
  const countdownTimer = useRef<any>(null)

  //+ 发送验证码
  const handleSendCode = async () => {
    const phoneValue = formRef.current?.getFieldValue?.('phone')
    if (!phoneValue) {
      Taro.showToast({ title: '请先输入手机号', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phoneValue)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (codeCountdown > 0) return

    try {
      const result: any = await dispatch(fetchSendCode({ phone: phoneValue, scene: 'reset-password' }))
      if (result.type === 'user/fetchSendCode/fulfilled') {
        Taro.showToast({ title: '验证码已发送', icon: 'success' })
        setCodeCountdown(60)
        countdownTimer.current = setInterval(() => {
          setCodeCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownTimer.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (error) {
      console.error('发送验证码失败:', error)
    }
  }

  //+ 重置密码提交
  const onFinish = async (values: { phone: string; code: string; newPassword: string; confirmPassword: string }) => {
    try {
      const result: any = await dispatch(fetchResetPassword({
        phone: values.phone,
        code: values.code,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      }))

      if (result.type === 'user/fetchResetPassword/fulfilled') {
        Taro.showToast({
          title: '密码重置成功',
          icon: 'success'
        })
        setTimeout(() => {
          //+ 跳转到登录页使用新密码登录
          Taro.redirectTo({ url: '/pages/Login/index' })
        }, 1500)
      }
    } catch (error) {
      console.error('重置密码失败:', error)
    }
  }

  //+ 返回登录页
  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <div className="auth-container">
      {/* 顶部标题和返回箭头 */}
      <div className="register-header">
        <ArrowLeft className='arrow-left' onClick={handleBack} />
        <span>找回密码</span>
      </div>

      {/* logo */}
      <div className="auth-logo">
        <img src='http://192.168.10.7:89/logo.png' alt="logo" />
        <p>探索自然，结伴前行</p>
      </div>

      <Form
        className="auth-form"
        ref={formRef}
        onFinish={onFinish}
        footer={
          <Button type="primary" className="auth-submit-btn" nativeType="submit">
            确认
          </Button>
        }
      >
        {/* 手机号 */}
        <Form.Item
          className='auth-form-item'
          name="phone"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]}
        >
          <Input placeholder="请输入手机号" type="tel" className='auth-input' />
        </Form.Item>

        {/* 验证码 */}
        <Form.Item
          className='auth-form-item auth-form-item-code'
          name="code"
          rules={[
            { required: true, message: '请输入验证码' },
            { pattern: /^\d{6}$/, message: '请输入6位数字验证码' }
          ]}
        >
          <div className="code-input-row">
            <Input placeholder="请输入短信验证码" type="number" maxLength={6} className='auth-input auth-input-code' />
            <Button
              className={`send-code-btn ${codeCountdown > 0 ? 'send-code-btn--disabled' : ''}`}
              onClick={handleSendCode}
            >
              {codeCountdown > 0 ? `${codeCountdown}s后重发` : '发送验证码'}
            </Button>
          </div>
        </Form.Item>

        {/* 新密码 */}
        <Form.Item
          className='auth-form-item'
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少6位' }
          ]}
        >
          <Input placeholder="请输入新密码（至少六位）" type="password" className='auth-input' />
        </Form.Item>

        {/* 确认新密码 */}
        <Form.Item
          className='auth-form-item'
          name="confirmPassword"
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              }
            })
          ]}
        >
          <Input placeholder="请确认新密码" type="password" className='auth-input' />
        </Form.Item>
      </Form>
    </div>
  )
}

export default ForgotPassword