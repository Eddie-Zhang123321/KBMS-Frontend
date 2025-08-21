// src/stores/user.js
import { defineStore } from 'pinia'
import { loginAPI, meAPI } from '@/api/user'
import { ROLES } from '@/constants/roles'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,         // 用户信息（包含 roles）
    tenant: null,       // 租户信息（平台管理员为 null）
    roles: [],          // 角色列表，字符串数组
  }),
  getters: {
    tenantName: (s) => s.tenant?.name || '—',
    isPlatformAdmin: (s) => s.roles?.includes(ROLES.PLATFORM_ADMIN) || false,
    hasRole: (s) => {
      return (role) => s.roles?.includes(role)
    },
    hasAnyRole: (s) => {
      return (roleList = []) => roleList.some(r => s.roles?.includes(r))
    },
  },
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    setUserFromResponse(payload) {
      // 兼容多种返回结构：
      // 1) { token, user: { roles: [...] }, tenant }
      // 2) { user, tenant, roles }
      const user = payload.user || null
      const tenant = payload.tenant || null
      const rolesFromUser = Array.isArray(user?.roles) ? user.roles : []
      const roles = Array.isArray(payload.roles) ? payload.roles : rolesFromUser

      this.user = user
      this.tenant = tenant
      this.roles = roles
    },
    async login(payload) {
      const res = await loginAPI(payload)
      // 兼容未返回 token 的 Mock：生成一个可用的 mock token 确保路由守卫放行
      const token = res?.token || `mock-${(res?.user?.username || 'user')}-${Date.now()}`
      this.setToken(token)
      this.setUserFromResponse(res)
    },
    async fetchMe() {
      const res = await meAPI()
      this.setUserFromResponse(res)
    },
    logout() {
      this.$reset()
      localStorage.removeItem('token')
    }
  }
})
