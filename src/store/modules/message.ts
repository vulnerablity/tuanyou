//+ 消息模块 store（当前阶段只存未读总数，用于 TabBar 红点同步）
//+ 后期接入链路时，可扩展：互动列表、系统通知列表、批量未读数等
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface MessageState {
  /** 未读消息总数（互动 + 系统通知），用于 TabBar 消息 tab 右上角红点 */
  unreadTotal: number
  /** 互动未读数（用于 MessageTabs 红点，虽然后台也可自行过滤，但统一放 store） */
  interactionUnread: number
  /** 系统通知未读数 */
  systemUnread: number
}

const initialState: MessageState = {
  unreadTotal: 0,
  interactionUnread: 0,
  systemUnread: 0,
}

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    /** 全量设置当前未读数（例如 Message 页面从接口/静态过滤后拿到） */
    setUnreadCounts(
      state,
      action: PayloadAction<{ interactionUnread: number; systemUnread: number }>
    ) {
      state.interactionUnread = action.payload.interactionUnread
      state.systemUnread = action.payload.systemUnread
      state.unreadTotal = action.payload.interactionUnread + action.payload.systemUnread
    },
    /** 清空未读（点击"全部已读"时调用，按 tab 分别清空） */
    clearAllUnread(state, action: PayloadAction<{ tab: 'interaction' | 'system' | 'both' }>) {
      if (action.payload.tab === 'interaction' || action.payload.tab === 'both') {
        state.interactionUnread = 0
      }
      if (action.payload.tab === 'system' || action.payload.tab === 'both') {
        state.systemUnread = 0
      }
      state.unreadTotal = state.interactionUnread + state.systemUnread
    },
    /** 单条互动消息标记已读 */
    decrementInteractionUnread(state) {
      if (state.interactionUnread > 0) state.interactionUnread -= 1
      state.unreadTotal = state.interactionUnread + state.systemUnread
    },
    /** 单条系统通知标记已读 */
    decrementSystemUnread(state) {
      if (state.systemUnread > 0) state.systemUnread -= 1
      state.unreadTotal = state.interactionUnread + state.systemUnread
    },
  },
})

export const {
  setUnreadCounts,
  clearAllUnread,
  decrementInteractionUnread,
  decrementSystemUnread,
} = messageSlice.actions
export default messageSlice.reducer
