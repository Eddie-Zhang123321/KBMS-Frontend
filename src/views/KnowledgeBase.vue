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
import { ro } from 'date-fns/locale'

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
            { label: '评测', name: 'evaluate' },
            { label: '调优', name: 'optimize' },
            { label: '日志', name: 'log' }
        )
    }

    return tabs
})

// ✅ 关键：建立 tab name 到组件变量的映射
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
            // 建议在此获取用户角色
            // 示例：getUserRole(kbId).then(role => kbStore.setUserRole(role))
        } else {
            ElMessage.warning('未找到对应的知识库信息')
        }
    }
})
</script>

<template>
    <div class="knowledge-base-page">
        <!-- 顶部区域 -->
        <div class="header-bar">
            <div class="back" @click="goBack">
                <el-icon>
                    <ArrowLeft />
                </el-icon>
                <span class="back-text">知识库总页</span>
            </div>

            <el-tabs v-model="activeTab" class="custom-tabs" stretch tab-position="top">
                <el-tab-pane v-for="tab in availableTabs" :key="tab.name" :label="tab.label" :name="tab.name" />
            </el-tabs>
        </div>

        <!-- 当前知识库提示 -->
        <div class="kb_name">
            🟢 当前知识库：{{ knowledgeBaseName }}
        </div>

        <!-- ✅ 正确渲染组件 -->
        <component :is="tabComponents[activeTab]" :knowledge-base-id="route.params.id" />
    </div>
</template>

<style scoped>
.knowledge-base-page {
    padding: 20px;
    background-color: #f5f6fa;
    min-height: 100vh;
}

.header-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background-color: white;
    padding: 10px;
    border-bottom: 1px solid #e4e7ed;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back {
    position: absolute;
    left: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    color: #333;
    padding: 8px 16px;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.back:hover {
    background-color: #f5f5f5;
}

.back-text {
    font-size: 14px;
    font-weight: 500;
}

.custom-tabs {
    width: 400px;
}

/* 隐藏 Element Plus 默认的底部横线 */
::v-deep(.el-tabs__nav-wrap::after) {
    display: none !important;
}

.kb_name {
    margin: 10px 20px;
    font-size: 16px;
    color: #666;
    font-weight: 500;
}
</style>