// src\api\Knowledgebase.js

import { get, post, put, del } from '@/utils/http'

export const getKnowledgeList = (data) => {
  return post('api/knowledgebase/items', data)
}

export const createKnowledgeBase = (data) => {
  return post('api/knowledgebase/create', data)
}

export const getKnowledgeDetail = (id) => {    //获取某个知识库的数据源列表
  return get(`/api/knowledgebase/datasources`, { kb_id: id })
}

export const updateKnowledgeBase = (id, data) => {
  return put(`/api/datasource/${id}`, data)
}

export const deleteKnowledgeBase = (kb_id, document_id) => {
  return del(`/api/knowledgebase/${kb_id}/datasource/${document_id}`)
}

/**
 * 创建数据源
 * @param {string} knowledgeBaseId - 知识库 ID
 * @param {Object} data - 请求参数，如 type, file_name, file_size 等
 */
export const createDataSource = (knowledgeBaseId, data) => {
<<<<<<< HEAD
  return post('/api/knowledgebase/add-datasource', {
=======
  return post('/datasource/upload', {
>>>>>>> bea964767f2a5bf47c7d2a250ef2c7257448caa8
    knowledge_base_id: knowledgeBaseId,
    ...data
  })
}


/**
 * 上传文件
 * @param {FormData} formData - 包含 file 的 FormData
 * @returns {Promise}
 */
export const uploadFile = (formData) => {
  return post('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}




export const getKnowledgeBaseLogs = (kbId, params = {}) => {
  return get('/api/knowledgebase/logs', { knowledge_base_id: kbId }, params)
}



export const getKnowledgeBasePermissions = (knowledgeBaseId) => {
  return get(`/api/knowledgebase/${knowledgeBaseId}/permissions`)
}

/**
 * 更新知识库权限设置
 * @param {string} knowledgeBaseId - 知识库ID
 * @param {Object} data - 权限数据
 * @returns {Promise}
 */
export const updateKnowledgeBasePermissions = (knowledgeBaseId, data) => {
  return put(`/api/knowledgebase/${knowledgeBaseId}/permissions`, data)
}

/**
 * 搜索用户
 * @param {string} query - 搜索关键词
 * @returns {Promise}
 */
export const searchUsers = (query) => {
  return get('/api/user/items', { query })
}


export const getSourceFileDownloadLink = (dataSourceId) => {
<<<<<<< HEAD
  return get(`/api/knowledgebase/datasource/${dataSourceId}/download-link`)
=======
  return get(`/knowledgebase/datasource/${dataSourceId}/download-link`)
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
>>>>>>> bea964767f2a5bf47c7d2a250ef2c7257448caa8
}