import { get, post, put, del } from '@/utils/http'

// 角色列表（支持筛选与分页）
export const getRoleList = (params) => {
  // 约定 Apifox: POST /role/items { roleKey, roleType, page, size }
  return post('/api/role/items', params)
}

// 新建角色
export const createRole = (data) => {
  return post('/api/role', data)
}

// 角色详情
export const getRoleDetail = (id) => {
  return get(`/api/role/${id}`)
}

// 角色权限读取/更新
export const getRolePermissions = (id) => {
  return get(`/api/role/${id}/permissions`)
}

export const updateRolePermissions = (id, data) => {
  return put(`/api/role/${id}/permissions`, data)
}

// 角色授权人（成员）读取/更新
export const getRoleAssignees = (id) => {
  return get(`/api/role/${id}/assignees`)
}

export const updateRoleAssignees = (id, data) => {
  return put(`/api/role/${id}/assignees`, data)
}


