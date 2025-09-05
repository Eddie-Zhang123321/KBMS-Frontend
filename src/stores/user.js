// src/stores/user.js
import { defineStore } from 'pinia'
import { loginAPI, meAPI } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,         // 用户信息
    tenantName: localStorage.getItem('tenantName') || null,         // 租户名称
    platformAdmin: JSON.parse(localStorage.getItem('platformAdmin')) || false,    // 是否为平台管理员
    tenantSuperAdmin: JSON.parse(localStorage.getItem('tenantSuperAdmin')) || false, // 是否为租户超级管理员
    preferences: JSON.parse(localStorage.getItem('preferences')) || null, // 用户偏好设置
    avatar: localStorage.getItem('avatar') || null, // 用户头像URL
    avatarId: parseInt(localStorage.getItem('avatarId')) || 1, // 用户头像ID (1-4)
  }),
  getters: {
    displayTenantName: (s) => s.tenantName || '—',
    isPlatformAdmin: (s) => s.platformAdmin,
    isTenantSuperAdmin: (s) => s.tenantSuperAdmin,
    isAdmin: (s) => s.platformAdmin || s.tenantSuperAdmin, // 是否为管理员（平台或租户超级）
    userAvatar: (s) => {
      // 优先使用localStorage中的头像，然后是user对象中的头像，最后使用默认头像
      return s.avatar || s.user?.avatar || new URL('@/assets/avatar/avatar1.jpg', import.meta.url).href
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
    setPreferences(preferences) {
      this.preferences = preferences
      try {
        localStorage.setItem('preferences', JSON.stringify(preferences))
      } catch (e) {
        console.warn('Failed to save preferences to localStorage:', e)
      }
    },
    updateUserAvatar(avatarUrl, avatarId = null) {
      // 更新store中的头像
      this.avatar = avatarUrl
      if (avatarId !== null) {
        this.avatarId = avatarId
      }

      // 更新user对象中的头像
      if (this.user) {
        this.user.avatar = avatarUrl
        if (avatarId !== null) {
          this.user.avatarId = avatarId
        }
      } else {
        this.user = {
          avatar: avatarUrl,
          avatarId: avatarId || this.avatarId
        }
      }

      // 保存到localStorage
      try {
        localStorage.setItem('avatar', avatarUrl)
        if (avatarId !== null) {
          localStorage.setItem('avatarId', avatarId.toString())
        }
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch (e) {
        console.warn('Failed to save avatar to localStorage:', e)
      }
    },
    setUserFromResponse(payload) {
      // 适配新的响应结构：
      // { token, userName, tenantName, platformAdmin, tenantSuperAdmin, avatar, avatarId }
      const userName = payload.userName || null
      const tenantName = payload.tenantName || null
      const platformAdmin = payload.platformAdmin || false
      const tenantSuperAdmin = payload.tenantSuperAdmin || false
      const avatar = payload.avatar || null
      const avatarId = payload.avatarId || 1

      // 验证用户信息完整性
      if (!userName) {
        console.warn('User data incomplete:', payload)
        throw new Error('用户信息不完整，请重新登录')
      }

      // 构造用户对象，包含头像信息
      this.user = {
        username: userName,
        avatar: avatar,
        avatarId: avatarId
      }
      this.tenantName = tenantName
      this.platformAdmin = platformAdmin
      this.tenantSuperAdmin = tenantSuperAdmin

      // 如果响应中包含头像，更新头像状态
      if (avatar) {
        this.avatar = avatar
      }
      this.avatarId = avatarId

      // 保存到 localStorage 以实现持久化
      try {
        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('tenantName', tenantName || '')
        localStorage.setItem('platformAdmin', JSON.stringify(platformAdmin))
        localStorage.setItem('tenantSuperAdmin', JSON.stringify(tenantSuperAdmin))
        if (avatar) {
          localStorage.setItem('avatar', avatar)
        }
        localStorage.setItem('avatarId', avatarId.toString())
      } catch (e) {
        console.warn('Failed to save user data to localStorage:', e)
      }
    },
    async login(payload) {
      const res = await loginAPI(payload)
      // 从响应的data字段中获取数据
      const data = res?.data || res
      const token = data?.token || `mock-${(data?.userName || 'user')}-${Date.now()}`
      this.setToken(token)
      this.setUserFromResponse(data)
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
      localStorage.removeItem('tenantName')
      localStorage.removeItem('platformAdmin')
      localStorage.removeItem('tenantSuperAdmin')
      localStorage.removeItem('preferences')
      localStorage.removeItem('avatar')
      localStorage.removeItem('avatarId')
      this.$reset()
    }
  }
})
