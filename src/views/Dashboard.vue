<template>
  <div class="dashboard-container">
    <div class="dashboard-layout">
      <!-- 通知面板 -->
      <div class="notification-section">
        <el-card shadow="hover" class="notification-card">
          <template #header>
            <div class="card-header">
              <span>工单通知</span>
              <div class="header-actions">
                <el-button 
                  type="text" 
                  size="small" 
                  :loading="loading"
                  @click="refreshNotifications"
                  title="刷新通知"
                >
                  <el-icon><Refresh /></el-icon>
                </el-button>
                <el-badge :value="unreadNotificationsCount" :max="99" class="unread-badge">
                  <el-icon>
                    <Bell />
                  </el-icon>
                </el-badge>
              </div>
            </div>
          </template>

          <el-scrollbar class="notification-list">
            <template v-if="loading">
              <div class="loading-notification">加载中...</div>
            </template>
            <template v-else-if="allNotifications.length === 0">
              <div class="empty-notification">
                <div>暂无工单通知</div>
                <div v-if="lastLoadTime" class="last-load-time">
                  最后更新：{{ formatLastLoadTime(lastLoadTime) }}
                </div>
              </div>
            </template>

            <div v-for="notification in allNotifications" :key="notification.id" 
                 class="notification-item" 
                 :class="getTypeClass(notification.type)"
                 @click="handleNotificationClick(notification)">
              <div class="notification-content">
                <div class="notification-title">
                  <span>{{ getNotificationTitle(notification) }}</span>
                  <span v-if="notification.type" class="type-badge" :class="getTypeClass(notification.type)">
                    {{ getTypeDisplayText(notification.type) }}
                  </span>
                </div>
                <div class="notification-detail">
                  {{ getNotificationDetail(notification) }}
                </div>
                <div class="notification-time">
                  {{ formatTime(notification.createdAt) }}
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-card>

        <!-- 统计卡片区域 - 仅平台管理员可见 -->
        <div v-if="userStore.isPlatformAdmin" class="stats-cards-container">
          <el-row :gutter="12" class="stats-row">
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><Lock /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-title">登录失败统计</div>
                  <div class="stat-value">9<span class="stat-unit">次</span></div>
                  <div class="stat-desc">近24h失败数</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-title">API异常率</div>
                  <div class="stat-value">2<span class="stat-unit">%</span></div>
                  <div class="stat-desc">跨租户占比</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><FolderOpened /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-title">存储使用</div>
                  <div class="stat-value">2.3<span class="stat-unit">TB</span></div>
                  <div class="stat-desc">平台总存储量</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-title">文档条目</div>
                  <div class="stat-value">1200<span class="stat-unit">条</span></div>
                  <div class="stat-desc">全平台总量</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><Warning /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-title">系统告警</div>
                  <div class="stat-value">3<span class="stat-unit">条</span></div>
                  <div class="stat-desc">待处理告警</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="12" :md="6" :lg="6">
              <div class="stat-card">
                <div class="stat-icon">
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-title">系统响应时间</div>
                  <div class="stat-value">156<span class="stat-unit">ms</span></div>
                  <div class="stat-desc">平均响应时间</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

      </div>

      <!-- 数据统计区 -->
      <div class="statistics-section">
        <!-- 平台管理员：系统级别统计 -->
        <template v-if="userStore.isPlatformAdmin">
          <PlatformAdminStatistics />
        </template>

        <!-- 超级管理员：租户级别统计 -->
        <template v-else-if="userStore.isTenantSuperAdmin">
          <TenantAdminStatistics />
        </template>

        <!-- 普通用户：个人知识库级别统计 -->
        <template v-else>
          <UserKnowledgeStatistics />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Lock, Connection, FolderOpened, Document, Warning, Timer, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { formatDistance } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useWebSocket } from '@/composables/useWebSocket'
import { getTicketNotifications, getTicketKnowledgeBase } from '@/api/ticket'
import { ElMessage } from 'element-plus'

// 异步组件导入
const PlatformAdminStatistics = defineAsyncComponent(() =>
  import('@/views/dashboard/PlatformAdminStatistics.vue')
)
const TenantAdminStatistics = defineAsyncComponent(() =>
  import('@/views/dashboard/TenantAdminStatistics.vue')
)
const UserKnowledgeStatistics = defineAsyncComponent(() =>
  import('@/views/dashboard/UserKnowledgeStatistics.vue')
)

// 用户 store
const userStore = useUserStore()
const router = useRouter()

// WebSocket 通知
const { notifications, isConnected } = useWebSocket('ws://localhost:8081')

// 工单通知列表（从API获取）
const ticketNotifications = ref([])
const loading = ref(false)
const lastLoadTime = ref(null)

