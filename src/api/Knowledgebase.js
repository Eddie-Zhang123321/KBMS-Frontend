import { get, post, put, del } from '@/utils/http'

export const getKnowledgeList = (data)  => {
  return post('/knowledgebase/items',data)
}

export const createKnowledgeBase = (data) => {
  return post('/knowledge-bases', data)
}

export const getKnowledgeDetail = (id) => {
  return get(`/knowledge-bases/${id}`)
}

export const updateKnowledgeBase = (id, data) => {
  return put(`/knowledge-bases/${id}`, data)
}

export const deleteKnowledgeBase = (id) => {
  return del(`/knowledge-bases/${id}`)
}