//+ Redux Store配置
import { configureStore } from '@reduxjs/toolkit'
import userReducer from './modules/user'
import noteReducer from './modules/note'
import activityReducer from './modules/activity'
import homeReducer from './modules/home'

//+ 创建Store
export const store = configureStore({
  reducer: {
    user: userReducer,
    note: noteReducer,
    activity: activityReducer,
    home: homeReducer
  }
})

//+ 导出类型
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
