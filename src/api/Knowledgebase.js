// src\api\Knowledgebase.js

import { get, post, put, del } from '@/utils/http'

export const getKnowledgeList = (data) => {
  return post('/knowledgebase/items', data)
}

export const createKnowledgeBase = (data) => {
  return post('/knowledgebase/create', data)
}

export const getKnowledgeDetail = (id) => {    //获取某个知识库的数据源列表
  return get(`/knowledgebase/datasources`,{kb_id: id})
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
  return post('/knowledgebase/add-datasource', {
    knowledge_base_id: knowledgeBaseId,
    ...data
  })
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


export const getSourceFileDownloadLink = (dataSourceId) => {
  return get(`/knowledgebase/datasource/${dataSourceId}/download-link`)
}