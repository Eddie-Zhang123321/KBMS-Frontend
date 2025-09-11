<template>
  <div class="platform-admin-statistics">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="8" :lg="6" class="left-col">
        <el-card shadow="hover" class="overview-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">系统总览</span>
              <el-icon>
                <DataLine />
              </el-icon>
            </div>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <span>租户总数</span>
              <strong class="metric">{{ systemStats.totalTenants }}</strong>
            </div>
            <div class="overview-item">
              <span>用户总数</span>
              <strong class="metric">{{ systemStats.totalUsers }}</strong>
            </div>
            <div class="overview-item">
              <span>今日新增</span>
              <strong class="metric">{{ systemStats.todayNewRegistrations }}</strong>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="pie-chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">租户状态分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="tenantStatusPieRef" class="echarts-chart"></div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="16" :lg="18" class="right-col">
        <el-card shadow="hover" class="trend-chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">系统注册趋势</span>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button label="week">近一周</el-radio-button>
                <el-radio-button label="month">近一月</el-radio-button>
                <el-radio-button label="quarter">近一季</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-row :gutter="10" class="chart-sub-row">
            <el-col :xs="24" :sm="12" :md="12">
              <div ref="registrationLineRef" class="echarts-chart trend-chart"></div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="12">
              <div ref="registrationBarRef" class="echarts-chart trend-chart"></div>
            </el-col>
          </el-row>
        </el-card>

        <el-card shadow="hover" class="system-resource-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">系统资源使用</span>
            </div>
          </template>
          <el-row :gutter="10" class="chart-sub-row">
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
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { DataLine } from '@element-plus/icons-vue'
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
const registrationLineRef = ref(null)
const registrationBarRef = ref(null)
const tenantStatusPieRef = ref(null)
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
      label: { show: false } // 饼图不显示文字
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
    renderResourceUsageCharts()
  })
})

// 监听周期变化，更新趋势图
watch(chartPeriod, renderTrendCharts)
</script>

<style scoped>
.platform-admin-statistics {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100%;
}

.left-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.overview-card .overview-content {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.overview-item span {
  font-size: 14px;
  color: #909399;
}

.metric {
  font-size: 2em;
  font-weight: bold;
  color: #303133;
}

.echarts-chart {
  width: 100%;
}

.trend-chart {
  height: 300px;
}

.echarts-chart.resource-chart {
  height: 200px;
}

.echarts-chart.pie-chart-card .echarts-chart {
  height: 250px;
}

/* 响应式布局 */
@media (max-width: 1199px) {

  .left-col,
  .right-col {
    /* 1199px以下，左侧和右侧列垂直堆叠 */
    margin-bottom: 20px;
  }
}

@media (max-width: 767px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-title {
    margin-bottom: 10px;
  }

  .overview-card .overview-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
}
</style>