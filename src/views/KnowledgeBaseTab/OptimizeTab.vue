<template>
    <div class="optimize-tab">
        <!-- 顶部筛选区域 -->
        <div class="filter-bar">
            <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 140px; margin-right: 10px;" @change="loadTickets">
                <el-option label="全部" value="" />
                <el-option label="未处理" value="pending" />
                <el-option label="已应用" value="applied" />
                <el-option label="已忽略" value="ignored" />
            </el-select>

            <el-button type="primary" @click="loadTickets">刷新</el-button>
        </div>

        <!-- 按文档分组的工单列表 -->
        <div v-loading="loading" class="tickets-groups">
            <div v-if="ticketGroups.length === 0" class="empty-state">
                <el-empty description="暂无待处理的工单" />
            </div>

            <div v-for="group in ticketGroups" :key="group.document_id" class="group-card">
                <!-- 文档头部 -->
                <div class="group-header">
                    <div class="file-info">
                        <h3>{{ group.file_name }}</h3>
                        <span class="ticket-count">{{ group.ticket_count }} 个工单</span>
                    </div>
                    <div class="group-actions">
                        <el-button type="primary" size="small" @click="openMergeReview(group.document_id)">
                            一起审核
                        </el-button>
                        <el-button 
                            size="small" 
                            @click="toggleGroupExpand(group.document_id)"
                            :type="expandedGroups[group.document_id] ? 'default' : 'info'"
                        >
                            {{ expandedGroups[group.document_id] ? '收起' : '展开' }}
                        </el-button>
                    </div>
                </div>

                <!-- 工单列表（可展开/收起） -->
                <div v-if="expandedGroups[group.document_id]" class="tickets-list">
                    <div v-for="ticket in group.tickets" :key="ticket.id" class="ticket-item">
                        <div class="ticket-left">
                            <el-tag :type="getTagType(ticket.feedback_type)" size="small">
                                {{ ticket.feedback_type }}
                            </el-tag>
                            <span class="ticket-id">#{{ ticket.id }}</span>
                        </div>

                        <div class="ticket-middle">
                            <span class="created-time">{{ formatTime(ticket.created_at) }}</span>
                        </div>

                        <div class="ticket-right">
                            <el-tag :type="getStatusTagType(ticket.status)" size="small">
                                {{ statusLabel[ticket.status] }}
                            </el-tag>
                        </div>
                    </div>
                </div>

                <!-- 收起时的摘要 -->
                <div v-else class="group-summary">
                    <div class="summary-types">
                        <el-tag 
                            v-for="type in group.feedback_types" 
                            :key="type"
                            :type="getTagType(type)"
                            size="small"
                        >
                            {{ type }}
                        </el-tag>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { get } from '@/utils/http'

const router = useRouter()
const route = useRoute()
const kb_id = route.params.id

const loading = ref(false)
const ticketGroups = ref([])
const statusFilter = ref('pending')
const expandedGroups = ref({})

const statusLabel = {
    'pending': '未处理',
    'in_progress': '审核中',
    'applied': '已应用',
    'ignored': '已忽略'
}

// 获取反馈类型的标签类型
const getTagType = (feedbackType) => {
    const typeMap = {
        'accuracy': 'danger',
        'relevance': 'warning',
        'completeness': 'info',
        'clarity': 'success'
    }
    return typeMap[feedbackType] || 'info'
}

// 获取状态的标签类型
const getStatusTagType = (status) => {
    const typeMap = {
        'pending': 'warning',
        'in_progress': 'info',
        'applied': 'success',
        'ignored': 'info'
    }
    return typeMap[status] || 'info'
}

// 加载工单列表
const loadTickets = async () => {
    loading.value = true
    try {
        const params = statusFilter.value ? { status: statusFilter.value } : {}
        const data = await get(
            `knowledgebase/${kb_id}/tickets/group-by-document`,
            params
        )
        
        ticketGroups.value = data
        // 默认展开第一个分组
        if (ticketGroups.value.length > 0) {
            expandedGroups.value[ticketGroups.value[0].document_id] = true
        }
    } catch (error) {
        console.error(error)
        ElMessage.error('加载工单失败')
    } finally {
        loading.value = false
    }
}

// 切换分组展开/收起
const toggleGroupExpand = (documentId) => {
    expandedGroups.value[documentId] = !expandedGroups.value[documentId]
}

// 打开合并审核界面
const openMergeReview = (documentId) => {
    router.push({
        name: 'MergeReview',
        params: {
            kbId: kb_id,
            documentId: documentId
        }
    })
}

// 格式化时间
const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
    loadTickets()
})
</script>

<style scoped>
.optimize-tab {
    padding: 0;
}

.filter-bar {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.tickets-groups {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.empty-state {
    padding: 40px 20px;
    text-align: center;
}

.group-card {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #e0e0e0;
}

.file-info h3 {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: #333;
    font-weight: 600;
}

.ticket-count {
    font-size: 12px;
    color: #999;
    background: #e3f2fd;
    padding: 2px 6px;
    border-radius: 3px;
    color: #1976d2;
}

.group-actions {
    display: flex;
    gap: 8px;
}

.tickets-list {
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.ticket-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 3px;
    transition: all 0.2s;
}

.ticket-item:hover {
    background: #f0f0f0;
    border-color: #ddd;
}

.ticket-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 100px;
}

.ticket-id {
    font-size: 12px;
    color: #999;
}

.ticket-middle {
    flex: 1;
    margin: 0 16px;
}

.created-time {
    font-size: 12px;
    color: #999;
}

.ticket-right {
    min-width: 80px;
    text-align: right;
}

.group-summary {
    padding: 8px 12px;
    background: #fafafa;
}

.summary-types {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}
</style>
