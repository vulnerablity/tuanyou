//+ 上传模块Mock数据和路由
//+ 对应后端：POST /upload/image、POST /upload/images、POST /upload/video
//+ 注意：文件上传走 Taro.uploadFile（multipart/form-data），不经 request.ts，
//+       因此 mockRoutes 无法自动拦截；实际 Mock 由 apis/upload.ts 直接导入本文件函数调用。
//+       这里的 uploadMockRoutes 仅作结构占位，保持与其他模块一致的组织方式。
import { successResponse } from './utils'
import type { MockHandler, MockData } from './utils'

//+ Mock 单张图片上传
//+ 若是本地 blob/data URL（H5 开发预览），直接回显；否则用 picsum 占位图
export function mockUploadImage(filePath: string) {
  const url = filePath.startsWith('blob:') || filePath.startsWith('data:')
    ? filePath
    : `https://picsum.photos/seed/${Date.now()}_${Math.random().toString(36).slice(2, 7)}/800/450`
  return successResponse({ url })
}

//+ Mock 批量图片上传（1~5 张）
export function mockUploadImages(filePaths: string[]) {
  const urls = filePaths.map((fp, i) =>
    fp.startsWith('blob:') || fp.startsWith('data:')
      ? fp
      : `https://picsum.photos/seed/${Date.now()}_${i}/800/450`
  )
  return successResponse({ urls })
}

//+ Mock 视频上传
//+ 按文档约定：coverUrl = videoUrl + OSS 截帧参数（?x-oss-process=video/snapshot,t_0,f_jpg）
//+ 若是本地 blob/data URL，coverUrl 原样复用（开发预览）
export function mockUploadVideo(filePath: string) {
  const videoUrl = filePath.startsWith('blob:') || filePath.startsWith('data:')
    ? filePath
    : `https://www.w3schools.com/html/mov_bbb.mp4`
  const coverUrl =
    videoUrl.startsWith('blob:') || videoUrl.startsWith('data:')
      ? videoUrl
      : `${videoUrl}?x-oss-process=video/snapshot,t_0,f_jpg`
  return successResponse({ videoUrl, coverUrl })
}

//+ 上传模块Mock路由（结构占位）
//+ request.ts 的 mockRequest 不会走到这里（上传不走 request.ts），
//+ 仅为了 mock/index.ts 统一注册，保持模块结构一致。
export const uploadMockRoutes: Record<string, MockHandler> = {
  'POST /api/v1/upload/image': (_data, url) => mockUploadImage(url || ''),
  'POST /api/v1/upload/images': (data?: MockData) =>
    mockUploadImages(Array.isArray(data?.filePaths) ? (data!.filePaths as string[]) : []),
  'POST /api/v1/upload/video': (_data, url) => mockUploadVideo(url || '')
}
