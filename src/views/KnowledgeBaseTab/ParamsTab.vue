<template>
    <div class="params-tab">
        <!-- 初始化策略区 -->
        <div class="section">
            <h3 class="section-title">
                <el-icon>
                    <Edit />
                </el-icon>
                初始化策略默认值
            </h3>

            <!-- 默认初始化参数 -->
            <div class="init-params">
                <el-form label-width="120px">
                    <el-form-item label="chunk size:">
                        <el-input-number v-model="form.chunkSize" :min="100" :max="5000" />
                    </el-form-item>
                    <el-form-item label="chunk overlap:">
                        <el-input-number v-model="form.chunkOverlap" :min="0" :max="1000" />
                    </el-form-item>
                    <el-form-item label="separator:">
                        <el-input v-model="form.separator" placeholder="例如：\n\n" />
                    </el-form-item>
                    <el-form-item label="embedding 模型:">
                        <el-select v-model="form.initEmbedding" placeholder="选择模型">
                            <el-option label="text2vec-base" value="text2vec-base" />
                            <el-option label="text2vec-large" value="text2vec-large" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
        </div>

        <!-- 搜索策略区 -->
        <div class="section">
            <h3 class="section-title">
                <el-icon>
                    <Search />
                </el-icon>
                检索策略区
            </h3>
            <el-form label-width="120px">
                <el-form-item label="Top-K:">
                    <el-input-number v-model="form.topK" :min="1" :max="20" />
                </el-form-item>
                <el-form-item label="相似度阈值:">
                    <el-input-number v-model="form.similarity" :min="0" :max="1" :step="0.1" />
                </el-form-item>
                <el-form-item label="embedding 模型:">
                    <el-select v-model="form.searchEmbedding" placeholder="选择模型">
                        <el-option label="text2vec-base" value="text2vec-base" />
                        <el-option label="text2vec-large" value="text2vec-large" />
                    </el-select>
                </el-form-item>
                <el-form-item label="QA 模式:">
                    <el-select v-model="form.qaMode" placeholder="选择模式">
                        <el-option label="单段问答" value="single" />
                        <el-option label="多段问答" value="multi" />
                    </el-select>
                </el-form-item>
            </el-form>
        </div>

        <!-- 确定按钮 -->
        <div class="footer">
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存配置</el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Edit, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
    getKnowledgeBaseParams,
    updateKnowledgeBaseParams
} from "@/api/Knowledgebase";

const props = defineProps({
    knowledgeBaseId: {
        type: String,
        required: true
    }
});

const submitLoading = ref(false);

const form = ref({
    initStrategy: "smart",
    chunkSize: 1000,
    chunkOverlap: 200,
    separator: "\n\n",
    initEmbedding: "text2vec-base",
    topK: 5,
    similarity: 0.75,
    searchEmbedding: "text2vec-base",
    qaMode: "single",
});

// 加载参数配置
const loadParams = async () => {
    try {
        console.log('加载参数配置...');
        const response = await getKnowledgeBaseParams(props.knowledgeBaseId);
        console.log(response);
        if (response) {
            form.value = { ...form.value, ...response };
            console.log('加载参数配置成功:', response);
        }
    } catch (error) {
        console.error('加载参数配置失败:', error);
        ElMessage.error('加载参数配置失败');
    }
};

// 提交参数配置
const handleSubmit = async () => {
    submitLoading.value = true;
    try {
        const response = await updateKnowledgeBaseParams(props.knowledgeBaseId, form.value);
        ElMessage.success('参数配置保存成功');
        console.log('提交参数成功:', response.data);
    } catch (error) {
        console.error('保存参数配置失败:', error);
        ElMessage.error('保存参数配置失败：' + (error.response?.data?.message || error.message));
    } finally {
        submitLoading.value = false;
    }
};

// 组件挂载时加载参数
onMounted(() => {
    loadParams();
});
</script>

<style scoped>
.params-tab {
    padding: 20px;
}

.section {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
}

.section-title {
    display: flex;
    align-items: center;
    font-weight: bold;
    margin-bottom: 15px;
    color: #303133;
}

.section-title .el-icon {
    margin-right: 8px;
}

.init-params {
    margin-top: 15px;
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 4px;
}

.footer {
    margin-top: 20px;
    text-align: left;
}

:deep(.el-form-item__label) {
    font-weight: 500;
}

:deep(.el-input-number) {
    width: 100%;
}
</style>