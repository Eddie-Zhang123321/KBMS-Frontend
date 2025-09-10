<template>
  <div class="user-knowledge-statistics">
    <el-row :gutter="20">
      <!-- 个人知识库总览 -->
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <template #header>
            <div class="card-header">
              <span>个人知识库</span>
              <el-icon><DocumentChecked /></el-icon>
            </div>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <span>知识库数量</span>
              <strong>{{ knowledgeStats.totalKnowledgeBases }}</strong>
            </div>
            <div class="overview-item">
              <span>文档总数</span>
              <strong>{{ knowledgeStats.totalDocuments }}</strong>
            </div>
            <div class="overview-item">
              <span>今日新增</span>
              <strong>{{ knowledgeStats.todayNewDocuments }}</strong>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 知识库使用趋势图表 -->
      <el-col :span="18">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>知识库使用趋势</span>
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

    <!-- 知识库详细数据 -->
    <el-card shadow="hover" class="data-table-card">
      <template #header>
        <div class="card-header">
          <span>知识库明细</span>
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索知识库" 
            clearable 
            style="width: 200px;"
          />
        </div>
      </template>
      <el-table 
        :data="filteredKnowledgeBases" 
        stripe 
        style="width: 100%"
      >
        <el-table-column prop="name" label="知识库名称" />
        <el-table-column prop="documentCount" label="文档数量" />
        <el-table-column prop="lastUpdated" label="最近更新" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag 
              :type="getStatusType(scope.row.status)"
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button 
              type="primary" 
              link 
              @click="viewKnowledgeBase(scope.row)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { DocumentChecked } from '@element-plus/icons-vue'
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

// 个人知识库统计数据
const knowledgeStats = reactive({
  totalKnowledgeBases: 5,
  totalDocuments: 128,
  todayNewDocuments: 3
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
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '文档新增',
            type: 'line',
            stack: 'Total',
            data: [12, 15, 10, 18, 20, 22, 25]
          },
          {
            name: '知识库访问',
            type: 'line',
            stack: 'Total',
            data: [30, 35, 28, 40, 45, 50, 55]
          }
        ]
      })
    }
  })
})

// 搜索关键词
const searchKeyword = ref('')

// 知识库数据
const knowledgeBases = ref([
  { 
    name: '技术文档', 
    documentCount: 42, 
    lastUpdated: '2023-07-15',
    status: '正常' 
  },
  { 
    name: '产品手册', 
    documentCount: 25, 
    lastUpdated: '2023-07-10',
    status: '正常' 
  },
  { 
    name: '项目总结', 
    documentCount: 15, 
    lastUpdated: '2023-07-05',
    status: '警告' 
  }
])

// 过滤知识库数据
const filteredKnowledgeBases = computed(() => {
  return knowledgeBases.value.filter(kb => 
    kb.name.includes(searchKeyword.value)
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
