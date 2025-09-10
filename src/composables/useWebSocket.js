import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { io } from 'socket.io-client'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElNotification } from 'element-plus'

// 通知类型枚举
export const NotificationTypes = {
  // 租户相关通知
  TENANT_REGISTRATION_PENDING: 'tenant:registration:pending',
  TENANT_REGISTRATION_APPROVED: 'tenant:registration:approved',
  TENANT_REGISTRATION_REJECTED: 'tenant:registration:rejected',

  // 用户注册相关通知
  USER_REGISTER_PENDING: 'user:register:pending',
  USER_REGISTER_APPROVED: 'user:register:approved',
  USER_REGISTER_REJECTED: 'user:register:rejected',

  // 系统通知
  SYSTEM_ALERT: 'system:alert',
  SYSTEM_WARNING: 'system:warning',
  SYSTEM_INFO: 'system:info'
}

// 角色枚举（精简为三种角色）
export const UserRoles = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',     // 平台管理员
  TENANT_SUPER_ADMIN: 'TENANT_SUPER_ADMIN', // 租户超级管理员
  TENANT_USER: 'TENANT_USER'            // 租户普通用户
}

// 通知管理器
export function useSocketIO(serverUrl = `ws://localhost:8081`) {
  const socket = ref(null)
  const isConnected = ref(false)
  const error = ref(null)
  const reconnectAttempts = ref(0)

  // 通知存储
  const notifications = reactive({
    list: [],
    unreadCount: 0,
    // 按类型分组的通知
    groupedNotifications: computed(() => {
      return notifications.list.reduce((groups, notification) => {
        const group = notification.type || 'other'
        if (!groups[group]) {
          groups[group] = []
        }
        groups[group].push(notification)
        return groups
      }, {})
    })
  })

  // 连接 Socket.IO
  function connect() {
    const userStore = useUserStore()

    try {
      // 构建连接元数据
      const connectionMetadata = buildConnectionMetadata(userStore)

      console.log('WebSocket 连接元数据:', connectionMetadata)

      socket.value = io(serverUrl, {
        auth: connectionMetadata,
        transports: ['websocket'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

      // 连接成功
      socket.value.on('connect', () => {
        isConnected.value = true
        error.value = null
        reconnectAttempts.value = 0
        console.log('Socket.IO 连接成功')

        // 订阅通知
        subscribeToNotifications(userStore)

        // 桌面通知
        ElNotification.success({
          title: '网络连接',
          message: 'WebSocket 连接已建立'
        })
      })

      // 连接错误处理
      socket.value.on('connect_error', (err) => {
        error.value = err
        isConnected.value = false
        reconnectAttempts.value++
        console.error('Socket.IO 连接错误:', err)

        // 重连失败提示
        if (reconnectAttempts.value >= 3) {
          ElNotification.error({
            title: '网络错误',
            message: '无法连接到服务器，请检查网络设置'
          })
        }
      })

      // 断开连接处理
      socket.value.on('disconnect', (reason) => {
        isConnected.value = false
        console.log('Socket.IO 断开连接:', reason)

        if (reason === 'io server disconnect') {
          socket.value.connect()
        }
      })

      // 监听通知事件
      socket.value.on(NotificationTypes.TENANT_REGISTRATION_PENDING, handleTenantRegistrationNotification)
      socket.value.on(NotificationTypes.USER_REGISTER_PENDING, handleUserRegisterNotification)
    } catch (err) {
      error.value = err
      console.error('创建 Socket.IO 失败:', err)
    }
  }

  // 构建连接元数据
  function buildConnectionMetadata(userStore) {
    return {
      token: userStore.token || '',
      userId: userStore.user?.username || '',
      role: getUserRole(userStore),
      tenantId: userStore.tenant?.id || ''
    }
  }

  // 获取用户角色
  function getUserRole(userStore) {
    if (userStore.isPlatformAdmin) return UserRoles.PLATFORM_ADMIN
    if (userStore.isTenantSuperAdmin) return UserRoles.TENANT_SUPER_ADMIN
    return UserRoles.TENANT_USER
  }

  // 订阅通知
  function subscribeToNotifications(userStore) {
    const role = getUserRole(userStore)

    switch (role) {
      case UserRoles.PLATFORM_ADMIN:
        // 订阅平台管理员通知
        socket.value.emit('subscribe', {
          room: 'PLATFORM_ADMIN_ROOM'
        })
        break
      case UserRoles.TENANT_SUPER_ADMIN:
        // 订阅租户超级管理员通知
        socket.value.emit('subscribe', {
          room: `TENANT_${userStore.tenant.id}_ADMIN_ROOM`
        })
        break
    }
  }

  // 处理租户注册通知（仅平台管理员）
  function handleTenantRegistrationNotification(data) {
    const userStore = useUserStore()
    if (!userStore.isPlatformAdmin) return

    const notification = {
      id: Date.now(),
      type: NotificationTypes.TENANT_REGISTRATION_PENDING,
      data,
      timestamp: Date.now(),
      read: false
    }

    // 添加到通知列表
    notifications.list.unshift(notification)
    notifications.unreadCount++

    // 桌面通知
    ElNotification.info({
      title: '租户注册通知',
      message: `新租户 ${data.tenantName} 申请注册`,
      onClick: () => {
        // TODO: 跳转到租户审批页面
      }
    })
  }

  // 处理用户注册通知（仅租户超级管理员）
  function handleUserRegisterNotification(data) {
    const userStore = useUserStore()
    if (!userStore.isTenantSuperAdmin ||
      data.tenantId !== userStore.tenant.id) return

    const notification = {
      id: Date.now(),
      type: NotificationTypes.USER_REGISTER_PENDING,
      data,
      timestamp: Date.now(),
      read: false
    }

    // 添加到通知列表
    notifications.list.unshift(notification)
    notifications.unreadCount++

    // 桌面通知
    ElNotification.info({
      title: '用户注册通知',
      message: `新用户 ${data.username} 申请注册`,
      onClick: () => {
        // TODO: 跳转到用户审批页面
      }
    })
  }

  // 发送租户注册通知
  function sendTenantRegistrationNotification(tenantData) {
    if (socket.value && isConnected.value) {
      socket.value.emit(NotificationTypes.TENANT_REGISTRATION_PENDING, {
        tenantName: tenantData.name,
        tenantId: tenantData.id,
        registrationTime: Date.now()
      })
    }
  }

  // 发送用户注册通知
  function sendUserRegisterNotification(userData) {
    if (socket.value && isConnected.value) {
      socket.value.emit(NotificationTypes.USER_REGISTER_PENDING, {
        username: userData.username,
        userId: userData.id,
        tenantId: userData.tenantId,
        registrationTime: Date.now()
      })
    }
  }

  // 标记通知为已读
  function markNotificationAsRead(notificationId) {
    const index = notifications.list.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      notifications.list[index].read = true
      notifications.unreadCount--
    }
  }

  // 清除特定类型的通知
  function clearNotificationsByType(type) {
    notifications.list = notifications.list.filter(n => n.type !== type)
    notifications.unreadCount = notifications.list.filter(n => !n.read).length
  }

  // 清除所有通知
  function clearAllNotifications() {
    notifications.list = []
    notifications.unreadCount = 0
  }

  // 生命周期管理
  onMounted(connect)

  onUnmounted(() => {
    if (socket.value) {
      socket.value.disconnect()
    }
  })

  return {
    socket,
    isConnected,
    notifications,
    error,
    reconnectAttempts,
    NotificationTypes,
    UserRoles,
    sendTenantRegistrationNotification,
    sendUserRegisterNotification,
    markNotificationAsRead,
    clearNotificationsByType,
    clearAllNotifications
  }
}

