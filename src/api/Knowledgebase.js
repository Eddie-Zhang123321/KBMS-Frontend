// src\api\Knowledgebase.js

import { get, post, put, del } from '@/utils/http'

export const getKnowledgeList = (data) => {
  return get('/knowledgebase/items', data)
}

export const createKnowledgeBase = (data) => {
  return post('/knowledgebase/create', data)
}

export const deleteKB = (kb_id) => {
  return del(`/knowledgebase/${kb_id}`)
}

export const getKnowledgeDetail = (id,data) => {    //获取某个知识库的数据源列表
  return get(`/knowledgebase/${id}/datasource`,data)
}

export const updateKnowledgeBase = (id, data) => {
  return put(`/datasource/${id}`, data)
}

export const deleteKnowledgeBase = (kb_id, document_id) => {
  return del(`/knowledgebase/${kb_id}/datasource/${document_id}`)
}

/**
 * 创建数据源
 * @param {string} knowledgeBaseId - 知识库 ID
 * @param {Object} data - 请求参数，如 type, file_name, file_size 等
 */
export const createDataSource = (knowledgeBaseId, data) => {
  return post(`/knowledgebase/${knowledgeBaseId}/datasource/upload`, data)
}




// @/api/Knowledgebase.js
export const getKnowledgeBaseLogs = (kb_id,params = {}) => {
  return get(`/knowledgebase/${kb_id}/logs`, params)
}


export const getKnowledgeBasePermissions = (knowledgeBaseId) => {
  return get(`/knowledgebase/${knowledgeBaseId}/permissions`)
}

/**
 * 更新知识库权限设置
 * @param {string} knowledgeBaseId - 知识库ID
 * @param {Object} data - 权限数据
 * @returns {Promise}
 */
export const updateKnowledgeBasePermissions = (knowledgeBaseId, data) => {
  return put(`/knowledgebase/${knowledgeBaseId}/permissions`, data)
}

/**
 * 搜索用户
 * @param {string} query - 搜索关键词
 * @returns {Promise}
 */
export const searchUsers = (query) => {
  return get('/user/items', { query })
}


export const getSourceFileDownloadLink = (kb_id,dataSourceId) => {
  return get(`/knowledgebase/${kb_id}/datasource/${dataSourceId}/download-link`)
}

/**
 * 获取知识库的参数配置
 * @param {string} knowledgeBaseId - 知识库ID
 * @returns {Promise}
 */
export const getKnowledgeBaseParams = (knowledgeBaseId) => {
  return get(`/knowledgebase/${knowledgeBaseId}/params`)
}


/**
 * 更新知识库的参数配置
 * @param {string} knowledgeBaseId - 知识库ID
 * @param {Object} params - 参数配置对象
 * @returns {Promise}
 */
export const updateKnowledgeBaseParams = (knowledgeBaseId, params) => {
  return put(`/knowledgebase/${knowledgeBaseId}/params`, {
    ...params
  })
}

/**
 * 预览分片结果
 * @param {string} knowledgeBaseId - 知识库ID
 * @param {Object} chunkParams - 分片参数
 * @returns {Promise}
 */
export const previewChunking = (knowledgeBaseId, chunkParams) => {
  return post('/knowledgebase/preview-chunking', {
    knowledge_base_id: knowledgeBaseId,
    ...chunkParams
  })
}

//获取用户在知识库中的角色
export const getUserRoleInKnowledgeBase = (knowledgeBaseId) => {
  return get(`/knowledgebase/${knowledgeBaseId}/role`)
}

// 获取调优建议列表
export const getOptimizeList = (kb_id,params) => {
  return get(`/knowledgebase/${kb_id}/optimize/list`, params)
}

// 应用某个调优建议
export const applyOptimize = (kb_id, id) => {
  return post(`/knowledgebase/${kb_id}/optimize/${id}/apply`)
}

// 忽略某个调优建议
export const ignoreOptimize = (kb_id, id) => {
  return post(`/knowledgebase/${kb_id}/optimize/${id}/ignore`)
}

// 批量应用
export const batchApplyOptimize = (kb_id, ids) => {
  return post(`/knowledgebase/${kb_id}/optimize/batch/apply`, { ids })
}

// 批量忽略
export const batchIgnoreOptimize = (kb_id, ids) => {
  return post(`/knowledgebase/${kb_id}/optimize/batch/ignore`, { ids })
}
