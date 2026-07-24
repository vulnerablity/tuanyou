//+ 导入请求工具
import { get, post } from '@/utils/request'

//+ 健康检查接口
export function healthCheck() {
  return get('/health')
}
//+ 登录请求
export function loginAPI(params: {
  phone: string
  password: string
  smsCode?: string
  captcha?: string
}) {
  return post('/auth/login', params)
}

//+ 获取用户信息
export function getUserProfileAPI() {
  return get('/auth/profile')
}

//+ 注册请求
export function registerAPI(params: {
  phone: string
  password: string
  nickname: string
}) {
  return post('/auth/register', params)
}
