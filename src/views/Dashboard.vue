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

        <!-- 系统监控概览 - 仅平台管理员可见 -->
        <el-row v-if="userStore.isPlatformAdmin" :gutter="8" class="stats-row platform-stats-row">
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

        <!-- 租户用户角色分布 - 仅超级管理员可见 -->
        <div v-if="userStore.isTenantSuperAdmin" class="tenant-role-distribution">
          <div class="role-header">
            <h3 class="role-title">租户用户角色分布</h3>
            <div class="role-total">总用户数：256人</div>
          </div>
          <div class="role-content">
            <div class="role-item">
              <div class="role-icon normal-user">
                <el-icon><User /></el-icon>
              </div>
              <div class="role-info">
                <div class="role-name">普通用户</div>
                <div class="role-count">180人</div>
                <div class="role-percentage">70.3%</div>
              </div>
              <div class="role-progress">
                <div class="progress-bar">
                  <div class="progress-fill normal-fill" style="width: 70.3%"></div>
                </div>
              </div>
            </div>
            <div class="role-item">
              <div class="role-icon kb-admin">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="role-info">
                <div class="role-name">知识库管理员</div>
                <div class="role-count">45人</div>
                <div class="role-percentage">17.6%</div>
              </div>
              <div class="role-progress">
                <div class="progress-bar">
                  <div class="progress-fill admin-fill" style="width: 17.6%"></div>
                </div>
              </div>
            </div>
            <div class="role-item">
              <div class="role-icon kb-owner">
                <el-icon><Avatar /></el-icon>
              </div>
              <div class="role-info">
                <div class="role-name">知识库所有人</div>
                <div class="role-count">31人</div>
                <div class="role-percentage">12.1%</div>
              </div>
              <div class="role-progress">
                <div class="progress-bar">
                  <div class="progress-fill owner-fill" style="width: 12.1%"></div>
                </div>
              </div>
            </div>
            <div class="role-item">
              <div class="role-icon super-admin">
                <el-icon><Star /></el-icon>
              </div>
              <div class="role-info">
                <div class="role-name">超级管理员</div>
                <div class="role-count">1人</div>
                <div class="role-percentage">0.4%</div>
              </div>
              <div class="role-progress">
                <div class="progress-bar">
                  <div class="progress-fill super-fill" style="width: 0.4%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 普通用户工作台概览 - 仅普通用户可见 -->
        <div v-if="!userStore.isPlatformAdmin && !userStore.isTenantSuperAdmin" class="user-dashboard-overview">
          <div class="overview-header">
            <h3 class="overview-title">今日活动</h3>
          </div>
          <div class="overview-content">
            <div class="activity-item">
              <div class="activity-icon">
                <el-icon><Search /></el-icon>
              </div>
              <div class="activity-info">
                <div class="activity-label">查询次数</div>
                <div class="activity-value">23次</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="activity-info">
                <div class="activity-label">新增文档</div>
                <div class="activity-value">5个</div>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="activity-info">
                <div class="activity-label">使用时长</div>
                <div class="activity-value">2.5小时</div>
              </div>
            </div>
          </div>
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
import { Bell, Lock, Connection, FolderOpened, Document, Warning, Timer, User, TrendCharts, Search, Clock, UserFilled, Avatar, Star, Edit, Plus } from '@element-plus/icons-vue'
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


/* 租户用户角色分布样式 */
.tenant-role-distribution {
  margin-top: 16px;
  height: 320px;
  background: linear-gradient(135deg, #e8f4fd 0%, #d1e7dd 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.tenant-role-distribution:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.2);
}

.role-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.role-total {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.role-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.role-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(5px);
}

.role-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  flex-shrink: 0;
}

