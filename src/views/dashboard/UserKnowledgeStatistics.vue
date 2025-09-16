<template>
  <div class="user-knowledge-statistics">
    <el-row :gutter="20" class="top-row">
      <el-col :xs="24" :sm="12" :lg="6" class="overview-col">
        <el-card shadow="hover" class="overview-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">个人知识库</span>
              <el-icon>
                <DocumentChecked />
              </el-icon>
            </div>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <span>知识库数量</span>
              <strong class="metric">{{ knowledgeStats.totalKnowledgeBases }}</strong>
            </div>
            <div class="overview-item">
              <span>文档总数</span>
              <strong class="metric">{{ knowledgeStats.totalDocuments }}</strong>
            </div>
            <div class="overview-item">
              <span>今日新增</span>
              <strong class="metric">{{ knowledgeStats.todayNewDocuments }}</strong>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="18" class="chart-col">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">知识库使用趋势</span>
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
      </el-col>
    </el-row>

    <el-card shadow="hover" class="data-table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">知识库明细</span>
          <el-input v-model="searchKeyword" placeholder="搜索知识库" clearable :prefix-icon="Search" class="search-input" />
        </div>
      </template>
      <el-table :data="filteredKnowledgeBases" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="知识库名称" min-width="150" />
        <el-table-column prop="documentCount" label="文档数量" sortable min-width="100" />
        <el-table-column prop="lastUpdated" label="最近更新" sortable min-width="120" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="light">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="viewKnowledgeBase(scope.row)">
              查看
            </el-button>
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
import { DocumentChecked, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
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
  CanvasRenderer,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 个人知识库统计数据
const knowledgeStats = reactive({
  totalKnowledgeBases: 5,
  totalDocuments: 128,
  todayNewDocuments: 3
})

// 图表周期和引用
const chartPeriod = ref('week')
const chartRef = ref(null)
const chartInstance = ref(null)

// 模拟数据
const mockData = {
  week: {
    dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    newDocs: [12, 15, 10, 18, 20, 22, 25],
    visits: [30, 35, 28, 40, 45, 50, 55]
  },
  month: {
    dates: ['第1周', '第2周', '第3周', '第4周'],
    newDocs: [60, 75, 55, 80],
    visits: [180, 210, 160, 240]
  },
  quarter: {
    dates: ['1月', '2月', '3月'],
    newDocs: [250, 300, 350],
    visits: [700, 850, 950]
  }
}

// 渲染或更新图表
const updateChart = () => {
  if (!chartInstance.value) return

  const data = mockData[chartPeriod.value]
  chartInstance.value.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['文档新增', '知识库访问']
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
      data: data.dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '文档新增',
        type: 'line',
        data: data.newDocs,
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '知识库访问',
        type: 'line',
        data: data.visits,
        smooth: true,
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
}

// 监听周期变化，更新图表
watch(chartPeriod, updateChart)

onMounted(() => {
  nextTick(() => {
    if (chartRef.value) {
      chartInstance.value = echarts.init(chartRef.value)
      updateChart()
      window.addEventListener('resize', () => chartInstance.value.resize())
    }
  })
})

// 搜索关键词
const searchKeyword = ref('')
const loading = ref(false)

// 知识库数据
const knowledgeBases = ref([
  { name: '技术文档', documentCount: 42, lastUpdated: '2023-07-15', status: '正常' },
  { name: '产品手册', documentCount: 25, lastUpdated: '2023-07-10', status: '正常' },
  { name: '项目总结', documentCount: 15, lastUpdated: '2023-07-05', status: '警告' },
  { name: '个人笔记', documentCount: 45, lastUpdated: '2023-07-12', status: '正常' },
  { name: '学习资料', documentCount: 1, lastUpdated: '2023-06-28', status: '异常' }
])

// 过滤知识库数据
const filteredKnowledgeBases = computed(() => {
  if (!searchKeyword.value) {
    return knowledgeBases.value
  }
  return knowledgeBases.value.filter(kb =>
    kb.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
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

// 查看知识库详情
const viewKnowledgeBase = (knowledgeBase) => {
  console.log('查看知识库:', knowledgeBase.name)
  // TODO: 实现跳转到知识库详情页面的逻辑
}
</script>

<style scoped>
.user-knowledge-statistics {
  padding: 24px;
  background-color: #f0f2f5;
  min-height: 100%;
}

.top-row {
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

  .overview-col,
  .chart-col {
    /* 平板设备上各占一半，防止过窄 */
    flex: 0 0 50%;
    max-width: 50%;
    margin-bottom: 20px;
  }

  .top-row {
    flex-wrap: wrap;
  }

  .overview-col:nth-child(2) {
    padding-left: 10px;
  }
}

@media (max-width: 768px) {
  .user-knowledge-statistics {
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

  .overview-col,
  .chart-col {
    /* 手机上全屏显示 */
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>