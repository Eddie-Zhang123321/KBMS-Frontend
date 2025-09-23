<template>
  <div class="dashboard-container">
    <div class="dashboard-layout">
      <!-- 通知面板 -->
      <div class="notification-section">
        <el-card shadow="hover" class="notification-card">
          <template #header>
            <div class="card-header">
              <span>工单通知</span>
              <el-badge :value="unreadNotificationsCount" :max="99" class="unread-badge">
                <el-icon>
                  <Bell />
                </el-icon>
              </el-badge>
            </div>
          </template>

          <el-scrollbar class="notification-list">
            <template v-if="loading">
              <div class="loading-notification">加载中...</div>
            </template>
            <template v-else-if="displayedNotifications.length === 0">
              <div class="empty-notification">
                <div>暂无工单通知</div>
                <div v-if="lastLoadTime" class="last-load-time">
                  最后更新：{{ formatLastLoadTime(lastLoadTime) }}
                </div>
              </div>
            </template>

            <div v-for="notification in displayedNotifications" :key="notification.id" 
                 class="notification-item" 
                 :class="getTypeClass(notification.type)">
              <div class="notification-content">
                <div class="notification-title">
                  <span class="feedback-type-text" :class="getFeedbackTypeClass(notification.feedbackType)">
                    {{ getNotificationTitle(notification) }}
                  </span>
                  <span v-if="notification.type" class="type-badge" :class="getTypeClass(notification.type)">
                    {{ getTypeDisplayText(notification.type) }}
                  </span>
                </div>
                <div class="knowledge-base-name">
                  📚 {{ notification.knowledgeBaseName || '未知知识库' }}
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
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { Bell, Lock, Connection, FolderOpened, Document, Warning, Timer } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { formatDistance } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useWebSocket } from '@/composables/useWebSocket'
import { getTicketNotifications } from '@/api/ticket'
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

// WebSocket 通知（保留用于状态更新）
const { notifications, isConnected } = useWebSocket()

// HTTP获取的工单通知列表
const ticketNotifications = ref([])
const loading = ref(false)
const lastLoadTime = ref(null)

// 合并HTTP和WebSocket通知列表
const allNotifications = computed(() => {
  const httpNotifications = ticketNotifications.value || []
  const wsNotifications = notifications.list || []
  
  // 合并通知列表，去重（基于id）
  const allNotifs = [...httpNotifications, ...wsNotifications]
  const uniqueNotifs = allNotifs.filter((notif, index, self) => 
    index === self.findIndex(n => n.id === notif.id)
  )
  
  // 按时间戳排序（最新的在前）
  return uniqueNotifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
})

// 显示的通知列表（默认显示5条，支持滚动查看更多）
const displayedNotifications = computed(() => {
  return allNotifications.value
})

// 未读通知数量（简化后所有通知都视为未读）
const unreadNotificationsCount = computed(() => {
  return allNotifications.value.length
})

