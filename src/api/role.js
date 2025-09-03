import { get, post, put, del } from '@/utils/http'

// 角色列表（支持筛选与分页）
export const getRoleList = (params) => {
  // 约定 Apifox: POST /role/items { roleKey, roleType, page, size }
  return post('/role/items', params)
}

// 新建角色
export const createRole = (data) => {
  return post('/role', data)
}

// 角色详情
export const getRoleDetail = (id) => {
  return get(`/role/${id}`)
}

// 角色权限读取/更新
export const getRolePermissions = (id) => {
  return get(`/role/${id}/permissions`)
}

export const updateRolePermissions = (id, data) => {
  return put(`/role/${id}/permissions`, data)
}

// 角色授权人（成员）读取/更新
export const getRoleAssignees = (id) => {
  return get(`/role/${id}/assignees`)
}

export const updateRoleAssignees = (id, data) => {
  return put(`/role/${id}/assignees`, data)
}


