<template>
  <div class="platform-admin-statistics">
    <!-- 租户统计栏 -->
    <el-card shadow="hover" class="tenant-stats-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">租户统计</span>
          <el-icon>
            <OfficeBuilding />
          </el-icon>
        </div>
      </template>
      <div class="tenant-stats-content">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <div class="stat-item">
              <div class="stat-value">{{ systemStats.totalTenants }}</div>
              <div class="stat-label">租户总数</div>
              <div class="stat-change">
                <span class="change-text">7% 较昨日</span>
                <el-icon class="change-icon down"><ArrowDown /></el-icon>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <div class="stat-item">
              <div class="stat-value">{{ systemStats.todayNewRegistrations }}</div>
              <div class="stat-label">今日新增</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <div class="stat-item">
              <div class="stat-value">80</div>
              <div class="stat-label">活跃租户</div>
              <div class="stat-change">
                <span class="change-text">62.5%</span>
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="tenant-chart-container">
          <div ref="tenantStatusPieRef" class="echarts-chart tenant-pie-chart"></div>
        </div>
        <div class="trend-charts-container">
          <div class="chart-controls">
            <el-radio-group v-model="chartPeriod" size="small">
              <el-radio-button label="week">近一周</el-radio-button>
              <el-radio-button label="month">近一月</el-radio-button>
              <el-radio-button label="quarter">近一季</el-radio-button>
            </el-radio-group>
          </div>
          <el-row :gutter="15">
            <el-col :xs="24" :sm="24" :md="12">
              <div ref="registrationLineRef" class="echarts-chart trend-chart"></div>
            </el-col>
            <el-col :xs="24" :sm="24" :md="12">
              <div ref="registrationBarRef" class="echarts-chart trend-chart"></div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 系统统计栏 -->
    <el-card shadow="hover" class="system-stats-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">系统统计</span>
          <el-icon>
            <DataLine />
          </el-icon>
        </div>
      </template>
      <div class="system-stats-content">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <div class="stat-item">
              <div class="stat-value">{{ systemStats.totalUsers }}</div>
              <div class="stat-label">系统用户总数</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <div class="stat-item">
              <div class="stat-value">50,000</div>
              <div class="stat-label">问答总统计</div>
              <div class="stat-sub-label">(今日1000次)</div>
              <div class="stat-change">
                <span class="change-text error">错误率3%</span>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <div class="stat-item">
              <div class="stat-value">500</div>
              <div class="stat-label">知识库全局统计</div>
              <div class="stat-sub-label">最近新增:20个</div>
              <div class="stat-change">
                <span class="change-text">5% 较昨日</span>
                <el-icon class="change-icon up"><ArrowUp /></el-icon>
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="system-chart-container">
          <div ref="systemUserPieRef" class="echarts-chart system-pie-chart"></div>
        </div>
      </div>
    </el-card>

    <!-- 系统资源使用栏 -->
    <el-card shadow="hover" class="system-resource-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">系统资源使用</span>
          <el-icon>
            <Monitor />
          </el-icon>
        </div>
      </template>
      <el-row :gutter="20" class="resource-row">
        <el-col :xs="24" :sm="8" :md="8">
          <div ref="cpuUsageRef" class="echarts-chart resource-chart"></div>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8">
          <div ref="memoryUsageRef" class="echarts-chart resource-chart"></div>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8">
          <div ref="diskUsageRef" class="echarts-chart resource-chart"></div>
        </el-col>
      </el-row>
    </el-card>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { DataLine, OfficeBuilding, Monitor, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import {
  LineChart,
  BarChart,
  PieChart,
  GaugeChart
} from 'echarts/charts'
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
  BarChart,
  PieChart,
  GaugeChart,
  CanvasRenderer,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 系统统计数据
const systemStats = ref({
  totalTenants: 128,
  totalUsers: 3256,
  todayNewRegistrations: 12
})

// 图表引用
const tenantStatusPieRef = ref(null)
const systemUserPieRef = ref(null)
const registrationLineRef = ref(null)
const registrationBarRef = ref(null)
const cpuUsageRef = ref(null)
const memoryUsageRef = ref(null)
const diskUsageRef = ref(null)

// 图表实例
const chartInstances = ref({})

// 图表周期
const chartPeriod = ref('week')

// 模拟数据
const mockData = {
  week: {
    dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    tenantRegistrations: [12, 13, 10, 13, 9, 23, 21],
    userRegistrations: [22, 18, 19, 23, 29, 33, 31]
  },
  month: {
    dates: ['第1周', '第2周', '第3周', '第4周'],
    tenantRegistrations: [45, 52, 48, 60],
    userRegistrations: [180, 210, 190, 250]
  },
  quarter: {
    dates: ['第1月', '第2月', '第3月'],
    tenantRegistrations: [150, 180, 200],
    userRegistrations: [600, 750, 850]
  }
}

// 渲染趋势图
function renderTrendCharts() {
  const data = mockData[chartPeriod.value]
  const commonOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['租户注册', '用户注册'], bottom: 0 },
    xAxis: { type: 'category', data: data.dates },
    yAxis: { type: 'value' },
    series: [
      { name: '租户注册', data: data.tenantRegistrations, itemStyle: { color: '#3a8ee6' } },
      { name: '用户注册', data: data.userRegistrations, itemStyle: { color: '#13ce66' } }
    ]
  }

  // 折线图
  if (!chartInstances.value.line) {
    chartInstances.value.line = echarts.init(registrationLineRef.value)
    window.addEventListener('resize', () => chartInstances.value.line.resize())
  }
  chartInstances.value.line.setOption({ ...commonOption, title: { text: '注册趋势', left: 'center' }, series: commonOption.series.map(s => ({ ...s, type: 'line', smooth: true })) })

  // 柱状图
  if (!chartInstances.value.bar) {
    chartInstances.value.bar = echarts.init(registrationBarRef.value)
    window.addEventListener('resize', () => chartInstances.value.bar.resize())
  }
  chartInstances.value.bar.setOption({ ...commonOption, title: { text: '注册对比', left: 'center' }, series: commonOption.series.map(s => ({ ...s, type: 'bar' })) })
}

