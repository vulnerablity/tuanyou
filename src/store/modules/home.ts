//+ 首页模块Redux状态管理
//+ 管理轮播（slides）和Feed流（feed）数据
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getSlidesAPI, getFeedAPI } from '@/apis/home'
import type { SlideItem, FeedItem, PageResult } from '@/types'

//+ Feed查询参数接口
export interface FeedQueryParams {
  category?: number
  sort?: string
  page: number
  size: number
}

//+ 首页状态接口
export interface HomeState {
  //+ 轮播数据
  slides: SlideItem[]
  slidesLoading: boolean
  slidesError: string | null
  
  //+ Feed流数据
  feed: FeedItem[]
  feedTotal: number
  feedPage: number
  feedSize: number
  feedTotalPage: number
  feedLoading: boolean
  feedHasMore: boolean
  feedError: string | null
}

//+ 初始状态
const initialState: HomeState = {
  slides: [],
  slidesLoading: false,
  slidesError: null,
  
  feed: [],
  feedTotal: 0,
  feedPage: 1,
  feedSize: 10,
  feedTotalPage: 0,
  feedLoading: false,
  feedHasMore: true,
  feedError: null
}

//+ 获取轮播数据异步Action
export const fetchSlides = createAsyncThunk(
  'home/fetchSlides',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getSlidesAPI()
      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        return rejectWithValue(res.message || '获取轮播数据失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 获取Feed流数据异步Action
export const fetchFeed = createAsyncThunk(
  'home/fetchFeed',
  async (params: FeedQueryParams, { rejectWithValue }) => {
    try {
      const res = await getFeedAPI(params)
      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        return rejectWithValue(res.message || '获取Feed流失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 首页Slice
const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    //+ 重置Feed流
    resetFeed: (state) => {
      state.feed = []
      state.feedPage = 1
      state.feedHasMore = true
      state.feedError = null
    },
    //+ 追加Feed数据（加载更多）
    appendFeed: (state, action: PayloadAction<FeedItem[]>) => {
      state.feed = [...state.feed, ...action.payload]
    }
  },
  extraReducers: (builder) => {
    builder
      //+ 轮播
      .addCase(fetchSlides.pending, (state) => {
        state.slidesLoading = true
        state.slidesError = null
      })
      .addCase(fetchSlides.fulfilled, (state, action: PayloadAction<SlideItem[]>) => {
        state.slidesLoading = false
        state.slides = action.payload
      })
      .addCase(fetchSlides.rejected, (state, action) => {
        state.slidesLoading = false
        state.slidesError = action.payload as string
      })
      //+ Feed流
      .addCase(fetchFeed.pending, (state) => {
        state.feedLoading = true
        state.feedError = null
      })
      .addCase(fetchFeed.fulfilled, (state, action: PayloadAction<PageResult<FeedItem>>) => {
        state.feedLoading = false
        state.feed = action.payload.list
        state.feedTotal = action.payload.total
        state.feedPage = action.payload.page
        state.feedTotalPage = action.payload.total_page
        state.feedHasMore = action.payload.page < action.payload.total_page
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.feedLoading = false
        state.feedError = action.payload as string
      })
  }
})

//+ 导出Action
export const { resetFeed, appendFeed } = homeSlice.actions

//+ 导出Reducer
export default homeSlice.reducer
