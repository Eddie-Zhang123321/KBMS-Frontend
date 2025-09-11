<template>
  <div class="dashboard-container">
    <div class="dashboard-layout">
      <!-- 通知面板 -->
      <div class="notification-section">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>通知中心</span>
              <el-badge :value="unreadNotificationsCount" :max="99" class="unread-badge">
                <el-icon>
                  <Bell />
                </el-icon>
              </el-badge>
            </div>
          </template>

          <el-scrollbar class="notification-list">
            <template v-if="notifications.length === 0">
              <div class="empty-notification">暂无新通知</div>
            </template>

            <div v-for="notification in notifications" :key="notification.id" class="notification-item" :class="{
              'unread': !notification.read,
              [`severity-${notification.severity}`]: true
            }" @click="handleNotificationClick(notification)">
              <div class="notification-content">
                <div class="notification-title">
                  <span>{{ getNotificationTitle(notification) }}</span>
                  <el-tag :type="getSeverityTagType(notification.severity)" size="small">
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
const handleNotificationClick = () => { }

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
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.dashboard-layout {
  display: flex;
  gap: 24px;
}

.notification-card {
  width: 380px;
  min-width: 300px;
  /* 防止在小屏幕下过窄 */
  height: fit-content;
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
  max-height: 400px;
  /* 增加最大高度，容纳更多通知 */
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s, transform 0.2s;
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

.severity-low {
  border-left: 3px solid #67c23a;
}

.severity-medium {
  border-left: 3px solid #e6a23c;
}

.severity-high {
  border-left: 3px solid #f56c6c;
}

.severity-critical {
  border-left: 3px solid #c03639;
}

/* 桌面端布局 (> 768px) */
@media (min-width: 768px) {
  .dashboard-layout {
    flex-direction: row;
    align-items: flex-start;
    /* 顶部对齐 */
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

  .notification-card {
    width: 100%;
    /* 全宽显示 */
    min-width: unset;
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
}
</style>