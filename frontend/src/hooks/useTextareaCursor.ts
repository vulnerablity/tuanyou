import { useCallback } from 'react'
import Taro from '@tarojs/taro'
import type { CursorPos } from '@/types/markdown'

//+ 文本域 ref 的结构类型（H5 下可能是 NutUI 包裹层，需穿透到原生 textarea）
interface TextareaLikeElement {
  nativeElement?: HTMLElement
  querySelector?: (selector: string) => Element | null
  focus?: () => void
}

//+ 光标事件结构（H5 target.selectionStart / 小程序 e.detail）
interface CursorEvent {
  target?: { selectionStart?: number; selectionEnd?: number }
  detail?: { selectionStart?: number; selectionEnd?: number; cursor?: number }
}

/**
 * 双端 Textarea 光标位置读写
 * H5：target.selectionStart/End + setSelectionRange
 * 小程序：通过 onSelectionChange 事件提取；设置由父组件 EditView 维护 selStart/selEnd state，
 *         作为 NutUI Textarea 的 selection-start/selection-end props 传入。
 */
export function useTextareaCursor(
  textareaRef: React.RefObject<TextareaLikeElement | null>,
  setSelProps?: (start: number, end: number) => void
) {
  const extractFromEvent = useCallback((e: CursorEvent): CursorPos => {
    if (!e) return { start: 0, end: 0 }
    const tgt = e.target
    if (tgt && typeof tgt.selectionStart === 'number') {
      return {
        start: Math.max(0, tgt.selectionStart || 0),
        end: Math.max(0, tgt.selectionEnd || tgt.selectionStart || 0)
      }
    }
    const d = e.detail
    if (d) {
      const s = typeof d.selectionStart === 'number'
        ? d.selectionStart
        : (typeof d.cursor === 'number' ? d.cursor : 0)
      const e2 = typeof d.selectionEnd === 'number' ? d.selectionEnd : s
      return { start: Math.max(0, s), end: Math.max(0, e2) }
    }
    return { start: 0, end: 0 }
  }, [])

  const setSelection = useCallback((start: number, end?: number) => {
    const s = Math.max(0, start)
    const e = Math.max(s, typeof end === 'number' ? end : start)
    const isWeb = Taro.getEnv() === Taro.ENV_TYPE.WEB
    if (isWeb && textareaRef?.current) {
      const el = textareaRef.current
      const realEl = (el && (el.nativeElement || el.querySelector?.('textarea') || el)) as HTMLTextAreaElement | null
      if (realEl && typeof realEl.setSelectionRange === 'function') {
        try {
          realEl.focus()
          realEl.setSelectionRange(s, e)
        } catch (_) { /* ignore */ }
      }
    }
    setSelProps?.(s, e)
  }, [textareaRef, setSelProps])

  const focus = useCallback(() => {
    const isWeb = Taro.getEnv() === Taro.ENV_TYPE.WEB
    if (isWeb && textareaRef?.current) {
      const el = textareaRef.current
      const realEl = (el && (el.nativeElement || el.querySelector?.('textarea') || el)) as HTMLTextAreaElement | null
      realEl?.focus?.()
    }
  }, [textareaRef])

  return { extractFromEvent, setSelection, focus }
}

export default useTextareaCursor
