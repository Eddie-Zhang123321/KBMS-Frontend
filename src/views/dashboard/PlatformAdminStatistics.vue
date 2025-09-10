<template>
  <div class="platform-admin-statistics">
    <el-row :gutter="20">
      <!-- 总览卡片 -->
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <template #header>
            <div class="card-header">
              <span>系统总览</span>
              <el-icon><DataLine /></el-icon>
            </div>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <span>租户总数</span>
              <strong>{{ systemStats.totalTenants }}</strong>
            </div>
            <div class="overview-item">
              <span>用户总数</span>
              <strong>{{ systemStats.totalUsers }}</strong>
            </div>
            <div class="overview-item">
              <span>今日新增</span>
              <strong>{{ systemStats.todayNewRegistrations }}</strong>
            </div>
          </div>
        </el-card>

        <!-- 租户状态饼图 -->
        <el-card shadow="hover" class="pie-chart-card">
          <template #header>
            <div class="card-header">
              <span>租户状态分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="tenantStatusPieRef" style="width: 100%; height: 250px;"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 图表区域 -->
      <el-col :span="18">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>系统注册趋势</span>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button label="week">近一周</el-radio-button>
                <el-radio-button label="month">近一月</el-radio-button>
                <el-radio-button label="quarter">近一季</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-row :gutter="10">
            <el-col :span="12">
              <div ref="registrationLineRef" style="width: 100%; height: 300px;"></div>
            </el-col>
            <el-col :span="12">
              <div ref="registrationBarRef" style="width: 100%; height: 300px;"></div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 系统资源使用 -->
        <el-card shadow="hover" class="system-resource-card">
          <template #header>
            <div class="card-header">
              <span>系统资源使用</span>
            </div>
          </template>
          <el-row :gutter="10">
            <el-col :span="8">
              <div ref="cpuUsageRef" style="width: 100%; height: 200px;"></div>
            </el-col>
            <el-col :span="8">
              <div ref="memoryUsageRef" style="width: 100%; height: 200px;"></div>
            </el-col>
            <el-col :span="8">
              <div ref="diskUsageRef" style="width: 100%; height: 200px;"></div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
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

// 图表周期
const chartPeriod = ref('week')

// 渲染图表
onMounted(() => {
  nextTick(() => {
    renderRegistrationLineChart()
    renderRegistrationBarChart()
    renderTenantStatusPieChart()
    renderResourceUsageCharts()
  })
})

// 注册趋势折线图
function renderRegistrationLineChart() {
  const chart = echarts.init(registrationLineRef.value)
  chart.setOption({
    title: { text: '注册趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { 
      data: ['租户注册', '用户注册'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '租户注册',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: { color: '#3a8ee6' }
      },
      {
        name: '用户注册',
        type: 'line',
        smooth: true,
        data: [220, 182, 191, 234, 290, 330, 310],
        itemStyle: { color: '#13ce66' }
      }
    ]
  })
}

// 注册趋势柱状图
function renderRegistrationBarChart() {
  const chart = echarts.init(registrationBarRef.value)
  chart.setOption({
    title: { text: '注册对比', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { 
      data: ['租户注册', '用户注册'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '租户注册',
        type: 'bar',
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: { color: '#3a8ee6' }
      },
      {
        name: '用户注册',
        type: 'bar',
        data: [220, 182, 191, 234, 290, 330, 310],
        itemStyle: { color: '#13ce66' }
      }
    ]
  })
}

// 租户状态饼图
function renderTenantStatusPieChart() {
  const chart = echarts.init(tenantStatusPieRef.value)
  chart.setOption({
    title: { 
      text: '租户状态分布', 
      left: 'center',
      top: '5%'
    },
    tooltip: { 
      trigger: 'item',
      // 提示信息显示在框外，并包含更详细的信息
      formatter: function(params) {
        return `
          <div style="text-align: left;">
            <strong>${params.name}</strong><br/>
            数量: ${params.value}<br/>
            占比: ${params.percent}%
          </div>
        `
      },
      // 确保提示框在图表外部显示
      position: 'top'
    },
    legend: { 
      orient: 'horizontal', 
      left: 'center',
      bottom: '5%',
      itemWidth: 15,
      itemHeight: 10
    },
    series: [
      {
        name: '租户状态',
        type: 'pie',
        radius: ['40%', '60%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'inside',
          formatter: '{d}%',
          color: '#000', // 使用黑色文字
          fontSize: 12,
          fontWeight: 'bold'
        },
        labelLine: { 
          show: false 
        },
        data: [
          { 
            value: 80, 
            name: '活跃租户', 
            itemStyle: { color: '#13ce66' } 
          },
          { 
            value: 30, 
            name: '未激活租户', 
            itemStyle: { color: '#f56c6c' } 
          },
          { 
            value: 18, 
            name: '已暂停租户', 
            itemStyle: { color: '#909399' } 
          }
        ]
      }
    ]
  })
}

// 系统资源使用仪表盘
function renderResourceUsageCharts() {
  const cpuChart = echarts.init(cpuUsageRef.value)
  cpuChart.setOption({
    title: { text: 'CPU使用率', left: 'center' },
    series: [{
      type: 'gauge',
      progress: { show: true },
      detail: { 
        valueAnimation: true,
        formatter: '{value}%'
      },
      data: [{ value: 65 }],
      axisLine: {
        lineStyle: {
          width: 20,
          color: [[0.3, '#67C23A'], [0.7, '#E6A23C'], [1, '#F56C6C']]
        }
      }
    }]
  })

  const memoryChart = echarts.init(memoryUsageRef.value)
  memoryChart.setOption({
    title: { text: '内存使用率', left: 'center' },
    series: [{
      type: 'gauge',
      progress: { show: true },
      detail: { 
        valueAnimation: true,
        formatter: '{value}%'
      },
      data: [{ value: 45 }],
      axisLine: {
        lineStyle: {
          width: 20,
          color: [[0.3, '#67C23A'], [0.7, '#E6A23C'], [1, '#F56C6C']]
        }
      }
    }]
  })

  const diskChart = echarts.init(diskUsageRef.value)
  diskChart.setOption({
    title: { text: '磁盘使用率', left: 'center' },
    series: [{
      type: 'gauge',
      progress: { show: true },
      detail: { 
        valueAnimation: true,
        formatter: '{value}%'
      },
      data: [{ value: 75 }],
      axisLine: {
        lineStyle: {
          width: 20,
          color: [[0.3, '#67C23A'], [0.7, '#E6A23C'], [1, '#F56C6C']]
        }
      }
    }]
  })
}
</script>

<style scoped>
.platform-admin-statistics {
  width: 100%;
}

.overview-card .overview-content {
  display: flex;
  justify-content: space-between;
}

.overview-item {
  text-align: center;
}

.overview-item span {
  color: #909399;
  display: block;
  margin-bottom: 5px;
}

.overview-item strong {
  font-size: 1.5em;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pie-chart-card {
  margin-top: 20px;
}

.system-resource-card {
  margin-top: 20px;
}
</style>
