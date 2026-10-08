//+ 上传模块 Redux 状态管理（request → api → store 链路）
//+ 统一管理：单张图片上传、批量图片上传、单个视频上传 三类任务的 loading 和返回结果
//+ 页面侧使用：dispatch(uploadImage({filePath,type})) → useSelector 读 lastImageUrl 等写回本地 form
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  uploadImage as uploadImageApi,
  uploadImages as uploadImagesApi,
  uploadVideo as uploadVideoApi
} from '@/apis/upload'
import type { UploadType } from '@/types/upload'

//+ 上传任务状态：空闲 / 加载中 / 成功 / 失败
export type UploadTaskStatus = 'idle' | 'loading' | 'success' | 'error'

//+ 上传模块 State
export interface UploadState {
  //+ 单张图片：上次上传结果
  imageStatus: UploadTaskStatus
  lastImageUrl: string | null
  //+ 批量图片：上次上传结果（1~N 张）
  imagesStatus: UploadTaskStatus
  lastImageUrls: string[]
  //+ 单个视频：上次上传结果 + OSS 截帧封面
  videoStatus: UploadTaskStatus
  lastVideoUrl: string | null
  lastVideoCoverUrl: string | null
  //+ 最近一次错误
  error: string | null
}

const initialState: UploadState = {
  imageStatus: 'idle',
  lastImageUrl: null,
  imagesStatus: 'idle',
  lastImageUrls: [],
  videoStatus: 'idle',
  lastVideoUrl: null,
  lastVideoCoverUrl: null,
  error: null
}

// ========== Async Thunks ==========

//+ 单张图片上传参数
export interface UploadImageParams {
  filePath: string
  type?: UploadType
}

//+ 上传单张图片，解包契约返回 { url }，thunk 直接吐出 url 字符串（与旧行为一致）
export const uploadImage = createAsyncThunk(
  'upload/uploadImage',
  async (params: UploadImageParams) => {
    const { url } = await uploadImageApi(params.filePath, params.type)
    return url
  }
)

//+ 批量图片上传参数
export interface UploadImagesParams {
  filePaths: string[]
  type?: UploadType
  maxCount?: number
}

//+ 上传批量图片，解包契约返回 { urls }，thunk 直接吐出 urls 数组（与旧行为一致）
export const uploadImages = createAsyncThunk(
  'upload/uploadImages',
  async (params: UploadImagesParams) => {
    const { urls } = await uploadImagesApi(
      params.filePaths,
      params.type,
      params.maxCount ?? 5
    )
    return urls
  }
)

//+ 单个视频上传参数
export interface UploadVideoParams {
  filePath: string
  type?: UploadType
}

export interface UploadVideoResult {
  videoUrl: string
  coverUrl: string
}

//+ 上传单个视频，解包契约返回 { videoUrl, coverUrl }
export const uploadVideo = createAsyncThunk(
  'upload/uploadVideo',
  async (params: UploadVideoParams) => {
    return await uploadVideoApi(params.filePath, params.type)
  }
)

// ========== Slice ==========

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    //+ 重置单个任务状态（避免下一次进入页面误读到上次结果）
    resetImage: (state) => {
      state.imageStatus = 'idle'
      state.lastImageUrl = null
      state.error = null
    },
    resetImages: (state) => {
      state.imagesStatus = 'idle'
      state.lastImageUrls = []
      state.error = null
    },
    resetVideo: (state) => {
      state.videoStatus = 'idle'
      state.lastVideoUrl = null
      state.lastVideoCoverUrl = null
      state.error = null
    },
    //+ 全量重置（组件卸载时调用）
    resetUpload: () => initialState,
    //+ 手动清错
    clearUploadError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // ---- 单张图片 ----
      .addCase(uploadImage.pending, (state) => {
        state.imageStatus = 'loading'
        state.lastImageUrl = null
        state.error = null
      })
      .addCase(uploadImage.fulfilled, (state, action: PayloadAction<string>) => {
        state.imageStatus = 'success'
        state.lastImageUrl = action.payload
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.imageStatus = 'error'
        state.error = action.error.message ?? '图片上传失败'
      })
      // ---- 批量图片 ----
      .addCase(uploadImages.pending, (state) => {
        state.imagesStatus = 'loading'
        state.lastImageUrls = []
        state.error = null
      })
      .addCase(uploadImages.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.imagesStatus = 'success'
        state.lastImageUrls = action.payload
      })
      .addCase(uploadImages.rejected, (state, action) => {
        state.imagesStatus = 'error'
        state.error = action.error.message ?? '图片上传失败'
      })
      // ---- 视频 ----
      .addCase(uploadVideo.pending, (state) => {
        state.videoStatus = 'loading'
        state.lastVideoUrl = null
        state.lastVideoCoverUrl = null
        state.error = null
      })
      .addCase(uploadVideo.fulfilled, (state, action: PayloadAction<UploadVideoResult>) => {
        state.videoStatus = 'success'
        state.lastVideoUrl = action.payload.videoUrl
        state.lastVideoCoverUrl = action.payload.coverUrl
      })
      .addCase(uploadVideo.rejected, (state, action) => {
        state.videoStatus = 'error'
        state.error = action.error.message ?? '视频上传失败'
      })
  }
})

//+ Actions
export const {
  resetImage,
  resetImages,
  resetVideo,
  resetUpload,
  clearUploadError
} = uploadSlice.actions

export default uploadSlice.reducer