// 合并WebSocket和API工单通知
const allNotifications = computed(() => {
  // 合并WebSocket实时通知和API工单通知
  const wsNotifications = notifications.list || []
  const apiNotifications = ticketNotifications.value || []
  
  // 去重合并（基于ID）
  const notificationMap = new Map()
  
  // 先添加API工单通知
  apiNotifications.forEach(notif => {
    notificationMap.set(notif.id, {
      ...notif,
      source: 'api',
      timestamp: new Date(notif.createdAt).getTime()
    })
  })
  
  // 再添加WebSocket通知（会覆盖同ID的API通知）
  wsNotifications.forEach(notif => {
    notificationMap.set(notif.id, {
      ...notif,
      source: 'websocket',
      timestamp: notif.timestamp || Date.now()
    })
  })
  
  // 按时间戳排序（最新的在前）
  return Array.from(notificationMap.values()).sort((a, b) => b.timestamp - a.timestamp)
})

// 未读通知数量（简化后所有通知都视为未读）
const unreadNotificationsCount = computed(() =>
  allNotifications.value.length
)

// 加载工单通知列表
const loadTicketNotifications = async (showMessage = false) => {
  try {
    loading.value = true
    console.log('正在加载工单通知...')
    
    const response = await getTicketNotifications()
    console.log('工单通知API响应:', response)
    
    if (response?.data) {
      ticketNotifications.value = response.data
      lastLoadTime.value = new Date()
      console.log('成功加载工单通知:', response.data.length, '条')
      
      if (showMessage && response.data.length > 0) {
        ElMessage.success(`已加载 ${response.data.length} 条工单通知`)
      }
    } else {
      ticketNotifications.value = []
      console.log('工单通知数据为空')
    }
  } catch (error) {
    console.error('加载工单通知失败:', error)
    ticketNotifications.value = []
    
    // 根据错误类型显示不同的错误信息
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
    } else if (error.response?.status === 403) {
      ElMessage.error('没有权限访问工单通知')
    } else if (error.code === 'NETWORK_ERROR') {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error(`加载工单通知失败: ${error.message || '未知错误'}`)
    }
  } finally {
    loading.value = false
  }
}

// 处理工单通知点击
const handleNotificationClick = async (notification) => {
  try {
    // 1. 获取通知的ID
    const ticketId = notification.id
    if (!ticketId) {
      ElMessage.warning('工单ID不存在')
      return
    }

    // 2. 调用接口获取工单对应的知识库ID
    console.log('正在获取工单对应的知识库信息，工单ID:', ticketId)
    const response = await getTicketKnowledgeBase(ticketId)
    console.log('接口返回数据:', response)
    
    if (response?.data?.knowledgeBaseId) {
      // 3. 根据返回的知识库ID跳转到调优页面
      const knowledgeBaseId = response.data.knowledgeBaseId
      const knowledgeBaseName = response.data.knowledgeBaseName || '未知知识库'
      
      console.log('跳转到知识库:', knowledgeBaseId, '调优页面')
      router.push(`/knowledgebase/${knowledgeBaseId}?tab=optimize`)
      ElMessage.success(`正在跳转到知识库「${knowledgeBaseName}」的调优页面`)
    } else {
      ElMessage.warning('未找到对应的知识库信息')
    }
  } catch (error) {
    console.error('处理工单通知失败:', error)
    ElMessage.error(`处理工单通知失败: ${error.message || '未知错误'}`)
  }
}

// 格式化时间 - 直接显示createdAt内容
const formatTime = (createdAt) => {
  // 直接返回createdAt的内容，不进行相对时间转换
  return createdAt || '未知时间'
}

