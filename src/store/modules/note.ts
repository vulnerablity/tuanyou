//+ 笔记模块Redux状态管理
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { getNotesAPI, toggleNoteLikeAPI, toggleNoteFavoriteAPI ,getNoteDetailAPI} from '@/apis/note'
import type {Post,PageResult } from '@/types'

//+ 笔记查询参数接口
//+ type为后端检索字段：笔记/攻略/视频
export interface NoteQueryParams {
  category?: string   
  sort?: string
  type?: string
  page: number
  size: number
}
//+ 笔记详情参数接口
export interface NoteDetailQueryParams {
  id: string
  type?: string
}

//+ 笔记状态接口
export interface NoteState {
  //+ 笔记列表
  notes: Post[]
  total: number
  page: number
  size: number
  totalPage: number
  loading: boolean
  hasMore: boolean
  error: string | null
  //+ 笔记详情
  noteDetail: Post | null
}

//+ 初始状态
const initialState: NoteState = {
  //+ 笔记列表
  notes: [],
  total: 0,
  page: 1,
  size: 10,
  totalPage: 0,
  loading: false,
  hasMore: true,
  error: null,
  //+ 笔记详情
  noteDetail: null,
 
}
//获取笔记详情异步Action
export const fetchNoteDetail= createAsyncThunk(
  'note/fetchNoteDetail',
  async (params: NoteDetailQueryParams, { rejectWithValue }) => {
    try {
      const res = await getNoteDetailAPI(params.id, params.type)
      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        return rejectWithValue(res.message || '获取笔记详情失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 获取笔记列表异步Action
export const fetchNotes = createAsyncThunk(
  'note/fetchNotes',
  async (params: NoteQueryParams, { rejectWithValue }) => {
    try {
      const res = await getNotesAPI(params)
      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        return rejectWithValue(res.message || '获取笔记列表失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 笔记点赞异步Action
export const toggleLike = createAsyncThunk(
  'note/toggleLike',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await toggleNoteLikeAPI(id)
      if (res.code === 0 || res.code === 200) {
        return { id, ...res.data }
      } else {
        return rejectWithValue(res.message || '操作失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 笔记收藏异步Action
export const toggleFavorite = createAsyncThunk(
  'note/toggleFavorite',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await toggleNoteFavoriteAPI(id)
      if (res.code === 0 || res.code === 200) {
        return { id, ...res.data }
      } else {
        return rejectWithValue(res.message || '操作失败')
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误')
    }
  }
)

//+ 笔记Slice
const noteSlice = createSlice({
  name: 'note',
  initialState,
  reducers: {
    //+ 重置笔记列表
    resetNotes: (state) => {
      state.notes = []
      state.page = 1
      state.hasMore = true
      state.error = null
    },
    //+ 更新笔记列表（替换）
    setNotes: (state, action: PayloadAction<Post[]>) => {
      state.notes = action.payload
    },
    //+ 追加笔记列表（加载更多）
    appendNotes: (state, action: PayloadAction<Post[]>) => {
      state.notes = [...state.notes, ...action.payload]
    },
    //+ 更新笔记详情
    //+ 用于在获取笔记详情成功后，更新状态中的noteDetail
    setNoteDetail: (state, action: PayloadAction<Post>) => {
      state.noteDetail = action.payload
    },

  },
  extraReducers: (builder) => {
// 以下是对extraReducers中每个addCase的解释：
// 1. fetchNotes.pending: 获取笔记列表请求发出时，将loading设为true，清空之前的错误信息
// 2. fetchNotes.fulfilled: 获取笔记列表成功时，更新笔记数据、总数、当前页、总页数，并根据是否还有更多数据设置hasMore
// 3. fetchNotes.rejected: 获取笔记列表失败时，将loading设为false，保存错误信息到error
// 4. toggleLike.fulfilled: 点赞/取消点赞成功时，更新对应笔记的点赞状态和点赞数量
// 5. toggleFavorite.fulfilled: 收藏/取消收藏成功时，更新对应笔记的收藏状态
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotes.fulfilled, (state, action: PayloadAction<PageResult<Post>>) => {
        state.loading = false
        state.notes = action.payload.list
        state.total = action.payload.total
        state.page = action.payload.page
        state.totalPage = action.payload.total_page
        state.hasMore = action.payload.page < action.payload.total_page
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(toggleLike.fulfilled, (state, action: PayloadAction<{ id: string; isLiked: boolean; likeCount: number }>) => {
        const note = state.notes.find(n => n.id === action.payload.id)
        if (note) {
          note.isLiked = action.payload.isLiked
          note.likeCount = action.payload.likeCount
        }
      })
      .addCase(toggleFavorite.fulfilled, (state, action: PayloadAction<{ id: string; isFavorited: boolean }>) => {
        const note = state.notes.find(n => n.id === action.payload.id)
        if (note) {
          note.isFavorited = action.payload.isFavorited
        }
      })
      .addCase(fetchNoteDetail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNoteDetail.fulfilled, (state, action: PayloadAction<Post>) => {
        state.loading = false
        state.noteDetail = action.payload
       
      })
      .addCase(fetchNoteDetail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

//+ 导出Action
export const { resetNotes, setNotes, appendNotes } = noteSlice.actions

//+ 导出Reducer
export default noteSlice.reducer
