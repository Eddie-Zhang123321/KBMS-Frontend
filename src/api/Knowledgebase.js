// src\api\Knowledgebase.js

import { get, post, put, del } from '@/utils/http'

export const getKnowledgeList = (data) => {
  return get('/knowledgebase/items', data)
}

export const createKnowledgeBase = (data) => {
  return post('/knowledgebase/create', data)
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




export const getKnowledgeBaseLogs = (kbId, params = {}) => {
  return get('/knowledgebase/logs', { knowledge_base_id: kbId }, params)
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
  return get('/knowledgebase/params',{ knowledge_base_id: knowledgeBaseId })
}


/**
 * 更新知识库的参数配置
 * @param {string} knowledgeBaseId - 知识库ID
 * @param {Object} params - 参数配置对象
 * @returns {Promise}
 */
export const updateKnowledgeBaseParams = (knowledgeBaseId, params) => {
  return put('/knowledgebase/params', {
    knowledge_base_id: knowledgeBaseId,
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