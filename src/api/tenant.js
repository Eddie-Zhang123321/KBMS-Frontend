// src/api/tenant.js
import { get, post, put, del } from '@/utils/http'

//获取租户列表（支持分页和筛选）
export const getTenantList = (params = {}) => {
  // 设置默认分页参数
  const queryParams = {
    page: 1,
    size: 10,
    ...params
  }

  // 移除空值参数
  Object.keys(queryParams).forEach(key => {
    if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
      delete queryParams[key]
    }
  })

  return get('/tenant/items', queryParams)
}

/**
 * 创建租户
 * @param {Object} data - 租户数据
 * @param {string} data.tenantName - 租户名称
 * @param {string} data.tenantStatus - 租户状态
 * @param {string} data.adminName - 租户管理员
 * @param {string} data.email - 管理员邮箱
 * @returns {Promise} 返回创建的租户信息
 */
export const createTenant = (data) => {
  return post('/tenant', data)
}

/**
 * 获取租户详情
 * @param {string|number} id - 租户ID
 * @returns {Promise} 返回租户详细信息
 */
export const getTenantDetail = (id) => {
  return get(`/tenant/${id}`)
}

/**
 * 更新租户状态
 * @param {string|number} id - 租户ID
 * @param {Object} data - 要更新的租户状态数据
 * @param {string} data.tenantStatus - 租户状态（开通/关闭）
 * @returns {Promise} 返回更新后的租户信息
 */
export const updateTenantStatus = (id, data) => {
  return put(`/tenant/${id}/status`, data)
}

/**
 * 删除租户
 * @param {string|number} id - 租户ID
 * @returns {Promise} 返回删除结果
 */
export const deleteTenant = (id) => {
  return del(`/tenant/${id}`)
}


