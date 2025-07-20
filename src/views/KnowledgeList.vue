<template>
    <div class="knowledge-base">
        <div class="header">
            <el-input v-model="searchQuery" placeholder="请输入关键字" class="pill-input" style="width: 300px; margin: 20px">
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
            </el-input>
            <el-button type="primary" @click="createKnowledgeBase" style="margin-left: auto; margin-right: 50px"
                round>创建知识库</el-button>
        </div>

        <div class="knowledge-container">
            <el-row :gutter="20" justify="start">
                <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="6" v-for="(item, index) in filteredItems" :key="index">
                    <el-card :body-style="{ margin: '20px' }" class="knowledge-card">
                        <div class="item-content">
                            <img :src="item.icon" class="item-icon" />
                            <div class="item-text">
                                <div class="item-title">{{ item.title }}</div>
                                <div class="item-description">{{ item.description }}</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { getKnowledgeList } from '@/api/Knowledgebase';
import { ElMessage } from 'element-plus';

const searchQuery = ref('');
const knowledgeItems = ref([]);
const isLoading = ref(false);

// 计算属性：实现搜索过滤功能
const filteredItems = computed(() => {
    if (!searchQuery.value) return knowledgeItems.value;
    const query = searchQuery.value.toLowerCase();
    return knowledgeItems.value.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
});

const fetchData = async () => {
    isLoading.value = true;
    try {
        // 直接获取数据，错误已在axios拦截器处理
        const response = await getKnowledgeList();
        knowledgeItems.value = response; // 直接赋值，因为axios已剥离data层
    } catch (error) {
        // 错误已由axios拦截器统一处理，此处可补充特殊逻辑
        console.error('请求异常:', error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchData();
});

const createKnowledgeBase = () => {
    console.log('创建知识库');
};
</script>

<style scoped>
/* 保持原有样式不变 */
.knowledge-base {
    padding: 0px;
}

.header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    background-color: #fff;
    padding: 0px 20px;
}

.knowledge-container {
    padding: 0 5%;
    max-width: 1600px;
    margin: 0 auto;
}

.knowledge-card {
    margin-bottom: 20px;
    transition: all 0.3s ease;
    height: 90%;
    border-radius: 30px;
}

.knowledge-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}


.item-content {
    display: flex;
    flex-direction: row;
    /* 从 column 改为 row，实现横向排列 */
    align-items: center;
    text-align: left;
    /* 如果需要标题靠左 */
    gap: 12px;
    /* 图标和文字之间的间距 */
}




.item-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
    object-fit: contain;
}

.item-title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
    color: var(--el-text-color-primary);
}


.item-description {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    /* 兼容性处理 */
    line-clamp: 3;
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