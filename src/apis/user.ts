//+ 导入请求工具
import { get, post } from '@/utils/request'

//+ 健康检查接口
export function healthCheck() {
  return get('/health')
}

//+ 登录请求
export function login(params: {
  phone: string
  password?: string
  smsCode?: string
  captcha?: string
}) {
  return post('/user/login', params)
}

//+ 获取用户信息
export function getUserInfo() {
  return get('/user/info')
}
