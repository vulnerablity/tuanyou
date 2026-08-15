//+ 滑动操作组件：左滑露出右侧删除按钮
//+ 交互：touchStart → 记录起始 X；touchMove → 实时 translate；touchEnd → 吸附/回弹
//+ 按钮区宽度固定 120px（删除按钮），内容区 translate 范围 [-120px, 0]
//+ 同一列表中只有一项可以处于"展开"状态（打开新项时自动关闭其他项）
import { useState, useRef, useCallback, useEffect } from 'react'

import './index.less'

interface SwipeActionProps {
  children: React.ReactNode
  onDelete: () => void
  //+ 外部控制：当某一项展开时，通知父组件关闭其他项
  onSwipeOpen?: () => void
  //+ 受控展开状态（可选，由父组件管理互斥）
  open?: boolean
}

const ACTION_WIDTH = 60
const THRESHOLD = ACTION_WIDTH / 2
const VELOCITY_THRESHOLD = 0.3

const SwipeAction = ({ children, onDelete, onSwipeOpen, open: controlledOpen }: SwipeActionProps) => {
  //+ 内部展开状态（未受控时使用）
  const [innerOpen, setInnerOpen] = useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : innerOpen

  //+ 手势状态
  const startXRef = useRef(0)
  const currentXRef = useRef(0)
  const [offsetX, setOffsetX] = useState(0)
  const touchingRef = useRef(false)
  const lastTimeRef = useRef(0)
  const lastXRef = useRef(0)
  const velocityRef = useRef(0)

  //+ 点击删除按钮：先回弹再触发回调
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    //+ 先收起再回调，让动画更自然
    setOffsetX(0)
    if (controlledOpen === undefined) setInnerOpen(false)
    onDelete()
  }, [onDelete, controlledOpen])

  //+ 点击内容区：若处于展开状态，先收起（不触发 onClick）
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (isOpen) {
      e.stopPropagation()
      setOffsetX(0)
      if (controlledOpen === undefined) setInnerOpen(false)
    }
  }, [isOpen, controlledOpen])

  //+ 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    startXRef.current = touch.clientX
    currentXRef.current = isOpen ? -ACTION_WIDTH : 0
    lastXRef.current = touch.clientX
    lastTimeRef.current = Date.now()
    velocityRef.current = 0
    touchingRef.current = true
    setOffsetX(currentXRef.current)
  }, [isOpen])

  //+ 触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchingRef.current) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - startXRef.current
    //+ 限制范围：右侧不超过 0，左侧不超过 -ACTION_WIDTH - 额外缓冲
    let nextOffset = Math.min(0, Math.max(-ACTION_WIDTH - 40, deltaX + (isOpen ? -ACTION_WIDTH : 0)))
    //+ 计算速度（用于快速滑动判定）
    const now = Date.now()
    const dt = now - lastTimeRef.current
    if (dt > 0) {
      velocityRef.current = (touch.clientX - lastXRef.current) / dt
    }
    lastXRef.current = touch.clientX
    lastTimeRef.current = now
    currentXRef.current = nextOffset
    setOffsetX(nextOffset)
  }, [isOpen])

  //+ 触摸结束
  const handleTouchEnd = useCallback(() => {
    if (!touchingRef.current) return
    touchingRef.current = false
    const offset = currentXRef.current
    const velocity = velocityRef.current
    //+ 根据位移和速度判断吸附方向
    let shouldOpen: boolean
    if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
      //+ 快速滑动：方向决定
      shouldOpen = velocity < 0
    } else {
      //+ 慢速滑动：超过阈值则展开
      shouldOpen = offset < -THRESHOLD
    }
    setOffsetX(shouldOpen ? -ACTION_WIDTH : 0)
    if (controlledOpen === undefined) {
      setInnerOpen(shouldOpen)
    }
    if (shouldOpen) {
      onSwipeOpen?.()
    }
  }, [controlledOpen, onSwipeOpen])

  //+ 外部受控 open 变化时同步 offset
  useEffect(() => {
    if (isOpen) {
      setOffsetX(-ACTION_WIDTH)
    } else {
      setOffsetX(0)
    }
  }, [isOpen])

  return (
    <div className='swipe-action-wrapper'>
      {/* 底层：删除按钮 */}
      <div className='swipe-action-delete-btn' onClick={handleDeleteClick}>
        <div className='iconfont icon-shanchu' style={{ color: '#f39d9d' }}></div>
      </div>
      {/* 顶层：内容区 */}
      <div
        className='swipe-action-content'
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: touchingRef.current ? 'none' : 'transform 0.25s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  )
}

export default SwipeAction
