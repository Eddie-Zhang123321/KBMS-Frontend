import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_DEV_BASE_API, // 
  timeout: 30000, // 超时时间调整为30秒
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 标准化URL处理
    config.url = config.url.replace(/^\/+/, '') // 移除开头斜杠
    
    // 自动添加Token
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    // 处理数组参数 (qs格式化)
    if (config.params && config.paramsSerializer) {
      config.paramsSerializer = {
        indexes: null // 保留数组索引 a[]=1&a[]=2
      }
    }
    
    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    
    /* 兼容两种响应格式：1. 直接返回数据 2. 包装格式 { code, data, message } */
    if (res.code !== undefined) {
      // 处理业务错误（根据实际后端规范调整）
      if (res.code !== 200) {
        handleBusinessError(res)
        return Promise.reject(res)
      }
      return res.data // 返回data字段
    }
    
    return res // 直接返回数据
  },
  (error) => {
    handleHttpError(error)
    return Promise.reject(error)
  }
)

/**
 * 处理业务逻辑错误
 */
function handleBusinessError(response) {
  const code = response.code
  const msg = response.message || '请求失败'
  
  // 特殊错误码处理
  if (code === 401) {
    ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/login')
    })
  } else if (code === 403) {
    ElMessage.error('没有操作权限')
  } else {
    ElMessage.error(msg)
  }
}

/**
 * 处理HTTP错误
 */
function handleHttpError(error) {
  let msg = ''
  
  if (error.response) {
    switch (error.response.status) {
      case 400:
        msg = '请求参数错误'
        break
      case 401:
        msg = '未授权，请登录'
        break
      case 403:
        msg = '拒绝访问'
        break
      case 404:
        msg = `请求地址不存在: ${error.config.url}`
        break
      case 408:
        msg = '请求超时'
        break
      case 500:
        msg = '服务器内部错误'
        break
      case 502:
        msg = '网关错误'
        break
      case 503:
        msg = '服务不可用'
        break
      case 504:
        msg = '网关超时'
        break
      default:
        msg = `网络错误 (${error.response.status})`
    }
  } else if (error.request) {
    msg = '未收到服务器响应'
  } else {
    msg = `请求错误: ${error.message}`
  }
  
  ElMessage.error(msg)
}

/**
 * 封装GET请求（支持Query参数）
 * @param {string} url 
 * @param {object} params 
 * @param {object} config 
 */
export function get(url, params = {}, config = {}) {
  return service.get(url, { 
    params,
    ...config,
    paramsSerializer: {
      indexes: null // 保留数组格式
    }
  })
}

/**
 * 封装POST请求（支持FormData/JSON自动处理）
 * @param {string} url 
 * @param {object} data 
 * @param {object} config 
 */
export function post(url, data = {}, config = {}) {
  // 自动识别FormData
  if (data instanceof FormData) {
    config.headers = {
      ...config.headers,
      'Content-Type': 'multipart/form-data'
    }
  }
  return service.post(url, data, config)
}

/**
 * 封装PUT请求
 * @param {string} url 
 * @param {object} data 
 * @param {object} config 
 */
export function put(url, data = {}, config = {}) {
  return service.put(url, data, config)
}

/**
 * 封装DELETE请求（支持URL参数和Body参数）
 * @param {string} url 
 * @param {object} config 
 * @param {object} data - 可选Body参数
 */
export function del(url, config = {}, data) {
  if (data) {
    return service.delete(url, { data, ...config })
  }
  return service.delete(url, config)
}

/**
 * 文件下载（特殊处理）
 * @param {string} url 
 * @param {object} params 
 */
export function download(url, params = {}) {
  return service.get(url, {
    params,
    responseType: 'blob'
  })
}

export default service