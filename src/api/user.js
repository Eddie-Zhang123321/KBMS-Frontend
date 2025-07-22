// src/api/user.js
import { get, post, put, del } from '@/utils/http'

// 获取知识库列表（用户列表）
export const getUserList = (data) => {
  return post('/user/items', data)  // 调用 post 请求并传入参数
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
