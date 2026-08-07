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
    },
    //+ Q8：局部更新Feed流中单个卡片（点赞/收藏后同步）
    updateFeedItem: (state, action: PayloadAction<{ id: string; patch: Partial<FeedItem> }>) => {
      const { id, patch } = action.payload
      const item = state.feed.find(f => f.id === id)
      if (item) {
        Object.assign(item, patch)
      }
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
        //+ page===1 重置列表，page>1 追加（上拉加载更多）；以响应中的 page 为准
        const page = action.payload.page
        state.feed = page === 1 ? action.payload.list : [...state.feed, ...action.payload.list]
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
export const { resetFeed, appendFeed, updateFeedItem } = homeSlice.actions

//+ 导出Reducer
export default homeSlice.reducer
