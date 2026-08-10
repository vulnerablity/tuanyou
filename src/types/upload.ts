//+ 上传模块专项类型
//+ 原来放 apis/uploadTypes.ts 中的 UploadType 迁移到这里，纳入 types 体系。
//+ 上传响应结构（ResponseData<{url}>、ResponseData<{urls}>、ResponseData<{videoUrl,coverUrl}>）
//+   由各 API 自行按返回值泛型声明，不作为固定 interface。

//+ 图片/视频上传的目的场景，对应后端 multipart/form-data 中的 type 文本字段
//+   avatar    用户头像（单张，POST /upload/image）
//+   cover     活动封面（单张，POST /upload/image）
//+   note      发布笔记的图片 1~5 张 或 视频 1 个
//+   activity  活动详情/附件类上传（预留）
//+   bg        个人主页背景图（单张）
export type UploadType = 'avatar' | 'cover' | 'note' | 'activity' | 'bg'
