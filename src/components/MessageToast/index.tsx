//+ 全局消息弹窗组件（场景1：非消息页收到新消息）
//+ 样式：白色半透明背景，居中，宽 80%，高度自适应
//+ 内容：左上角 logo + 右侧"途友"文字 + 下方 SSE 推送内容（Ellipsis 2行）
//+ 交互：点击弹窗跳转消息页对应 Tab；3 秒后自动关闭
//+ 防抖：store toastCooldown 控制 3 秒内不重复弹窗
import { useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Ellipsis } from '@nutui/nutui-react'
import Taro from '@tarojs/taro'
import type { RootState, AppDispatch } from '@/store'
import {
  hideToast,
  clearToastCooldown,
  setPendingJumpTab
} from '@/store/modules/message'
// import logo from '@/assets/logo.png'
import './index.less'

const AUTO_CLOSE_MS = 4000

const MessageToast = () => {
  const dispatch = useDispatch<AppDispatch>()
  const visible = useSelector((state: RootState) => state.message.toastVisible)
  const content = useSelector((state: RootState) => state.message.toastContent)
  const toastTab = useSelector((state: RootState) => state.message.toastTab)
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  //+ 自动关闭定时器
  useEffect(() => {
    if (visible) {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current)
      }
      autoCloseTimerRef.current = setTimeout(() => {
        dispatch(hideToast())
      }, AUTO_CLOSE_MS)
    }
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current)
      }
    }
  }, [visible, dispatch])

  //+ 点击弹窗：跳转消息页 + 设置目标 tab + 关闭弹窗
  const handleClick = useCallback(() => {
    const targetTab = toastTab === 'interaction' ? 0 : 1
    dispatch(setPendingJumpTab(targetTab))
    dispatch(hideToast())
    dispatch(clearToastCooldown())
    Taro.switchTab({ url: '/pages/Message/index' })
  }, [toastTab, dispatch])

  //+ 点击遮罩关闭
  const handleMaskClick = useCallback(() => {
    dispatch(hideToast())
    dispatch(clearToastCooldown())
  }, [dispatch])

  if (!visible) return null

  console.log('[MessageToast] 渲染弹窗 visible=', visible, 'content=', content, 'tab=', toastTab)

  return (
    <div className='message-toast-mask' onClick={handleMaskClick}>
      <div className='message-toast' onClick={handleClick}>
        {/* 左上角 logo + "途友" 文字 */}
        <div className='message-toast-header'>
          {/* <img className='message-toast-logo' src='http://192.168.10.7:89/logo.png' alt='途友' /> */}
          <span className='message-toast-brand'>途友</span>
        </div>
        {/* SSE 推送内容，Ellipsis 2行省略 */}
        <div className='message-toast-content'>
          <Ellipsis content={content} rows={2} />
        </div>
      </div>
    </div>
  )
}

export default MessageToast
