<template>
    <div class="data-source-tab">
        <div class="action-bar">
            <el-button type="primary" @click="addSource">+ 添加数据源</el-button>
            <el-button @click="refreshData" :loading="loading">刷新</el-button>
        </div>

        <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="type" label="类型">
                <template #default="{ row }">
                    <el-tag :type="getTypeTag(row.type)">
                        {{ formatType(row.type) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="creator" label="上传人" />
            <el-table-column prop="created_at" label="创建时间">
                <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
                <template #default="{ row }">
                    <el-tag :type="getStatusTag(row.status)">
                        {{ row.status }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="关键词">
                <template #default="{ row }">
                    <el-tag v-for="(kw, index) in row.keywords || []" :key="index" size="small"
                        style="margin-right: 4px">
                        {{ kw }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="240">
                <template #default="{ row }">
                    <el-button size="small" text icon="Search" @click="viewContent(row)">查看内容</el-button>
                    <el-button size="small" text @click="syncData(row)">同步更新</el-button>
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
import { useRoute } from 'vue-router'
import CreateData from '@/components/dialogs/CreateData.vue'
import {
    getKnowledgeDetail,
    createDataSource,
    deleteKnowledgeBase
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
        console.log('API返回数据:', res)

        // 修正点：直接使用 res.data_sources
        tableData.value = res.data_sources || []

        console.log('数据源列表:', tableData.value)
    } catch (error) {
        console.error('API错误详情:', error)
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
const handleAdd = async (newData) => {
    try {
        loading.value = true
        await createDataSource(knowledgeBaseId, newData)
        ElMessage.success('数据源添加成功')
        await fetchDataSources()
    } catch (error) {
        ElMessage.error('添加数据源失败: ' + (error.message || '未知错误'))
    } finally {
        loading.value = false
    }
}

// 查看内容
const viewContent = (row) => {
    console.log('查看内容:', row)
    // 这里可以跳转到内容详情页或打开预览对话框
}

// 同步数据
const syncData = async (row) => {
    try {
        row.syncing = true
        // 调用同步API
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
    // 打开编辑对话框
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
            await deleteKnowledgeBase(row.id)
            ElMessage.success('删除成功')
            await fetchDataSources()
        } catch (error) {
            ElMessage.error('删除失败: ' + error.message)
        } finally {
            row.deleting = false
        }
    }).catch(() => { })
}

// 格式化类型显示
const formatType = (type) => {
    const typeMap = {
        document: '文档',
        url: 'URL',
        database: '数据库',
        api: 'API',
        audio: '语音'
    }
    return typeMap[type] || type
}

// 格式化日期
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString()
}


// 获取类型标签样式
const getTypeTag = (type) => {
    const typeTagMap = {
        document: 'primary',  // 将空字符串改为 'primary'
        url: 'success',
        database: 'info',
        api: 'warning',
        audio: 'danger'
    }
    return typeTagMap[type] || 'info' // 默认返回 'info' 而不是空字符串
}

// 获取状态标签样式
const getStatusTag = (status) => {
    const statusTagMap = {
        '构建中': 'warning',
        '成功': 'success',
        '失败': 'danger',
        '待同步': 'info'
    }
    return statusTagMap[status] || ''
}

// 初始化加载数据
onMounted(() => {
    fetchDataSources()
})
</script>

<style scoped>
.action-bar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 16px;
}
</style>