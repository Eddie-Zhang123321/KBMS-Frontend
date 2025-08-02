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

        <!-- 主体内容区域 -->
        <component :is="tabComponents[activeTab]" />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

import DataSourceTab from './KnowledgeBaseTab/DataSourceTab.vue'
import PermissionTab from './KnowledgeBaseTab/PermissionTab.vue'
import LogTab from './KnowledgeBaseTab/LogTab.vue'

const activeTab = ref('data-source')
const router = useRouter()

function goBack() {
    router.push('/knowledgelist') // 按需修改为实际路由路径
}

const tabComponents = {
    'data-source': DataSourceTab,
    'permission': PermissionTab,
    'param': { template: '<div>参数页开发中...</div>' },
    'evaluate': { template: '<div>评价页开发中...</div>' },
    'optimize': { template: '<div>调优页开发中...</div>' },
    'log': LogTab,
}
</script>

<style scoped>
.knowledge-base-page {
    padding: 20px;
}


/* 顶部容器 */
.header-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background-color: white;
    padding: 10px;
}

/* 返回按钮样式 */
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
    /* 黑色字体 */
    font-size: 14px;
}

/* 自定义 Tabs 样式 */
.custom-tabs {
    width: 400px;
}

/* 正确方式：深度作用取消下划线 */
::v-deep(.el-tabs__nav-wrap::after) {
    display: none !important;
}
</style>
