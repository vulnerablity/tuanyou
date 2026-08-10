//+ 文件上传API封装
//+ 对接后端：
//+   - POST /upload/image   单张图片（头像/封面/活动背景等）
//+   - POST /upload/images  批量图片（1~5 张，发布笔记时使用）
//+   - POST /upload/video   单个视频（返回 { videoUrl, coverUrl }，coverUrl 为 OSS 截帧地址）
//+ 策略：先走真实后端，失败降级 Mock；Mock 模式直接调用 mock/upload.ts 的函数
//+ 说明：文件上传走 Taro.uploadFile（multipart/form-data），不经 request.ts，
//+       因此 Mock 由本文件直接导入 mock/upload.ts 的生成函数调用，不走 mockRoutes 拦截。
import Taro from '@tarojs/taro'
import { getToken } from '@/utils/token'
import type { ResponseData } from '@/utils/request'
import { mockUploadImage, mockUploadImages, mockUploadVideo } from '@/mock/upload'

//+ 图片用途类型
export type UploadType = 'avatar' | 'cover' | 'note' | 'activity' | 'bg'

//+ 是否全局启用 Mock
const isMock = process.env.TARO_APP_USE_MOCK === 'true'

// ========== 图片相关 ==========

//+ 上传单张图片（POST /upload/image）
//+ 用于头像、封面、活动背景等单张场景；发布笔记时优先用批量接口
//+ H5 端注意：与视频上传同理，blob:/data: URL 走 fetch + FormData 避开 Taro.uploadFile 缺陷
export async function uploadImageAPI(
  filePath: string,
  type?: UploadType
): Promise<ResponseData<{ url: string }>> {
  if (isMock) {
    console.log('[Upload] Mock 模式：上传单张图片')
    return mockUploadImage(filePath)
  }

  const baseURL = process.env.TARO_APP_API_BASE || ''
  const token = getToken()
  const url = `${baseURL}/upload/image`

  try {
    //+ H5 端：blob:/data: URL 走 fetch + FormData
    const isH5Blob =
      typeof window !== 'undefined' &&
      typeof fetch === 'function' &&
      typeof FormData !== 'undefined' &&
      (filePath.startsWith('blob:') || filePath.startsWith('data:'))

    if (isH5Blob) {
      const blob = await fetch(filePath).then(r => r.blob())
      const formData = new FormData()
      formData.append('file', blob, `image_${Date.now()}.jpg`)
      if (type) formData.append('type', type)

      const res = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      })
      const data = await res.json()
      if (data.code === 0 || data.code === 200) {
        return { ...data, __fromMock: false }
      }
      throw new Error(data.message || '上传失败')
    }

    //+ 非 H5 / 非 blob 路径：走 Taro.uploadFile
    const uploadRes = await Taro.uploadFile({
      url,
      filePath,
      name: 'file',
      formData: type ? { type } : {},
      header: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const data = JSON.parse(uploadRes.data)
    if (data.code === 0 || data.code === 200) {
      return { ...data, __fromMock: false }
    }
    throw new Error(data.message || '上传失败')
  } catch (err: any) {
    //+ 真实上传失败，降级 Mock
    console.warn('[Upload] 单张图片真实上传失败，降级 Mock:', err?.message || err)
    return mockUploadImage(filePath)
  }
}

