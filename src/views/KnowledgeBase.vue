<template>
    <div class="knowledge-base-page">
        <!-- 顶部区域 -->
        <div class="header-bar">
            <div class="back" @click="goBack" aria-label="返回知识库总页">
                <el-icon size="20">
                    <ArrowLeft />
                </el-icon>
                <span class="back-text">知识库总页</span>
            </div>

            <el-tabs v-model="activeTab" class="custom-tabs" tab-position="top">
                <el-tab-pane v-for="tab in availableTabs" :key="tab.name" :label="tab.label" :name="tab.name" />
            </el-tabs>
        </div>

        <!-- 当前知识库提示 -->
        <div class="kb_name">
            🟢 当前知识库：{{ knowledgeBaseName }}
        </div>

        <!-- 动态渲染 Tab 内容 -->
        <component :is="tabComponents[activeTab]" :knowledge-base-id="route.params.id" />
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useKBStore } from '@/stores/kb'
import { ElMessage } from 'element-plus'

// 导入各个 Tab 组件
import DataSourceTab from './KnowledgeBaseTab/DataSourceTab.vue'
import PermissionTab from './KnowledgeBaseTab/PermissionTab.vue'
import LogTab from './KnowledgeBaseTab/LogTab.vue'
import ParamsTab from './KnowledgeBaseTab/ParamsTab.vue'
import EvaluateTab from './KnowledgeBaseTab/EvaluateTab.vue'
import OptimizeTab from './KnowledgeBaseTab/OptimizeTab.vue'

const activeTab = ref('data-source')
const router = useRouter()
const route = useRoute()
const kbStore = useKBStore()

// 从 store 获取当前知识库名称
const knowledgeBaseName = computed(() => {
    return kbStore.currentKB?.name || '未知知识库'
})

// 返回知识库总页
function goBack() {
    router.push('/knowledgelist')
}

// 判断是否为管理员或所有者
const isEditor = computed(() => {
    const role = kbStore.userRole
    return role === 1 || role === 2 || role === 3 // admin 或 owner
})

// 动态生成当前用户可访问的 Tab 列表
const availableTabs = computed(() => {
    const tabs = [
        { label: '数据源', name: 'data-source' }
    ]

    if (isEditor.value) {
        tabs.push(
            { label: '权限', name: 'permission' },
            { label: '参数', name: 'param' },
            { label: '评价', name: 'evaluate' },
            { label: '调优', name: 'optimize' },
            { label: '日志', name: 'log' }
        )
    }

    return tabs
})

// Tab 名称到组件的映射
const tabComponents = {
    'data-source': DataSourceTab,
    'permission': PermissionTab,
    'param': ParamsTab,
    'evaluate': EvaluateTab,
    'optimize': OptimizeTab,
    'log': LogTab
}

// 监听 activeTab，防止非法访问
watch(activeTab, (newTab) => {
    const isValidTab = availableTabs.value.some(tab => tab.name === newTab)
    if (!isValidTab) {
        activeTab.value = 'data-source'
        ElMessage.warning('您没有权限访问该页面')
    }
}, { immediate: true })

// 页面加载时尝试设置当前知识库
onMounted(() => {
    const kbId = route.params.id
    if (kbId && !kbStore.currentKB) {
        const kbItem = kbStore.getKBById(kbId)
        if (kbItem) {
            kbStore.setCurrentKB(kbItem)
        } else {
            ElMessage.warning('未找到对应的知识库信息')
        }
    }
})
</script>