// HTTP接口加载工单通知列表
const loadTicketNotifications = async () => {
  try {
    loading.value = true
    console.log('📡 开始加载工单通知列表...')
    
    const response = await getTicketNotifications()
    console.log('📡 HTTP响应:', response)
    console.log('📡 响应类型:', typeof response)
    console.log('📡 是否为数组:', Array.isArray(response))
    console.log('📡 响应长度:', response?.length)
    
    // 处理响应数据
    if (response) {
      // HTTP拦截器已经处理了响应格式，response 就是 data 数组
      if (Array.isArray(response)) {
        ticketNotifications.value = response.map(item => ({
          id: item.id || Date.now(),
          knowledgeBaseName: item.knowledgeBaseName || '未知知识库',
          userName: item.userName || '未知用户',
          feedbackType: item.feedbackType || '工单通知',
          createdAt: item.createdAt || new Date().toISOString(),
          type: item.type || 'NEW',
          timestamp: new Date(item.createdAt || Date.now()).getTime()
        }))
        
        console.log('✅ 工单通知列表加载成功，总数:', ticketNotifications.value.length)
        ElMessage.success(`成功加载 ${ticketNotifications.value.length} 条工单通知`)
      } 
      // 如果响应是对象格式，包含data数组（兼容性处理）
      else if (response.data && Array.isArray(response.data)) {
        ticketNotifications.value = response.data.map(item => ({
          id: item.id || Date.now(),
          knowledgeBaseName: item.knowledgeBaseName || '未知知识库',
          userName: item.userName || '未知用户',
          feedbackType: item.feedbackType || '工单通知',
          createdAt: item.createdAt || new Date().toISOString(),
          type: item.type || 'NEW',
          timestamp: new Date(item.createdAt || Date.now()).getTime()
        }))
        
        console.log('✅ 工单通知列表加载成功，总数:', ticketNotifications.value.length)
        ElMessage.success(`成功加载 ${ticketNotifications.value.length} 条工单通知`)
      } else {
        console.warn('⚠️ 响应数据格式异常:', response)
        ElMessage.warning('工单通知数据格式异常')
      }
    } else {
      console.warn('⚠️ 响应为空:', response)
      ElMessage.warning('未收到工单通知数据')
    }
    
    lastLoadTime.value = new Date()
  } catch (error) {
    console.error('❌ 加载工单通知失败:', error)
    ElMessage.error('加载工单通知失败，请检查网络连接')
  } finally {
    loading.value = false
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

// 工单类型中文转换
const getFeedbackTypeText = (feedbackType) => {
  const typeMap = {
    'accuracy': '准确度',
    'relevance': '相关度', 
    'completeness': '完整度',
    'clarity': '清晰度'
  }
  return typeMap[feedbackType] || feedbackType || '工单通知'
}

// 获取工单通知标题
const getNotificationTitle = (notification) => {
  return getFeedbackTypeText(notification.feedbackType)
}

// 获取工单通知详情
const getNotificationDetail = (notification) => {
  const parts = []
  
  if (notification.userName) {
    parts.push(`用户：${notification.userName}`)
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

// 获取工单类型对应的样式类（用于左侧颜色条）
const getFeedbackTypeClass = (feedbackType) => {
  if (feedbackType === 'accuracy') return 'feedback-accuracy'
  if (feedbackType === 'relevance') return 'feedback-relevance'
  if (feedbackType === 'completeness') return 'feedback-completeness'
  if (feedbackType === 'clarity') return 'feedback-clarity'
  return 'feedback-default'
}




// 组件挂载时加载工单通知
onMounted(() => {
  console.log('Dashboard组件已挂载，开始加载工单通知')
  loadTicketNotifications()
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
  height: 780px; /* 调整高度以正好显示5条消息 */
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


.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.notification-list {
  flex: 1;
  max-height: 660px; /* 调整高度以正好显示5条消息并支持滚动 */
  overflow: hidden;
}

/* 自定义滚动条样式 */
.notification-list :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

.notification-list :deep(.el-scrollbar__bar) {
  right: 2px;
  bottom: 2px;
}

.notification-list :deep(.el-scrollbar__thumb) {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 4px;
}

.notification-list :deep(.el-scrollbar__thumb:hover) {
  background-color: rgba(144, 147, 153, 0.5);
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
  padding: 16px 12px; /* 增加垂直内边距 */
  border-bottom: 1px solid #ebeef5;
  min-height: 95px; /* 增加最小高度，确保每条消息有足够空间 */
  position: relative;
  background-color: #ffffff;
  transition: all 0.3s ease;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.is-unread {
  background-color: #f7fcf8;
}

.notification-content {
  flex-grow: 1;
  margin-left: 8px; /* 为左侧颜色条留出空间 */
}

.notification-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #444;
  margin-bottom: 6px;
}

.knowledge-base-name {
  font-size: 16px;
  font-weight: 700;
  color: #444;
  margin-bottom: 6px;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(24, 144, 255, 0.1);
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
  font-size: 14px;
  font-weight: 500;
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
  padding: 1px 8px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  margin-left: 8px;
  white-space: nowrap;
}

.type-new {
  /* background-color: #ffeb3b; */
  color: #f57f17;
  /* border: 1px solid #ffc107; */
}

.type-processed {
  /* background-color: #c8e6c9; */
  color: #2e7d32;
  /* border: 1px solid #4caf50; */
}

.type-unknown {
  /* background-color: #e2e3e5; */
  color: #383d41;
  /* border: 1px solid #d6d8db; */
}

/* 通知项类型左侧颜色条样式（与type状态相符） */
.notification-item.type-new {
  border-left: 4px solid #ffc107; /* 黄色 - 新工单 */
}

.notification-item.type-processed {
  border-left: 4px solid #4caf50; /* 绿色 - 已处理 */
}

.notification-item.type-unknown {
  border-left: 4px solid #6c757d; /* 灰色 - 未知状态 */
}

/* 工单类型文字颜色样式 */
.feedback-type-text {
  font-size: 16px;
  font-weight: 600;
}

.feedback-type-text.feedback-accuracy {
  color: #52c41a; /* 绿色 - 准确度 */
}

.feedback-type-text.feedback-relevance {
  color: #1890ff; /* 蓝色 - 相关度 */
}

.feedback-type-text.feedback-completeness {
  color: #fa8c16; /* 橙色 - 完整度 */
}

.feedback-type-text.feedback-clarity {
  color: #722ed1; /* 紫色 - 清晰度 */
}

.feedback-type-text.feedback-default {
  color: #666666; /* 灰色 - 默认 */
}

/* 通知项类型样式（保留兼容性，现在使用工单类型颜色条） */

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
    height: 680px; /* 平板高度，正好显示5条消息 */
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
    height: 630px; /* 手机高度，正好显示5条消息 */
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