//+ 修改密码页面
//+ 场景：Settings → 修改密码
//+ 接口：PUT /auth/password（需登录）
//+ 字段：oldPassword / newPassword / confirmPassword
//+ 校验：非空 + 新密码长度≥6 + 两次新密码一致
import { Button, Input } from '@nutui/nutui-react'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import HeaderNavBar from '@/components/HeaderNavBar'
import { updatePassword } from '@/apis/user'
import { useAuthGuard } from '@/components/AuthRoute'
import { routerNavigateBack } from '@/router'
import '@/styles/auth.less'
import './index.less'

//+ 新密码最小长度
const PASSWORD_MIN = 6

const ChangePassword = () => {
  useAuthGuard()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!oldPassword) {
      Taro.showToast({ title: '请输入原密码', icon: 'none' })
      return
    }
    if (!newPassword) {
      Taro.showToast({ title: '请输入新密码', icon: 'none' })
      return
    }
    if (newPassword.length < PASSWORD_MIN) {
      Taro.showToast({ title: `新密码至少${PASSWORD_MIN}位`, icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      Taro.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }
    if (oldPassword === newPassword) {
      Taro.showToast({ title: '新密码不能与原密码相同', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      await updatePassword({ oldPassword, newPassword, confirmPassword })
      Taro.showToast({ title: '修改成功', icon: 'success' })
      setTimeout(() => routerNavigateBack(), 1000)
    } catch (err: unknown) {
      //+ 业务错误（如原密码错误）由请求层抛 ApiError（继承 Error），此处取 message
      const msg = err instanceof Error ? err.message : '修改失败'
      Taro.showToast({ title: msg, icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='auth-container change-password-page'>
      <HeaderNavBar title='修改密码' backPageNum={1} fixed={false} />

      <div className='auth-form'>
        <div className='auth-form-item'>
          <Input
            value={oldPassword}
            onChange={setOldPassword}
            placeholder='请输入原密码'
            type='password'
            className='auth-input'
          />
        </div>
        <div className='auth-form-item'>
          <Input
            value={newPassword}
            onChange={setNewPassword}
            placeholder='请输入新密码（至少6位）'
            type='password'
            className='auth-input'
          />
        </div>
        <div className='auth-form-item'>
          <Input
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder='请确认新密码'
            type='password'
            className='auth-input'
          />
        </div>

        <Button
          type='primary'
          className='auth-submit-btn'
          loading={submitting}
          disabled={submitting}
          onClick={handleSubmit}
        >
          确认修改
        </Button>
      </div>
    </div>
  )
}

export default ChangePassword
