<template>
    <div class="merge-review-page">
        <!-- 顶部区域 -->
        <div class="header">
            <div class="header-left">
                <el-button type="default" @click="goBack" :icon="ArrowLeft">返回</el-button>
                <h1>{{ document.file_name }} - 工单合并审核</h1>
            </div>
        </div>

        <div v-loading="loading" class="content-wrapper">
            <!-- 左侧面板：工单信息 -->
            <div class="left-panel panel-card">
                <div class="panel-header">
                    <div class="panel-title">
                        <div class="title-icon">
                            <el-icon size="18"><Tickets /></el-icon>
                        </div>
                        <div class="title-text">
                            <h3>工单信息</h3>
                            <p>快速浏览本次待处理的反馈详情</p>
                        </div>
                    </div>
                    <div class="panel-metrics">
                        <span class="metric-chip metric-chip__processed">
                            已处理 {{ Object.keys(ticketDecisions).length }}/{{ allTickets.length }}
                        </span>
                        <span 
                            v-if="unprocessedTickets.length > 0" 
                            class="metric-chip metric-chip__pending"
                        >
                            未处理 {{ unprocessedTickets.length }}
                        </span>
                    </div>
                </div>

                <div class="ticket-info-section">
                    <!-- 当前选中工单的详情 -->
                    <div v-if="selectedTicket" class="ticket-detail">
                        <div class="ticket-header">
                            <span class="ticket-id">工单 #{{ selectedTicket.id }}</span>
                            <el-tag :type="getTagType(selectedTicket.feedback_type)" size="small">
                                {{ selectedTicket.feedback_type }}
                            </el-tag>
                        </div>

                        <div class="info-block">
                            <h4>原始问题</h4>
                            <p class="info-text">{{ selectedTicket.question }}</p>
                        </div>

                        <div class="info-block">
                            <h4>用户反馈</h4>
                            <p class="info-text">{{ selectedTicket.user_feedback }}</p>
                        </div>

                        <div class="info-block">
                            <h4>AI 分析</h4>
                            <p class="info-text">{{ selectedTicket.ai_analysis }}</p>
                        </div>

                        <div class="info-block">
                            <h4>系统建议</h4>
                            <p class="info-text">{{ selectedTicket.system_suggestion }}</p>
                        </div>
                    </div>

                    <!-- 工单列表 -->
                    <div class="tickets-list-section">
                        <h4 class="section-heading">工单列表（共 {{ tickets.length }} 个）</h4>

                        <div class="tickets-list">
                            <div 
                                v-for="ticket in tickets"
                                :key="ticket.id"
                                class="ticket-item"
                                :class="{ 
                                    active: selectedTicket?.id === ticket.id,
                                    processed: ticketDecisions[ticket.id] !== undefined,
                                    accepted: ticketDecisions[ticket.id] === 'accepted',
                                    rejected: ticketDecisions[ticket.id] === 'rejected'
                                }"
                                @click="selectTicket(ticket)"
                            >
                                <div class="ticket-checkbox">
                                    <el-icon v-if="ticketDecisions[ticket.id] === 'accepted'" size="16"><CircleCheck /></el-icon>
                                    <el-icon v-else-if="ticketDecisions[ticket.id] === 'rejected'" size="16"><CircleClose /></el-icon>
                                    <span v-else class="icon-placeholder"></span>
                                </div>
                                <div class="ticket-info">
                                    <span class="id">工单 #{{ ticket.id }}</span>
                                    <div class="ticket-tags">
                                        <el-tag :type="getTagType(ticket.feedback_type)" size="small">
                                            {{ ticket.feedback_type }}
                                        </el-tag>
                                        <el-tag v-if="ticket.status" :type="getStatusTagType(ticket.status)" size="small">
                                            {{ getStatusLabel(ticket.status) }}
                                        </el-tag>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 操作按钮 -->
                <div class="actions-left">
                    <el-button 
                        @click="acceptTicket" 
                        type="success"
                        :icon="Check"
                        :disabled="!selectedTicket"
                        round
                    >
                        接受建议
                    </el-button>
                    <el-button 
                        @click="rejectTicket" 
                        type="danger"
                        :icon="Close"
                        :disabled="!selectedTicket"
                        round
                    >
                        拒绝建议
                    </el-button>
                </div>
            </div>

            <!-- 右侧面板：文档编辑 -->
            <div class="right-panel panel-card">
                <div class="editor-tabs">
                    <button 
                        v-for="tab in ['original', 'suggested', 'final']"
                        :key="tab"
                        class="tab"
                        :class="{ active: activeTab === tab }"
                        @click="activeTab = tab"
                    >
                        {{ tabLabels[tab] }}
                    </button>
                </div>

                <!-- 原文档 -->
                <div v-if="activeTab === 'original'" class="editor-content">
                    <div class="content read-only">
                        {{ document.original_content }}
                    </div>
                </div>

                <!-- 建议修改（高亮显示） -->
                <div v-if="activeTab === 'suggested'" class="editor-content">
                    <div class="content read-only git-diff">
                        <div v-for="(line, idx) in suggestedLines" :key="idx" class="diff-line" :class="line.type">
                            <span class="line-number old">{{ line.oldLine !== null && line.oldLine !== undefined ? line.oldLine : '' }}</span>
                            <span class="line-number new">{{ line.newLine !== null && line.newLine !== undefined ? line.newLine : '' }}</span>
                            <span class="line-marker">{{ line.marker }}</span>
                            <span class="line-content">{{ line.content }}</span>
                        </div>
                    </div>
                </div>

                <!-- 最终编辑 -->
                <div v-if="activeTab === 'final'" class="editor-content">
                    <textarea 
                        v-model="finalContent"
                        class="content editable"
                        placeholder="在这里编辑最终内容"
                    ></textarea>
                </div>

                <!-- 修改摘要 -->
                <div class="summary" :class="{ collapsed: !summaryExpanded }">
                    <div class="summary-header" @click="summaryExpanded = !summaryExpanded">
                        <div class="summary-title">
                            <el-icon class="toggle-icon" :class="{ expanded: summaryExpanded }">
                                <ArrowLeft />
                            </el-icon>
                            <h4>修改摘要</h4>
                        </div>
                        <span class="summary-subtitle">系统自动识别改动，便于快速回顾</span>
                    </div>
                    <div v-show="summaryExpanded" class="summary-content">
                        <div v-if="changes.length === 0" class="no-changes">
                            无修改
                        </div>
                        <ul v-else class="changes-list">
                            <li v-for="(change, idx) in changes" :key="idx">
                                {{ change }}
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- 操作按针：应用、忽略、保存草稿 -->
                <div class="actions-right">
                    <el-button 
                        @click="applyAll" 
                        type="primary"
                        :icon="Finished"
                        :disabled="!allTicketsProcessed"
                        round
                    >
                        应用
                    </el-button>
                    <el-button 
                        @click="ignoreAll" 
                        type="info"
                        :icon="CircleClose"
                        round
                    >
                        忽略所有
                    </el-button>
                    <el-button @click="saveDraft" type="default" :icon="Document" round>
                        保存草稿
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Check, Close, CircleCheck, CircleClose, Finished, Document, Tickets } from '@element-plus/icons-vue'
import { get, post } from '@/utils/http'

