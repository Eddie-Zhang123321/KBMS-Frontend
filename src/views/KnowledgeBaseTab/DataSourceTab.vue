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

        <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="file_type" label="类型">
                <template #default="{ row }">
                    <el-tag :type="getTypeTag(row.file_type)">
                        {{ row.file_type.toUpperCase() }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="uploader_name" label="上传人" />
            <el-table-column prop="updated_time" label="更新时间">
                <template #default="{ row }">
                    {{ formatDate(row.updated_time) }}
                </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                    <el-tag :type="getStatusTag(row.status)">
                        {{ formatStatus(row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="260">
                <template #default="{ row }">
                    <!-- 查看内容 - 所有人都可以 -->
                    <el-button size="small" text @click="viewContent(row)">
                        <el-icon>
                            <Search />
                        </el-icon> 查看内容
                    </el-button>


                    <!-- 编辑 - 仅 admin/owner -->
                    <el-button v-if="isEditor()" size="small" text @click="editData(row)">
                        编辑
                    </el-button>

                    <!-- 删除 - 仅 admin/owner -->
                    <el-button v-if="isEditor()" size="small" text type="danger" @click="deleteData(row)"
                        :loading="row.deleting">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页控件 -->
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
import { useKBStore } from '@/stores/kb' // 确保路径正确
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

// 搜索和分页相关变量
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 防抖计时器
let searchTimeout = null

// 使用 store 获取用户角色
const kbStore = useKBStore()

// 判断是否为管理员或所有者（可执行增删改）
const isEditor = () => {
    const role = kbStore.userRole
    return role === 1 || role === 2 || role === 3 // admin 或 owner
}

// 获取数据源列表（后端筛选和分页）
const fetchDataSources = async () => {
    try {
        loading.value = true

        // 构建请求参数，包含分页和搜索条件
        const params = {
            page: currentPage.value,
            page_size: pageSize.value
        }

        // 如果有搜索关键词，添加到参数中
        if (searchQuery.value.trim()) {
            params.search = searchQuery.value.trim()
        }

        // 调用API，传递筛选和分页参数
        const res = await getKnowledgeDetail(knowledgeBaseId, params)

        // 根据API响应结构调整
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

// 监听搜索条件变化，添加防抖
watch(searchQuery, (newValue) => {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }

    searchTimeout = setTimeout(() => {
        currentPage.value = 1 // 搜索时重置到第一页
        fetchDataSources()
    }, 500) // 500毫秒防抖
})

// 手动搜索
const handleSearch = () => {
    currentPage.value = 1
    fetchDataSources()
}

// 清除搜索
const handleSearchClear = () => {
    currentPage.value = 1
    fetchDataSources()
}

// 分页事件
const handlePageChange = (page) => {
    currentPage.value = page
    fetchDataSources()
}

const handleSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchDataSources()
}

// 刷新数据
const refreshData = () => {
    fetchDataSources()
}

// 添加数据源
const addSource = () => {
    dialogVisible.value = true
}

// 处理新增数据源
const handleAdd = async () => {
    try {
        ElMessage.success('数据源添加成功')
        // 添加成功后重新加载数据
        currentPage.value = 1
        await fetchDataSources()
    } catch (error) {
        ElMessage.error('添加数据源失败: ' + (error.message || '未知错误'))
    }
}

// 查看内容
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

// 同步数据
const syncData = async (row) => {
    try {
        row.syncing = true
        // TODO: 调用同步API
        ElMessage.success('同步请求已发送')
        // 同步后刷新数据
        await fetchDataSources()
    } catch (error) {
        ElMessage.error('同步失败: ' + error.message)
    } finally {
        row.syncing = false
    }
}

// 编辑数据
const editData = (row) => {
    console.log('编辑:', row)
    // TODO: 实现编辑功能
}

// 删除数据
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
            // 删除后重新加载数据
            await fetchDataSources()
        } catch (error) {
            ElMessage.error('删除失败: ' + error.message)
        } finally {
            row.deleting = false
        }
    }).catch(() => { })
}

// 格式化状态文本
const formatStatus = (status) => {
    const statusMap = {
        DONE: '完成',
        TODO: '待处理',
        PROCESSING: '处理中',
        FAILED: '失败'
    }
    return statusMap[status] || status
}

// 格式化日期
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString()
}

// 获取类型标签样式
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

// 获取状态标签样式
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
    padding: 0;
}

.header {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
    margin-bottom: 20px;
}

.header .search-input {
    width: 300px;
    margin-right: 20px;
}

.header .action-bar {
    margin-left: auto;
    display: flex;
    gap: 10px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.empty-state {
    margin: 40px 0;
    display: flex;
    justify-content: center;
}

/* 药丸状输入框样式 */
:deep(.pill-input .el-input__wrapper) {
    border-radius: 9999px !important;
    padding-left: 20px;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

:deep(.pill-input .el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.pill-input .el-input__prefix) {
    margin-right: 8px;
}
</style>