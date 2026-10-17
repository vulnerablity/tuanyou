//+ 忘记密码/重置密码页面
//+ 受控表单：用 useState 管理字段值，手写校验，避免 NutUI Form.Item 注入不稳定
//+ 保留头部 HeaderNavBar、logo
import { Button, Input } from '@nutui/nutui-react'
import Taro from '@tarojs/taro'
import { useDispatch } from 'react-redux'
import { useState } from 'react'
import { fetchResetPassword } from '@/store/modules/user'
import type { AppDispatch } from '@/store'
import { routerRedirectTo } from '@/router'
import { useSendCode } from '@/hooks/useSendCode'
import CodeInput from '@/components/CodeInput'
//+ 封装组件
import HeaderNavBar from '@/components/HeaderNavBar'
import logo from '@/assets/logo.png'
//+ 导入公共认证样式
import '@/styles/auth.less'
import './index.less'

//+ 手机号 / 短信验证码校验规则（模块级常量）
const PHONE_REGEX = /^1[3-9]\d{9}$/
const SMS_CODE_REGEX = /^\d{6}$/
//+ 新密码最小长度
const PASSWORD_MIN = 6

const ForgotPassword = () => {
  const dispatch: AppDispatch = useDispatch<AppDispatch>()

  //+ 表单字段（受控）
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  //+ 验证码发送逻辑复用（场景为重置密码 scene=reset-pwd）
  const { codeSent, codeCountdown, sendCode } = useSendCode('reset-pwd')

  //+ 重置密码提交：校验 → 调接口 → 反馈
  const handleSubmit = async () => {
    if (!phone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!PHONE_REGEX.test(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!code) {
      Taro.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }
    if (!SMS_CODE_REGEX.test(code)) {
      Taro.showToast({ title: '请输入6位数字验证码', icon: 'none' })
      return
    }
    if (!newPassword) {
      Taro.showToast({ title: '请输入新密码', icon: 'none' })
      return
    }
    if (newPassword.length < PASSWORD_MIN) {
      Taro.showToast({ title: `密码至少${PASSWORD_MIN}位`, icon: 'none' })
      return
    }
    if (!confirmPassword) {
      Taro.showToast({ title: '请确认新密码', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      Taro.showToast({ title: '两次输入的密码不一致', icon: 'none' })
      return
    }

    const result = await dispatch(
      fetchResetPassword({ phone, code, newPassword, confirmPassword })
    )

    if (fetchResetPassword.fulfilled.match(result)) {
      Taro.showToast({ title: '密码重置成功', icon: 'success' })
      setTimeout(() => {
        //+ 跳转到登录页使用新密码登录
        routerRedirectTo('LOGIN')
      }, 1500)
    } else {
      const errMsg = result.error?.message || '密码重置失败，请重试'
      Taro.showToast({ title: errMsg, icon: 'none' })
    }
  }

  return (
    <div className='auth-container'>
      {/* 顶部导航：使用封装的 HeaderNavBar 组件（含降级返回逻辑） */}
      <HeaderNavBar title='找回密码' backPageNum={1} />

      {/* logo */}
      <div className='auth-logo'>
        <img src={logo} alt='logo' />
        <p>探索自然，结伴前行</p>
      </div>

      {/* 表单区域 */}
      <div className='auth-form'>
        {/* 手机号 */}
        <div className='auth-form-item'>
          <Input
            value={phone}
            onChange={setPhone}
            placeholder='请输入手机号'
            type='tel'
            className='auth-input'
          />
        </div>

        {/* 验证码 */}
        <CodeInput
          value={code}
          onChange={setCode}
          codeCountdown={codeCountdown}
          codeSent={codeSent}
          onSendCode={() => sendCode(phone)}
        />

        {/* 新密码 */}
        <div className='auth-form-item'>
          <Input
            value={newPassword}
            onChange={setNewPassword}
            placeholder='请输入新密码（至少六位）'
            type='password'
            className='auth-input'
          />
        </div>

        {/* 确认新密码 */}
        <div className='auth-form-item'>
          <Input
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder='请确认新密码'
            type='password'
            className='auth-input'
          />
        </div>

        {/* 提交按钮 */}
        <Button type='primary' className='auth-submit-btn' onClick={handleSubmit}>
          确认
        </Button>
      </div>
    </div>
  )
}

export default ForgotPassword
