<template>
  <div class="dashboard-container">
    <div class="dashboard-layout">
      <!-- 通知面板 -->
      <div class="notification-section">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>通知中心</span>
              <el-badge 
                :value="unreadNotificationsCount" 
                :max="99" 
                class="unread-badge"
              >
                <el-icon><Bell /></el-icon>
              </el-badge>
            </div>
          </template>
          
          <el-scrollbar class="notification-list">
            <template v-if="notifications.length === 0">
              <div class="empty-notification">暂无新通知</div>
            </template>
            
            <div 
              v-for="notification in notifications" 
              :key="notification.id" 
              class="notification-item"
              :class="{
                'unread': !notification.read,
                [`severity-${notification.severity}`]: true
              }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-content">
                <div class="notification-title">
                  <span>{{ getNotificationTitle(notification) }}</span>
                  <el-tag 
                    :type="getSeverityTagType(notification.severity)" 
                    size="small"
                  >
                    {{ getSeverityLabel(notification.severity) }}
                  </el-tag>
                </div>
                <div class="notification-detail">
                  {{ getNotificationDetail(notification) }}
                </div>
                <div class="notification-time">
                  {{ formatTime(notification.timestamp) }}
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
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
import { ref, computed, onMounted } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { formatDistance } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useSocketIO } from '@/composables/useWebSocket'

// 用户 store
const userStore = useUserStore()

// Socket.IO 通知
const { notifications } = useSocketIO('http://your-socket-server')

// 未读通知数量
const unreadNotificationsCount = computed(() => 
  notifications.list.filter(n => !n.read).length
)

// 处理通知点击
const handleNotificationClick = () => {}

// 格式化时间
const formatTime = (timestamp) => {
  return formatDistance(new Date(timestamp || Date.now()), new Date(), { 
    addSuffix: true, 
    locale: zhCN 
  })
}

// 获取通知标题
const getNotificationTitle = () => '未知通知'

// 获取通知详情
const getNotificationDetail = () => '暂无详情'

// 获取严重程度标签类型
const getSeverityTagType = () => 'info'

// 获取严重程度标签文本
const getSeverityLabel = () => '未知'
</script>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  components: {
    PlatformAdminStatistics: defineAsyncComponent(() => 
      import('@/views/dashboard/PlatformAdminStatistics.vue')
    ),
    TenantAdminStatistics: defineAsyncComponent(() => 
      import('@/views/dashboard/TenantAdminStatistics.vue')
    ),
    UserKnowledgeStatistics: defineAsyncComponent(() => 
      import('@/views/dashboard/UserKnowledgeStatistics.vue')
    )
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: #f5f7fa;
}

.dashboard-layout {
  display: flex;
  flex-direction: column;
}

.notification-section {
  margin-bottom: 20px;
}

.statistics-section {
  flex-grow: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-list {
  max-height: 300px;
}

.notification-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9eb;
}

.notification-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.notification-detail {
  color: #606266;
  font-size: 12px;
  margin-bottom: 5px;
}

.notification-time {
  color: #909399;
  font-size: 12px;
  text-align: right;
}

.empty-notification {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.severity-low { border-left: 3px solid #409eff; }
.severity-medium { border-left: 3px solid #e6a23c; }
.severity-high { border-left: 3px solid #f56c6c; }
.severity-critical { border-left: 3px solid #ff0000; }

/* 响应式设计 */
@media (min-width: 1200px) {
  .dashboard-layout {
    flex-direction: row;
  }

  .notification-section {
    width: 350px;
    margin-right: 20px;
    margin-bottom: 0;
  }

  .statistics-section {
    flex-grow: 1;
  }
}

@media (max-width: 1199px) {
  .dashboard-layout {
    flex-direction: column;
  }

  .notification-section {
    margin-bottom: 20px;
  }
}
</style>