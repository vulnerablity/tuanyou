//+ 攻略模块Redux状态管理
//+ 与笔记模块（note.ts）结构对称，便于复用与未来扩展
//+ 说明：本模块仅承接"已写好的攻略相关代码"，不主动扩展新功能
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  getGuidesAPI,
  getGuideDetailAPI,
  toggleGuideLikeAPI,
  toggleGuideFavoriteAPI,
  getGuideCommentsAPI,
  deleteGuideAPI
} from '@/apis/guide'
import type { Post, PageResult, Comment } from '@/types'

//+ 攻略查询参数接口
export interface GuideQueryParams {
  category?: number
  sort?: string
  page: number
  size: number
}

//+ 攻略详情参数接口
export interface GuideDetailQueryParams {
  id: string
}

//+ 攻略状态接口（与 NoteState 对称）
export interface GuideState {
  //+ 攻略列表
  guides: Post[]
  total: number
  page: number
  size: number
  totalPage: number
  loading: boolean
  hasMore: boolean
  error: string | null
  //+ 攻略详情
  guideDetail: Post | null
  //+ 攻略评论列表
  comments: Comment[] | null
}

//+ 初始状态
const initialState: GuideState = {
  guides: [],
  total: 0,
  page: 1,
  size: 10,
  totalPage: 0,
  loading: false,
  hasMore: true,
  error: null,
  guideDetail: null,
  comments: null
}

