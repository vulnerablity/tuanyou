import React, { useRef, useState, useEffect } from 'react'
import { TextArea } from '@nutui/nutui-react'
import Taro from '@tarojs/taro'
import { useTextareaCursor } from '@/hooks/useTextareaCursor'
import type { CursorPos } from '@/types/markdown'

//+ NutUI TextArea 透传 ref 的结构（H5 下可能是组件包裹层，需穿透 nativeElement/querySelector 取原生 textarea）
export interface TextareaHandle {
  nativeElement?: HTMLElement
  querySelector?: (selector: string) => Element | null
  focus?: () => void
}

export interface EditViewProps {
  value: string
  onChange: (v: string) => void
  onCursorChange: (cursor: CursorPos) => void
  minHeight?: string | number
  readOnly?: boolean
  maxLength?: number
  /** 来自父组件的 selection-set 通知：组件每次 setSelectionProps (t,s,e) 时根据 token 重设 */
  selectionToken?: number
  onSelectionChangeSync?: (cb: (s: number, e: number) => void) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  /** 暴露 textarea ref 给父组件（useMarkdownInsert 光标调整需要） */
  onTextareaRef?: (ref: React.RefObject<TextareaHandle>) => void
}

const isWeb = Taro.getEnv() === Taro.ENV_TYPE.WEB

//+ 光标事件结构（与 useTextareaCursor.extractFromEvent 入参对齐，结构化鸭型）
type CursorEvent = Parameters<ReturnType<typeof useTextareaCursor>['extractFromEvent']>[0]

function EditView({
  value,
  onChange,
  onCursorChange,
  minHeight,
  readOnly,
  maxLength,
  selectionToken,
  onSelectionChangeSync,
  onKeyDown,
  onTextareaRef
}: EditViewProps) {
  //+ NutUI TextArea 包裹层 ref：类型为结构化 TextareaHandle，绑定 JSX 时做一次边界断言（组件库 ref 类型不精确）
  const textareaRef = useRef<TextareaHandle>(null)
  // 小程序端 selection-start/selection-end props
  const [selStart, setSelStart] = useState<number>(-1)
  const [selEnd, setSelEnd] = useState<number>(-1)

  const setSelProps = (s: number, e: number) => {
    setSelStart(s)
    setSelEnd(e)
  }

  const { extractFromEvent, setSelection } = useTextareaCursor(textareaRef, setSelProps)

  // 给父组件暴露"设置光标选区"回调
  useEffect(() => {
    onSelectionChangeSync?.((s, e) => setSelection(s, e))
  }, [onSelectionChangeSync, setSelection])

  // selectionToken 变化 → 重新应用 setSelection（小程序端用 state，H5 端用 setSelectionRange）
  useEffect(() => {
    if (selectionToken && selStart >= 0) {
      setSelection(selStart, selEnd)
    }
  }, [selectionToken, selStart, selEnd, setSelection])

  // 暴露 ref 给父组件
  useEffect(() => {
    onTextareaRef?.(textareaRef)
  }, [onTextareaRef])

  const h = (() => {
    if (typeof minHeight === 'number') return `${minHeight}px`
    if (typeof minHeight === 'string' && minHeight) return minHeight
    return '320px'
  })()

  return (
    <div className='md-edit-view' style={{ minHeight: h }}>
      <TextArea
        //+ NutUI TextArea ref 类型与其真实结构（带 nativeElement 的包裹层）不匹配，边界断言一次
        ref={textareaRef as unknown as React.RefObject<HTMLTextAreaElement>}
        className='md-textarea'
        style={{ minHeight: h, fontFamily: 'inherit' }}
        value={value}
        placeholder='支持标题/粗体/斜体/列表/引用等格式，可点击上方工具栏一键插入~'
        maxLength={maxLength || 999999}
        rows={10}
        showCount={false}
        readOnly={readOnly}
        onChange={(v) => onChange(v)}
        {...(isWeb
          ? {}
          : {
              // 选区设置：仅小程序端需要这两个 props，H5 传了会触发 React unknown-prop 警告
              ...(selStart >= 0 ? { selectionStart: selStart } : {}),
              ...(selEnd >= 0 ? { selectionEnd: selEnd } : {}),
            })}
        onInput={(e) => {
          if (isWeb) onCursorChange(extractFromEvent(e as CursorEvent))
        }}
        onClick={(e) => {
          if (isWeb) onCursorChange(extractFromEvent(e as CursorEvent))
        }}
        onKeyUp={(e) => {
          if (isWeb) onCursorChange(extractFromEvent(e as CursorEvent))
        }}
        // 选区变化：仅小程序端需要；H5 端没有这个 DOM 事件，传了会触发 React unknown-event-handler 警告
        {...(isWeb
          ? {}
          : {
              onSelectionChange: (e: CursorEvent) => onCursorChange(extractFromEvent(e)),
            })}
        // H5 键盘快捷键
        {...(isWeb && onKeyDown ? { onKeyDown } : {})}
      />
    </div>
  )
}

export default EditView
