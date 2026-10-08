//+ 文件上传API封装（统一对外返回解包后的 data，内部仍走底层 upload/uploadBatch 信封）
//+ 对接后端：
//+   - POST /upload/images  批量图片（1~5 张），单张图片也走此接口传 1 张
//+     后端只实现 /upload/images，旧单图接口 /upload/image 已 404；
//+     uploadImage 内部复用批量接口传 1 张，再适配成 { url }。
//+   - POST /upload/video   单个视频（返回 { videoUrl, coverUrl }，coverUrl 为 OSS 截帧地址）
//+ 上传底层统一走 @/utils/request 暴露的 upload / uploadBatch（含：baseURL 拼接、Authorization 注入、
//+   H5 blob→fetch+FormData 兼容、Mock 降级、响应规范化、401 跳转登录）。
//+ Mock 实现来自 @/mock/upload（文件上传不走 request.ts 的 mockRoutes 拦截器）。
import type { UploadType } from '@/types/upload'
import { upload, uploadBatch } from '@/utils/request'
import { mockUploadImage, mockUploadImages, mockUploadVideo } from '@/mock/upload'

//+ 单图上传结果
export type UploadImageResult = { url: string }
//+ 批量图片上传结果
export type UploadImagesResult = { urls: string[] }
//+ 视频上传结果
export type UploadVideoResult = { videoUrl: string; coverUrl: string }

//+ 判断是否为业务错误信封（{code, message}）：业务错误不降级，直接向上抛
function isBusinessError(err: unknown): boolean {
  return !!err && typeof err === 'object' && typeof (err as { code?: unknown }).code === 'number'
}

// ========== 图片相关 ==========

//+ 上传单张图片（复用 POST /upload/images 批量接口传 1 张）
//+ 用于头像、封面、活动背景等单张场景；发布笔记时优先用批量接口
//+ 调用方拿到 { url }：后端批量接口返回 { urls:[url] }，这里取第 0 项适配。
export async function uploadImage(
  filePath: string,
  type?: UploadType
): Promise<UploadImageResult> {
  //+ 直接走底层 uploadBatch，不要调用 uploadImages（后者在非 H5 兜底时会回调 uploadImage，死循环）
  try {
    const res = await uploadBatch<{ urls: string[] }>({
      url: '/upload/images',
      filePaths: [filePath],
      name: 'files',
      formData: type ? { type } : undefined
      //+ 注意：此处不传 mockFn，保证批量失败时直接抛错，再在下面 catch 中按单张语义降级
    })
    const url = res.data?.urls?.[0] ?? ''
    return { url }
  } catch (err: unknown) {
    //+ 业务错误：不降级 Mock，直接向上抛
    if (isBusinessError(err)) throw err
    //+ 非 H5 端（小程序）uploadBatch 不支持真实批量 fetch 会抛 'batch-not-supported' / 'not-all-blob'
    //+   → 退回到 Taro.uploadFile 单张接口（仍请求 /upload/images，fieldName='files'）
    //+   → 若仍然失败再 Mock 降级
    try {
      const single = await upload<{ url?: string; urls?: string[] }>({
        url: '/upload/images',
        filePath,
        name: 'files', //+ 后端批量接口字段名仍为 'files'
        formData: type ? { type } : undefined,
        mockFn: (fp) => mockUploadImage(fp)
      })
      //+ 兼容两种返回：{ url } 或 { urls: [url] }
      const d = single.data || {}
      const url = d.url ?? (Array.isArray(d.urls) ? d.urls[0] : '') ?? ''
      return { url }
    } catch (innerErr: unknown) {
      if (isBusinessError(innerErr)) throw innerErr
      //+ 兜底 Mock：mockUploadImage 返回信封，取 data.url
      return { url: mockUploadImage(filePath).data.url }
    }
  }
}

//+ 批量上传图片（POST /upload/images，1~5 张）
//+ - H5 端：uploadBatch → fetch + FormData 真正批量上传
//+ - 其他端（小程序等）：退化为逐个调用 uploadImage（Taro.uploadFile 只支持单文件）
//+ - 任何失败都走 Mock 降级
export async function uploadImages(
  filePaths: string[],
  type?: UploadType,
  maxCount = 5
): Promise<UploadImagesResult> {
  const targetPaths = filePaths.slice(0, maxCount)
  if (targetPaths.length === 0) {
    return { urls: [] }
  }

  //+ 先尝试统一批量上传（H5 真正批量 fetch；非 H5 会抛 batch-not-supported 后手动兜底逐张）
  try {
    const res = await uploadBatch<{ urls: string[] }>({
      url: '/upload/images',
      filePaths: targetPaths,
      name: 'files',
      formData: type ? { type } : undefined
      //+ 不直接传 mockFn 给 uploadBatch，避免"逐张上传还没试就 Mock 降级"
    })
    return { urls: res.data?.urls ?? [] }
  } catch (err: unknown) {
    //+ 业务错误：直接抛
    if (isBusinessError(err)) throw err

    //+ 非 H5 / 不支持批量 → 逐张调用 uploadImage 兜底
    try {
      const urls: string[] = []
      for (const fp of targetPaths) {
        const one = await uploadImage(fp, type)
        urls.push(one.url)
      }
      return { urls }
    } catch (innerErr: unknown) {
      //+ 逐张也失败 → Mock 降级
      if (isBusinessError(innerErr)) throw innerErr
      return { urls: mockUploadImages(targetPaths).data.urls }
    }
  }
}

// ========== 视频相关 ==========

//+ 上传单个视频（POST /upload/video）
//+ 后端返回：{ videoUrl, coverUrl }，其中 coverUrl 由 OSS 即时截帧（无需前端单独传封面）
//+ 发布笔记时：将 coverUrl 填入 images[0]，videoUrl 填入 videoUrl
export async function uploadVideo(
  filePath: string,
  type?: UploadType
): Promise<UploadVideoResult> {
  //+ 兼容真实后端 { videoUrl, coverUrl } 或旧字段 { url }，拿到结果后统一 normalize
  const raw = await upload<{ videoUrl?: string; url?: string; coverUrl?: string }>({
    url: '/upload/video',
    filePath,
    name: 'file',
    formData: type ? { type } : undefined,
    mockFn: mockUploadVideo
  })
  const d = raw.data || {}
  const videoUrl: string = d.videoUrl || d.url || ''
  const coverUrl: string =
    d.coverUrl ||
    (videoUrl && !videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:')
      ? `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg`
      : videoUrl)
  return { videoUrl, coverUrl }
}

//+ 为保持 `import { UploadType } from '@/apis/upload'` 历史用法继续可用，做一次 re-export
export type { UploadType }