.role-icon.normal-user {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.role-icon.kb-admin {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
}

.role-icon.kb-owner {
  background: linear-gradient(135deg, #f56c6c 0%, #f89898 100%);
}

.role-icon.super-admin {
  background: linear-gradient(135deg, #722ed1 0%, #b37feb 100%);
}

.role-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.role-name {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.role-count {
  font-size: 14px;
  font-weight: bold;
  color: #409eff;
}

.role-percentage {
  font-size: 10px;
  color: #909399;
  font-weight: 500;
}

.role-progress {
  width: 100px;
  flex-shrink: 0;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.normal-fill {
  background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
}

.progress-fill.admin-fill {
  background: linear-gradient(90deg, #e6a23c 0%, #f0c78a 100%);
}

.progress-fill.owner-fill {
  background: linear-gradient(90deg, #f56c6c 0%, #f89898 100%);
}

.progress-fill.super-fill {
  background: linear-gradient(90deg, #722ed1 0%, #b37feb 100%);
}

/* 普通用户工作台概览样式 */
.user-dashboard-overview {
  margin-top: 16px;
  height: 185px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.user-dashboard-overview:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.overview-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.overview-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e40af;
  margin: 0;
}

.overview-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 120px;
  gap: 20px;
}

.activity-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  transition: all 0.3s ease;
  flex: 1;
  max-width: 150px;
}

.activity-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-3px);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.activity-info {
  text-align: center;
}

.activity-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.activity-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

/* 统计卡片样式 */
.stats-cards-container {
  margin-top: 16px;
}

.platform-stats-row {
  margin-top: 30px !important;
}

.stats-row {
  margin: 0;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  height: 100%;
  min-height: 100px;
  display: flex;
  align-items: center;
  gap: 10px;
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
  padding-left: 4px;
}

.stat-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
  line-height: 1.2;
}

.stat-value {
  font-size: 22px;
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
  
  
  .tenant-role-distribution {
    height: 320px;
  }
  
  .role-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .role-item {
    gap: 4px;
    padding: 3px;
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
  
  .system-monitor-overview {
    height: 100px;
    padding: 15px;
  }
  
  .monitor-icon {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  
  .monitor-label {
    font-size: 11px;
  }
  
  .monitor-value {
    font-size: 14px;
  }
  
  .tenant-role-distribution {
    height: 280px;
    padding: 15px;
  }
  
  .role-header {
    margin-bottom: 15px;
    padding-bottom: 10px;
  }
  
  .role-title {
    font-size: 16px;
  }
  
  .role-total {
    font-size: 13px;
  }
  
  .role-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .role-item {
    gap: 4px;
    padding: 3px;
  }
  
  .role-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .role-name {
    font-size: 13px;
  }
  
  .role-count {
    font-size: 14px;
  }
  
  .role-percentage {
    font-size: 11px;
  }
  
  .role-progress {
    width: 40px;
  }
  
  .user-dashboard-overview {
    height: 160px;
    padding: 14px;
  }
  
  .overview-content {
    height: 80px;
    gap: 12px;
  }
  
  .activity-item {
    padding: 8px;
    max-width: 100px;
  }
  
  .activity-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .activity-label {
    font-size: 11px;
  }
  
  .activity-value {
    font-size: 13px;
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
  
  .system-monitor-overview {
    height: 80px;
    padding: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .monitor-item {
    flex: 0 0 calc(50% - 4px);
    gap: 8px;
  }
  
  .monitor-icon {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
  
  .monitor-label {
    font-size: 10px;
  }
  
  .monitor-value {
    font-size: 12px;
  }
  
  .tenant-role-distribution {
    height: 240px;
    padding: 12px;
  }
  
  .role-header {
    margin-bottom: 12px;
    padding-bottom: 8px;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .role-title {
    font-size: 15px;
  }
  
  .role-total {
    font-size: 12px;
  }
  
  .role-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .role-item {
    gap: 6px;
    padding: 4px;
  }
  
  .role-icon {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
  
  .role-name {
    font-size: 12px;
  }
  
  .role-count {
    font-size: 13px;
  }
  
  .role-percentage {
    font-size: 10px;
  }
  
  .role-progress {
    width: 40px;
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
  
  .system-monitor-overview {
    height: 70px;
    padding: 10px;
  }
  
  .monitor-item {
    flex: 0 0 calc(50% - 4px);
    gap: 6px;
  }
  
  .monitor-icon {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
  
  .monitor-label {
    font-size: 9px;
  }
  
  .monitor-value {
    font-size: 11px;
  }
  
  .tenant-role-distribution {
    height: 200px;
    padding: 10px;
  }
  
  .role-header {
    margin-bottom: 10px;
    padding-bottom: 6px;
  }
  
  .role-title {
    font-size: 14px;
  }
  
  .role-total {
    font-size: 11px;
  }
  
  .role-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .role-item {
    gap: 4px;
    padding: 3px;
  }
  
  .role-icon {
    width: 20px;
    height: 20px;
    font-size: 8px;
  }
  
  .role-name {
    font-size: 11px;
  }
  
  .role-count {
    font-size: 12px;
  }
  
  .role-percentage {
    font-size: 9px;
  }
  
  .role-progress {
    width: 40px;
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