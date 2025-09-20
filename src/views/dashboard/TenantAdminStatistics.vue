<template>
  <div class="tenant-admin-statistics">
    <!-- 租户总览卡片 -->
    <el-card shadow="hover" class="overview-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">租户总览</span>
          <el-icon>
            <DataLine />
          </el-icon>
        </div>
      </template>
      <div class="overview-content">
        <div class="overview-item">
          <span>用户总数</span>
          <strong class="metric">{{ tenantStats.totalUsers }}</strong>
        </div>
        <div class="overview-item">
          <span>知识库数量</span>
          <strong class="metric">{{ tenantStats.totalKnowledgeBases }}</strong>
        </div>
        <div class="overview-item">
          <span>今日新增</span>
          <strong class="metric">{{ tenantStats.todayNewRegistrations }}</strong>
        </div>
      </div>
    </el-card>

    <!-- 租户用户趋势图表 -->
    <el-card shadow="hover" class="chart-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">租户用户趋势</span>
          <el-radio-group v-model="chartPeriod" size="small">
            <el-radio-button label="week">近一周</el-radio-button>
            <el-radio-button label="month">近一月</el-radio-button>
            <el-radio-button label="quarter">近一季</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div class="chart-container">
        <div ref="chartRef" class="echarts-chart"></div>
      </div>
    </el-card>

    <el-card shadow="hover" class="data-table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">租户用户数据</span>
          <el-input v-model="searchKeyword" placeholder="搜索..." clearable :prefix-icon="Search" class="search-input" />
        </div>
      </template>
      <el-table :data="filteredRegistrationData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="date" label="日期" min-width="120" />
        <el-table-column prop="userRegistrations" label="用户注册数" min-width="120" />
        <el-table-column prop="knowledgeBaseCreations" label="知识库创建数" min-width="150" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="light">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <div class="table-empty-tip">
            <el-empty description="没有找到匹配的数据"></el-empty>
          </div>
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { DataLine, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册 ECharts 组件
echarts.use([
  LineChart,
  CanvasRenderer,
  GridComponent,
  TooltipComponent,
  LegendComponent
])

// 租户统计数据
const tenantStats = reactive({
  totalUsers: 256,
  totalKnowledgeBases: 42,
  todayNewRegistrations: 5
})

// 图表周期
const chartPeriod = ref('week')
const chartRef = ref(null)
const chartInstance = ref(null) // 保存 ECharts 实例

// 模拟数据
const mockData = {
  week: {
    dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    userRegistrations: [20, 32, 21, 34, 30, 40, 35],
    kbCreations: [5, 8, 6, 10, 7, 12, 9]
  },
  month: {
    dates: ['1周', '2周', '3周', '4周'],
    userRegistrations: [120, 150, 130, 180],
    kbCreations: [30, 45, 38, 55]
  },
  quarter: {
    dates: ['1月', '2月', '3月'],
    userRegistrations: [450, 520, 600],
    kbCreations: [110, 135, 150]
  }
}

// 更新图表数据
const updateChart = () => {
  if (!chartInstance.value) return

  const data = mockData[chartPeriod.value]
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['用户注册', '知识库创建'] },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dates
    },
    yAxis: { type: 'value' },
    series: [
      { name: '用户注册', type: 'line', data: data.userRegistrations, smooth: true },
      { name: '知识库创建', type: 'line', data: data.kbCreations, smooth: true }
    ]
  }
  chartInstance.value.setOption(option)
}

// 监听周期变化，更新图表
watch(chartPeriod, updateChart)

onMounted(() => {
  nextTick(() => {
    if (chartRef.value) {
      chartInstance.value = echarts.init(chartRef.value)
      updateChart()
      window.addEventListener('resize', chartInstance.value.resize)
    }
  })
})

// 搜索关键词
const searchKeyword = ref('')
const loading = ref(false)

// 注册数据
const registrationData = ref([
  { date: '2023-07-01', userRegistrations: 12, knowledgeBaseCreations: 3, status: '正常' },
  { date: '2023-07-02', userRegistrations: 8, knowledgeBaseCreations: 2, status: '正常' },
  { date: '2023-07-03', userRegistrations: 15, knowledgeBaseCreations: 5, status: '正常' },
  { date: '2023-07-04', userRegistrations: 10, knowledgeBaseCreations: 4, status: '正常' },
  { date: '2023-07-05', userRegistrations: 9, knowledgeBaseCreations: 3, status: '异常' },
])

// 过滤注册数据
const filteredRegistrationData = computed(() => {
  if (!searchKeyword.value) {
    return registrationData.value
  }
  return registrationData.value.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  )
})

// 获取状态标签类型
const getStatusType = (status) => {
  const statusTypeMap = {
    '正常': 'success',
    '异常': 'danger',
    '警告': 'warning'
  }
  return statusTypeMap[status] || 'info'
}
</script>

<style scoped>
.tenant-admin-statistics {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100%;
}

.overview-card {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
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

.chart-container {
  padding: 10px 0;
}

.echarts-chart {
  width: 100%;
  height: 300px;
}

.data-table-card {
  margin-top: 20px;
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

/* 响应式布局 */
@media (max-width: 1200px) {
  .overview-card,
  .chart-card {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .tenant-admin-statistics {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-title {
    margin-bottom: 10px;
  }

  .search-input {
    width: 100%;
    margin-top: 10px;
  }

  .overview-card .overview-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
}
</style>