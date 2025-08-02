<template>
    <div class="knowledge-base">
        <div class="header">
            <el-input v-model="searchQuery" placeholder="搜索知识库" class="pill-input search-input" clearable>
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
            </el-input>
            <el-button type="primary" @click="createKnowledgeBase" round class="create-btn">
                创建知识库
            </el-button>
        </div>
        <CreateKB ref="createDialog" />
        <div v-loading="isLoading" class="knowledge-list-container">
            <template v-if="filteredItems.length > 0">
                <div class="knowledge-list">
                    <div v-for="item in filteredItems" :key="item.id" class="knowledge-card"
                        @click="handleCardClick(item.id)">
                        <div class="knowledge-header">
                            <el-avatar :src="item.icon" :size="60" class="item-icon" />
                            <div class="knowledge-info">
                                <h3 class="knowledge-title">{{ item.title }}</h3>
                                <p class="knowledge-description">{{ item.description }}</p>
                            </div>
                        </div>
                        <div class="knowledge-tags">
                            <el-tag size="small" type="info">
                                📚 {{ item.recordCount || 0 }}
                            </el-tag>
                            <el-tag v-for="(tag, index) in item.tags" :key="index" size="small">
                                {{ tag }}
                            </el-tag>
                            <el-tag size="small" effect="plain">
                                {{ item.vectorStore }}
                            </el-tag>
                        </div>
                        <div class="knowledge-footer">
                            <span class="update-time">
                                最后更新: {{ formatTime(item.updatedAt) }}
                            </span>
                            <el-button type="primary" size="small" @click.stop="startConversation(item.id)">
                                开始对话
                            </el-button>
                        </div>
                    </div>
                </div>
            </template>
            <div v-else class="empty-state">
                <el-empty description="暂无知识库" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getKnowledgeList } from '@/api/Knowledgebase'
import { ElMessage } from 'element-plus'
import CreateKB from '@/components/dialogs/CreateKB.vue'
import { useRouter } from 'vue-router'
const searchQuery = ref('')
const knowledgeItems = ref([])
const isLoading = ref(false)
const createDialog = ref()
const router = useRouter()
// 时间格式化函数
const formatTime = (timeString) => {
    if (!timeString) return '未知时间'
    try {
        const date = new Date(timeString)
        const now = new Date()
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

        if (diffInDays === 0) return '今天'
        if (diffInDays === 1) return '昨天'
        if (diffInDays < 7) return `${diffInDays}天前`
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前`

        return date.toLocaleDateString()
    } catch {
        return timeString
    }
}

// 计算属性：实现搜索过滤功能
const filteredItems = computed(() => {
    if (!searchQuery.value.trim()) return knowledgeItems.value
    const query = searchQuery.value.toLowerCase()
    return knowledgeItems.value.filter(
        (item) =>
            item.title?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            (item.tags || []).some((tag) => tag?.toLowerCase().includes(query))
    )
})

const fetchData = async () => {
    isLoading.value = true
    try {
        const response = await getKnowledgeList()
        // 根据API返回的实际数据结构处理
        knowledgeItems.value = response?.list || []
    } catch (error) {
        ElMessage.error('获取知识库列表失败')
        console.error('请求异常:', error)
        knowledgeItems.value = [] // 确保出错时清空列表
    } finally {
        isLoading.value = false
    }
}

const handleCardClick = (id) => {
    console.log('查看知识库详情:', id)
    console.log('即将跳转到', `/knowledgebase/${id}`)
    router.push(`/knowledgebase/${id}`)
}

const startConversation = (id) => {
    console.log('开始对话:', id)
    // 实际项目中可以打开对话窗口
}

const createKnowledgeBase = () => {
    console.log('创建知识库')
    createDialog.value.open()
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped lang="scss">
.knowledge-base {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.header {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);

    .search-input {
        width: 300px;
        margin-right: 20px;
    }

    .create-btn {
        margin-left: auto;
    }
}

.knowledge-list-container {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background-color: var(--el-fill-color-light);
    display: flex;
    flex-direction: column;

    .knowledge-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 20px;
    }

    .empty-state {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
    }
}

.knowledge-card {
    display: flex;
    /* 新增：使卡片成为flex容器 */
    flex-direction: column;
    /* 新增：垂直排列 */
    min-height: 100px;
    /* 新增：给卡片一个最小高度（可根据实际调整）*/
    background-color: var(--el-bg-color);
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid var(--el-border-color-light);

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .knowledge-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        height: 106px;

        .item-icon {
            margin-right: 16px;
            flex-shrink: 0;
        }

        .knowledge-info {
            flex-grow: 1;
            min-width: 0;

            .knowledge-title {
                font-size: 18px;
                font-weight: bold;
                margin: 0 0 8px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .knowledge-description {
                font-size: 14px;
                color: var(--el-text-color-secondary);
                display: -webkit-box;
                line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        }
    }

    .knowledge-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
    }

    .knowledge-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        margin-top: auto;

        .update-time {
            font-size: 12px;
            color: var(--el-text-color-placeholder);
        }
    }
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