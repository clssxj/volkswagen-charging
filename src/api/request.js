import axios from 'axios'
import { useAppStore } from '@/stores/app'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const { data } = response
    
    // 根据后端返回的数据结构调整
    if (data.code !== undefined) {
      if (data.code === 200 || data.code === 0) {
        return data.data
      } else {
        const appStore = useAppStore()
        appStore.showToast(data.message || '请求失败', 'error')
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    return data
  },
  error => {
    const appStore = useAppStore()
    
    let message = '网络错误，请稍后重试'
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 可以跳转到登录页
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        default:
          message = error.response.data?.message || '请求失败'
      }
    } else if (error.request) {
      message = '网络连接失败，请检查网络'
    }
    
    appStore.showToast(message, 'error')
    
    // 记录错误日志
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      error: error.message,
      response: error.response?.data
    })
    
    return Promise.reject(error)
  }
)

// 请求重试逻辑
export function createRetryableRequest(requestFn, maxRetries = 3, delay = 1000) {
  return async (...args) => {
    let lastError
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn(...args)
      } catch (error) {
        lastError = error
        
        // 如果是客户端错误（4xx），不重试
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error
        }
        
        // 最后一次重试失败，抛出错误
        if (i === maxRetries - 1) {
          throw error
        }
        
        // 指数退避
        const waitTime = delay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    throw lastError
  }
}

export default request

