<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useKBStore } from '@/stores/kb' // 导入store
import { ElMessage } from 'element-plus'

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

// 从store中获取当前知识库名称
const knowledgeBaseName = computed(() => {
    return kbStore.currentKB?.title || '未知知识库'
})

function goBack() {
    router.push('/knowledgelist')
}

const tabComponents = {
    'data-source': DataSourceTab,
    'permission': PermissionTab,
    'param': ParamsTab,
    'evaluate': EvaluateTab,
    'optimize': OptimizeTab,
    'log': LogTab,
}

// 如果直接从URL进入页面，尝试从store中获取或根据ID查找
onMounted(() => {
    const kbId = route.params.id
    if (kbId && !kbStore.currentKB) {
        // 如果store中没有当前知识库，但URL有ID，尝试从列表中找到
        const kbItem = kbStore.getKBById(kbId)
        if (kbItem) {
            kbStore.setCurrentKB(kbItem)
        } else {
            ElMessage.warning('未找到对应的知识库信息')
        }
    }
})
</script>

<template>
    <div class="knowledge-base-page">
        <!-- 顶部区域：返回按钮 + 标签栏 -->
        <div class="header-bar">
            <div class="back" @click="goBack">
                <el-icon>
                    <ArrowLeft />
                </el-icon>
                <span class="back-text">知识库总页</span>
            </div>

            <el-tabs v-model="activeTab" class="custom-tabs" stretch tab-position="top">
                <el-tab-pane label="数据源" name="data-source" />
                <el-tab-pane label="权限" name="permission" />
                <el-tab-pane label="参数" name="param" />
                <el-tab-pane label="评价" name="evaluate" />
                <el-tab-pane label="调优" name="optimize" />
                <el-tab-pane label="日志" name="log" />
            </el-tabs>
        </div>
        <div class="kb_name">
            🟢 当前知识库：{{ knowledgeBaseName }}
        </div>
        <!-- 主体内容区域 -->
        <component :is="tabComponents[activeTab]" :knowledge-base-id="route.params.id" />
    </div>
</template>

<style scoped>
/* 样式保持不变 */
.knowledge-base-page {
    padding: 20px;
}

.header-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background-color: white;
    padding: 10px;
}

.back {
    position: absolute;
    left: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}

.back-text {
    color: #000;
    font-size: 14px;
}

.custom-tabs {
    width: 400px;
}

::v-deep(.el-tabs__nav-wrap::after) {
    display: none !important;
}

.kb_name {
    margin: 10px 20px;
    font-size: 16px;
    color: gray;
    font-weight: 500;
}
</style>