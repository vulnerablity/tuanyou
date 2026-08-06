//+ 编辑资料页（从个人中心进入）
//+ 功能：编辑头像、背景图、昵称、签名
//+ 标签使用习惯：NutUI 组件（Button/Input/TextArea）+ 原生 HTML（div/img/span）
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Button, Input, TextArea } from '@nutui/nutui-react'
import HeaderNavBar from '@/components/HeaderNavBar'
import Avatar from '@/components/Avatar'
import { uploadImageAPI } from '@/apis/upload'
import './index.less'

//+ 最大长度限制
const MAX_NICKNAME = 20
const MAX_SIGNATURE = 100

//+ 表单状态类型
interface EditFormState {
  avatar: string
  bgImg: string
  nickname: string
  signature: string
}

//+ 初始数据（模拟当前用户数据，后期从接口获取）
const initialData: EditFormState = {
  avatar: 'https://picsum.photos/200?random=1',
  bgImg: 'https://picsum.photos/400/200?random=10',
  nickname: '山林旅人',
  signature: '热爱徒步，每周一山',
}

const EditProfile = () => {
  const [form, setForm] = useState<EditFormState>(initialData)
  const [submitting, setSubmitting] = useState(false)

  //+ 更新单个字段
  const updateField = (field: keyof EditFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  //+ 选择并上传头像
  const handleChangeAvatar = async () => {
    try {
      const chooseRes = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      const filePath = chooseRes.tempFilePaths[0]
      Taro.showLoading({ title: '上传中...' })
      const res = await uploadImageAPI(filePath, 'avatar')
      Taro.hideLoading()
      if (res.code === 0 || res.code === 200) {
        updateField('avatar', res.data.url)
      } else {
        Taro.showToast({ title: res.message || '上传失败', icon: 'none' })
      }
    } catch (err) {
      Taro.hideLoading()
      console.warn('[EditProfile] 头像上传失败:', err)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  //+ 选择并上传背景图
  const handleChangeBgImg = async () => {
    try {
      const chooseRes = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      const filePath = chooseRes.tempFilePaths[0]
      Taro.showLoading({ title: '上传中...' })
      const res = await uploadImageAPI(filePath, 'bg')
      Taro.hideLoading()
      if (res.code === 0 || res.code === 200) {
        updateField('bgImg', res.data.url)
      } else {
        Taro.showToast({ title: res.message || '上传失败', icon: 'none' })
      }
    } catch (err) {
      Taro.hideLoading()
      console.warn('[EditProfile] 背景图上传失败:', err)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  //+ 保存表单（静态模拟，后期对接接口）
  const handleSave = async () => {
    if (submitting) return

    if (!form.nickname.trim()) {
      Taro.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      //+ 后期对接保存接口
      await new Promise(resolve => setTimeout(resolve, 500))
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        //+ 返回个人中心
        Taro.navigateBack({ delta: 1 })
      }, 1000)
    } catch (err) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="edit-profile-page">
      {/* 头部导航栏 */}
      <HeaderNavBar
        title="编辑资料"
        fixed={true}
        cancel={true}
      />

      <div className="form-wrapper">
        {/* 头像模块 */}
        <div className="avatar-section">
          <div className="section-label">头像</div>
          <div className="avatar-upload" onClick={handleChangeAvatar}>
            <Avatar url={form.avatar} size="100" />
            <div className="avatar-tip">点击更换头像</div>
          </div>
        </div>

        {/* 背景图模块 */}
        <div className="bg-section">
          <div className="section-label">背景图</div>
          <div className="bg-preview" onClick={handleChangeBgImg}>
            {form.bgImg ? (
              <img src={form.bgImg} alt="背景图" />
            ) : (
              <div className="bg-placeholder">
                <span className="placeholder-text">点击选择背景图</span>
              </div>
            )}
          </div>
        </div>

        {/* 昵称输入 */}
        <div className="form-section">
          <div className="form-label">昵称</div>
          <Input
            className="form-input"
            type="text"
            placeholder="请输入昵称"
            value={form.nickname}
            maxLength={MAX_NICKNAME}
            onChange={(v) => updateField('nickname', v)}
          />
          <span className="form-count">{form.nickname.length}/{MAX_NICKNAME}</span>
        </div>

        {/* 签名输入 */}
        <div className="form-section column">
          <div className="form-label">签名</div>
          <TextArea
            className="form-textarea"
            placeholder="介绍一下自己吧"
            value={form.signature}
            onChange={(v) => updateField('signature', v)}
            maxLength={MAX_SIGNATURE}
            rows={3}
            showCount={false}
          />
          <span className="form-count right">{form.signature.length}/{MAX_SIGNATURE}</span>
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div className="submit-bar">
        <Button
          type="primary"
          block
          loading={submitting}
          disabled={submitting}
          onClick={handleSave}
        >
          {submitting ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}

export default EditProfile
