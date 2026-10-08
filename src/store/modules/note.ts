//+ 笔记模块Redux状态管理
//+ 说明：攻略相关逻辑已拆分到 src/store/modules/guide.ts，本模块仅处理笔记
//+ 复用约定：与 guide.ts 保持结构对称，便于列表/详情/点赞/收藏逻辑复用
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  getNotes,
  toggleNoteLike,
  toggleNoteFavorite,
  getNoteDetail,
  getNoteComments,
  deleteNote as deleteNoteApi
} from '@/apis/note'
import type { Post, PageResult, Comment } from '@/types'

//+ 笔记查询参数接口
export interface NoteQueryParams {
  category?: number
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
  //+ 笔记详情（笔记或攻略）
  noteDetail: Post | null
  //+ 笔记评论列表
  comments: Comment[] | null
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
  //+ 笔记评论列表
  comments: null,
}

//+ 获取笔记详情异步Action
export const fetchNoteDetail = createAsyncThunk(
  'note/fetchNoteDetail',
  async (params: NoteDetailQueryParams) => {
    return await getNoteDetail(params.id, params.type)
  }
)

//+ 获取笔记列表异步Action
export const fetchNotes = createAsyncThunk(
  'note/fetchNotes',
  async (params: NoteQueryParams) => {
    return await getNotes(params)
  }
)

//+ 笔记点赞/取消点赞（攻略请使用 guide 模块的 toggleLike）
//+ Pending 阶段做乐观更新（立即翻转 UI），Rejected 回滚（AbortError 除外），Fulfilled 用后端真实值校准
export const toggleLike = createAsyncThunk(
  'note/toggleLike',
  async (id: string, { signal }) => {
    const data = await toggleNoteLike(id, signal)
    return { id, ...data }
  }
)

//+ 笔记收藏/取消收藏（攻略请使用 guide 模块的 toggleFavorite）
//+ Pending 阶段做乐观更新，Rejected 回滚（AbortError 除外），Fulfilled 用后端真实值校准
export const toggleFavorite = createAsyncThunk(
  'note/toggleFavorite',
  async (id: string, { signal }) => {
    const data = await toggleNoteFavorite(id, signal)
    return { id, ...data }
  }
)

//+ 获取笔记评论列表异步Action
export const fetchNoteComments = createAsyncThunk(
  'note/fetchNoteComments',
  async (id: string) => {
    return await getNoteComments(id)
  }
)

