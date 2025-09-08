<template>
    <div class="log-tab">
        <!-- 查询条件区域 -->
        <div class="filter-section">
            <el-form :model="queryParams" inline class="filter-form">
                <el-form-item label="操作人">
                    <el-input v-model="queryParams.operator" placeholder="请输入操作人" clearable aria-label="输入操作人"
                        class="filter-input" />
                </el-form-item>

                <el-form-item label="操作类型">
                    <el-select v-model="queryParams.action" placeholder="请选择操作类型" clearable aria-label="选择操作类型"
                        class="filter-select">
                        <el-option label="创建" value="create" />
                        <el-option label="更新" value="update" />
                        <el-option label="删除" value="delete" />
                        <el-option label="权限变更" value="permission" />
                        <el-option label="导入" value="import" />
                        <el-option label="导出" value="export" />
                    </el-select>
                </el-form-item>

                <el-form-item label="时间范围">
                    <el-date-picker v-model="queryParams.timeRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" clearable
                        aria-label="选择时间范围" class="filter-date" />
                </el-form-item>

                <el-form-item class="filter-buttons">
                    <el-button type="primary" @click="handleSearch" :loading="loading" class="filter-button">
                        <el-icon>
                            <Search />
                        </el-icon> 查询
                    </el-button>
                    <el-button @click="resetSearch" class="filter-button">
                        <el-icon>
                            <Refresh />
                        </el-icon> 重置
                    </el-button>
                    <el-button type="success" @click="exportToExcel" :disabled="filteredLogs.length === 0"
                        class="filter-button">
                        <el-icon>
                            <Download />
                        </el-icon> 导出Excel
                    </el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 日志表格（PC 端） -->
        <div class="section">
            <div class="section-title">知识库修改记录</div>
            <el-table :data="filteredLogs" stripe class="desktop-table" v-loading="loading">
                <el-table-column prop="timestamp" label="时间" width="180" sortable />
                <el-table-column prop="operator" label="操作人" width="120" />
                <el-table-column prop="action" label="操作类型" width="120">
                    <template #default="{ row }">
                        <el-tag :type="getActionTypeColor(row.action)">
                            {{ getActionLabel(row.action) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="300" />
            </el-table>

            <!-- 卡片列表（移动端） -->
            <div class="mobile-list" v-if="!loading && filteredLogs.length">
                <div v-for="log in filteredLogs" :key="log.timestamp" class="mobile-card">
                    <div class="title">{{ getActionLabel(log.action) }}</div>
                    <div class="meta">时间：{{ log.timestamp }}</div>
                    <div class="meta">操作人：{{ log.operator }}</div>
                    <div class="meta">描述：{{ log.description }}</div>
                    <div class="tags">
                        <el-tag size="small" :type="getActionTypeColor(log.action)">
                            {{ getActionLabel(log.action) }}
                        </el-tag>
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-if="!loading && filteredLogs.length === 0" class="empty-state">
                <el-empty description="暂无日志记录" />
            </div>

            <!-- 分页 -->
            <div class="pagination">
                <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize"
                    :total="totalCount" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                    @size-change="fetchLogs" @current-change="fetchLogs" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getKnowledgeBaseLogs } from '@/api/Knowledgebase'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'

const route = useRoute()
const logRecords = ref([])
const loading = ref(false)
const totalCount = ref(0)

// 查询参数
const queryParams = ref({
    operator: '',
    action: '',
    timeRange: [],
    page: 1,
    pageSize: 20
})

// 操作类型映射
const actionMap = {
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'permission': '权限变更',
    'import': '导入',
    'export': '导出'
}

// 操作类型颜色
const getActionTypeColor = (action) => {
    const colorMap = {
        'create': 'success',
        'update': 'primary',
        'delete': 'danger',
        'permission': 'warning',
        'import': 'info',
        'export': 'success'
    }
    return colorMap[action] || 'default'
}

// 获取操作类型标签
const getActionLabel = (action) => {
    return actionMap[action] || action
}

// 过滤后的日志数据
const filteredLogs = computed(() => {
    let filtered = logRecords.value

    // 按操作人过滤
    if (queryParams.value.operator) {
        const operator = queryParams.value.operator.toLowerCase()
        filtered = filtered.filter(log =>
            log.operator.toLowerCase().includes(operator)
        )
    }

    // 按操作类型过滤
    if (queryParams.value.action) {
        filtered = filtered.filter(log => log.action === queryParams.value.action)
    }

    // 按时间范围过滤
    if (queryParams.value.timeRange && queryParams.value.timeRange.length === 2) {
        const [start, end] = queryParams.value.timeRange
        filtered = filtered.filter(log => {
            const logDate = log.timestamp.split(' ')[0] // 只比较日期部分
            return logDate >= start && logDate <= end
        })
    }

    return filtered
})

const fetchLogs = async () => {
    try {
        loading.value = true
        const response = await getKnowledgeBaseLogs(route.params.id, {
            page: queryParams.value.page,
            pageSize: queryParams.value.pageSize,
            operator: queryParams.value.operator,
            action: queryParams.value.action,
            start_time: queryParams.value.timeRange?.[0],
            end_time: queryParams.value.timeRange?.[1]
        })

        let logsData = []
        let total = 0

        if (Array.isArray(response)) {
            logsData = response
            total = response.length
        } else if (Array.isArray(response?.data)) {
            logsData = response.data
            total = response.total || response.data.length
        } else if (Array.isArray(response?.data?.items)) {
            logsData = response.data.items
            total = response.data.total || response.data.items.length
        } else if (Array.isArray(response?.data?.data)) {
            logsData = response.data.data
            total = response.data.total || response.data.data.length
        } else {
            console.warn('未知的API响应结构:', response)
            ElMessage.warning('获取日志数据格式异常')
        }

        logRecords.value = logsData.map(log => ({
            timestamp: log.create_time || log.timestamp,
            operator: log.operator_name || log.operator || log.operator_id || '未知',
            action: log.action_type || log.action,
            description: log.action_detail || log.description
        }))

        totalCount.value = total
    } catch (error) {
        console.error('获取日志失败:', error)
        ElMessage.error('获取日志失败: ' + error.message)
    } finally {
        loading.value = false
    }
}

// 搜索处理
const handleSearch = () => {
    queryParams.value.page = 1 // 重置到第一页
    fetchLogs()
}

// 重置搜索条件
const resetSearch = () => {
    queryParams.value = {
        operator: '',
        action: '',
        timeRange: [],
        page: 1,
        pageSize: 20
    }
    fetchLogs()
}

// 导出Excel
const exportToExcel = () => {
    try {
        // 准备导出数据
        const exportData = filteredLogs.value.map(log => ({
            '时间': log.timestamp,
            '操作人': log.operator,
            '操作类型': getActionLabel(log.action),
            '描述': log.description
        }))

        // 创建工作簿
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(exportData)

        // 设置列宽
        const colWidth = [
            { wch: 20 }, // 时间列
            { wch: 15 }, // 操作人列
            { wch: 15 }, // 操作类型列
            { wch: 50 }  // 描述列
        ]
        worksheet['!cols'] = colWidth

        // 添加工作表
        XLSX.utils.book_append_sheet(workbook, worksheet, '知识库操作日志')

        // 生成文件名
        const fileName = `知识库操作日志_${new Date().toISOString().split('T')[0]}.xlsx`

        // 导出文件
        XLSX.writeFile(workbook, fileName)

        ElMessage.success('导出成功')
    } catch (error) {
        console.error('导出Excel失败:', error)
        ElMessage.error('导出失败: ' + error.message)
    }
}

onMounted(() => {
    fetchLogs()
})
</script>

<style scoped>
.log-tab {
    padding: 16px;
    background-color: var(--el-bg-color, #ffffff);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    max-width: 100%;
    overflow-x: auto;
}

.filter-section {
    background: var(--el-bg-color-overlay, #f5f7fa);
    padding: 16px;
    border-radius: 6px;
    margin-bottom: 16px;
}

.filter-form {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.filter-input,
.filter-select,
.filter-date {
    flex: 1;
    min-width: 140px;
    max-width: 260px;
}

.filter-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.filter-button {
    min-height: 36px;
    padding: 8px 16px;
    border-radius: 6px;
}

.section {
    margin-bottom: 24px;
}

.section-title {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 12px;
    color: var(--el-text-color-primary, #303133);
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

.mobile-card .tags {
    margin-bottom: 10px;
    display: flex;
    gap: 6px;
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

:deep(.el-form--inline .el-form-item) {
    margin-right: 12px;
    margin-bottom: 12px;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .log-tab {
        padding: 12px;
    }

    .filter-section {
        padding: 12px;
    }

    .filter-form {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }

    .filter-input,
    .filter-select,
    .filter-date {
        max-width: 100%;
    }

    .filter-buttons {
        flex-direction: column;
        gap: 8px;
    }

    .filter-button {
        width: 100%;
        font-size: 13px;
    }

    .desktop-table {
        display: none;
    }

    .mobile-list {
        display: block;
    }

    .section-title {
        font-size: 14px;
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