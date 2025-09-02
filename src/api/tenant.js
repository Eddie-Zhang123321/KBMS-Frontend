// src/api/tenant.js
import { get, post, put, del } from '@/utils/http'

// 获取知识库列表（租户列表）
export const getTenantList = (data) => {
  return post('/api/tenant/items', data)  // 调用 post 请求并传入参数
}

// 创建租户
export const createTenant = (data) => {
  return post('/api/tenant', data)  // 创建租户的接口
}

// 获取租户详情
export const getTenantDetail = (id) => {
  return get(`/api/tenant/${id}`)  // 获取指定 id 的租户信息
}

// 更新租户信息
export const updateTenant = (id, data) => {
  return put(`/api/tenant/${id}`, data)  // 更新指定租户的信息
}

// 删除租户
export const deleteTenant = (id) => {
  return del(`/api/tenant/${id}`)  // 删除指定租户
}
