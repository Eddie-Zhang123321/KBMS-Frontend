import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_DEV_BASE_API, // 从环境变量读取API基础地址
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8' // 默认请求头
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 处理URL（确保不以斜杠开头，避免双斜杠问题）
    if (config.url) {
      config.url = config.url.replace(/^\/+/, '')
    }
    
    // 可在此处添加全局请求逻辑（如token等）
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    
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

    /* 根据后端接口规范调整此处逻辑 */
    if (res.code !== undefined && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }

    // 如果接口直接返回有效数据（没有code/message包装）
    return res.data || res
  },
  (error) => {
    /* 统一错误处理 */
    let errorMessage = '请求错误'

    if (error.response) {
      // 有响应但状态码不在2xx范围
      switch (error.response.status) {
        case 400:
          errorMessage = '请求参数错误'
          break
        case 401:
          errorMessage = '登录已过期，请重新登录'
          // 可在此处跳转到登录页
          break
        case 403:
          errorMessage = '没有权限访问'
          break
        case 404:
          errorMessage = `请求地址不存在: ${error.config.url}`
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        default:
          errorMessage = `网络错误 (${error.response.status})`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络连接异常，请检查网络'
    } else {
      // 请求配置出错
      errorMessage = '请求发送失败'
    }

    ElMessage.error(errorMessage)
    return Promise.reject(error)
  }
)

/**
 * 封装GET请求
 * @param {string} url 请求地址
 * @param {object} params 查询参数
 * @param {object} config 额外axios配置
 */
export function get(url, params = {}, config = {}) {
  return service.get(url, { params, ...config })
}

/**
 * 封装POST请求
 * @param {string} url 请求地址
 * @param {object} data 请求体数据
 * @param {object} config 额外axios配置
 */
export function post(url, data = {}, config = {}) {
  return service.post(url, data, config)
}

/**
 * 封装PUT请求
 * @param {string} url 请求地址
 * @param {object} data 请求体数据
 * @param {object} config 额外axios配置
 */
export function put(url, data = {}, config = {}) {
  return service.put(url, data, config)
}

/**
 * 封装DELETE请求
 * @param {string} url 请求地址
 * @param {object} config 额外axios配置
 */
export function del(url, config = {}) {
  return service.delete(url, config)
}

// 默认导出实例
export default service