const router = useRouter()
const route = useRoute()
const kbId = route.params.kbId
const documentId = route.params.documentId

const loading = ref(false)
const document = ref({
    file_name: '',
    original_content: '',
    suggested_content: '',
    diff_lines: []
})
const tickets = ref([])  // \u5f85\u5904\u7406\u7684\u5de5\u5355
const allTickets = ref([])  // \u6240\u6709\u5de5\u5355\uff08\u5305\u62ec\u5df2\u5904\u7406\u7684\uff09
const selectedTicket = ref(null)
const finalContent = ref('')
const activeTab = ref('suggested')
const changes = ref([])
const ticketDecisions = ref({})
const summaryExpanded = ref(false)

const tabLabels = {
    original: '原文档',
    suggested: '建议修改',
    final: '最终编辑'
}

// 检查是否所有工单都已处理
const allTicketsProcessed = computed(() => {
    // 检查所有工单（包括已处理的）是否都有决策
    return allTickets.value.every(ticket => 
        ticketDecisions.value[ticket.id] !== undefined
    )
})

// 使用后端提供的 diff 行，便于展示行号和符号
const suggestedLines = computed(() => {
    const diffLines = document.value.diff_lines || []
    return diffLines.map(line => ({
        type: line.type,
        marker: line.marker,
        oldLine: line.old_line ?? null,
        newLine: line.new_line ?? null,
        content: line.content
    }))
})

// 检查是否有未处理的工单
const unprocessedTickets = computed(() => {
    return tickets.value.filter(ticket => 
        ticketDecisions.value[ticket.id] === undefined
    )
})

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

