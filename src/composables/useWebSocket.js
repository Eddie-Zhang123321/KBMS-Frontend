import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElNotification } from 'element-plus'

// WebSocket通知管理器
export function useWebSocket(serverUrl = null) {
  // 动态构建WebSocket URL（独立配置，不影响HTTP接口）
  const getWebSocketUrl = () => {
    if (serverUrl) return serverUrl

    // 直接设置WebSocket后端服务器地址
    const WEBSOCKET_SERVER_URL = 'ws://localhost:8081'
    const WEBSOCKET_PATH = '/api/ticket/notifications'

    return `${WEBSOCKET_SERVER_URL}${WEBSOCKET_PATH}`
  }
  const socket = ref(null)
  const isConnected = ref(false)
  const error = ref(null)
  const reconnectAttempts = ref(0)
  const reconnectTimer = ref(null)

  // 通知存储
  const notifications = reactive({
    list: [],
    unreadCount: 0
  })

  // 连接 WebSocket
  function connect() {
    try {
      // 构建WebSocket URL
      const wsUrl = getWebSocketUrl()

      console.log('🔗 WebSocket连接中:', wsUrl)

      socket.value = new WebSocket(wsUrl)

      // 连接成功
      socket.value.onopen = () => {
        isConnected.value = true
        error.value = null
        reconnectAttempts.value = 0

        console.log('✅ WebSocket握手成功')
      }

      // 接收消息
      socket.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 收到工单通知:', message)
          handleTicketNotification(message)
        } catch (err) {
          console.error('❌ 消息解析失败:', event.data)
        }
      }

      // 连接错误处理
      socket.value.onerror = (err) => {
        error.value = err
        isConnected.value = false

        console.error('❌ WebSocket连接失败')

        ElNotification.error({
          title: 'WebSocket 连接错误',
          message: '无法连接到工单通知服务，请检查网络连接或联系管理员'
        })
      }

      // 断开连接处理
      socket.value.onclose = (event) => {
        isConnected.value = false

        console.log('🔌 WebSocket断开，代码:', event.code)

        if (event.code !== 1000) {
          ElNotification.warning({
            title: '连接断开',
            message: `WebSocket连接已断开 (代码: ${event.code})`
          })
        }
      }
    } catch (err) {
      error.value = err
      console.error('创建 WebSocket 失败:', err)
    }
  }

  // 处理工单通知消息
  function handleTicketNotification(message) {
    // 检查消息格式
    if (message.code === 0 && Array.isArray(message.data)) {
      // 处理工单通知数组
      message.data.forEach(item => {
        const notification = {
          id: item.id || Date.now(),
          knowledgeBaseName: item.knowledgeBaseName || '未知知识库',
          userName: item.userName || '未知用户',
          feedbackType: item.feedbackType || '工单通知',
          createdAt: item.createdAt || new Date().toISOString(),
          type: item.type || 'NEW',
          timestamp: new Date(item.createdAt || Date.now()).getTime()
        }

        notifications.list.unshift(notification)
        notifications.unreadCount++

        console.log('📋 工单通知已添加:', notification)

        // 桌面通知
        ElNotification({
          title: '新工单通知',
          message: `用户「${notification.userName}」在知识库「${notification.knowledgeBaseName}」中提交了工单`,
          type: 'info',
          duration: 5000
        })
      })
    } else {
      console.error('❌ 工单通知格式错误:', message)
    }
  }

  // 标记通知为已读
  function markNotificationAsRead(notificationId) {
    if (notifications.unreadCount > 0) {
      notifications.unreadCount--
    }
  }

  // 清除所有通知
  function clearAllNotifications() {
    notifications.list = []
    notifications.unreadCount = 0
  }

  // 手动断开连接
  function disconnect() {
    if (socket.value) {
      socket.value.close(1000, 'Manual disconnect')
    }
  }

  // 生命周期管理
  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    isConnected,
    notifications,
    error,
    connect,
    disconnect,
    markNotificationAsRead,
    clearAllNotifications
  }
}