// 格式化最后加载时间
const formatLastLoadTime = (time) => {
  if (!time) return ''
  const now = new Date()
  const diff = now - time
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  
  return time.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取工单通知标题
const getNotificationTitle = (notification) => {
  return notification.feedbackType || '工单通知'
}

// 获取工单通知详情
const getNotificationDetail = (notification) => {
  const parts = []
  
  if (notification.userName) {
    parts.push(`用户：${notification.userName}`)
  }
  
  if (notification.knowledgeBaseName) {
    parts.push(`知识库：${notification.knowledgeBaseName}`)
  }
  
  if (notification.type) {
    parts.push(`状态：${getTypeDisplayText(notification.type)}`)
  }
  
  return parts.join(' | ')
}

// 获取类型显示文本
const getTypeDisplayText = (type) => {
  if (type === 'NEW') return '新工单'
  if (type === 'PROCESSED') return '已处理'
  return type || '未知状态'
}

// 获取类型对应的样式类
const getTypeClass = (type) => {
  if (type === 'NEW') return 'type-new'
  if (type === 'PROCESSED') return 'type-processed'
  return 'type-unknown'
}


// 刷新通知数据
const refreshNotifications = () => {
  console.log('手动刷新工单通知')
  loadTicketNotifications(true)
}

// 组件挂载时加载工单通知
onMounted(() => {
  console.log('Dashboard组件已挂载，开始加载工单通知')
  loadTicketNotifications()
  
  // 设置定时刷新（每5分钟自动刷新一次）
  const refreshInterval = setInterval(() => {
    console.log('定时刷新工单通知')
    loadTicketNotifications()
  }, 5 * 60 * 1000) // 5分钟
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
})
</script>


<style scoped>
.dashboard-container {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.dashboard-layout {
  display: flex;
  gap: 24px;
}

.notification-section {
  margin-top: 25px;
  width: 450px;
  min-width: 400px;
}

.notification-card {
  width: 100%;
  max-width: 500px;
  height: 570px; /* 增加高度以显示5条消息 */
  display: flex;
  flex-direction: column;
}

.statistics-section {
  flex-grow: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.notification-list {
  flex: 1;
  max-height: 450px; /* 增加最大高度，确保能显示5条消息并支持滚动 */
  overflow: hidden;
}

/* 统计卡片样式 */
.stats-cards-container {
  margin-top: 16px;
}

.stats-row {
  margin: 0;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 100%;
  min-height: 100px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  line-height: 1.2;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 2px;
  line-height: 1;
}

.stat-unit {
  font-size: 14px;
  font-weight: normal;
  color: #606266;
  margin-left: 2px;
}

.stat-desc {
  font-size: 11px;
  color: #c0c4cc;
  line-height: 1.2;
}


.notification-item {
  display: flex;
  align-items: center;
  padding: 14px 12px; /* 增加垂直内边距 */
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s, transform 0.2s;
  min-height: 85px; /* 设置最小高度，确保每条消息有足够空间 */
}

.notification-item:hover {
  background-color: #f9fafc;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.is-unread {
  background-color: #f7fcf8;
}

.notification-content {
  flex-grow: 1;
}

.notification-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #444;
  margin-bottom: 4px;
}

.notification-detail {
  color: #6a7482;
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 6px 0;
  word-break: break-all;
}

.notification-time {
  color: #aeb6bf;
  font-size: 11px;
  text-align: right;
}

.empty-notification {
  text-align: center;
  color: #909399;
  padding: 30px;
  font-size: 14px;
}

.last-load-time {
  margin-top: 8px;
  font-size: 12px;
  color: #c0c4cc;
}

.loading-notification {
  text-align: center;
  color: #666;
  padding: 30px;
  font-size: 14px;
}

.priority-low {
  border-left: 3px solid #67c23a;
}

.priority-medium {
  border-left: 3px solid #e6a23c;
}

.priority-high {
  border-left: 3px solid #f56c6c;
}

.severity-critical {
  border-left: 3px solid #c03639;
}

/* 简化的类型状态样式 */
.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 8px;
  white-space: nowrap;
}

.type-new {
  background-color: #ffeb3b;
  color: #f57f17;
  border: 1px solid #ffc107;
}

.type-processed {
  background-color: #c8e6c9;
  color: #2e7d32;
  border: 1px solid #4caf50;
}

.type-unknown {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

/* 通知项类型边框样式 */
.notification-item.type-new {
  border-left: 3px solid #ffc107;
}

.notification-item.type-processed {
  border-left: 3px solid #4caf50;
}

.notification-item.type-unknown {
  border-left: 3px solid #6c757d;
}

/* 桌面端布局 (> 1200px) */
@media (min-width: 1200px) {
  .dashboard-layout {
    flex-direction: row;
    align-items: flex-start;
  }
  
  .notification-section {
    width: 500px;
    min-width: 450px;
  }
  
  .stats-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .stats-row .el-col {
    width: 100% !important;
    max-width: none !important;
    flex: none !important;
  }
}

/* 中等屏幕 (768px - 1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  .dashboard-layout {
    flex-direction: row;
    align-items: flex-start;
  }
  
  .notification-section {
    width: 400px;
    min-width: 350px;
  }
  
  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .stats-row .el-col {
    width: 100% !important;
    max-width: none !important;
    flex: none !important;
  }
}

/* 移动端布局 (< 768px) */
@media (max-width: 767px) {
  .dashboard-container {
    padding: 16px;
  }

  .dashboard-layout {
    flex-direction: column;
  }

  .notification-section {
    width: 100%;
    min-width: unset;
  }
  
  .notification-card {
    height: 460px; /* 平板高度，确保能显示5条消息 */
  }

  .statistics-section {
    width: 100%;
    margin-top: 16px;
  }
  
  .card-title {
    font-size: 16px;
  }

  .notification-item {
    padding: 10px;
  }

  .notification-detail {
    font-size: 12px;
  }
  
  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .stats-row .el-col {
    width: 100% !important;
    max-width: none !important;
    flex: none !important;
  }
  
  .stat-card {
    padding: 16px;
    min-height: 90px;
  }
  
  .stat-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .stat-title {
    font-size: 11px;
  }
  
  .stat-desc {
    font-size: 10px;
  }
}

/* 超小屏幕 (< 480px) */
@media (max-width: 480px) {
  .dashboard-container {
    padding: 12px;
  }
  
  .notification-card {
    height: 420px; /* 手机高度，确保能显示5条消息 */
  }
  
  .stats-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .stat-card {
    padding: 14px;
    min-height: 80px;
  }
  
  .stat-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
  
  .stat-value {
    font-size: 16px;
  }
}
</style>