// 渲染租户状态饼图
function renderTenantStatusPieChart() {
  const chart = echarts.init(tenantStatusPieRef.value)
  window.addEventListener('resize', () => chart.resize())
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}<br/>数量: {c}<br/>占比: {d}%' },
    legend: { orient: 'horizontal', left: 'center', bottom: '5%' },
    series: [{
      name: '租户状态',
      type: 'pie',
      radius: ['40%', '60%'],
      center: ['50%', '45%'],
      data: [
        { value: 80, name: '活跃租户', itemStyle: { color: '#13ce66' } },
        { value: 30, name: '未激活租户', itemStyle: { color: '#f56c6c' } },
        { value: 18, name: '已暂停租户', itemStyle: { color: '#909399' } }
      ],
      label: { show: false }
    }]
  })
}

// 渲染系统用户饼图
function renderSystemUserPieChart() {
  const chart = echarts.init(systemUserPieRef.value)
  window.addEventListener('resize', () => chart.resize())
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}<br/>数量: {c}<br/>占比: {d}%' },
    legend: { orient: 'horizontal', left: 'center', bottom: '5%' },
    series: [{
      name: '系统用户',
      type: 'pie',
      radius: ['40%', '60%'],
      center: ['50%', '45%'],
      data: [
        { value: 50, name: '超级管理员', itemStyle: { color: '#f56c6c' } },
        { value: 800, name: '普通用户', itemStyle: { color: '#409eff' } },
        { value: 200, name: '知识库管理员', itemStyle: { color: '#13ce66' } },
        { value: 213, name: '知识库所有人', itemStyle: { color: '#e6a23c' } }
      ],
      label: { show: false }
    }]
  })
}


