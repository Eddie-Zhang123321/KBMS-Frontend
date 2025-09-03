<template>
    <div class="data-source-tab">
        <div class="action-bar">
            <el-button type="primary" @click="addSource">+ 添加数据源</el-button>
            <el-button @click="refreshData" :loading="loading">刷新</el-button>
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
                    <el-button size="small" text @click="viewContent(row)">
                        <el-icon>
                            <Search />
                        </el-icon> 查看内容
                    </el-button>
                    <el-button size="small" text :loading="row.syncing" @click="syncData(row)">
                        同步更新
                    </el-button>
                    <el-button size="small" text @click="editData(row)">编辑</el-button>
                    <el-button size="small" text type="danger" @click="deleteData(row)" :loading="row.deleting">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <CreateData v-model:visible="dialogVisible" @add="handleAdd" :knowledge-base-id="knowledgeBaseId" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
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

// 获取数据源列表
const fetchDataSources = async () => {
    try {
        loading.value = true
        const res = await getKnowledgeDetail(knowledgeBaseId)
        tableData.value = (res || []).map(item => ({
            ...item,
            deleting: false,
            syncing: false
        }))
    } catch (error) {
        ElMessage.error('获取数据源列表失败: ' + (error.message || '未知错误'))
    } finally {
        loading.value = false
    }
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
        loading.value = true
        ElMessage.success('数据源添加成功')
        await fetchDataSources()
    } catch (error) {
        ElMessage.error('添加数据源失败: ' + (error.message || '未知错误'))
    } finally {
        loading.value = false
    }
}

// 查看内容
const viewContent = async (row) => {
    try {
        console.log('查看内容:', row)
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
    } catch (error) {
        ElMessage.error('同步失败: ' + error.message)
    } finally {
        row.syncing = false
    }
}

// 编辑数据
const editData = (row) => {
    console.log('编辑:', row)
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
        txt: 'warning'
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