//+ 删除笔记异步Action
export const deleteNote = createAsyncThunk(
  'note/deleteNote',
  async (id: string) => {
    await deleteNoteApi(id)
    return { id }
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
    setNoteDetail: (state, action: PayloadAction<Post>) => {
      state.noteDetail = action.payload
    },
    //+ 局部更新笔记详情（用于点赞/收藏/关注后同步状态）
    patchNoteDetail: (state, action: PayloadAction<Partial<Post>>) => {
      if (state.noteDetail) {
        state.noteDetail = { ...state.noteDetail, ...action.payload }
      }
    },
    //+ 更新笔记评论列表
    setNoteComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments = action.payload
    },
  },
  extraReducers: (builder) => {
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
        state.totalPage = action.payload.total_page || 0
        state.hasMore = action.payload.page < (action.payload.total_page || 0)
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '网络错误'
      })
      //+ 点赞：pending 阶段立即乐观翻转 UI，rejected 回滚（AbortError 除外），fulfilled 用后端值校准
      .addCase(toggleLike.pending, (state, action) => {
        const id = action.meta.arg
        // 1. 乐观更新列表项
        const note = state.notes.find(n => n.id === id)
        if (note) {
          note.isLiked = !note.isLiked
          note.likeCount = note.likeCount + (note.isLiked ? 1 : -1)
        }
        // 2. 乐观更新详情
        if (state.noteDetail && state.noteDetail.id === id) {
          state.noteDetail.isLiked = !state.noteDetail.isLiked
          state.noteDetail.likeCount = state.noteDetail.likeCount + (state.noteDetail.isLiked ? 1 : -1)
        }
      })
      .addCase(toggleLike.fulfilled, (state, action: PayloadAction<{ id: string; isLiked?: boolean; likeCount?: number }>) => {
        const id = action.payload.id
        // 1. 用后端真实值校准列表（防止乐观值偏差）
        const note = state.notes.find(n => n.id === id)
        if (note) {
          if (typeof action.payload.isLiked === 'boolean') note.isLiked = action.payload.isLiked
          if (typeof action.payload.likeCount === 'number') note.likeCount = action.payload.likeCount
        }
        // 2. 用后端真实值校准详情
        if (state.noteDetail && state.noteDetail.id === id) {
          if (typeof action.payload.isLiked === 'boolean') state.noteDetail.isLiked = action.payload.isLiked
          if (typeof action.payload.likeCount === 'number') state.noteDetail.likeCount = action.payload.likeCount
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        //+ AbortController 主动取消：丢弃过期响应，不做回滚
        if (action.error.name === 'AbortError') return
        const id = action.meta.arg
        // 回滚：再翻转一次
        const note = state.notes.find(n => n.id === id)
        if (note) {
          note.isLiked = !note.isLiked
          note.likeCount = note.likeCount + (note.isLiked ? 1 : -1)
        }
        if (state.noteDetail && state.noteDetail.id === id) {
          state.noteDetail.isLiked = !state.noteDetail.isLiked
          state.noteDetail.likeCount = state.noteDetail.likeCount + (state.noteDetail.isLiked ? 1 : -1)
        }
      })
      //+ 收藏：pending 乐观翻转，rejected 回滚（AbortError 除外），fulfilled 校准
      .addCase(toggleFavorite.pending, (state, action) => {
        const id = action.meta.arg
        const note = state.notes.find(n => n.id === id)
        if (note) note.isFavorited = !note.isFavorited
        if (state.noteDetail && state.noteDetail.id === id) {
          state.noteDetail.isFavorited = !state.noteDetail.isFavorited
        }
      })
      .addCase(toggleFavorite.fulfilled, (state, action: PayloadAction<{ id: string; isFavorited?: boolean }>) => {
        const note = state.notes.find(n => n.id === action.payload.id)
        if (note && typeof action.payload.isFavorited === 'boolean') {
          note.isFavorited = action.payload.isFavorited
        }
        if (state.noteDetail && state.noteDetail.id === action.payload.id && typeof action.payload.isFavorited === 'boolean') {
          state.noteDetail.isFavorited = action.payload.isFavorited
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        //+ AbortController 主动取消：丢弃过期响应，不做回滚
        if (action.error.name === 'AbortError') return
        const id = action.meta.arg
        const note = state.notes.find(n => n.id === id)
        if (note) note.isFavorited = !note.isFavorited
        if (state.noteDetail && state.noteDetail.id === id) {
          state.noteDetail.isFavorited = !state.noteDetail.isFavorited
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
        state.error = action.error.message ?? '网络错误'
      })
      .addCase(fetchNoteComments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNoteComments.fulfilled, (state, action: PayloadAction<Comment[]>) => {
        state.loading = false
        state.comments = action.payload
      })
      .addCase(fetchNoteComments.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? '网络错误'
      })
      //+ 删除笔记
      .addCase(deleteNote.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        //+ 从列表中移除已删除项
        state.notes = state.notes.filter(n => n.id !== action.payload.id)
        //+ 如果删除的是当前详情，清空详情
        if (state.noteDetail && state.noteDetail.id === action.payload.id) {
          state.noteDetail = null
        }
      })
  }
})

//+ 导出Action
export const { resetNotes, setNotes, appendNotes, setNoteDetail, patchNoteDetail, setNoteComments } = noteSlice.actions

//+ 导出Reducer
export default noteSlice.reducer
