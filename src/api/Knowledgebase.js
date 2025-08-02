// src\api\Knowledgebase.js

import { get, post, put, del } from '@/utils/http'

export const getKnowledgeList = (data) => {
  return post('/knowledgebase/items', data)
}

export const createKnowledgeBase = (data) => {
  return post('/knowledgebase/create', data)
}

export const getKnowledgeDetail = (id) => {
  return get(`/datasource`, { id:id })
}

export const updateKnowledgeBase = (id, data) => {
  return put(`/datasource/${id}`, data)
}

export const deleteKnowledgeBase = (id) => {
  return del(`/datasource/${id}`)
}

/**
 * 创建数据源
 * @param {string} knowledgeBaseId - 知识库 ID
 * @param {Object} data - 请求参数，如 type, file_name, file_size 等
 */
export const createDataSource = (knowledgeBaseId, data) => {
  return post('/datasource/create', {
    knowledge_base_id: knowledgeBaseId,
    ...data
  })
}