<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getKnowledgeList, getUserRoleInKnowledgeBase, deleteKB } from '@/api/Knowledgebase'
import { ElMessage, ElMessageBox } from 'element-plus'
import CreateKB from '@/components/dialogs/CreateKB.vue'
import { useRouter } from 'vue-router'
import { useKBStore } from '@/stores/kb'
import { createChat } from '@/api/chat'
const searchQuery = ref('')
const knowledgeItems = ref([])
const isLoading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(6)

const createDialog = ref()
const router = useRouter()
const kbStore = useKBStore()

let searchTimeout = null

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

const fetchData = async () => {
    isLoading.value = true
    try {
        const params = {
            page: currentPage.value,
            page_size: pageSize.value
        }
        if (searchQuery.value.trim()) {
            params.search = searchQuery.value.trim()
        }
        const response = await getKnowledgeList(params)
        knowledgeItems.value = response.items || []
        total.value = response.total || 0
        kbStore.setKBList(knowledgeItems.value)
    } catch (error) {
        ElMessage.error('获取知识库列表失败')
        knowledgeItems.value = []
        total.value = 0
    } finally {
        isLoading.value = false
    }
}

watch(searchQuery, (newValue) => {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }
    searchTimeout = setTimeout(() => {
        currentPage.value = 1
        fetchData()
    }, 500)
})

const handlePageChange = (page) => {
    currentPage.value = page
    fetchData()
}
const handleSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchData()
}

const handleCardClick = (item) => {
    kbStore.setCurrentKB(item)
    getUserRoleInKnowledgeBase(item.id).then(res => {
        kbStore.setUserRole(res.role)
    }).catch(err => {
        console.error('获取用户角色失败:', err)
        kbStore.setUserRole(0)
    })
    router.push(`/knowledgebase/${item.id}`)
}
const startConversation = async (item) => {
    try {
        const res = await createChat({
            title: `${item.name} 的对话`,
            kb_id: item.id,   // 传知识库 ID，接口需要支持
        })

        const chatId = String(res.chat_id)

        // 跳转到 Service 页面，并把 chatId 带过去
        router.push({
            path: '/service',
            query: { chatId }
        })
    } catch (error) {
        console.error('创建对话失败:', error)
        ElMessage.error('创建对话失败，请稍后重试')
    }
}
const createKnowledgeBase = () => {
    createDialog.value.open()
}

const handleEdit = (item) => {
    console.log('编辑知识库:', item.id)
    // 实现编辑逻辑，例如打开编辑对话框
}

const handleDelete = (item) => {
    ElMessageBox.confirm('确定要删除该知识库吗？此操作不可撤销！', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        try {
            await deleteKB(item.id)
            ElMessage.success('删除成功')
            fetchData()
        } catch (error) {
            ElMessage.error('删除失败')
            console.error('删除异常:', error)
        }
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

const handleCommand = (command, item) => {
    if (command === 'edit') {
        handleEdit(item)
    } else if (command === 'delete') {
        handleDelete(item)
    }
}

onMounted(() => {
    fetchData()
})
</script>

<template>
    <div class="knowledge-base">
        <div class="header">
            <el-input v-model="searchQuery" placeholder="搜索知识库名称、描述或标签" class="pill-input search-input" clearable>
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
            <template v-if="knowledgeItems.length > 0">
                <div class="knowledge-list">
                    <div v-for="item in knowledgeItems" :key="item.id" class="knowledge-card"
                        @click="handleCardClick(item)">
                        <div class="knowledge-header">
                            <el-avatar :src="item.icon" :size="60" class="item-icon" />
                            <div class="knowledge-info">
                                <h3 class="knowledge-title">{{ item.name }}</h3>
                                <p class="knowledge-description">{{ item.description }}</p>
                            </div>
                        </div>
                        <div class="knowledge-tags">
                            <el-tag v-for="(tag, index) in item.tags" :key="index" size="small">
                                {{ tag }}
                            </el-tag>
                            <el-tag size="small" effect="plain">{{ item.status }}</el-tag>
                        </div>
                        <div class="knowledge-footer">
                            <span class="update-time">最后更新: {{ formatTime(item.updated_at) }}</span>
                            <el-button type="primary" size="small" @click.stop="startConversation(item)">
                                开始对话
                            </el-button>
                        </div>
                        <div class="more-options" @click.stop>
                            <el-dropdown trigger="click" @command="(command) => handleCommand(command, item)">
                                <span class="el-dropdown-link">
                                    <el-icon class="more-icon">
                                        <More />
                                    </el-icon>
                                </span>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item command="edit">编辑</el-dropdown-item>
                                        <el-dropdown-item command="delete">删除</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>

                    </div>
                </div>

                <div class="pagination">
                    <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
                        :page-sizes="[6, 12, 18, 24]" layout="total, sizes, prev, pager, next, jumper"
                        @current-change="handlePageChange" @size-change="handleSizeChange" />
                </div>
            </template>

            <div v-else class="empty-state">
                <el-empty :description="searchQuery ? '未找到匹配的知识库' : '暂无知识库'" />
            </div>
        </div>
    </div>
</template>

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
    flex-direction: column;
    min-height: 100px;
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

    .more-options {
        position: absolute;
        top: 10px;
        right: 10px;

        .more-icon {
            font-size: 20px;
            cursor: pointer;
            color: var(--el-text-color-secondary);

            &:hover {
                color: var(--el-color-primary);
            }
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