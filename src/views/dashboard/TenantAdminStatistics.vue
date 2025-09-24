<template>
  <div class="tenant-admin-statistics">
    <!-- 租户核心指标卡片 -->
    <el-card shadow="hover" class="core-metrics-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">租户核心指标</span>
          <el-icon>
            <DataLine />
          </el-icon>
        </div>
      </template>
      <div class="core-metrics-content">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="8" :md="6">
            <div class="metric-item">
              <div class="metric-value">{{ tenantStats.totalUsers }}</div>
              <div class="metric-label">用户总数</div>
              <div class="metric-change">
                <span class="change-text">+{{ tenantStats.todayNewUsers }} 今日</span>
                <el-icon class="change-icon up"><ArrowUp /></el-icon>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="8" :md="6">
            <div class="metric-item">
              <div class="metric-value">{{ tenantStats.totalKnowledgeBases }}</div>
              <div class="metric-label">知识库数量</div>
              <div class="metric-change">
                <span class="change-text">+{{ tenantStats.todayNewKBs }} 今日</span>
                <el-icon class="change-icon up"><ArrowUp /></el-icon>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="8" :md="6">
            <div class="metric-item">
              <div class="metric-value">{{ tenantStats.activeUsers }}</div>
              <div class="metric-label">活跃用户</div>
              <div class="metric-change">
                <span class="change-text">{{ tenantStats.activeRate }}% 活跃率</span>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="8" :md="6">
            <div class="metric-item">
              <div class="metric-value">{{ tenantStats.totalQueries }}</div>
              <div class="metric-label">总查询次数</div>
              <div class="metric-change">
                <span class="change-text">+{{ tenantStats.todayQueries }} 今日</span>
                <el-icon class="change-icon up"><ArrowUp /></el-icon>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 租户实时监控栏 -->
    <el-card shadow="hover" class="realtime-monitor-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">租户实时监控</span>
          <el-icon>
            <Monitor />
          </el-icon>
        </div>
      </template>
      
      <!-- 租户超级管理员关键指标概览 -->
      <div class="tenant-overview-content">
        <div class="overview-item">
          <span class="overview-label">在线用户</span>
          <span class="overview-value">{{ onlineUsers }}</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">使用中知识库</span>
          <span class="overview-value">{{ activeKnowledgeBases }}</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">查询频率</span>
          <span class="overview-value">{{ queryFrequency }}/min</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">存储使用</span>
          <span class="overview-value">{{ storageUsage }}GB</span>
        </div>
        <div class="overview-item">
          <span class="overview-label">响应时间</span>
          <el-tag :type="responseTime < 200 ? 'success' : responseTime < 500 ? 'warning' : 'danger'" effect="light" size="small">{{ responseTime }}ms</el-tag>
        </div>
        <div class="overview-item">
          <span class="overview-label">最后更新</span>
          <span class="overview-time">{{ currentTime }}</span>
        </div>
      </div>
      
      <!-- 用户活跃度图表 -->
      <div class="activity-charts-container">
        <el-row :gutter="15">
          <el-col :xs="24" :sm="12">
            <div class="chart-section">
              <div class="chart-title">用户活跃度趋势</div>
              <div ref="userActivityRef" class="echarts-chart activity-chart"></div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="chart-section">
              <div class="chart-title">知识库使用分布</div>
              <div ref="kbUsageRef" class="echarts-chart activity-chart"></div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 用户管理数据表 -->
    <el-card shadow="hover" class="user-management-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">用户管理概览</span>
          <div class="header-actions">
            <el-input v-model="searchKeyword" placeholder="搜索用户..." clearable :prefix-icon="Search" class="search-input" />
            <el-button type="primary" size="small" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredUserData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="lastLogin" label="最后登录" min-width="120" />
        <el-table-column prop="knowledgeBases" label="知识库数量" min-width="100" />
        <el-table-column prop="queryCount" label="查询次数" min-width="100" />
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="light">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="viewUserDetail(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty-tip">
            <el-empty description="没有找到匹配的用户数据"></el-empty>
          </div>
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { DataLine, Search, Monitor, ArrowUp, Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册 ECharts 组件
echarts.use([
  LineChart,
  PieChart,
  CanvasRenderer,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 租户统计数据
const tenantStats = reactive({
  totalUsers: 256,
  totalKnowledgeBases: 42,
  todayNewUsers: 8,
  todayNewKBs: 3,
  activeUsers: 189,
  activeRate: 73.8,
  totalQueries: 15420,
  todayQueries: 156
})

// 租户实时监控数据
const onlineUsers = ref(89)
const activeKnowledgeBases = ref(28)
const queryFrequency = ref(12)
const storageUsage = ref(2.3)
const responseTime = ref(156)
const currentTime = ref('')

// 图表引用
const userActivityRef = ref(null)
const kbUsageRef = ref(null)
const chartInstances = ref({})

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 渲染用户活跃度趋势图
const renderUserActivityChart = () => {
  if (!chartInstances.value.userActivity) {
    chartInstances.value.userActivity = echarts.init(userActivityRef.value)
    window.addEventListener('resize', () => chartInstances.value.userActivity.resize())
  }
  
  chartInstances.value.userActivity.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['活跃用户', '新用户'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: { type: 'value' },
    series: [
      { 
        name: '活跃用户', 
        type: 'line', 
        data: [45, 52, 48, 61, 55, 67, 63], 
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      { 
        name: '新用户', 
        type: 'line', 
        data: [8, 12, 6, 15, 9, 18, 14], 
        smooth: true,
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
}

// 渲染知识库使用分布图
const renderKBUsageChart = () => {
  if (!chartInstances.value.kbUsage) {
    chartInstances.value.kbUsage = echarts.init(kbUsageRef.value)
    window.addEventListener('resize', () => chartInstances.value.kbUsage.resize())
  }
  
  chartInstances.value.kbUsage.setOption({
    tooltip: { trigger: 'item', formatter: '{b}<br/>使用次数: {c}<br/>占比: {d}%' },
    legend: { orient: 'horizontal', left: 'center', bottom: '5%' },
    series: [{
      name: '知识库使用',
      type: 'pie',
      radius: ['40%', '60%'],
      center: ['50%', '45%'],
      data: [
        { value: 156, name: '技术文档库', itemStyle: { color: '#409EFF' } },
        { value: 89, name: '产品手册库', itemStyle: { color: '#67C23A' } },
        { value: 67, name: '培训资料库', itemStyle: { color: '#E6A23C' } },
        { value: 45, name: 'FAQ库', itemStyle: { color: '#F56C6C' } },
        { value: 23, name: '其他', itemStyle: { color: '#909399' } }
      ],
      label: { show: false }
    }]
  })
}

// 搜索关键词
const searchKeyword = ref('')
const loading = ref(false)

// 用户数据
const userData = ref([
  { username: '张三', lastLogin: '2024-01-15 14:30', knowledgeBases: 5, queryCount: 156, status: '活跃' },
  { username: '李四', lastLogin: '2024-01-15 13:45', knowledgeBases: 2, queryCount: 89, status: '活跃' },
  { username: '王五', lastLogin: '2024-01-15 12:20', knowledgeBases: 8, queryCount: 234, status: '活跃' },
  { username: '赵六', lastLogin: '2024-01-14 16:15', knowledgeBases: 1, queryCount: 23, status: '正常' },
  { username: '钱七', lastLogin: '2024-01-14 10:30', knowledgeBases: 3, queryCount: 67, status: '正常' },
  { username: '孙八', lastLogin: '2024-01-13 09:20', knowledgeBases: 0, queryCount: 0, status: '未激活' }
])

// 过滤用户数据
const filteredUserData = computed(() => {
  if (!searchKeyword.value) {
    return userData.value
  }
  return userData.value.filter(user =>
    user.username.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    user.status.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})


// 获取状态标签类型
const getStatusType = (status) => {
  const statusTypeMap = {
    '活跃': 'success',
    '正常': 'primary',
    '未激活': 'info'
  }
  return statusTypeMap[status] || 'info'
}

// 查看用户详情
const viewUserDetail = (user) => {
  console.log('查看用户详情:', user.username)
  // TODO: 实现跳转到用户详情页面的逻辑
}

// 刷新数据
const refreshData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    // 这里可以添加实际的数据刷新逻辑
  }, 1000)
}

onMounted(() => {
  nextTick(() => {
    renderUserActivityChart()
    renderKBUsageChart()
  })
  
  // 初始化时间并设置定时器
  updateTime()
  setInterval(updateTime, 1000)
})
</script>

<style scoped>
.tenant-admin-statistics {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片通用样式 */
.tenant-admin-statistics .el-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.tenant-admin-statistics .el-card:hover {
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 核心指标卡片 */
.core-metrics-card {
  margin-bottom: 0;
}

.core-metrics-content {
  padding: 10px 0;
}

.metric-item {
  text-align: center;
  padding: 20px 10px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  position: relative;
}

.metric-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-value {
  font-size: 2.2em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
  line-height: 1;
}

.metric-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 4px;
}

.metric-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
}

.change-text {
  font-size: 12px;
  color: #67c23a;
  font-weight: 500;
}

.change-icon {
  font-size: 12px;
}

.change-icon.up {
  color: #67c23a;
}

/* 租户实时监控栏 */
.realtime-monitor-card {
  margin-bottom: 0;
}

/* 租户超级管理员关键指标概览 */
.tenant-overview-content {
  padding: 8px 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 60px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 6px;
  margin-bottom: 15px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 50px;
  flex: 1;
}

.overview-label {
  font-size: 10px;
  color: #909399;
  font-weight: 500;
  line-height: 1;
}

.overview-value {
  font-size: 12px;
  color: #303133;
  font-weight: 600;
  line-height: 1;
}

.overview-time {
  font-size: 10px;
  color: #606266;
  font-weight: 500;
  line-height: 1;
}

/* 活动图表容器 */
.activity-charts-container {
  margin-top: 20px;
}

.chart-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 15px;
  height: 100%;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  text-align: center;
}

.activity-chart {
  height: 200px;
}

/* 用户管理卡片 */
.user-management-card {
  margin-bottom: 0;
  flex: 1;
}

.search-input {
  width: 250px;
}

.el-table {
  border-radius: 4px;
}

.table-empty-tip {
  padding: 20px;
}

.echarts-chart {
  width: 100%;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .tenant-admin-statistics {
    padding: 15px;
    gap: 15px;
  }
  
  .metric-value {
    font-size: 1.8em;
  }
  
  .activity-chart {
    height: 180px;
  }
}

@media (max-width: 768px) {
  .tenant-admin-statistics {
    padding: 10px;
    gap: 10px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .card-title {
    font-size: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .search-input {
    width: 100%;
    margin-top: 10px;
  }
  
  .metric-item {
    padding: 15px 8px;
    margin-bottom: 10px;
  }
  
  .metric-value {
    font-size: 1.6em;
  }
  
  .metric-label {
    font-size: 13px;
  }
  
  .tenant-overview-content {
    height: 50px;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .overview-item {
    min-width: 45px;
    flex: 0 0 auto;
  }
  
  .overview-label {
    font-size: 9px;
  }
  
  .overview-value {
    font-size: 11px;
  }
  
  .overview-time {
    font-size: 9px;
  }
  
  .activity-chart {
    height: 160px;
  }
  
  .chart-section {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .tenant-admin-statistics {
    padding: 8px;
    gap: 8px;
  }
  
  .metric-item {
    padding: 12px 6px;
  }
  
  .metric-value {
    font-size: 1.4em;
  }
  
  .metric-label {
    font-size: 12px;
  }
  
  .activity-chart {
    height: 140px;
  }
  
  .card-title {
    font-size: 15px;
  }
}
</style>