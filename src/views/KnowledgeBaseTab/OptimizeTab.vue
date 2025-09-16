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
import { ElMessage } from 'element-plus'
import { getOptimizeList, applyOptimize, ignoreOptimize, batchApplyOptimize, batchIgnoreOptimize } from '@/api/Knowledgebase'
import { useRoute } from 'vue-router'
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const route = useRoute()
const kb_id = route.params.id
const filter = ref({
    target: 'all',
    status: 'all',
    keyword: ''
})

const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0
})

// 请求列表
const fetchList = async () => {
    loading.value = true
    try {
        const params = {
            target: filter.value.target === 'all' ? undefined : filter.value.target,
            status: filter.value.status === 'all' ? undefined : filter.value.status,
            keyword: filter.value.keyword || undefined,
            page: pagination.value.page,
            pageSize: pagination.value.pageSize
        }
        const res = await getOptimizeList(kb_id, params)
        tableData.value = res.list || []
        pagination.value.total = res.total || 0
    } catch (e) {
        console.error(e)
        ElMessage.error('获取调优建议失败')
    } finally {
        loading.value = false
    }
}

const resetFilter = () => {
    filter.value = { target: 'all', status: 'all', keyword: '' }
    pagination.value.page = 1
    fetchList()
}

const handleSelectionChange = (rows) => {
    selectedRows.value = rows
}

const apply = async (row) => {
    try {
        await applyOptimize(kb_id, row.id)
        row.status = 'applied'
        ElMessage.success('已应用')
    } catch {
        ElMessage.error('操作失败')
    }
}

const ignore = async (row) => {
    try {
        await ignoreOptimize(kb_id, row.id)
        row.status = 'ignored'
        ElMessage.success('已忽略')
    } catch {
        ElMessage.error('操作失败')
    }
}

const batchApply = async () => {
    const ids = selectedRows.value.map(r => r.id)
    if (!ids.length) return ElMessage.warning('请选择数据')
    try {
        await batchApplyOptimize(kb_id, ids)
        selectedRows.value.forEach(r => r.status = 'applied')
        ElMessage.success('批量应用成功')
    } catch {
        ElMessage.error('操作失败')
    }
}

const batchIgnore = async () => {
    const ids = selectedRows.value.map(r => r.id)
    if (!ids.length) return ElMessage.warning('请选择数据')
    try {
        await batchIgnoreOptimize(kb_id, ids)
        selectedRows.value.forEach(r => r.status = 'ignored')
        ElMessage.success('批量忽略成功')
    } catch {
        ElMessage.error('操作失败')
    }
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
