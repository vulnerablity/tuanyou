//+ 活动模块Redux状态管理
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getActivityBannersAPI } from '@/apis/activity'
import type { ActivityBanner } from '@/types'

//+ 活动状态接口
export interface ActivityState {
  banners: ActivityBanner[]
  loading: boolean
  error: string | null
}

//+ 初始状态
const initialState: ActivityState = {
  banners: [],
  loading: false,
  error: null
}

//+ 获取活动Banner异步Action
export const fetchBanners = createAsyncThunk(
  'activity/fetchBanners',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getActivityBannersAPI()
      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        return rejectWithValue(res.message || '获取活动Banner失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 活动Slice
const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false
        state.banners = action.payload
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

//+ 导出Reducer
export default activitySlice.reducer