<style scoped>
.knowledge-base-page {
    padding: 20px;
    background-color: var(--el-bg-color-page, #f5f6fa);
    min-height: 100vh;
    box-sizing: border-box;
}

.header-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background-color: var(--el-bg-color, #ffffff);
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light, #e4e7ed);
    border-radius: 8px 8px 0 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.back {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: var(--el-text-color-regular, #333);
    padding: 8px 12px;
    border-radius: 6px;
    transition: background-color 0.2s ease, color 0.2s ease;
}

.back:hover {
    background-color: var(--el-bg-color-overlay, #f5f5f5);
    color: var(--el-color-primary, #409eff);
}

.back-text {
    font-size: 15px;
    font-weight: 500;
}

.custom-tabs {
    width: 400px;
    /* PC 端固定宽度，完整显示 */
    max-width: 100%;
}

/* 隐藏 Element Plus 默认的底部横线 */
:deep(.el-tabs__nav-wrap::after) {
    display: none !important;
}

/* 调整 Tab 标签样式，确保 PC 端完整显示 */
:deep(.el-tabs__nav-wrap) {
    display: flex;
    justify-content: center;
}

:deep(.el-tabs__nav) {
    display: flex;
}

:deep(.el-tabs__item) {
    flex: 1;
    text-align: center;
    padding: 0 10px;
    font-size: 14px;
    height: 40px;
    line-height: 40px;
    color: var(--el-text-color-regular, #606266);
    transition: color 0.2s ease, background-color 0.2s ease;
}

:deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary, #409eff);
    font-weight: 600;
}

:deep(.el-tabs__item:hover) {
    background-color: var(--el-bg-color-overlay, #f5f5f5);
    border-radius: 4px;
}

:deep(.el-tabs__active-bar) {
    height: 3px;
    background-color: var(--el-color-primary, #409eff);
}

.kb_name {
    margin: 12px 20px;
    font-size: 16px;
    color: var(--el-text-color-secondary, #666);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .knowledge-base-page {
        padding: 12px;
    }

    .header-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 6px;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
    }

    .back {
        position: static;
        transform: none;
        justify-content: flex-start;
        width: fit-content;
        padding: 8px 10px;
        font-size: 14px;
        border: 1px solid var(--el-border-color-light, #e4e7ed);
        border-radius: 6px;
        margin: 0 auto 8px 0;
    }

    .back-text {
        font-size: 13px;
    }

    .custom-tabs {
        width: 100%;
        /* 移动端全宽 */
    }

    /* 优化标签页横向滚动 */
    :deep(.el-tabs__nav-wrap) {
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        /* 隐藏 Firefox 滚动条 */
        -webkit-overflow-scrolling: touch;
        white-space: nowrap;
        padding: 0 8px;
        position: relative;
        box-shadow: inset -8px 0 8px -8px rgba(0, 0, 0, 0.1),
            inset 8px 0 8px -8px rgba(0, 0, 0, 0.1);
    }

    :deep(.el-tabs__nav-wrap::-webkit-scrollbar) {
        display: none;
        /* 隐藏 Webkit 滚动条 */
    }

    :deep(.el-tabs__nav) {
        display: inline-flex;
    }

    :deep(.el-tabs__item) {
        flex: none;
        /* 移动端不均分宽度 */
        padding: 0 12px;
        font-size: 13px;
        height: 36px;
        line-height: 36px;
    }

    :deep(.el-tabs__item.is-active) {
        color: var(--el-color-primary, #409eff);
        font-weight: 600;
    }

    :deep(.el-tabs__item:hover) {
        background-color: var(--el-bg-color-overlay, #f5f5f5);
        border-radius: 4px;
    }

    :deep(.el-tabs__active-bar) {
        height: 3px;
    }

    .kb_name {
        margin: 10px 12px;
        font-size: 14px;
        color: var(--el-text-color-secondary, #555);
    }

    /* 优化内容区域 */
    :deep(.el-tab-pane) {
        padding: 8px 12px;
    }

    :deep(.el-card),
    :deep(.el-table) {
        font-size: 13px;
        border-radius: 6px;
    }

    :deep(.el-button) {
        font-size: 13px;
        padding: 8px 12px;
        border-radius: 6px;
        min-height: 36px;
        /* 确保触摸友好 */
    }

    :deep(.el-button:hover),
    :deep(.el-button:active) {
        background-color: var(--el-bg-color-overlay, #f5f5f5);
        transition: background-color 0.1s ease;
    }
}
</style>