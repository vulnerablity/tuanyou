//+ 请求工具封装，基于Taro.request

import Taro from '@tarojs/taro'
import { getToken } from './token'

//+ 请求方法类型
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

//+ 请求配置接口
interface RequestConfig {
  url: string
  method?: Method
  data?: any
  header?: any
  timeout?: number
}

//+ 响应数据接口
interface ResponseData<T = any> {
  code: number
  message: string
  data: T
}

//+ 默认请求头
const defaultHeader = {
  'content-type': 'application/json',
  'Accept': 'application/json'
}

//+ 请求拦截器：添加token
function requestInterceptor(config: RequestConfig): RequestConfig {
  const token = getToken()
  if (token) {
    config.header = {
      ...config.header,
      'Authorization': `Bearer ${token}`
    }
  }
  return config
}

//+ 响应拦截器：处理错误和数据
function responseInterceptor<T = any>(res: any): Promise<ResponseData<T>> {
  return new Promise((resolve, reject) => {
    if (res.statusCode === 200) {
      const data = res.data as ResponseData<T>
      if (data.code === 0 || data.code === 200) {
        resolve(data)
      } else {
        //+ 处理业务错误
        Taro.showToast({
          title: data.message || '请求失败',
          icon: 'none'
        })
        reject(data)
      }
    } else if (res.statusCode === 401) {
      //+ 未授权，清除token并跳转登录
      Taro.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none'
      })
      Taro.redirectTo({ url: '/pages/Login/index' })
      reject(res)
    } else {
      Taro.showToast({
        title: `请求错误 ${res.statusCode}`,
        icon: 'none'
      })
      reject(res)
    }
  })
}

//+ 发起请求
export function request<T = any>(config: RequestConfig): Promise<ResponseData<T>> {
  const { url, method = 'GET', data, header, timeout = 30000 } = config
  
  const baseURL = process.env.TARO_APP_API_BASE || ''
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`
  
  const requestConfig = requestInterceptor({
    url: fullUrl,
    method,
    data,
    header: { ...defaultHeader, ...header },
    timeout
  })

  return Taro.request(requestConfig).then(responseInterceptor)
}

//+ GET请求

export function get<T = any>(url: string, data?: any, header?: any): Promise<ResponseData<T>> {
  return request({ url, method: 'GET', data, header })
}

//+ POST请求
export function post<T = any>(url: string, data?: any, header?: any): Promise<ResponseData<T>> {
  return request({ url, method: 'POST', data, header })
}

//+ PUT请求
export function put<T = any>(url: string, data?: any, header?: any): Promise<ResponseData<T>> {
  return request({ url, method: 'PUT', data, header })
}

//+ DELETE请求
export function del<T = any>(url: string, data?: any, header?: any): Promise<ResponseData<T>> {
  return request({ url, method: 'DELETE', data, header })
}

// src/utils/request.ts
const isMock = process.env.TARO_APP_USE_MOCK === 'true'

// 在请求拦截器中判断
if (isMock) {
  // 返回 Mock 数据
} else {
  // 发送真实请求
}