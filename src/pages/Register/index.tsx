//+ 注册页面
//+ 需要先发送验证码，再完成注册
import { Form, Button, Input } from '@nutui/nutui-react'
import { ArrowLeft } from '@nutui/icons-react'
import { Navigator } from '@tarojs/components'
import { useDispatch } from 'react-redux'
import Taro from '@tarojs/taro'
import { fetchRegister, fetchSendCode } from '@/store/modules/user'
import type { AppDispatch } from '@/store'
import { useState, useRef } from 'react'
//+ 导入公共认证样式
import '@/styles/auth.less'
import './index.less'

const Register = () => {
  const dispatch: AppDispatch = useDispatch<AppDispatch>()
  const formRef = useRef<any>(null)

  //+ 验证码发送状态
  const [codeSent, setCodeSent] = useState(false)
  const [codeCountdown, setCodeCountdown] = useState(0)
  const countdownTimer = useRef<any>(null)

  //+ 发送验证码
  const handleSendCode = async () => {
    //+ 先获取手机号
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
      const result: any = await dispatch(fetchSendCode({ phone: phoneValue, scene: 'register' }))
      if (result.type === 'user/fetchSendCode/fulfilled') {
        setCodeSent(true)
        Taro.showToast({ title: '验证码已发送', icon: 'success' })
        //+ 60秒倒计时
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

  //+ 注册表单提交
  const onFinish = async (values: { phone: string; code: string; nickname: string; password: string; confirmPassword: string }) => {
    try {
      const result: any = await dispatch(fetchRegister({
        phone: values.phone,
        code: values.code,
        nickname: values.nickname,
        password: values.password,
        confirmPassword: values.confirmPassword
      }))

      if (result.type === 'user/fetchRegister/fulfilled') {
        Taro.showToast({
          title: '注册成功',
          icon: 'success'
        })
        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/Home/index' })
        }, 1500)
      }
    } catch (error) {
      console.error('注册失败:', error)
    }
  }

  //+ 返回登录页
  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <div className="auth-container">
      {/* 顶部注册字样和返回登录箭头 */}
      <div className="register-header">
        <ArrowLeft className='arrow-left' onClick={handleBack} />
        <span>注册</span>
      </div>

      {/* logo */}
      <div className="auth-logo">
        <img src='http://192.168.10.7:89/logo.png' alt="logo" />
        <p>探索自然，结伴前行</p>
      </div>

      {/* 表单区域 */}
      <Form
        className="auth-form"
        ref={formRef}
        onFinish={onFinish}
        footer={
          <Button type="primary" className="auth-submit-btn" nativeType="submit">
            注册
          </Button>
        }
      >
        {/* 手机号输入框 */}
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

        {/* 验证码输入 + 发送按钮 */}
        <Form.Item
          className='auth-form-item auth-form-item-code'
          name="code"
          rules={[
            { required: true, message: '请输入验证码' },
            { pattern: /^\d{6}$/, message: '请输入6位数字验证码' }
          ]}
        >
          <div className="code-input-row">
            <Input placeholder="请输入验证码" type="number" maxLength={6} className='auth-input auth-input-code' />
            <span
              className={`send-code-btn ${codeCountdown > 0 ? 'send-code-btn--disabled' : ''}`}
              onClick={handleSendCode}
            >
              {codeCountdown > 0 ? `${codeCountdown}s后重发` : codeSent ? '重新发送' : '发送验证码'}
            </span>
          </div>
        </Form.Item>

        {/* 昵称输入框 */}
        <Form.Item
          className='auth-form-item'
          name="nickname"
          rules={[
            { required: true, message: '请输入昵称' },
            { min: 2, max: 20, message: '昵称长度为2-20个字符' }
          ]}
        >
          <Input placeholder="请输入昵称" className='auth-input' />
        </Form.Item>

        {/* 设置密码 */}
        <Form.Item
          className='auth-form-item'
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' }
          ]}
        >
          <Input placeholder="请设置密码（至少六位）" type="password" className='auth-input' />
        </Form.Item>

        {/* 确认密码 */}
        <Form.Item
          className='auth-form-item'
          name="confirmPassword"
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              }
            })
          ]}
        >
          <Input placeholder="请确认密码" type="password" className='auth-input' />
        </Form.Item>
      </Form>

      {/* 已有账号？去登录 */}
      <div className="auth-link">
        已有账号？
        <Navigator url="/login" className="auth-link-text">去登录</Navigator>
      </div>
    </div>
  )
}

export default Register