// 获取工单状态的标签类型
const getStatusTagType = (status) => {
    const statusMap = {
        'pending': 'warning',
        'in_progress': 'info',
        'applied': 'success',
        'ignored': 'info'
    }
    return statusMap[status] || 'info'
}

// 获取工单状态的中文标签
const getStatusLabel = (status) => {
    const statusMap = {
        'pending': '待处理',
        'in_progress': '处理中',
        'applied': '已应用',
        'ignored': '已忽略'
    }
    return statusMap[status] || status
}

// 加载合并审核数据
const loadMergeReview = async () => {
    loading.value = true
    try {
        const data = await get(
            `knowledgebase/${kbId}/tickets/${documentId}/merge-review`
        )
        
        document.value = {
            file_name: data.file_name,
            original_content: data.original_content,
            suggested_content: data.suggested_content,
            diff_lines: data.diff_lines || []
        }
        tickets.value = data.tickets
        // 初始化 allTickets，合并所有工单
        if (!allTickets.value.length) {
            allTickets.value = data.tickets
        } else {
            // 合并新的工单到 allTickets
            for (const ticket of data.tickets) {
                if (!allTickets.value.find(t => t.id === ticket.id)) {
                    allTickets.value.push(ticket)
                }
            }
        }
        
        // 初始化 ticketDecisions：根据工单状态初始化决策记录
        ticketDecisions.value = {}
        for (const ticket of allTickets.value) {
            if (ticket.status === 'applied') {
                ticketDecisions.value[ticket.id] = 'accepted'
            } else if (ticket.status === 'ignored') {
                ticketDecisions.value[ticket.id] = 'rejected'
            }
        }
        
        finalContent.value = data.suggested_content
        
        // 默认选中第一个工单
        if (tickets.value.length > 0) {
            selectTicket(tickets.value[0])
        }
        
        calculateChanges()
    } catch (error) {
        console.error(error)
        ElMessage.error('加载审核数据失败')
    } finally {
        loading.value = false
    }
}

// 选择工单
const selectTicket = (ticket) => {
    selectedTicket.value = ticket
}

// 接受工单建议
const acceptTicket = async () => {
    if (!selectedTicket.value) return
    
    try {
        loading.value = true
        const data = await post(
            `knowledgebase/${kbId}/tickets/${documentId}/save-decision`,
            {
                ticket_id: selectedTicket.value.id,
                decision: 'accepted'
            }
        )
        
        // 更新文档数据和工单列表
        document.value = {
            file_name: data.file_name,
            original_content: data.original_content,
            suggested_content: data.suggested_content,
            diff_lines: data.diff_lines || []
        }
        // 在更新工单列表前，保存当前的finalContent
        if (!finalContent.value) {
            finalContent.value = document.value.suggested_content
        }
        
        tickets.value = data.tickets
        
        // 标记当前工单为已接受
        ticketDecisions.value[selectedTicket.value.id] = 'accepted'
        
        // 合并新的工单到 allTickets
        for (const ticket of data.tickets) {
            if (!allTickets.value.find(t => t.id === ticket.id)) {
                allTickets.value.push(ticket)
            }
        }
        
        // 更新 document.suggested_content 以便后续工单的建议可以基于此进行
        document.value.suggested_content = data.suggested_content
        document.value.diff_lines = data.diff_lines || []
        
        calculateChanges()
        
        ElMessage.success('已接受此工单建议')
        
        // 如果所有工单都已处理，提示管理员可以应用
        if (data.all_processed) {
            ElMessage.success('所有工单已处理，可以点击“应用”保存修改')
        } else {
            // 自动切换到下一个未处理的工单
            switchToNextUnprocessed()
        }
    } catch (error) {
        console.error('接受工单错误:', error)
        const errorMsg = error?.detail || error?.message || '接受工单失败'
        ElMessage.error(errorMsg)
    } finally {
        loading.value = false
    }
}

