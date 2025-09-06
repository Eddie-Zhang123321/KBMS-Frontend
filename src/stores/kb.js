import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useKBStore = defineStore('kb', () => {
  // 当前选中的知识库信息
  const currentKB = ref(null)
  
  // 知识库列表
  const kbList = ref([])

  // 👇 新增：当前用户在当前知识库中的角色
  const userRole = ref(0) // 默认为 0（viewer）

  // 设置当前知识库
  const setCurrentKB = (kbItem) => {
    currentKB.value = kbItem
  }
  
  // 清空当前知识库
  const clearCurrentKB = () => {
    currentKB.value = null
    // 可选：清除角色
    setUserRole(0)
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

  // 👇 新增：设置用户在当前知识库中的角色
  const setUserRole = (role) => {
    // 可以加一层校验，比如只允许特定角色
    const validRoles = [0, 1, 2, 3]  //0:viewer,  1:admin, 2:owner,3:superAdmin
    userRole.value = validRoles.includes(role) ? role : 0
  }

  // 👇 新增：获取当前用户角色（可选，因为可以直接用 userRole）
  const getUserRole = () => {
    return userRole.value
  }

  // 👇 可选：重置用户角色
  const resetUserRole = () => {
    userRole.value = 0
  }

  return {
    // 状态
    currentKB,
    kbList,
    userRole, // 👈 暴露出去，组件中可读取

    // 操作
    setCurrentKB,
    clearCurrentKB,
    setKBList,
    getKBById,
    updateKB,
    setUserRole,   // 👈 暴露设置角色方法
    getUserRole,   // 👈 暴露获取角色方法
    resetUserRole  // 👈 暴露重置方法
  }
})