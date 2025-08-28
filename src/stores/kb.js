import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useKBStore = defineStore('kb', () => {
  // 当前选中的知识库信息
  const currentKB = ref(null)
  
  // 知识库列表
  const kbList = ref([])
  
  // 设置当前知识库
  const setCurrentKB = (kbItem) => {
    currentKB.value = kbItem
  }
  
  // 清空当前知识库
  const clearCurrentKB = () => {
    currentKB.value = null
  }
  
  // 设置知识库列表
  const setKBList = (list) => {
    kbList.value = list
  }
  
  // 根据ID获取知识库
  const getKBById = (id) => {
    return kbList.value.find(item => item.id === id)
  }
  
  // 更新知识库信息
  const updateKB = (id, newData) => {
    const index = kbList.value.findIndex(item => item.id === id)
    if (index !== -1) {
      kbList.value[index] = { ...kbList.value[index], ...newData }
      // 如果更新的是当前选中的知识库，也更新currentKB
      if (currentKB.value && currentKB.value.id === id) {
        currentKB.value = { ...currentKB.value, ...newData }
      }
    }
  }

  return {
    currentKB,
    kbList,
    setCurrentKB,
    clearCurrentKB,
    setKBList,
    getKBById,
    updateKB
  }
})