// 拒绝工单建议
const rejectTicket = async () => {
    if (!selectedTicket.value) return
    
    try {
        loading.value = true
        const data = await post(
            `knowledgebase/${kbId}/tickets/${documentId}/save-decision`,
            {
                ticket_id: selectedTicket.value.id,
                decision: 'rejected'
            }
        )
        
        // 在更新工单列表前，保存当前的finalContent
        if (!finalContent.value) {
            finalContent.value = document.value.suggested_content
        }
        
        // 更新文档数据和工单列表
        document.value = {
            file_name: data.file_name,
            original_content: data.original_content,
            suggested_content: data.suggested_content,
            diff_lines: data.diff_lines || []
        }
        tickets.value = data.tickets
        
        // 标记当前工单为已拒绝
        ticketDecisions.value[selectedTicket.value.id] = 'rejected'
        
        // 合并新的工单到 allTickets
        for (const ticket of data.tickets) {
            if (!allTickets.value.find(t => t.id === ticket.id)) {
                allTickets.value.push(ticket)
            }
        }
        
        calculateChanges()
        
        ElMessage.info('已拒绝此工单建议')
        
        // 如果所有工单都已处理，提示管理员可以应用
        if (data.all_processed) {
            ElMessage.success('所有工单已处理，可以点击“应用”保存修改')
        } else {
            // 自动切换到下一个未处理的工单
            switchToNextUnprocessed()
        }
    } catch (error) {
        console.error('拒绝工单错误:', error)
        const errorMsg = error?.detail || error?.message || '拒绝工单失败'
        ElMessage.error(errorMsg)
    } finally {
        loading.value = false
    }
}

// 切换到下一个未处理的工单
const switchToNextUnprocessed = () => {
    const next = unprocessedTickets.value[0]
    if (next) {
        selectTicket(next)
    }
}

// 计算修改摘要
const calculateChanges = () => {
    const original = document.value.original_content
    const final = finalContent.value
    
    if (original === final) {
        changes.value = []
        return
    }
    
    // 简单的差异计算
    const originalLines = original.split('\n')
    const finalLines = final.split('\n')
    
    changes.value = []
    
    // 检测新增行
    finalLines.forEach((line, idx) => {
        if (!originalLines.includes(line) && line.trim()) {
            changes.value.push(`新增：${line.substring(0, 50)}...`)
        }
    })
    
    // 检测删除行
    originalLines.forEach((line, idx) => {
        if (!finalLines.includes(line) && line.trim()) {
            changes.value.push(`删除：${line.substring(0, 50)}...`)
        }
    })
    
    // 去重
    changes.value = [...new Set(changes.value)]
}

// 应用所有工单
const applyAll = async () => {
    // 棄查是否所有工单都已处理
    if (!allTicketsProcessed.value) {
        const unprocessed = unprocessedTickets.value
        ElMessage.warning(
            `还有 ${unprocessed.length} 个工单未处理：${unprocessed.map(t => `#${t.id}`).join(', ')}`
        )
        return
    }

    try {
        await ElMessageBox.confirm(
            '确定要应用所有工单吗？',
            '提示',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        loading.value = true
        const ticketIds = tickets.value.map(t => t.id)
        
        await post(
            `knowledgebase/${kbId}/tickets/${documentId}/apply`,
            {
                final_content: finalContent.value,
                ticket_ids: ticketIds,
                action: 'apply'
            }
        )
        
        ElMessage.success('工单已应用')
        // 清除草稿
        localStorage.removeItem(`draft_${documentId}`)
        // 返回上一页
        router.back()
    } catch (error) {
        if (error.message !== 'cancel') {
            console.error(error)
            ElMessage.error('应用失败')
        }
    } finally {
        loading.value = false
    }
}

// 忽略所有工单
const ignoreAll = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要忽略所有工单吗？',
            '提示',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        loading.value = true
        const ticketIds = tickets.value.map(t => t.id)
        
        await post(
            `knowledgebase/${kbId}/tickets/${documentId}/apply`,
            {
                final_content: '',
                ticket_ids: ticketIds,
                action: 'ignore'
            }
        )
        
        ElMessage.success('工单已忽略')
        // 清除草稿
        localStorage.removeItem(`draft_${documentId}`)
        // 返回上一页
        router.back()
    } catch (error) {
        if (error.message !== 'cancel') {
            console.error(error)
            ElMessage.error('忽略失败')
        }
    } finally {
        loading.value = false
    }
}

// 保存草稿
const saveDraft = () => {
    localStorage.setItem(
        `draft_${documentId}`,
        finalContent.value
    )
    ElMessage.success('草稿已保存')
}

// 返回上一页
const goBack = () => {
    router.back()
}

// 初始化
onMounted(() => {
    // 恢复草稿
    const draft = localStorage.getItem(`draft_${documentId}`)
    if (draft) {
        finalContent.value = draft
    }
    
    loadMergeReview()
})

// 监听 finalContent 变化
watch(finalContent, () => {
    calculateChanges()
})
</script>

