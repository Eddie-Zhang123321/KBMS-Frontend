<template>
    <div class="log-tab">
        <div class="section">
            <div class="section-title">知识库修改记录</div>
            <el-table :data="logRecords" stripe style="width: 100%" v-loading="loading">
                <el-table-column prop="timestamp" label="时间" width="180" />
                <el-table-column prop="operator" label="操作人" width="120" />
                <el-table-column prop="action" label="操作类型" width="120" />
                <el-table-column prop="description" label="描述" />
            </el-table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getKnowledgeBaseLogs } from '@/api/Knowledgebase'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const logRecords = ref([])
const loading = ref(false)

const fetchLogs = async () => {
    try {
        loading.value = true
        const response = await getKnowledgeBaseLogs(route.params.id)

        // 根据实际API返回结构调整处理逻辑
        let logsData = []

        if (Array.isArray(response)) {
            // 情况1：API直接返回数组
            logsData = response
        } else if (Array.isArray(response?.data)) {
            // 情况2：API返回 { data: [...] }
            logsData = response.data
        } else if (Array.isArray(response?.data?.data)) {
            // 情况3：API返回 { data: { data: [...] } }
            logsData = response.data.data
        } else {
            console.warn('未知的API响应结构:', response)
            ElMessage.warning('获取日志数据格式异常')
        }

        logRecords.value = logsData.map(log => ({
            timestamp: log.create_time,
            operator: log.operator_name || log.operator_id || '未知',
            action: log.action_type,
            description: log.action_detail
        }))

    } catch (error) {
        console.error('获取日志失败:', error)
        ElMessage.error('获取日志失败: ' + error.message)
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

.section {
    margin-bottom: 24px;
}

.section-title {
    font-weight: bold;
    margin-bottom: 12px;
}
</style>