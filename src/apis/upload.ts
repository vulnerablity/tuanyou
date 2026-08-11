//+ 文件上传API封装
//+ 对接后端：
//+   - POST /upload/images  批量图片（1~5 张），单张图片也走此接口传 1 张
//+     【注意】后端按最新《默认模块.md》落地，不再注册单张接口 /upload/image，
//+     因此 uploadImageAPI 内部改为复用批量接口传 1 张，返回 { urls: [url] } 再适配成 { url }。
//+   - POST /upload/video   单个视频（返回 { videoUrl, coverUrl }，coverUrl 为 OSS 截帧地址）
//+ 上传底层统一走 @/utils/request 暴露的 upload / uploadBatch 封装（含：baseURL 拼接、Authorization 注入、
//+   H5 blob→fetch+FormData 兼容、Mock 降级、响应规范化、401 跳转登录），
//+   与项目 get/post/del 风格保持一致，避免硬编码。
//+ Mock 实现来自 @/mock/upload（文件上传不走 request.ts 的 mockRoutes 拦截器）。
import type { UploadType } from '@/types/upload'
import { upload, uploadBatch } from '@/utils/request'
import type { ResponseData } from '@/utils/request'
import { mockUploadImage, mockUploadImages, mockUploadVideo } from '@/mock/upload'

// ========== 图片相关 ==========

//+ 上传单张图片（复用 POST /upload/images 批量接口传 1 张）
//+ 用于头像、封面、活动背景等单张场景；发布笔记时优先用批量接口
//+ 适配原因：后端按《默认模块.md》只实现了 /upload/images，旧接口 /upload/image 已 404。
//+ 调用方无需感知：返回结构仍为 { url: string }，与原契约一致。
export async function uploadImageAPI(
  filePath: string,
  type?: UploadType
): Promise<ResponseData<{ url: string }>> {
  //+ 直接走底层 uploadBatch，不要调用 uploadImagesAPI（后者在非 H5 兜底时会回调 uploadImageAPI，会死循环）
  try {
    const res = await uploadBatch<{ urls: string[] }>({
      url: '/upload/images',
      filePaths: [filePath],
      name: 'files',
      formData: type ? { type } : undefined
      //+ 注意：此处不传 mockFn，保证批量失败时直接抛错，再在下面 catch 中按单张语义降级
    })
    const urls = res.data?.urls ?? []
    const url = urls[0] ?? ''
    return { ...res, data: { url } }
  } catch (err: any) {
    //+ 业务错误：不降级 Mock，直接向上抛
    if (err && typeof err.code === 'number') throw err
    //+ 非 H5 端（小程序）uploadBatch 不支持真实批量 fetch 会抛 'batch-not-supported' / 'not-all-blob'
    //+   → 退回到 Taro.uploadFile 单张接口（仍然请求 /upload/images，fieldName='files'）
    //+   → 若仍然失败再 Mock 降级
    try {
      const singleRes = await upload<{ url: string }>({
        url: '/upload/images',
        filePath,
        name: 'files', //+ 后端批量接口字段名仍为 'files'
        formData: type ? { type } : undefined,
        //+ Taro.uploadFile 返回结构是 { urls: [...] } 时需做一次适配，
        //+   但 upload 只做 JSON 解析，所以在下面再 normalize。
        mockFn: (fp) => mockUploadImage(fp) as any
      })
      //+ 兼容两种返回：{ url } 或 { urls: [url] }
      const d: any = (singleRes as any).data || {}
      const url: string = d.url ?? (Array.isArray(d.urls) ? d.urls[0] : '') ?? ''
      return { ...(singleRes as any), data: { url } }
    } catch (innerErr: any) {
      if (innerErr && typeof innerErr.code === 'number') throw innerErr
      return mockUploadImage(filePath)
    }
  }
}

//+ 批量上传图片（POST /upload/images，1~5 张）
//+ - H5 端：uploadBatch → fetch + FormData 真正批量上传
//+ - 其他端（小程序等）：退化为逐个调用 uploadImageAPI（Taro.uploadFile 只支持单文件）
//+ - 任何失败都走 Mock 降级
export async function uploadImagesAPI(
  filePaths: string[],
  type?: UploadType,
  maxCount = 5
): Promise<ResponseData<{ urls: string[] }>> {
  const targetPaths = filePaths.slice(0, maxCount)
  if (targetPaths.length === 0) {
    return { code: 0, message: '成功', data: { urls: [] } }
  }

  //+ 先尝试走统一的批量上传（H5 真正批量 fetch；非 H5 会抛 batch-not-supported 然后触发 Mock 降级，
  //+   但我们需要"非 H5 兜底到逐张上传"而不是直接 Mock，所以用 try/catch 捕获后手动兜底）
  try {
    const res = await uploadBatch<{ urls: string[] }>({
      url: '/upload/images',
      filePaths: targetPaths,
      name: 'files',
      formData: type ? { type } : undefined,
      //+ 注意：此处不直接传 mockFn 给 uploadBatch，避免"逐张上传还没试就 Mock 降级"
    })
    return res
  } catch (err: any) {
    //+ 业务错误：直接抛
    if (err && typeof err.code === 'number') throw err

    //+ 非 H5 / 不支持批量 → 逐张调用 uploadImageAPI 兜底
    try {
      const urls: string[] = []
      for (const fp of targetPaths) {
        const one = await uploadImageAPI(fp, type)
        if (one.code === 0 || one.code === 200) urls.push(one.data.url)
      }
      return { code: 0, message: '成功', data: { urls } }
    } catch (innerErr: any) {
      //+ 逐张也失败 → Mock 降级
      if (innerErr && typeof innerErr.code === 'number') throw innerErr
      return mockUploadImages(targetPaths)
    }
  }
}

// ========== 视频相关 ==========

//+ 上传单个视频（POST /upload/video）
//+ 后端返回：{ videoUrl, coverUrl }，其中 coverUrl 由 OSS 即时截帧（无需前端单独传封面）
//+ 发布笔记时：将 coverUrl 填入 images[0]，videoUrl 填入 videoUrl
export async function uploadVideoAPI(
  filePath: string,
  type?: UploadType
): Promise<ResponseData<{ videoUrl: string; coverUrl: string }>> {
  //+ 注意：真实后端可能返回字段 { videoUrl, coverUrl } 或旧字段 { url }；
  //+       request.upload 只解析 JSON，不再做字段兼容，
  //+       因此在拿到结果后做一次 normalize，保证调用方永远拿到 videoUrl+coverUrl
  const raw = await upload<any>({
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
  return { ...raw, data: { videoUrl, coverUrl } }
}

//+ 为了保持 `import { UploadType } from '@/apis/upload'` 历史代码（如有）继续工作，做一次 re-export
export type { UploadType }
