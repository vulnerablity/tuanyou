//+ 修改手机号页面
//+ 场景：Settings → 修改手机号
//+ 接口：POST /auth/change-phone（需登录，scene=change-phone）
//+ 流程：输入新手机号 → 发送验证码（scene=change-phone）→ 输入验证码 → 提交
import { Button, Input } from '@nutui/nutui-react'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import HeaderNavBar from '@/components/HeaderNavBar'
import { changePhone } from '@/apis/user'
import { useSendCode } from '@/hooks/useSendCode'
import CodeInput from '@/components/CodeInput'
import { useAuthGuard } from '@/components/AuthRoute'
import { routerNavigateBack } from '@/router'
import '@/styles/auth.less'
import './index.less'

//+ 手机号 / 短信验证码校验规则（模块级常量）
const PHONE_REGEX = /^1[3-9]\d{9}$/
const SMS_CODE_REGEX = /^\d{6}$/

const ChangePhone = () => {
  useAuthGuard()
  const [newPhone, setNewPhone] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  //+ 验证码发送逻辑：scene=change-phone，发往新手机号
  const { codeSent, codeCountdown, sendCode } = useSendCode('change-phone')

  const handleSendCode = () => {
    if (!newPhone) {
      Taro.showToast({ title: '请输入新手机号', icon: 'none' })
      return
    }
    if (!PHONE_REGEX.test(newPhone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    sendCode(newPhone)
  }

  const handleSubmit = async () => {
    if (!newPhone) {
      Taro.showToast({ title: '请输入新手机号', icon: 'none' })
      return
    }
    if (!PHONE_REGEX.test(newPhone)) {
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

    setSubmitting(true)
    try {
      await changePhone({ newPhone, code })
      Taro.showToast({ title: '修改成功', icon: 'success' })
      setTimeout(() => routerNavigateBack(), 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '修改失败'
      Taro.showToast({ title: msg, icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='auth-container change-phone-page'>
      <HeaderNavBar title='修改手机号' backPageNum={1} fixed={false} />

      <div className='auth-form'>
        <div className='auth-form-item'>
          <Input
            value={newPhone}
            onChange={setNewPhone}
            placeholder='请输入新手机号'
            type='tel'
            maxLength={11}
            className='auth-input'
          />
        </div>

        <CodeInput
          value={code}
          onChange={setCode}
          codeCountdown={codeCountdown}
          codeSent={codeSent}
          onSendCode={handleSendCode}
        />

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

export default ChangePhone
