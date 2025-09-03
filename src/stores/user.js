// src/stores/user.js
import { defineStore } from 'pinia'
import { loginAPI, meAPI } from '@/api/user'
import { ROLES } from '@/constants/roles'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,         // 用户信息（包含 roles）
    tenant: JSON.parse(localStorage.getItem('tenant')) || null,       // 租户信息（平台管理员为 null）
    roles: JSON.parse(localStorage.getItem('roles')) || [],          // 角色列表，字符串数组
    preferences: JSON.parse(localStorage.getItem('preferences')) || null, // 用户偏好设置
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
    defaultPage: (s) => {
      // 根据用户偏好设置获取默认页面，fallback到dashboard
      const defaultPage = s.preferences?.defaultPage
      if (defaultPage) {
        // 将偏好设置的值映射到实际路由路径
        const pageMap = {
          'dashboard': '/dashboard',
          'knowledge': '/knowledgelist',
          'service': '/knowledgelist',
          'system': '/system/users',
          'tenant': '/tenant'
        }
        return pageMap[defaultPage] || '/dashboard'
      }
      return '/dashboard'
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

      // 验证用户信息完整性
      if (user && (!user.username || !user.id)) {
        console.warn('User data incomplete:', user)
        throw new Error('用户信息不完整，请重新登录')
      }

      this.user = user
      this.tenant = tenant
      this.roles = roles

      // 保存到 localStorage 以实现持久化
      try {
        if (user) localStorage.setItem('user', JSON.stringify(user))
        if (tenant) localStorage.setItem('tenant', JSON.stringify(tenant))
        if (roles) localStorage.setItem('roles', JSON.stringify(roles))
      } catch (e) {
        console.warn('Failed to save user data to localStorage:', e)
      }
    },
    setPreferences(preferences) {
      this.preferences = preferences
      try {
        localStorage.setItem('preferences', JSON.stringify(preferences))
      } catch (e) {
        console.warn('Failed to save preferences to localStorage:', e)
      }
    },
    async login(payload) {
      const res = await loginAPI(payload)
      // 兼容未返回 token 的 Mock：生成一个可用的 mock token 确保路由守卫放行
      const token = res?.token || `mock-${(res?.user?.username || 'user')}-${Date.now()}`
      this.setToken(token)
      this.setUserFromResponse(res)
    },
    async fetchMe() {
      try {
        const res = await meAPI()
        this.setUserFromResponse(res)
        return res
      } catch (error) {
    // Skip console log for business errors (already handled by http.js)
    if (!error.code) {
      console.warn('Failed to fetch user info from API:', error)
    }
        // 如果是401错误，清除本地数据并重新登录
        if (error.response?.status === 401) {
          this.logout()
          throw new Error('登录已过期，请重新登录')
        }
        // 重新抛出错误以便调用者可以处理
        throw error
      }
    },
    async fetchPreferences() {
      try {
        const { getUserPreferences } = await import('@/api/user')
        const preferences = await getUserPreferences()
        this.setPreferences(preferences)
        return preferences
      } catch (error) {
        console.warn('Failed to fetch user preferences:', error)
        // 偏好设置获取失败不影响正常使用，使用默认值
        const defaultPreferences = {
          defaultPage: 'dashboard',
          language: 'zh-CN',
          notifications: true
        }
        this.setPreferences(defaultPreferences)
        return defaultPreferences
      }
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('tenant')
      localStorage.removeItem('roles')
      localStorage.removeItem('preferences')
      this.$reset()
    }
  }
})
