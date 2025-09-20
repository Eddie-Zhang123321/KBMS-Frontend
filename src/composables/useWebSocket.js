import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElNotification } from 'element-plus'

// 通知类型枚举
export const NotificationTypes = {
  // 工单相关通知
  TICKET_CREATED: 'ticket:created',
  TICKET_UPDATED: 'ticket:updated',
  TICKET_COMPLETED: 'ticket:completed'
}

// 角色枚举（精简为三种角色）
export const UserRoles = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',     // 平台管理员
  TENANT_SUPER_ADMIN: 'TENANT_SUPER_ADMIN', // 租户超级管理员
  TENANT_USER: 'TENANT_USER'            // 租户普通用户
}

// WebSocket通知管理器
export function useWebSocket(serverUrl = `ws://localhost:8081`) {
  const socket = ref(null)
  const isConnected = ref(false)
  const error = ref(null)
  const reconnectAttempts = ref(0)
  const reconnectTimer = ref(null)

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

  // 连接 WebSocket
  function connect() {
    const userStore = useUserStore()

    try {
      // 构建WebSocket URL和认证信息
      const wsUrl = buildWebSocketUrl(serverUrl, userStore)
      console.log('WebSocket 连接URL:', wsUrl)

      socket.value = new WebSocket(wsUrl)

      // 连接成功
      socket.value.onopen = () => {
        isConnected.value = true
        error.value = null
        reconnectAttempts.value = 0
        console.log('WebSocket 连接成功')

        // 发送认证信息
        sendAuthMessage(userStore)

        // 桌面通知
        ElNotification.success({
          title: '网络连接',
          message: 'WebSocket 连接已建立'
        })
      }

      // 接收消息
      socket.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (err) {
          console.error('解析WebSocket消息失败:', err)
        }
      }

      // 连接错误处理
      socket.value.onerror = (err) => {
        error.value = err
        isConnected.value = false
        console.error('WebSocket 连接错误:', err)
      }

      // 断开连接处理
      socket.value.onclose = (event) => {
        isConnected.value = false
        console.log('WebSocket 断开连接:', event.code, event.reason)

        // 自动重连（除非是主动关闭）
        if (event.code !== 1000 && reconnectAttempts.value < 5) {
          scheduleReconnect()
        }
      }
    } catch (err) {
      error.value = err
      console.error('创建 WebSocket 失败:', err)
    }
  }

  // 构建WebSocket URL
  function buildWebSocketUrl(baseUrl, userStore) {
    const url = new URL(baseUrl)
    url.searchParams.set('token', userStore.token || '')
    url.searchParams.set('userId', userStore.user?.username || '')
    url.searchParams.set('role', getUserRole(userStore))
    url.searchParams.set('tenantId', userStore.tenant?.id || '')
    return url.toString()
  }

  // 发送认证消息
  function sendAuthMessage(userStore) {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      const authMessage = {
        type: 'auth',
        data: buildConnectionMetadata(userStore)
      }
      socket.value.send(JSON.stringify(authMessage))
    }
  }

  // 处理WebSocket消息
  function handleWebSocketMessage(message) {
    switch (message.type) {
      case 'ticket_notification':
        handleTicketNotification(message.data)
        break
      default:
        console.log('未知消息类型:', message.type)
    }
  }

  // 处理工单通知消息
  function handleTicketNotification(data) {
    const notification = {
      id: data.id || Date.now(),
      userName: data.userName || '',
      feedbackType: data.feedbackType || '工单通知',
      knowledgeBaseName: data.knowledgeBaseName || '',
      createdAt: data.createdAt || new Date().toISOString()
    }

    // 添加到通知列表
    notifications.list.unshift(notification)
    notifications.unreadCount++

    // 桌面通知
    ElNotification({
      title: notification.feedbackType,
      message: `知识库「${notification.knowledgeBaseName}」收到新工单`,
      type: 'info',
      onClick: () => {
        markNotificationAsRead(notification.id)
      }
    })
  }

  // 安排重连
  function scheduleReconnect() {
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
    }

    reconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)

    reconnectTimer.value = setTimeout(() => {
      console.log(`WebSocket 重连尝试 ${reconnectAttempts.value}`)
      connect()
    }, delay)
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


  // 发送消息到WebSocket
  function sendMessage(type, data) {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: Date.now()
      }
      socket.value.send(JSON.stringify(message))
    }
  }

  // 标记通知为已读（简化版本，因为通知不再包含read字段）
  function markNotificationAsRead(notificationId) {
    // 由于通知不再包含read字段，这里只是减少未读计数
    if (notifications.unreadCount > 0) {
      notifications.unreadCount--
    }
  }

  // 清除特定类型的通知
  function clearNotificationsByType(type) {
    notifications.list = notifications.list.filter(n => n.type !== type)
    // 由于通知不再包含read字段，重新计算未读数量
    notifications.unreadCount = notifications.list.length
  }

  // 清除所有通知
  function clearAllNotifications() {
    notifications.list = []
    notifications.unreadCount = 0
  }

  // 手动连接
  function manualConnect() {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      return
    }
    connect()
  }

  // 手动断开连接
  function disconnect() {
    if (socket.value) {
      socket.value.close(1000, 'Manual disconnect')
    }
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }
  }

  // 生命周期管理
  onMounted(() => {
    // 延迟连接，确保用户信息已加载
    setTimeout(connect, 1000)
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    isConnected,
    notifications,
    error,
    reconnectAttempts,
    NotificationTypes,
    UserRoles,
    connect: manualConnect,
    disconnect,
    sendMessage,
    markNotificationAsRead,
    clearNotificationsByType,
    clearAllNotifications
  }
}