<style scoped>
.merge-review-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    /* 使用更中性的浅灰背景，避免与主系统风格冲突 */
    background: #f5f7fa;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    /* 顶部改为纯白背景 + 细分割线，与系统通用布局一致 */
    background: #ffffff;
    border-bottom: 1px solid #e4e7ed;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 18px;
}

.header-left h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    letter-spacing: 0;
    text-shadow: none;
}

.content-wrapper {
    display: flex;
    flex: 1;
    gap: 16px;
    padding: 18px;
    overflow: hidden;
}

.panel-card {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
    border: 1px solid rgba(226, 232, 240, 0.9);
    backdrop-filter: blur(6px);
}

/* 左侧面板 */
.left-panel {
    width: 360px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 22px 24px 18px;
    border-bottom: 1px solid #eef2ff;
    background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.08) 0%, transparent 60%);
}

.panel-title {
    display: flex;
    gap: 14px;
    align-items: center;
}

.title-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(140deg, rgba(56, 189, 248, 0.25), rgba(59, 130, 246, 0.2));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1d4ed8;
}

.title-text h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
}

.title-text p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #64748b;
}

.panel-metrics {
    display: flex;
    gap: 8px;
}

.metric-chip {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    letter-spacing: 0.5px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
}

.metric-chip__processed {
    background: rgba(34, 197, 94, 0.12);
    color: #15803d;
}

.metric-chip__pending {
    background: rgba(249, 115, 22, 0.12);
    color: #c2410c;
}

.ticket-info-section {
    flex: 1;
    overflow-y: auto;
    padding: 22px 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.ticket-detail {
    padding: 18px;
    border-radius: 14px;
    border: 1px solid #e0e7ff;
    background: linear-gradient(160deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.03));
    box-shadow: 0 16px 40px rgba(59, 130, 246, 0.08);
}

.ticket-header {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
    align-items: center;
}

.ticket-id {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
}

.info-block {
    margin-bottom: 16px;
}

.info-block h4 {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: 0.4px;
}

.info-text {
    margin: 0;
    font-size: 13px;
    color: #0f172a;
    line-height: 1.7;
    background: rgba(241, 245, 249, 0.85);
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.35);
}

.section-heading {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.6px;
    color: #0f172a;
    text-transform: uppercase;
}

.tickets-list-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.tickets-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.ticket-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: #f8fafc;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
}

.ticket-item::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0));
    opacity: 0;
    transition: opacity 0.25s ease;
}

.ticket-item:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 18px 35px rgba(59, 130, 246, 0.12);
}

.ticket-item:hover::after {
    opacity: 1;
}

.ticket-item.active {
    background: linear-gradient(140deg, rgba(37, 99, 235, 0.18), rgba(37, 99, 235, 0.05));
    border-color: #2563eb;
    box-shadow: 0 22px 48px rgba(37, 99, 235, 0.22);
}

.ticket-item.processed {
    background: rgba(22, 101, 52, 0.12);
    border-color: rgba(22, 101, 52, 0.4);
}

.ticket-item.accepted {
    background: rgba(34, 197, 94, 0.14);
    border-color: rgba(34, 197, 94, 0.65);
}

.ticket-item.rejected {
    background: rgba(239, 68, 68, 0.14);
    border-color: rgba(239, 68, 68, 0.65);
}

.ticket-checkbox {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(148, 163, 184, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    color: #1d4ed8;
}

.icon-placeholder {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid #cbd5f5;
}

.ticket-info {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ticket-info .id {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
}

.ticket-tags {
    display: flex;
    gap: 6px;
    align-items: center;
}

.actions-left {
    display: flex;
    gap: 14px;
    padding: 20px 24px 22px;
    border-top: 1px solid rgba(37, 99, 235, 0.15);
    background: linear-gradient(135deg, rgba(234, 244, 255, 0.9), rgba(219, 234, 254, 0.85));
}

.actions-left .el-button {
    flex: 1;
    height: 46px;
    font-weight: 700;
    font-size: 14px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.actions-left .el-button:hover,
.actions-right .el-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
}

.actions-left .el-button:active,
.actions-right .el-button:active {
    transform: translateY(0);
    box-shadow: none;
}

/* 右侧面板 */
.right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.editor-tabs {
    display: flex;
    border-bottom: 1px solid rgba(148, 163, 184, 0.25);
    background: linear-gradient(135deg, rgba(30, 64, 175, 0.08), rgba(59, 130, 246, 0.08));
    padding: 0 6px;
}

.tab {
    flex: 1;
    padding: 16px 18px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.25s ease;
    color: #475569;
    position: relative;
    letter-spacing: 0.4px;
}

.tab:hover {
    color: #1d4ed8;
    background: rgba(59, 130, 246, 0.08);
}

.tab.active {
    color: #1d4ed8;
}

.tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 20%;
    right: 20%;
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(90deg, #1e40af 0%, #2563eb 45%, #3b82f6 100%);
}

.editor-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #ffffff;
}

.content {
    flex: 1;
    padding: 20px 22px;
    overflow-y: auto;
    font-family: 'Fira Code', 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    line-height: 1.75;
    color: #0f172a;
}

.read-only {
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.9));
    border: none;
    white-space: pre-wrap;
    word-break: break-word;
}

