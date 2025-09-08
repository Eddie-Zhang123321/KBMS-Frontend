import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 关键修改：开发环境下使用相对路径 /api/，让Vite代理处理
// 生产环境下使用环境变量配置的真实地址
const normalizedBaseURL = (() => {
  // 开发环境：使用相对路径 /api/，让Vite代理处理
  if (import.meta.env.MODE === 'development') {
    console.log('🔄 开发模式：使用Vite代理，baseURL = /api/')
    return '/api/'
  }
  
  // 生产/测试环境：使用环境变量配置的真实地址
  console.log('🚀 生产模式：使用环境变量地址')
  const raw = (
    import.meta.env.VITE_DEVELOPMENT_BASE_API ||
    import.meta.env.VITE_PROD_BASE_API ||
    import.meta.env.VITE_STAGING_BASE_API ||
    import.meta.env.VITE_BASE_API ||
    '/api/'
  )
  return raw.endsWith('/') ? raw : `${raw}/`
})()

console.log('🌐 最终 baseURL:', normalizedBaseURL)

// 创建axios实例
const service = axios.create({
  baseURL: normalizedBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 标准化URL处理，避免以 / 开头时覆盖 baseURL 的路径拼接
    if (typeof config.url === 'string') {
      config.url = config.url.replace(/^\/+/, '')
    }
    // 自动添加Token
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    // 多租户：为非平台管理员自动附带租户ID
    const isPlatformAdmin = userStore.platformAdmin
    const tenantId = userStore.tenant?.id || userStore.tenant?.tenantId
    if (!isPlatformAdmin && tenantId) {
      config.headers['X-Tenant-Id'] = tenantId
    } else {
      // 平台管理员不携带租户头
      if (config.headers['X-Tenant-Id']) delete config.headers['X-Tenant-Id']
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
      // 兼容 Apifox 常见 code：200 / 0 / '200' / '0'
      const successCodes = new Set([0, 200, '0', '200'])
      if (!successCodes.has(res.code)) {
        handleBusinessError(res)
        return Promise.reject(res)
      }
      return res.data !== undefined ? res.data : res
    }

    // 兼容 { success: true, data } 结构
    if (res.success !== undefined) {
      if (!res.success) {
        handleBusinessError({ code: res.code, message: res.message })
        return Promise.reject(res)
      }
      return res.data !== undefined ? res.data : res
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