// 渲染资源使用仪表盘
function renderResourceUsageCharts() {
  const chartRefs = [cpuUsageRef, memoryUsageRef, diskUsageRef]
  const titles = ['CPU使用率', '内存使用率', '磁盘使用率']
  const values = [65, 45, 75]

  chartRefs.forEach((ref, index) => {
    const chart = echarts.init(ref.value)
    window.addEventListener('resize', () => chart.resize())
    chart.setOption({
      title: { text: titles[index], left: 'center', top: '20px', textStyle: { fontSize: 14 } },
      series: [{
        type: 'gauge',
        progress: { show: true },
        detail: { valueAnimation: true, formatter: '{value}%', offsetCenter: [0, '80%'] },
        data: [{ value: values[index] }],
        axisLine: { lineStyle: { width: 15, color: [[0.3, '#67C23A'], [0.7, '#E6A23C'], [1, '#F56C6C']] } },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false }
      }]
    })
  })
}

// 初始化所有图表
onMounted(() => {
  nextTick(() => {
    renderTrendCharts()
    renderTenantStatusPieChart()
    renderSystemUserPieChart()
    renderResourceUsageCharts()
  })
})

// 监听周期变化，更新趋势图
watch(chartPeriod, renderTrendCharts)
</script>

<style scoped>
.platform-admin-statistics {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片通用样式 */
.platform-admin-statistics .el-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.platform-admin-statistics .el-card:hover {
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

/* 租户统计栏 */
.tenant-stats-card {
  margin-bottom: 0;
}

.tenant-stats-content {
  padding: 10px 0;
}

.stat-item {
  text-align: center;
  padding: 20px 10px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  position: relative;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2.2em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-sub-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-change {
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

.change-text.error {
  color: #f56c6c;
}

.change-icon {
  font-size: 12px;
}

.change-icon.up {
  color: #67c23a;
}

.change-icon.down {
  color: #f56c6c;
}

.tenant-chart-container {
  margin-top: 20px;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
}

.tenant-pie-chart {
  height: 160px;
}

.trend-charts-container {
  margin-top: 20px;
}

.chart-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.trend-chart {
  height: 280px;
  background: #fafafa;
  border-radius: 8px;
  padding: 10px;
}

/* 系统统计栏 */
.system-stats-card {
  margin-bottom: 0;
}

.system-stats-content {
  padding: 10px 0;
}

.system-chart-container {
  margin-top: 20px;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
}

.system-pie-chart {
  height: 160px;
}

/* 系统资源使用栏 */
.system-resource-card {
  margin-bottom: 0;
}

.resource-row {
  padding: 10px 0;
}

.resource-chart {
  height: 150px;
  background: #fafafa;
  border-radius: 8px;
  padding: 10px;
}

.echarts-chart {
  width: 100%;
}


/* 响应式布局 */
@media (max-width: 1200px) {
  .platform-admin-statistics {
    padding: 15px;
    gap: 15px;
  }
  
  .stat-value {
    font-size: 1.8em;
  }
  
  .resource-chart {
    height: 150px;
  }
  
  .trend-chart {
    height: 250px;
  }
}

@media (max-width: 768px) {
  .platform-admin-statistics {
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
  
  .stat-item {
    padding: 15px 8px;
    margin-bottom: 10px;
  }
  
  .stat-value {
    font-size: 1.6em;
  }
  
  .stat-label {
    font-size: 13px;
  }
  
  .resource-chart {
    height: 180px;
  }
  
  .tenant-pie-chart,
  .system-pie-chart {
    height: 140px;
  }
  
  .trend-chart {
    height: 220px;
  }
  
  .chart-controls {
    margin-bottom: 15px;
  }
  
  .chart-controls .el-radio-group {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .platform-admin-statistics {
    padding: 8px;
    gap: 8px;
  }
  
  .stat-item {
    padding: 12px 6px;
  }
  
  .stat-value {
    font-size: 1.4em;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .resource-chart {
    height: 160px;
  }
  
  .tenant-pie-chart,
  .system-pie-chart {
    height: 120px;
  }
  
  .trend-chart {
    height: 200px;
  }
  
  .card-title {
    font-size: 15px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .platform-admin-statistics {
    background-color: #1a1a1a;
  }
  
  .stat-item {
    background: linear-gradient(135deg, #2d2d2d 0%, #1e1e1e 100%);
  }
  
  .tenant-chart-container,
  .system-chart-container,
  .trend-chart,
  .resource-chart {
    background: #2d2d2d;
  }
}
</style>