.diff-line {
    display: flex;
    align-items: flex-start;
    padding: 0 18px;
    min-height: 26px;
    font-family: 'Fira Code', 'Monaco', 'Menlo', monospace;
    border-left: 4px solid transparent;
}

.diff-line.unchanged {
    background: transparent;
    color: #334155;
    border-left-color: transparent;
}

.diff-line.added {
    background: rgba(34, 197, 94, 0.12);
    color: #166534;
    border-left-color: #16a34a;
}

.diff-line.removed {
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
    border-left-color: #ef4444;
}

.diff-line.modified {
    background: rgba(37, 99, 235, 0.12);
    color: #1d4ed8;
    border-left-color: #2563eb;
}

.line-number {
    display: inline-block;
    width: 44px;
    text-align: right;
    margin-right: 16px;
    color: #94a3b8;
    user-select: none;
    flex-shrink: 0;
    font-size: 11px;
}

.line-marker {
    display: inline-block;
    width: 22px;
    text-align: center;
    margin-right: 10px;
    font-weight: 700;
    user-select: none;
    flex-shrink: 0;
}

.diff-line.added .line-marker {
    color: #16a34a;
}

.diff-line.removed .line-marker {
    color: #ef4444;
}

.diff-line.modified .line-marker {
    color: #2563eb;
}

.line-content {
    flex: 1;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Fira Code', 'Monaco', 'Menlo', monospace;
}

.editable {
    background: white;
    border: 1px solid rgba(148, 163, 184, 0.45);
    border-radius: 14px;
    resize: none;
    font-family: 'Fira Code', 'Monaco', 'Menlo', monospace;
    color: #0f172a;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.editable:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

.summary {
    padding: 0;
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(224, 231, 255, 0.75));
    border-top: 1px solid rgba(148, 163, 184, 0.25);
    transition: max-height 0.3s ease;
}

.summary.collapsed {
    max-height: 60px;
    overflow: hidden;
}

.summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 22px;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s ease;
}

.summary-header:hover {
    background: rgba(15, 23, 42, 0.04);
}

.summary-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.summary-title h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.6px;
    text-transform: uppercase;
}

.toggle-icon {
    transition: transform 0.3s ease;
    color: #2563eb;
    font-size: 18px;
}

.toggle-icon.expanded {
    transform: rotate(-90deg);
}

.summary-subtitle {
    font-size: 12px;
    color: #64748b;
}

.summary-content {
    padding: 0 22px 18px;
    max-height: 300px;
    overflow-y: auto;
}

.no-changes {
    font-size: 13px;
    color: #94a3b8;
}

.changes-list {
    margin: 0;
    padding-left: 20px;
    font-size: 12px;
    line-height: 1.85;
    color: #1e293b;
}

.changes-list li {
    margin-bottom: 6px;
}

.actions-right {
    display: flex;
    gap: 12px;
    padding: 20px 22px 22px;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    background: linear-gradient(135deg, rgba(236, 252, 255, 0.9), rgba(224, 242, 254, 0.74));
}

.actions-right .el-button {
    flex: 1;
    height: 46px;
    font-weight: 700;
    font-size: 14px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

@media (max-width: 1366px) {
    .content-wrapper {
        flex-direction: column;
        overflow-y: auto;
    }

    .left-panel {
        width: 100%;
        max-height: 420px;
    }

    .right-panel {
        flex: none;
        min-height: calc(100vh - 480px);
    }
}

@media (max-width: 1024px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }

    .header-left {
        width: 100%;
        justify-content: space-between;
    }

    .actions-left,
    .actions-right {
        flex-direction: column;
    }

    .actions-left .el-button,
    .actions-right .el-button {
        width: 100%;
    }
}
</style>