//+ H5 端通过 fetch + FormData 一次上传多张图片到 /upload/images
async function batchUploadImagesViaFetch(
  filePaths: string[],
  type?: UploadType
): Promise<ResponseData<{ urls: string[] }>> {
  const baseURL = process.env.TARO_APP_API_BASE || ''
  const token = getToken()

  const formData = new FormData()
  //+ 把本地临时路径转成真实文件（仅 H5 可行）
  for (let i = 0; i < filePaths.length; i++) {
    const fp = filePaths[i]
    //+ blob/data URL：尝试 fetch 内容并 append 二进制
    if (fp.startsWith('blob:') || fp.startsWith('data:')) {
      const blob = await fetch(fp).then(r => r.blob())
      formData.append('files', blob, `image_${i}.jpg`)
    } else {
      //+ 非 H5 blob 的路径（如本地文件路径），走回单张上传兜底
      throw new Error('unsupported-file-path')
    }
  }
  if (type) formData.append('type', type)

  const res = await fetch(`${baseURL}/upload/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  })
  const data = await res.json()
  if (data.code === 0 || data.code === 200) {
    return { ...data, __fromMock: false }
  }
  throw new Error(data.message || '批量上传失败')
}

//+ 批量上传图片（POST /upload/images，1~5 张）
//+ - H5 端：一次 fetch + FormData 真正批量上传
//+ - 其他端（小程序等）：退化为逐个调用 uploadImageAPI（Taro.uploadFile 只支持单文件）
//+ - 任何失败都走 Mock 降级
export async function uploadImagesAPI(
  filePaths: string[],
  type?: UploadType,
  maxCount = 5
): Promise<ResponseData<{ urls: string[] }>> {
  const targetPaths = filePaths.slice(0, maxCount)
  if (targetPaths.length === 0) {
    return { code: 0, message: '成功', data: { urls: [] }, __fromMock: isMock }
  }

  //+ Mock 模式：直接调用 mock 函数
  if (isMock) {
    console.log('[Upload] Mock 模式：上传批量图片')
    return mockUploadImages(targetPaths)
  }

  //+ 策略：H5 尝试真批量 fetch；失败或非 H5 走逐张兜底
  const isH5 = typeof window !== 'undefined' && typeof fetch === 'function' && typeof FormData !== 'undefined'
  try {
    if (isH5) {
      const res = await batchUploadImagesViaFetch(targetPaths, type)
      if (res.code === 0 || res.code === 200) return res
      throw new Error((res as any).message || '批量上传失败')
    }
    throw new Error('not-h5')
  } catch (outerErr: any) {
    //+ 不是 H5 / fetch 方式失败 → 逐张调用单张接口
    try {
      const urls: string[] = []
      for (const filePath of targetPaths) {
        const one = await uploadImageAPI(filePath, type)
        if (one.code === 0 || one.code === 200) urls.push(one.data.url)
      }
      return { code: 0, message: '成功', data: { urls }, __fromMock: false }
    } catch (innerErr: any) {
      //+ 逐张也失败 → 降级 Mock
      console.warn('[Upload] 批量图片上传全部失败，降级 Mock:', innerErr?.message || innerErr)
      return mockUploadImages(targetPaths)
    }
  }
}

// ========== 视频相关 ==========

//+ 上传单个视频（POST /upload/video）
//+ 后端返回：{ videoUrl, coverUrl }，其中 coverUrl 由 OSS 即时截帧（无需前端单独传封面）
//+ 发布笔记时：将 coverUrl 填入 images[0]，videoUrl 填入 videoUrl
//+ H5 端注意：Taro.chooseVideo 返回的 tempFilePath 是 blob: URL，
//+   Taro.uploadFile 在 H5 端无法正确处理 blob: URL（body 为空/格式错误，后端 400）；
//+   因此 H5 端检测到 blob:/data: 时改走 fetch + FormData 直接上传。
export async function uploadVideoAPI(
  filePath: string,
  type?: UploadType
): Promise<ResponseData<{ videoUrl: string; coverUrl: string }>> {
  if (isMock) {
    console.log('[Upload] Mock 模式：上传视频')
    return mockUploadVideo(filePath)
  }

  const baseURL = process.env.TARO_APP_API_BASE || ''
  const token = getToken()
  const url = `${baseURL}/upload/video`

  //+ 规范化响应：兼容后端旧字段 url，并按文档规则兜底拼 coverUrl
  const normalize = (data: any): ResponseData<{ videoUrl: string; coverUrl: string }> => {
    const d = data.data || {}
    const videoUrl: string = d.videoUrl || d.url || ''
    const coverUrl: string =
      d.coverUrl ||
      (videoUrl && !videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:')
        ? `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg`
        : videoUrl)
    return { ...data, data: { videoUrl, coverUrl }, __fromMock: false }
  }

  try {
    //+ H5 端：blob:/data: URL 走 fetch + FormData（避开 Taro.uploadFile 的 H5 blob 缺陷）
    const isH5Blob =
      typeof window !== 'undefined' &&
      typeof fetch === 'function' &&
      typeof FormData !== 'undefined' &&
      (filePath.startsWith('blob:') || filePath.startsWith('data:'))

    if (isH5Blob) {
      const blob = await fetch(filePath).then(r => r.blob())
      const formData = new FormData()
      formData.append('file', blob, `video_${Date.now()}.mp4`)
      if (type) formData.append('type', type)

      const res = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      })
      const data = await res.json()
      if (data.code === 0 || data.code === 200) {
        return normalize(data)
      }
      throw new Error(data.message || '上传失败')
    }

    //+ 非 H5 / 非 blob 路径（小程序端 tempFilePath 是真实文件路径）：走 Taro.uploadFile
    const uploadRes = await Taro.uploadFile({
      url,
      filePath,
      name: 'file',
      formData: type ? { type } : {},
      header: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const data = JSON.parse(uploadRes.data)
    if (data.code === 0 || data.code === 200) {
      return normalize(data)
    }
    throw new Error(data.message || '上传失败')
  } catch (err: any) {
    //+ 真实上传失败，降级 Mock
    console.warn('[Upload] 视频真实上传失败，降级 Mock:', err?.message || err)
    return mockUploadVideo(filePath)
  }
}
