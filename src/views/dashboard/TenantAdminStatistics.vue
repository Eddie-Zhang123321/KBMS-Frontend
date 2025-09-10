<template>
  <div class="tenant-admin-statistics">
    <el-row :gutter="20">
      <!-- 租户总览卡片 -->
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <template #header>
            <div class="card-header">
              <span>租户总览</span>
              <el-icon><DataLine /></el-icon>
            </div>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <span>用户总数</span>
              <strong>{{ tenantStats.totalUsers }}</strong>
            </div>
            <div class="overview-item">
              <span>知识库数量</span>
              <strong>{{ tenantStats.totalKnowledgeBases }}</strong>
            </div>
            <div class="overview-item">
              <span>今日新增</span>
              <strong>{{ tenantStats.todayNewRegistrations }}</strong>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 租户注册趋势图表 -->
      <el-col :span="18">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>租户用户趋势</span>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button label="week">近一周</el-radio-button>
                <el-radio-button label="month">近一月</el-radio-button>
                <el-radio-button label="quarter">近一季</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <div ref="chartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 租户详细注册数据 -->
    <el-card shadow="hover" class="data-table-card">
      <template #header>
        <div class="card-header">
          <span>租户用户数据</span>
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索" 
            clearable 
            style="width: 200px;"
          />
        </div>
      </template>
      <el-table 
        :data="filteredRegistrationData" 
        stripe 
        style="width: 100%"
      >
        <el-table-column prop="date" label="日期" />
        <el-table-column prop="userRegistrations" label="用户注册数" />
        <el-table-column prop="knowledgeBaseCreations" label="知识库创建数" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag 
              :type="getStatusType(scope.row.status)"
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { DataLine } from '@element-plus/icons-vue'
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

// 渲染图表
onMounted(() => {
  nextTick(() => {
    if (chartRef.value) {
      const chart = echarts.init(chartRef.value)
      chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line' }
        },
        legend: {
          data: ['用户注册', '知识库创建']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '用户注册',
            type: 'line',
            stack: 'Total',
            data: [20, 32, 21, 34, 30, 40, 35]
          },
          {
            name: '知识库创建',
            type: 'line',
            stack: 'Total',
            data: [5, 8, 6, 10, 7, 12, 9]
          }
        ]
      })
    }
  })
})

// 搜索关键词
const searchKeyword = ref('')

// 注册数据
const registrationData = ref([
  { 
    date: '2023-07-01', 
    userRegistrations: 12, 
    knowledgeBaseCreations: 3,
    status: '正常' 
  },
  { 
    date: '2023-07-02', 
    userRegistrations: 8, 
    knowledgeBaseCreations: 2,
    status: '正常' 
  }
])

// 过滤注册数据
const filteredRegistrationData = computed(() => {
  return registrationData.value.filter(item => 
    item.date.includes(searchKeyword.value)
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

.data-table-card {
  margin-top: 20px;
}
</style>