//+ 获取攻略列表异步Action
export const fetchGuides = createAsyncThunk(
  'guide/fetchGuides',
  async (params: GuideQueryParams, { rejectWithValue }) => {
    try {
      const res = await getGuidesAPI(params)
      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        return rejectWithValue(res.message || '获取攻略列表失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 获取攻略详情异步Action
export const fetchGuideDetail = createAsyncThunk(
  'guide/fetchGuideDetail',
  async (params: GuideDetailQueryParams, { rejectWithValue }) => {
    try {
      const res = await getGuideDetailAPI(params.id)
      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        return rejectWithValue(res.message || '获取攻略详情失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 攻略点赞/取消点赞
//+ Pending 阶段做乐观更新（立即翻转 UI），Rejected 回滚，Fulfilled 用后端真实值校准
export const toggleLike = createAsyncThunk(
  'guide/toggleLike',
  async (id: string, { rejectWithValue, signal }) => {
    try {
      const res = await toggleGuideLikeAPI(id, signal)
      if (res.code === 0 || res.code === 200) {
        return { id, ...(res.data || {}) }
      } else {
        return rejectWithValue(res.message || '操作失败')
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return rejectWithValue('aborted')
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 攻略收藏/取消收藏
//+ Pending 阶段做乐观更新，Rejected 回滚，Fulfilled 用后端真实值校准
export const toggleFavorite = createAsyncThunk(
  'guide/toggleFavorite',
  async (id: string, { rejectWithValue, signal }) => {
    try {
      const res = await toggleGuideFavoriteAPI(id, signal)
      if (res.code === 0 || res.code === 200) {
        return { id, ...(res.data || {}) }
      } else {
        return rejectWithValue(res.message || '操作失败')
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return rejectWithValue('aborted')
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 获取攻略评论列表异步Action
export const fetchGuideComments = createAsyncThunk(
  'guide/fetchGuideComments',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await getGuideCommentsAPI(id)
      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        return rejectWithValue(res.message || '获取攻略评论列表失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 删除攻略异步Action
export const deleteGuide = createAsyncThunk(
  'guide/deleteGuide',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await deleteGuideAPI(id)
      if (res.code === 0 || res.code === 200) {
        return { id }
      } else {
        return rejectWithValue(res.message || '删除攻略失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 攻略Slice
const guideSlice = createSlice({
  name: 'guide',
  initialState,
  reducers: {
    //+ 重置攻略列表
    resetGuides: (state) => {
      state.guides = []
      state.page = 1
      state.hasMore = true
      state.error = null
    },
    //+ 更新攻略列表（替换）
    setGuides: (state, action: PayloadAction<Post[]>) => {
      state.guides = action.payload
    },
    //+ 追加攻略列表（加载更多）
    appendGuides: (state, action: PayloadAction<Post[]>) => {
      state.guides = [...state.guides, ...action.payload]
    },
    //+ 更新攻略详情
    setGuideDetail: (state, action: PayloadAction<Post>) => {
      state.guideDetail = action.payload
    },
    //+ 局部更新攻略详情（用于点赞/收藏/关注后同步状态）
    patchGuideDetail: (state, action: PayloadAction<Partial<Post>>) => {
      if (state.guideDetail) {
        state.guideDetail = { ...state.guideDetail, ...action.payload }
      }
    },
    //+ 更新攻略评论列表
    setGuideComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuides.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGuides.fulfilled, (state, action: PayloadAction<PageResult<Post>>) => {
        state.loading = false
        state.guides = action.payload.list
        state.total = action.payload.total
        state.page = action.payload.page
        state.totalPage = action.payload.total_page || 0
        state.hasMore = action.payload.page < (action.payload.total_page || 0)
      })
      .addCase(fetchGuides.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      //+ 点赞：pending 阶段立即乐观翻转 UI，rejected 回滚，fulfilled 用后端值校准
      .addCase(toggleLike.pending, (state, action) => {
        const id = action.meta.arg
        const guide = state.guides.find(g => g.id === id)
        if (guide) {
          guide.isLiked = !guide.isLiked
          guide.likeCount = guide.likeCount + (guide.isLiked ? 1 : -1)
        }
        if (state.guideDetail && state.guideDetail.id === id) {
          state.guideDetail.isLiked = !state.guideDetail.isLiked
          state.guideDetail.likeCount = state.guideDetail.likeCount + (state.guideDetail.isLiked ? 1 : -1)
        }
      })
      .addCase(toggleLike.fulfilled, (state, action: PayloadAction<{ id: string; isLiked?: boolean; likeCount?: number }>) => {
        const id = action.payload.id
        const guide = state.guides.find(g => g.id === id)
        if (guide) {
          if (typeof action.payload.isLiked === 'boolean') guide.isLiked = action.payload.isLiked
          if (typeof action.payload.likeCount === 'number') guide.likeCount = action.payload.likeCount
        }
        if (state.guideDetail && state.guideDetail.id === id) {
          if (typeof action.payload.isLiked === 'boolean') state.guideDetail.isLiked = action.payload.isLiked
          if (typeof action.payload.likeCount === 'number') state.guideDetail.likeCount = action.payload.likeCount
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        if (action.payload === 'aborted') return
        const id = action.meta.arg
        const guide = state.guides.find(g => g.id === id)
        if (guide) {
          guide.isLiked = !guide.isLiked
          guide.likeCount = guide.likeCount + (guide.isLiked ? 1 : -1)
        }
        if (state.guideDetail && state.guideDetail.id === id) {
          state.guideDetail.isLiked = !state.guideDetail.isLiked
          state.guideDetail.likeCount = state.guideDetail.likeCount + (state.guideDetail.isLiked ? 1 : -1)
        }
      })
      //+ 收藏：pending 乐观翻转，rejected 回滚，fulfilled 校准
      .addCase(toggleFavorite.pending, (state, action) => {
        const id = action.meta.arg
        const guide = state.guides.find(g => g.id === id)
        if (guide) guide.isFavorited = !guide.isFavorited
        if (state.guideDetail && state.guideDetail.id === id) {
          state.guideDetail.isFavorited = !state.guideDetail.isFavorited
        }
      })
      .addCase(toggleFavorite.fulfilled, (state, action: PayloadAction<{ id: string; isFavorited?: boolean }>) => {
        const guide = state.guides.find(g => g.id === action.payload.id)
        if (guide && typeof action.payload.isFavorited === 'boolean') {
          guide.isFavorited = action.payload.isFavorited
        }
        if (state.guideDetail && state.guideDetail.id === action.payload.id && typeof action.payload.isFavorited === 'boolean') {
          state.guideDetail.isFavorited = action.payload.isFavorited
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        if (action.payload === 'aborted') return
        const id = action.meta.arg
        const guide = state.guides.find(g => g.id === id)
        if (guide) guide.isFavorited = !guide.isFavorited
        if (state.guideDetail && state.guideDetail.id === id) {
          state.guideDetail.isFavorited = !state.guideDetail.isFavorited
        }
      })
      .addCase(fetchGuideDetail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGuideDetail.fulfilled, (state, action: PayloadAction<Post>) => {
        state.loading = false
        state.guideDetail = action.payload
      })
      .addCase(fetchGuideDetail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchGuideComments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGuideComments.fulfilled, (state, action: PayloadAction<Comment[]>) => {
        state.loading = false
        state.comments = action.payload
      })
      .addCase(fetchGuideComments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      //+ 删除攻略
      .addCase(deleteGuide.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        //+ 从列表中移除已删除项
        state.guides = state.guides.filter(g => g.id !== action.payload.id)
        //+ 如果删除的是当前详情，清空详情
        if (state.guideDetail && state.guideDetail.id === action.payload.id) {
          state.guideDetail = null
        }
      })
  }
})

//+ 导出Action
export const {
  resetGuides,
  setGuides,
  appendGuides,
  setGuideDetail,
  patchGuideDetail,
  setGuideComments
} = guideSlice.actions

//+ 导出Reducer
export default guideSlice.reducer
