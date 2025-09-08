<template>
    <div class="data-source-tab">
        <div class="header">
            <el-input v-model="searchQuery" placeholder="搜索数据源名称、类型或上传人" class="pill-input search-input" clearable
                @clear="handleSearchClear" @keyup.enter="handleSearch">
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
            </el-input>

            <div class="action-bar">
                <el-button v-if="isEditor()" type="primary" @click="addSource">
                    + 添加数据源
                </el-button>
                <el-button @click="refreshData" :loading="loading">刷新</el-button>
            </div>
        </div>

        <el-table :data="tableData" stripe class="desktop-table" v-loading="loading">
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column prop="file_type" label="类型" width="120">
                <template #default="{ row }">
                    <el-tag :type="getTypeTag(row.file_type)">
                        {{ row.file_type.toUpperCase() }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="uploader_name" label="上传人" width="150" />
            <el-table-column prop="updated_time" label="更新时间" min-width="160">
                <template #default="{ row }">
                    {{ formatDate(row.updated_time) }}
                </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                    <el-tag :type="getStatusTag(row.status)">
                        {{ formatStatus(row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" min-width="220">
                <template #default="{ row }">
                    <el-button size="small" text @click="viewContent(row)">
                        <el-icon>
                            <Search />
                        </el-icon>
                        查看内容
                    </el-button>
                    <el-button v-if="isEditor()" size="small" text @click="editData(row)">
                        编辑
                    </el-button>
                    <el-button v-if="isEditor()" size="small" text type="danger" @click="deleteData(row)"
                        :loading="row.deleting">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="mobile-list" v-if="!loading && tableData.length">
            <div v-for="row in tableData" :key="row.id" class="mobile-card">
                <div class="title">{{ row.name }}</div>
                <div class="meta">上传人：{{ row.uploader_name || '未知' }}</div>
                <div class="tags">
                    <el-tag size="small" :type="getTypeTag(row.file_type)">
                        {{ row.file_type.toUpperCase() }}
                    </el-tag>
                    <el-tag size="small" :type="getStatusTag(row.status)">
                        {{ formatStatus(row.status) }}
                    </el-tag>
                </div>
                <div class="actions">
                    <el-button size="small" text @click="viewContent(row)">查看</el-button>
                    <el-button v-if="isEditor()" size="small" text @click="editData(row)">
                        编辑
                    </el-button>
                    <el-button v-if="isEditor()" size="small" text type="danger" @click="deleteData(row)"
                        :loading="row.deleting">
                        删除
                    </el-button>
                </div>
            </div>
        </div>

        <div class="pagination" v-if="total > 0">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                @current-change="handlePageChange" @size-change="handleSizeChange" />
        </div>

        <div v-if="tableData.length === 0 && !loading" class="empty-state">
            <el-empty :description="searchQuery ? '未找到匹配的数据源' : '暂无数据源'" />
        </div>

        <CreateData v-model:visible="dialogVisible" @add="handleAdd" :knowledge-base-id="knowledgeBaseId" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { useKBStore } from '@/stores/kb'
import CreateData from '@/components/dialogs/CreateData.vue'
import {
    getKnowledgeDetail,
    deleteKnowledgeBase,
    getSourceFileDownloadLink
} from '@/api/Knowledgebase'

const route = useRoute()
const knowledgeBaseId = route.params.id
const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

let searchTimeout = null

const kbStore = useKBStore()

const isEditor = () => {
    const role = kbStore.userRole
    return role === 1 || role === 2 || role === 3
}

const fetchDataSources = async () => {
    try {
        loading.value = true
        const params = {
            page: currentPage.value,
            page_size: pageSize.value
        }
        if (searchQuery.value.trim()) {
            params.search = searchQuery.value.trim()
        }
        const res = await getKnowledgeDetail(knowledgeBaseId, params)
        tableData.value = (res.items || res || []).map(item => ({
            ...item,
            deleting: false,
            syncing: false
        }))
        total.value = res.total || (res.items ? res.items.length : res.length) || 0
    } catch (error) {
        ElMessage.error('获取数据源列表失败: ' + (error.message || '未知错误'))
        tableData.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

watch(searchQuery, (newValue) => {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }
    searchTimeout = setTimeout(() => {
        currentPage.value = 1
        fetchDataSources()
    }, 500)
})

const handleSearch = () => {
    currentPage.value = 1
    fetchDataSources()
}

const handleSearchClear = () => {
    currentPage.value = 1
    fetchDataSources()
}

const handlePageChange = (page) => {
    currentPage.value = page
    fetchDataSources()
}

const handleSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchDataSources()
}

const refreshData = () => {
    fetchDataSources()
}

const addSource = () => {
    dialogVisible.value = true
}

const handleAdd = async () => {
    try {
        ElMessage.success('数据源添加成功')
        currentPage.value = 1
        await fetchDataSources()
    } catch (error) {
        ElMessage.error('添加数据源失败: ' + (error.message || '未知错误'))
    }
}

const viewContent = async (row) => {
    try {
        const res = await getSourceFileDownloadLink(knowledgeBaseId, row.id)
        const downloadUrl = res.download_url
        if (downloadUrl) {
            window.open(downloadUrl, '_blank')
            ElMessage.success('文件链接获取成功')
        } else {
            ElMessage.warning('未找到有效的下载链接')
        }
    } catch (error) {
        ElMessage.error('获取文件链接失败: ' + (error.message || '未知错误'))
    }
}

const editData = (row) => {
    console.log('编辑:', row)
    // TODO: 实现编辑功能
}

const deleteData = (row) => {
    ElMessageBox.confirm('确定删除该数据源吗？', '警告', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
    }).then(async () => {
        try {
            row.deleting = true
            await deleteKnowledgeBase(knowledgeBaseId, row.id)
            ElMessage.success('删除成功')
            await fetchDataSources()
        } catch (error) {
            ElMessage.error('删除失败: ' + error.message)
        } finally {
            row.deleting = false
        }
    }).catch(() => { })
}

const formatStatus = (status) => {
    const statusMap = {
        DONE: '完成',
        TODO: '待处理',
        PROCESSING: '处理中',
        FAILED: '失败'
    }
    return statusMap[status] || status
}

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString()
}

const getTypeTag = (fileType) => {
    const typeTagMap = {
        pdf: 'primary',
        csv: 'success',
        docx: 'info',
        txt: 'warning',
        xlsx: 'success',
        doc: 'info',
        ppt: 'warning',
        pptx: 'warning'
    }
    return typeTagMap[fileType] || 'info'
}

const getStatusTag = (status) => {
    const statusTagMap = {
        DONE: 'success',
        TODO: 'info',
        PROCESSING: 'warning',
        FAILED: 'danger'
    }
    return statusTagMap[status] || 'info'
}

onMounted(fetchDataSources)
</script>

<style scoped>
.data-source-tab {
    padding: 16px;
    max-width: 100%;
    overflow-x: auto;
}

.header {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: var(--el-bg-color, #ffffff);
    border-bottom: 1px solid var(--el-border-color-light, #ebeef5);
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
}

.header .search-input {
    max-width: 400px;
    flex: 1;
}

.header .action-bar {
    display: flex;
    gap: 12px;
    margin-left: auto;
}

.desktop-table {
    width: 100%;
    margin-bottom: 16px;
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

/* Pill-shaped input styling */
:deep(.pill-input .el-input__wrapper) {
    border-radius: 9999px;
    padding-left: 12px;
    box-shadow: 0 0 0 1px var(--el-border-color, #dcdfe6) inset;
    transition: box-shadow 0.3s ease;
}

:deep(.pill-input .el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--el-color-primary, #409eff) inset;
}

:deep(.pill-input .el-input__prefix) {
    margin-right: 8px;
    display: flex;
    align-items: center;
}

/* Mobile responsive layout */
@media (max-width: 768px) {
    .data-source-tab {
        padding: 12px;
    }

    .header {
        flex-direction: column;
        align-items: stretch;
        padding: 12px;
        gap: 10px;
        background: transparent;
        border: none;
    }

    .header .search-input {
        max-width: 100%;
    }

    .header .action-bar {
        flex-wrap: wrap;
        gap: 8px;
    }

    .header .action-bar .el-button {
        flex: 1;
        border-radius: 10px;
        font-size: 14px;
    }

    .desktop-table {
        display: none;
    }

    .mobile-list {
        display: block;
    }

    .mobile-card {
        background: var(--el-bg-color, #ffffff);
        border: 1px solid var(--el-border-color-light, #ebeef5);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    .mobile-card .title {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 6px;
    }

    .mobile-card .meta {
        font-size: 13px;
        color: var(--el-text-color-secondary, #666);
        margin-bottom: 8px;
    }

    .mobile-card .tags {
        margin-bottom: 10px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .mobile-card .actions {
        display: flex;
        justify-content: space-between;
        gap: 6px;
    }

    .mobile-card .actions .el-button {
        flex: 1;
        font-size: 13px;
        border-radius: 8px;
        padding: 6px 0;
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

/* Tablet and larger screens */
@media (min-width: 769px) {
    .mobile-list {
        display: none;
    }

    .desktop-table {
        display: table;
    }
}
</style>