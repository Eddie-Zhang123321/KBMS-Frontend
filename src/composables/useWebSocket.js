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
    const WEBSOCKET_PATH = '/ws/notifications'

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
          console.log('📨 收到WebSocket消息:', message.type || '状态更新', message)
          handleWebSocketMessage(message)
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

  // 处理WebSocket消息（用于状态更新）
  function handleWebSocketMessage(message) {
    console.log('📨 收到WebSocket消息:', message)

    // 检查是否是工单通知格式
    if (message.code === 0 && Array.isArray(message.data)) {
      handleTicketNotification(message)
      return
    }

    // 检查是否是单个工单数据（新工单或状态更新）
    if (message.id !== undefined) {
      handleSingleTicketMessage(message)
      return
    }

    // 其他类型的消息暂时不处理
    console.log('📨 其他WebSocket消息:', message)
  }

  // 处理单个工单消息（新工单或状态更新）
  function handleSingleTicketMessage(message) {
    const { id, knowledgeBaseName, userName, feedbackType, createdAt, type } = message

    console.log('🔍 解析工单消息:', { id, type, hasData: !!(knowledgeBaseName && userName) })

    // 检查是否是状态更新（只有id和type有值，其他为null）
    if (id && type && knowledgeBaseName === null && userName === null && feedbackType === null && createdAt === null) {
      console.log('🔄 识别为工单状态更新:', { id, type })
      updateTicketStatus(id, type)
      return
    }

    // 检查是否是新工单（有完整数据）
    if (id && knowledgeBaseName && userName && feedbackType && createdAt && type) {
      console.log('📋 识别为新工单通知:', message)
      addNewTicket(message)
      return
    }

    console.warn('⚠️ 未知的工单消息格式:', message)
  }

  // 更新工单状态
  function updateTicketStatus(ticketId, newType) {
    // 在通知列表中查找对应的工单
    const notificationIndex = notifications.list.findIndex(n => n.id === ticketId)

    if (notificationIndex !== -1) {
      // 更新工单状态
      notifications.list[notificationIndex].type = newType
      notifications.list[notificationIndex].updatedAt = new Date().toISOString()

      // 强制触发响应式更新
      notifications.list = [...notifications.list]

      console.log('✅ 工单状态已更新:', ticketId, '新状态:', newType)

      // 显示桌面通知
      ElNotification({
        title: '工单状态更新',
        message: `工单 #${ticketId} 状态已更新为: ${getTypeDisplayText(newType)}`,
        type: newType === 'PROCESSED' ? 'success' : 'info',
        duration: 3000
      })
    } else {
      console.warn('⚠️ 未找到要更新的工单:', ticketId)
    }
  }

  // 添加新工单
  function addNewTicket(ticketData) {
    const notification = {
      id: ticketData.id,
      knowledgeBaseName: ticketData.knowledgeBaseName || '未知知识库',
      userName: ticketData.userName || '未知用户',
      feedbackType: ticketData.feedbackType || '工单通知',
      createdAt: ticketData.createdAt || new Date().toISOString(),
      type: ticketData.type || 'NEW',
      timestamp: new Date(ticketData.createdAt || Date.now()).getTime()
    }

    // 检查是否已存在（避免重复添加）
    const existingIndex = notifications.list.findIndex(n => n.id === notification.id)
    if (existingIndex === -1) {
      // 添加到列表开头（最新消息在最上面）
      notifications.list.unshift(notification)
      notifications.unreadCount++

      console.log('✅ 新工单已添加（最新）:', notification)

      // 显示桌面通知
      ElNotification({
        title: '新工单通知',
        message: `用户「${notification.userName}」在知识库「${notification.knowledgeBaseName}」中提交了工单`,
        type: 'info',
        duration: 5000
      })
    } else {
      console.log('ℹ️ 工单已存在，跳过添加:', notification.id)
    }
  }

  // 获取类型显示文本
  function getTypeDisplayText(type) {
    if (type === 'NEW') return '新工单'
    if (type === 'PROCESSED') return '已处理'
    return type || '未知状态'
  }


  // 处理工单通知消息（兼容性保留）
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

