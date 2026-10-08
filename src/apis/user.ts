//+ 导入请求工具（统一解包封装：成功返回 data，业务错误抛 ApiError）
import { apiGet, apiPost, apiPut } from '@/utils/request'
import type { LoginResult, MemberInfo, UserDetail, UserPublic } from '@/types'

//+ 验证码场景枚举
//+ register=注册 login=登录 reset-pwd=重置密码 change-phone=更换手机号 cancel-account=注销账号
export type SmsScene = 'register' | 'login' | 'reset-pwd' | 'change-phone' | 'cancel-account'

//+ 图形验证码响应（GET /auth/captcha 返回）
//+ captcha_id 用于后续登录请求回传，captcha_image 为 base64 图片可直接渲染
export interface CaptchaInfo {
  captcha_id: string
  captcha_image: string
}

//+ 发送验证码响应（后端仅回传提示信息）
export interface SendCodeResult {
  message?: string
}

//+ 关注切换响应（POST /members/{id}/follow data）
export interface ToggleFollowResult {
  memberId: string
  isFollowed: boolean
  followCount: number
}

//+ ========== 认证模块 ==========

//+ POST /auth/send-code 发送验证码
//+ scene 枚举：register/login/reset-pwd/change-phone/cancel-account
export function sendCode(params: { phone: string; scene: SmsScene }): Promise<SendCodeResult> {
  return apiPost<SendCodeResult>('/auth/send-code', params)
}

//+ POST /auth/register 注册（新增 code + confirmPassword）
export function register(params: {
  phone: string
  code: string
  nickname: string
  password: string
  confirmPassword: string
}): Promise<LoginResult> {
  return apiPost<LoginResult>('/auth/register', params)
}

//+ POST /auth/login 登录（支持密码登录和验证码登录）
//+ type 为 "password" 时需传 password + captcha_id + captcha（图形验证码）
//+ type 为 "code" 时需传 code（短信验证码，无需图形验证码）
export function login(params: {
  phone: string
  password?: string
  code?: string
  type?: 'password' | 'code'
  //+ 密码登录需回传图形验证码 ID 与用户输入值（来自 GET /auth/captcha）
  captcha_id?: string
  captcha?: string
}): Promise<LoginResult> {
  return apiPost<LoginResult>('/auth/login', params)
}

//+ POST /auth/reset-password 重置密码
export function resetPassword(params: {
  phone: string
  code: string
  newPassword: string
  confirmPassword: string
}): Promise<SendCodeResult> {
  return apiPost<SendCodeResult>('/auth/reset-password', params)
}

//+ PUT /auth/password 修改密码（需登录）
//+ 场景：个人中心 → 设置 → 修改密码
export function updatePassword(params: {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<void> {
  return apiPut<void>('/auth/password', params)
}

//+ POST /auth/change-phone 修改手机号（需登录）
//+ 场景：个人中心 → 设置 → 修改手机号
//+ 发码场景 scene=change-phone，code 为发往新手机号的验证码
export function changePhone(params: { newPhone: string; code: string }): Promise<void> {
  return apiPost<void>('/auth/change-phone', params)
}

//+ POST /auth/cancel 注销账号（需登录）
//+ 双重校验：手机号验证码 + 原密码
//+ 成功后账号置 status=2、token 清除，前端需清登录态跳登录页
export function cancelAccount(params: {
  phone: string
  code: string
  password: string
}): Promise<void> {
  return apiPost<void>('/auth/cancel', params)
}

//+ GET /auth/captcha 获取图形验证码
//+ 用于登录页密码登录方式下的人机校验
//+ captcha_id 在登录请求时回传给后端，captcha_image 为 base64 图片可直接 <img src=...>
export function getCaptcha(): Promise<CaptchaInfo> {
  return apiGet<CaptchaInfo>('/auth/captcha')
}

//+ ========== 用户模块 ==========

//+ GET /health 健康检查
export function healthCheck(): Promise<Record<string, never>> {
  return apiGet<Record<string, never>>('/health')
}

//+ GET /member/info 获取用户基础信息（含 role 字段判断领队/会员）
//+ 用于：发布活动按钮的角色判断、app 启动刷新全局 userInfo 头像/昵称等场景
//+ 注意：/user/profile 接口后端不存在，统一改用 /member/info
export function getMemberInfo(signal?: AbortSignal | null): Promise<MemberInfo> {
  return apiGet<MemberInfo>('/member/info', undefined, signal)
}

//+ GET /personal/member/{id} 获取他人公开资料卡
//+ 用于：关注/粉丝/评论/报名人等所有带头像处点击头像弹出用户资料卡
//+ nickname/bio 已由后端做敏感词打星处理；status=2 表示已注销
export function getUserDetail(userId: string, signal?: AbortSignal | null): Promise<UserDetail> {
  return apiGet<UserDetail>(`/personal/member/${userId}`, undefined, signal)
}

//+ PUT /user/profile 更新用户资料
export function updateUserProfile(params: {
  nickname?: string
  bio?: string
  avatar?: string
  bgImg?: string
}): Promise<UserPublic> {
  return apiPut<UserPublic>('/user/profile', params)
}

//+ PUT /user/settings 更新用户设置
export function updateUserSettings(params: { notificationEnabled?: boolean }): Promise<void> {
  return apiPut<void>('/user/settings', params)
}

//+ GET /users/{id} 获取指定用户公开资料
export function getUserInfo(userId: string): Promise<UserPublic> {
  return apiGet<UserPublic>(`/users/${userId}`)
}

//+ POST /auth/logout 退出登录
export function logout(): Promise<void> {
  return apiPost<void>('/auth/logout')
}

//+ ========== 关注模块 ==========

//+ POST /members/{id}/follow 关注/取消关注（切换式，返回最新关注状态）
export function toggleFollow(memberId: string, signal?: AbortSignal | null): Promise<ToggleFollowResult> {
  return apiPost<ToggleFollowResult>(`/members/${memberId}/follow`, undefined, signal)
}
