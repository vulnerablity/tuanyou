//+ 编辑资料页（从个人中心进入）
//+ 链路：useDidShow → fetchProfileInfo 取初始值；保存 → fetchUpdateProfile；图片 → store upload thunk
import { useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Input, TextArea, Loading } from '@nutui/nutui-react'
import { useDispatch } from 'react-redux'
import HeaderNavBar from '@/components/HeaderNavBar'
import Avatar from '@/components/Avatar'
import { uploadImage } from '@/store/modules/upload'
import { fetchProfileInfo, fetchUpdateProfile } from '@/store/modules/profile'
import type { ProfileUpdate } from '@/types'
import type { AppDispatch } from '@/store'
import { routerNavigateBack } from '@/router'
import { useAuthGuard } from '@/components/AuthRoute'
import './index.less'

//+ 最大长度限制
const MAX_NICKNAME = 20
const MAX_SIGNATURE = 100

//+ 表单状态类型
interface EditFormState {
  avatar: string
  bgImg: string
  nickname: string
  signature: string // 页面展示用"签名"，接口用 bio
}

const EditProfile = () => {
  useAuthGuard()
  const dispatch: AppDispatch = useDispatch()

  const [form, setForm] = useState<EditFormState>({
    avatar: '',
    bgImg: '',
    nickname: '',
    signature: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  //+ 页面首次进入/显示时，拉取 profile info（真实 thunk 接口）作为初始值
  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const action = await dispatch(fetchProfileInfo())
      if (fetchProfileInfo.fulfilled.match(action) && action.payload) {
        const info = action.payload
        setForm({
          avatar: info.avatar || '',
          bgImg: info.bgImg || '',
          nickname: info.nickname || '',
          signature: info.bio || ''
        })
      }
    } catch (err) {
      console.warn('[EditProfile] load profile failed:', err)
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useDidShow(() => {
    loadProfile()
  })

  //+ 更新单个字段
  const updateField = (field: keyof EditFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  //+ 选择本地图片并上传：成功返回图片 url，失败返回 null
  const chooseAndUpload = async (type: 'avatar' | 'bg'): Promise<string | null> => {
    const chooseRes = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
    const filePath = chooseRes.tempFilePaths[0]
    Taro.showLoading({ title: '上传中...' })
    //+ 走 store upload thunk，fulfilled 时 payload 即上传后的 url（已解包）
    const result = await dispatch(uploadImage({ filePath, type }))
    Taro.hideLoading()
    if (uploadImage.fulfilled.match(result) && result.payload) {
      return result.payload
    }
    return null
  }

  //+ 选择并上传头像
  const handleChangeAvatar = async () => {
    try {
      const url = await chooseAndUpload('avatar')
      if (url) {
        updateField('avatar', url)
      } else {
        Taro.showToast({ title: '上传失败', icon: 'none' })
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
      const url = await chooseAndUpload('bg')
      if (url) {
        updateField('bgImg', url)
      } else {
        Taro.showToast({ title: '上传失败', icon: 'none' })
      }
    } catch (err) {
      Taro.hideLoading()
      console.warn('[EditProfile] 背景图上传失败:', err)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  //+ 保存表单（对接 fetchUpdateProfile thunk → 真实接口）
  const handleSave = async () => {
    if (submitting) return

    if (!form.nickname.trim()) {
      Taro.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }

    //+ 个性签名非空校验：避免用户清空后回个人中心显示省略号兜底数据
    if (!form.signature.trim()) {
      Taro.showToast({ title: '个性签名不能为空', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      // 页面 signature → 接口 bio 字段
      const params: ProfileUpdate = {
        avatar: form.avatar,
        bgImg: form.bgImg,
        nickname: form.nickname.trim(),
        bio: form.signature.trim()
      }
      const action = await dispatch(fetchUpdateProfile(params))
      if (fetchUpdateProfile.fulfilled.match(action)) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          routerNavigateBack()
        }, 800)
      } else {
        Taro.showToast({
          title: action.error?.message || '保存失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.warn('[EditProfile] save failed:', err)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='edit-profile-page'>
      {/* 头部导航栏 */}
      <HeaderNavBar
        title='编辑资料'
        fixed={false}
        cancel
      />

      {loading ? (
        <div className='edit-profile-loading'><Loading>加载中...</Loading></div>
      ) : (
        <div className='form-wrapper'>
          {/* 头像模块 */}
          <div className='avatar-section'>
            <div className='section-label'>头像</div>
            <div className='avatar-upload' onClick={handleChangeAvatar}>
              <Avatar url={form.avatar} size='80' />
            </div>
          </div>

          {/* 背景图模块 */}
          <div className='bg-section'>
            <div className='section-label'>背景图</div>
            <div className='bg-preview' onClick={handleChangeBgImg}>
              {form.bgImg ? (
                <img src={form.bgImg} alt='背景图' />
              ) : (
                <div className='bg-placeholder'>
                  <span className='placeholder-text'>点击选择背景图</span>
                </div>
              )}
            </div>
          </div>

          {/* 昵称输入 */}
          <div className='form-section'>
            <div className='form-label'>昵称</div>
            <Input
              className='form-input'
              type='text'
              placeholder='请输入昵称'
              value={form.nickname}
              maxLength={MAX_NICKNAME}
              onChange={(v) => updateField('nickname', v)}
            />
            <span className='form-count'>{form.nickname.length}/{MAX_NICKNAME}</span>
          </div>

          {/* 签名输入 */}
          <div className='form-section column'>
            <div className='form-label'>签名</div>
            <TextArea
              className='form-textarea'
              placeholder='介绍一下自己吧'
              value={form.signature}
              onChange={(v) => updateField('signature', v)}
              maxLength={MAX_SIGNATURE}
              rows={1}
              showCount={false}
            />
            <span className='form-count right'>{form.signature.length}/{MAX_SIGNATURE}</span>
          </div>

          {/* 底部保存按钮 */}
          <div className='submit-bar'>
            <Button
              type='primary'
              block
              loading={submitting}
              disabled={submitting}
              onClick={handleSave}
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditProfile
