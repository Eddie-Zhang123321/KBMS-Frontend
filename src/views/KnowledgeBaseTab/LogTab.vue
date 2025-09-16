<template>
    <div class="log-tab">
        <!-- 查询条件区域 -->
        <div class="filter-section">
            <el-form :model="queryParams" inline>
                <el-form-item label="操作人">
                    <el-input v-model="queryParams.operator" placeholder="请输入操作人" clearable />
                </el-form-item>

                <el-form-item label="操作类型">
                    <el-select v-model="queryParams.action" placeholder="请选择操作类型" clearable>
                        <el-option v-for="(label, value) in actionMap" :key="value" :label="label" :value="value" />
                    </el-select>
                </el-form-item>

                <el-form-item label="时间范围">
                    <el-date-picker v-model="queryParams.timeRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" clearable />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" @click="handleSearch" :loading="loading">
                        <el-icon>
                            <Search />
                        </el-icon>查询
                    </el-button>
                    <el-button @click="resetSearch">
                        <el-icon>
                            <Refresh />
                        </el-icon>重置
                    </el-button>
                    <el-button type="success" @click="exportToExcel(false)" :disabled="logRecords.length === 0">
                        <el-icon>
                            <Download />
                        </el-icon>导出当前页
                    </el-button>
                    <el-button type="warning" @click="exportToExcel(true)">
                        <el-icon>
                            <Download />
                        </el-icon>导出全部
                    </el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 日志表格 -->
        <div class="section">
            <div class="section-title">知识库修改记录</div>
            <el-table :data="logRecords" stripe style="width: 100%" v-loading="loading">
                <el-table-column prop="timestamp" label="时间" width="180" sortable />
                <el-table-column prop="operator" label="操作人" width="120" />
                <el-table-column prop="action" label="操作类型" width="120">
                    <template #default="{ row }">
                        <el-tag :type="getActionTypeColor(row.action)">
                            {{ getActionLabel(row.action) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" />
            </el-table>

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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { getKnowledgeBaseLogs } from '@/api/Knowledgebase'

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
    create: '创建',
    update: '更新',
    delete: '删除',
    permission: '权限变更',
    upload: '上传'
}

// 操作类型颜色
const getActionTypeColor = (action) => {
    const colorMap = {
        create: 'success',
        update: 'primary',
        delete: 'danger',
        permission: 'warning',
        upload: 'info'
    }
    return colorMap[action] || ''
}
const getActionLabel = (action) => actionMap[action] || '未知操作'

// 拼接查询参数
const buildParams = (withPage = true) => {
    const params = {
        operator: queryParams.value.operator,
        action: queryParams.value.action,
        start_time: queryParams.value.timeRange?.[0],
        end_time: queryParams.value.timeRange?.[1]
    }
    if (withPage) {
        params.page = queryParams.value.page
        params.pageSize = queryParams.value.pageSize
    }
    return params
}

// 请求日志
const fetchLogs = async () => {
    try {
        loading.value = true

        // 构建完整的请求参数
        const requestParams = buildParams(true)
        console.log('Fetching logs with params:', route.params.id)
        const response = await getKnowledgeBaseLogs(route.params.id, requestParams)

        let logsData = []
        let total = 0

        if (Array.isArray(response)) {
            logsData = response
            total = response.length
        } else if (response?.data?.items) {
            logsData = response.data.items
            total = response.data.total || response.data.items.length
        } else if (response?.data?.data) {
            logsData = response.data.data
            total = response.data.total || response.data.data.length
        } else if (Array.isArray(response?.data)) {
            logsData = response.data
            total = response.total || response.data.length
        } else {
            console.warn('未知的API响应结构:', response)
            ElMessage.warning('获取日志数据格式异常')
        }

        logRecords.value = logsData.map(log => ({
            timestamp: log.create_time || log.createTime || log.timestamp || 'N/A',
            operator: log.operator_name || log.operator || log.operator_id || '未知用户',
            action: log.action_type || log.action || 'unknown',
            description: log.action_detail || log.description || '无描述'
        }))

        totalCount.value = total
    } catch (error) {
        console.error('获取日志失败:', error)
        ElMessage.error('获取日志失败: ' + (error.message || '未知错误'))
    } finally {
        loading.value = false
    }
}

// 搜索
const handleSearch = () => {
    queryParams.value.page = 1
    fetchLogs()
}

// 重置
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

// 导出
const exportToExcel = async (exportAll = false) => {
    try {
        loading.value = true
        let dataToExport = []

        if (exportAll) {
            // 构建无分页的查询参数
            const requestParams = buildParams(false)
            const response = await getKnowledgeBaseLogs(requestParams)

            let logsData = []
            if (Array.isArray(response)) {
                logsData = response
            } else if (response?.data?.items) {
                logsData = response.data.items
            } else if (response?.data?.data) {
                logsData = response.data.data
            } else if (Array.isArray(response?.data)) {
                logsData = response.data
            }
            dataToExport = logsData.map(log => ({
                timestamp: log.create_time || log.createTime || log.timestamp || 'N/A',
                operator: log.operator_name || log.operator || log.operator_id || '未知用户',
                action: log.action_type || log.action || 'unknown',
                description: log.action_detail || log.description || '无描述'
            }))
        } else {
            dataToExport = logRecords.value
        }

        if (dataToExport.length === 0) {
            ElMessage.warning('当前无数据可导出')
            return
        }

        const exportData = dataToExport.map(log => ({
            '时间': log.timestamp,
            '操作人': log.operator,
            '操作类型': getActionLabel(log.action),
            '描述': log.description
        }))

        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(exportData)
        worksheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 50 }]
        XLSX.utils.book_append_sheet(workbook, worksheet, '知识库操作日志')

        const fileName = `知识库操作日志_${exportAll ? '全部' : '当前页'}_${new Date()
            .toISOString()
            .split('T')[0]}.xlsx`
        XLSX.writeFile(workbook, fileName)

        ElMessage.success(`导出${exportAll ? '全部' : '当前页'}成功`)
    } catch (error) {
        console.error('导出Excel失败:', error)
        ElMessage.error('导出失败: ' + error.message)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchLogs()
})
</script>

<style scoped>
.log-tab {
    padding: 20px;
}

.filter-section {
    background: #f5f7fa;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.section {
    margin-bottom: 24px;
}

.section-title {
    font-weight: bold;
    margin-bottom: 12px;
    font-size: 16px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

:deep(.el-form--inline .el-form-item) {
    margin-right: 20px;
    margin-bottom: 0;
}
</style>