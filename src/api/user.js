// src/api/user.js
import { get, post, put, del } from '@/utils/http'

// 登录
export const loginAPI = (data) => {
  return post('api/auth/login', data) // { username, password }
}

// 获取当前用户信息（含租户）
export const meAPI = () => {
  return get('/auth/me')
}

// 获取知识库列表（用户列表）
export const getUserList = (data) => {
  return post('/user/items', data)  // 调用 post 请求并传入参数
}

// 角色授权弹窗用：获取可选用户（避免与 /user/items 冲突）
export const getAssignableUsers = (data) => {
  // 建议 Apifox 定义为：POST /users/options，返回 { items: [{ id, username }], total }
  return post('/users/options', data)
}

// 创建用户
export const createUser = (data) => {
  return post('/user', data)  // 创建用户的接口
}

// 获取用户详情
export const getUserDetail = (id) => {
  return get(`/user/${id}`)  // 获取指定 id 的用户信息
}

// 更新用户信息
export const updateUserStatus = (id, data) => {
  return put(`/user/${id}`, data)  // 更新指定用户的信息
}

// 删除用户
export const deleteUser = (id) => {
  return del(`/user/${id}`)  // 删除指定用户
}

// 批量导入用户
export const batchImportUsers = (formData) => {
  return post('/users/batch-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// 根据租户ID获取用户列表
export const getUsersByTenant = (tenantId) => {
  return post('/user/items', { tenant_id: tenantId })
}

// 个人中心相关接口
// 获取用户详细信息（包含加入的知识库数量、最后登录时间等）
export const getUserProfile = () => {
  return get('/user/profile')
}

// 更新用户信息
export const updateUserProfile = (data) => {
  return put('/user/profile', data)
}

// 修改密码
export const changePassword = (data) => {
  return put('/user/password', data)
}

// 获取用户偏好设置
export const getUserPreferences = () => {
  return get('/user/preferences')
}

// 更新用户偏好设置
export const updateUserPreferences = (data) => {
  return put('/user/preferences', data)
}

// 获取用户加入的知识库列表
export const getUserKnowledgeBases = () => {
  return get('/user/knowledge-bases')
}