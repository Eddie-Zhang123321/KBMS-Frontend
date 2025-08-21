// src/api/user.js
import { get, post, put, del } from '@/utils/http'

// 登录
export const loginAPI = (data) => {
  return post('/auth/login', data) // { username, password }
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