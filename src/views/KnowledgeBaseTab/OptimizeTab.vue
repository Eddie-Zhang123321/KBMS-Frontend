<template>
    <div class="optimize-tab">
        <!-- 顶部筛选区域 -->
        <div class="filter-bar">
            <el-select v-model="filter.target" placeholder="调优对象" clearable class="filter-select" aria-label="选择调优对象">
                <el-option label="全部" value="all" />
                <el-option label="初始化策略" value="init" />
                <el-option label="检索策略" value="retrieval" />
            </el-select>

            <el-select v-model="filter.status" placeholder="状态" clearable class="filter-select" aria-label="选择状态">
                <el-option label="全部" value="all" />
                <el-option label="未处理" value="pending" />
                <el-option label="已应用" value="applied" />
                <el-option label="已忽略" value="ignored" />
            </el-select>

            <el-input v-model="filter.keyword" placeholder="请输入关键词或问题内容" clearable class="filter-input"
                aria-label="搜索关键词" />

            <el-button type="primary" @click="fetchList" class="filter-button">查询</el-button>
            <el-button @click="resetFilter" class="filter-button">重置</el-button>
        </div>

        <!-- 操作按钮 -->
        <div class="action-bar">
            <el-button type="success" @click="fetchList">刷新建议</el-button>
        </div>

        <!-- 表格（PC 端） -->
        <el-table v-loading="loading" :data="tableData" border class="desktop-table"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="target" label="调优对象" width="120" />
            <el-table-column prop="type" label="策略类型" width="160" />
            <el-table-column prop="analysis" label="分析依据" min-width="200" />
            <el-table-column prop="suggestion" label="系统建议" min-width="200" />
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

        <!-- 卡片列表（移动端） -->
        <div class="mobile-list" v-if="!loading && tableData.length">
            <div v-for="row in tableData" :key="row.id" class="mobile-card">
                <div class="title">{{ row.target }} - {{ row.type }}</div>
                <div class="meta">
                    <span>分析依据：</span>{{ row.analysis }}
                </div>
                <div class="meta">
                    <span>系统建议：</span>{{ row.suggestion }}
                </div>
                <div class="meta">建议时间：{{ row.time }}</div>
                <div class="tags">
                    <el-tag size="small"
                        :type="row.status === 'pending' ? 'warning' : row.status === 'applied' ? 'success' : 'info'">
                        {{ row.status === 'pending' ? '未处理' : row.status === 'applied' ? '已应用' : '已忽略' }}
                    </el-tag>
                </div>
                <div class="actions">
                    <el-button size="small" type="primary" @click="apply(row)">应用</el-button>
                    <el-button size="small" type="danger" @click="ignore(row)">忽略</el-button>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && tableData.length === 0" class="empty-state">
            <el-empty description="暂无优化建议" />
        </div>

        <!-- 分页 -->
        <div class="pagination">
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
.optimize-tab {
    padding: 16px;
    background-color: var(--el-bg-color, #ffffff);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    max-width: 100%;
    overflow-x: auto;
}

.filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.filter-select,
.filter-input {
    flex: 1;
    min-width: 140px;
    max-width: 260px;
}

.filter-button {
    min-height: 36px;
    padding: 8px 16px;
    border-radius: 6px;
}

.action-bar {
    display: flex;
    gap: 12px;
    margin: 16px 0;
}

.desktop-table {
    width: 100%;
    margin-bottom: 16px;
}

.mobile-list {
    display: none;
}

.mobile-card {
    background: var(--el-bg-color, #ffffff);
    border: 1px solid var(--el-border-color-light, #ebeef5);
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.mobile-card .title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 8px;
}

.mobile-card .meta {
    font-size: 13px;
    color: var(--el-text-color-secondary, #666);
    margin-bottom: 8px;
    line-height: 1.5;
}

.mobile-card .meta span {
    font-weight: 500;
}

.mobile-card .tags {
    margin-bottom: 10px;
    display: flex;
    gap: 6px;
}

.mobile-card .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
}

.empty-state {
    margin: 40px 0;
    display: flex;
    justify-content: center;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .optimize-tab {
        padding: 12px;
    }

    .filter-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }

    .filter-select,
    .filter-input {
        max-width: 100%;
    }

    .filter-button {
        width: 100%;
        font-size: 13px;
    }

    .action-bar {
        flex-direction: column;
        gap: 8px;
    }

    .action-bar .el-button {
        width: 100%;
        font-size: 13px;
        min-height: 36px;
        border-radius: 6px;
    }

    .desktop-table {
        display: none;
    }

    .mobile-list {
        display: block;
    }

    .mobile-card .actions .el-button {
        flex: 1;
        font-size: 13px;
        padding: 8px;
    }

    .pagination {
        margin: 16px 0;
    }

    .pagination :deep(.el-pagination) {
        font-size: 12px;
    }

    .empty-state {
        margin: 30px 0;
        padding: 0 12px;
    }

    .empty-state :deep(.el-empty__description) {
        font-size: 13px;
        color: var(--el-text-color-secondary, #888);
    }
}

/* PC 端确保表格完整显示 */
@media (min-width: 769px) {
    .mobile-list {
        display: none;
    }

    .desktop-table {
        display: table;
    }
}
</style>