// src/stores/user.js
import { defineStore } from 'pinia'
import { loginAPI } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,         // 用户信息
    tenant: JSON.parse(localStorage.getItem('tenant')) || null,     // 租户信息（包含id和name）
    tenantName: localStorage.getItem('tenantName') || null,         // 租户名称（兼容性保留）
    platformAdmin: JSON.parse(localStorage.getItem('platformAdmin')) || false,    // 是否为平台管理员
    tenantSuperAdmin: JSON.parse(localStorage.getItem('tenantSuperAdmin')) || false, // 是否为租户超级管理员
    preferences: JSON.parse(localStorage.getItem('preferences')) || null, // 用户偏好设置
    avatar: parseInt(localStorage.getItem('avatar')) || 1, // 用户头像ID (1-6)
  }),
  getters: {
    displayTenantName: (s) => s.tenantName || s.tenant?.name || '—',
    tenantId: (s) => s.tenant?.id || null, // 获取租户ID
    isPlatformAdmin: (s) => s.platformAdmin,
    isTenantSuperAdmin: (s) => s.tenantSuperAdmin,
    isAdmin: (s) => s.platformAdmin || s.tenantSuperAdmin, // 是否为管理员（平台或租户超级）
    userAvatar: (s) => {
      // 根据头像ID获取对应的头像URL
      const avatarId = s.avatar || s.user?.avatar || 1
      const avatarMapping = {
        1: '/src/assets/avatar/avatar1.jpg',
        2: '/src/assets/avatar/avatar2.jpg',
        3: '/src/assets/avatar/avatar3.jpg',
        4: '/src/assets/avatar/avatar4.jpg',
        5: '/src/assets/avatar/avatar5.jpg',
        6: '/src/assets/avatar/avatar6.jpg'
      }
      return avatarMapping[avatarId] || '/src/assets/avatar/avatar1.jpg'
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
    setPreferences(preferences = null) {
      // 如果没有传入preferences，使用硬编码的默认值
      const defaultPreferences = {
        defaultPage: 'dashboard',
        language: 'zh-CN',
        notifications: true
      }

      this.preferences = preferences || defaultPreferences
      try {
        localStorage.setItem('preferences', JSON.stringify(this.preferences))
      } catch (e) {
        console.warn('Failed to save preferences to localStorage:', e)
      }
    },
    updateUserAvatar(avatarId) {
      // 更新store中的头像ID
      this.avatar = avatarId

      // 更新user对象中的头像ID
      if (this.user) {
        this.user.avatar = avatarId
      } else {
        this.user = {
          avatar: avatarId
        }
      }

      // 保存到localStorage
      try {
        localStorage.setItem('avatar', avatarId.toString())
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch (e) {
        console.warn('Failed to save avatar to localStorage:', e)
      }
    },
    setUserFromResponse(payload) {
      // 适配新的响应结构：
      // { token, userName, tenantName, tenantId, platformAdmin, tenantSuperAdmin, avatar }
      const userName = payload.userName || null
      const tenantName = payload.tenantName || null
      const tenantId = payload.tenantId || null
      const platformAdmin = payload.platformAdmin || false
      const tenantSuperAdmin = payload.tenantSuperAdmin || false

      // 头像处理策略：优先使用服务器返回的头像，否则保留本地缓存的头像
      const serverAvatar = payload.avatar
      const cachedAvatar = parseInt(localStorage.getItem('avatar')) || 1
      const avatar = serverAvatar !== undefined ? serverAvatar : cachedAvatar

      // 验证用户信息完整性
      if (!userName) {
        console.warn('User data incomplete:', payload)
        throw new Error('用户信息不完整，请重新登录')
      }

      // 构造用户对象，包含头像ID
      this.user = {
        username: userName,
        avatar: avatar
      }

      // 构造租户对象，包含ID和名称
      this.tenant = {
        id: tenantId ? parseInt(tenantId) : null, // 确保tenantId为int类型
        name: tenantName
      }

      this.tenantName = tenantName // 保持兼容性
      this.platformAdmin = platformAdmin
      this.tenantSuperAdmin = tenantSuperAdmin
      this.avatar = avatar

      // 保存到 localStorage 以实现持久化
      try {
        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('tenant', JSON.stringify(this.tenant))
        localStorage.setItem('tenantName', tenantName || '')
        localStorage.setItem('platformAdmin', JSON.stringify(platformAdmin))
        localStorage.setItem('tenantSuperAdmin', JSON.stringify(tenantSuperAdmin))
        localStorage.setItem('avatar', avatar.toString())
      } catch (e) {
        console.warn('Failed to save user data to localStorage:', e)
      }
    },
    async login(payload) {
      console.log('开始登录，请求数据:', payload)
      const res = await loginAPI(payload)
      console.log('登录接口响应:', res)

      // 从响应的data字段中获取数据
      const data = res?.data || res
      const token = data?.token || `mock-${(data?.userName || 'user')}-${Date.now()}`

      console.log('提取的Token:', token)
      console.log('用户数据:', data)

      this.setToken(token)
      this.setUserFromResponse(data)
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('tenant')
      localStorage.removeItem('tenantName')
      localStorage.removeItem('platformAdmin')
      localStorage.removeItem('tenantSuperAdmin')
      localStorage.removeItem('preferences')
      localStorage.removeItem('avatar')
      this.$reset()
    }
  }
})
