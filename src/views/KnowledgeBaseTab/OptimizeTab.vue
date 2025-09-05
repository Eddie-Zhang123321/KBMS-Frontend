<template>
    <div class="optimize-tab">
        <!-- 顶部筛选区域 -->
        <div class="filter-bar">
            <el-select v-model="filter.target" placeholder="调优对象" clearable style="width: 160px; margin-right: 10px;">
                <el-option label="全部" value="all" />
                <el-option label="初始化策略" value="init" />
                <el-option label="检索策略" value="retrieval" />
            </el-select>

            <el-select v-model="filter.status" placeholder="状态" clearable style="width: 140px; margin-right: 10px;">
                <el-option label="全部" value="all" />
                <el-option label="未处理" value="pending" />
                <el-option label="已应用" value="applied" />
                <el-option label="已忽略" value="ignored" />
            </el-select>

            <el-input v-model="filter.keyword" placeholder="请输入关键词或问题内容" clearable
                style="width: 260px; margin-right: 10px;" />

            <el-button type="primary" @click="fetchList">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar" style="margin: 15px 0;">
            <el-button type="success" @click="fetchList">刷新建议</el-button>
            <el-button type="primary" @click="batchApply">批量应用</el-button>
            <el-button type="danger" @click="batchIgnore">批量忽略</el-button>
        </div>

        <!-- 表格 -->
        <el-table v-loading="loading" :data="tableData" border style="width: 100%;"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="target" label="调优对象" width="120" />
            <el-table-column prop="type" label="策略类型" width="160" />
            <el-table-column prop="analysis" label="分析依据" />
            <el-table-column prop="suggestion" label="系统建议" />
            <el-table-column prop="time" label="建议时间" width="160" />
            <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                    <el-tag v-if="row.status === 'pending'" type="warning">未处理</el-tag>
                    <el-tag v-else-if="row.status === 'applied'" type="success">已应用</el-tag>
                    <el-tag v-else type="info">已忽略</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
                <template #default="{ row }">
                    <el-button size="small" type="primary" @click="apply(row)">应用</el-button>
                    <el-button size="small" type="danger" @click="ignore(row)">忽略</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div style="margin-top: 20px; text-align: right;">
            <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
                :total="pagination.total" background layout="prev, pager, next, jumper" @current-change="fetchList" />
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])

const filter = ref({
    target: 'all',
    status: 'all',
    keyword: ''
})

const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 150
})

// 模拟请求数据
const fetchList = () => {
    loading.value = true
    setTimeout(() => {
        tableData.value = [
            {
                id: 1,
                target: '初始化策略',
                type: '分片大小',
                analysis: '条目平均长度=850字，超长条目比例约20%',
                suggestion: '建议将分片大小从1000调整为600',
                time: '2025-7-20',
                status: 'pending'
            },
            {
                id: 2,
                target: '初始化策略',
                type: '嵌入模型',
                analysis: '当前模型召回相似度均值=0.62',
                suggestion: '建议升级为更强语义模型 BERT-xx-large',
                time: '2025-7-20',
                status: 'applied'
            }
        ]
        loading.value = false
    }, 800)
}

const resetFilter = () => {
    filter.value = { target: 'all', status: 'all', keyword: '' }
    fetchList()
}

const handleSelectionChange = (rows) => {
    selectedRows.value = rows
}

const apply = (row) => {
    row.status = 'applied'
}

const ignore = (row) => {
    row.status = 'ignored'
}

const batchApply = () => {
    selectedRows.value.forEach((row) => (row.status = 'applied'))
}

const batchIgnore = () => {
    selectedRows.value.forEach((row) => (row.status = 'ignored'))
}

// 初始化
fetchList()
</script>

<style scoped>
.filter-bar {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
}
</style>
