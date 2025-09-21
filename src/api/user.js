// src/api/user.js
import { get, post, put, del } from '@/utils/http'

// 登录
export const loginAPI = (data) => {
  return post('/auth/login', data) // { email, password }
}

// 企业注册
export const tenantRegisterAPI = (data) => {
  return post('/tenant/register', data)
}

// 用户注册
export const userRegisterAPI = (data) => {
  return post('/auth/register', data)
}
// auth/me 接口已删除，用户信息通过登录接口获取

// 获取用户列表（支持分页和筛选）
export const getUserList = (params = {}) => {
  // 设置默认分页参数
  const queryParams = {
    page: 1,
    pageSize: 10,
    ...params
  }

  // 移除空值参数
  Object.keys(queryParams).forEach(key => {
    if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
      delete queryParams[key]
    }
  })

  return get('/user/items', queryParams)
}

// 新建用户
export const createUser = (data) => {
  return post('/users', data)  // 新建用户的接口
}

// 获取用户详情
export const getUserDetail = (id) => {
  return get(`/user/${id}`)  // 获取指定 id 的用户信息
}

// 更新用户信息
export const updateUser = (id, data) => {
  return put(`/user/${id}`, data)  // 更新指定用户的信息
}

// 更新用户状态
export const updateUserStatus = (id, data) => {
  return put(`/users/${id}/status`, data)  // 更新指定用户的状态
}

// 删除用户
export const deleteUser = (id) => {
  return del(`/users/${id}`)  // 删除指定用户
}

// 批量导入用户
export const batchImportUsers = (formData) => {
  return post('/users/batch-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// 批量删除用户
export const batchDeleteUsers = (userIds) => {
  return del('/users/batch-delete', userIds)
}


//获取用户详细信息
export const getUserProfile = () => {
  return get('/user/profile')
}


//更新用户基本信息
export const updateUserProfile = (data) => {
  return put('/user/profile', data)
}

//修改密码
export const changePassword = (data) => {
  return put('/user/password', data)
}

//更新用户头像（简化版本 - 只传头像ID）
export const updateUserAvatar = (data) => {
  return put('/user/avatar', data)
}