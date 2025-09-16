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
                    <el-form-item label="分块大小:">
                        <el-input-number v-model="initForm.chunkSize" :min="100" :max="5000" />
                    </el-form-item>
                    <el-form-item label="分块重叠:">
                        <el-input-number v-model="initForm.chunkOverlap" :min="0" :max="1000" />
                    </el-form-item>
                    <el-form-item label="分隔符:">
                        <el-input v-model="initForm.separator" placeholder="例如：\n\n" />
                    </el-form-item>
                    <el-form-item label="嵌入模型:">
                        <el-select v-model="initForm.embedding_model" placeholder="选择模型">
                            <el-option label="text2vec-base" value="text2vec-base" />
                            <el-option label="text2vec-large" value="text2vec-large" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
        </div>

        <!-- 确定按钮 -->
        <div class="footer">
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存配置</el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Edit } from "@element-plus/icons-vue";
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

// 初始化策略 form
const initForm = ref({
    chunkSize: 1000,
    chunkOverlap: 200,
    separator: "\n\n",
    embedding_model: "text2vec-base",
});

// 加载参数配置
const loadParams = async () => {
    try {
        console.log(props.knowledgeBaseId);
        const response = await getKnowledgeBaseParams(props.knowledgeBaseId);
        if (response) {
            initForm.value = {
                chunkSize: response.chunkSize ?? 1000,
                chunkOverlap: response.chunkOverlap ?? 200,
                separator: response.separator ?? "\n\n",
                embedding_model: response.embedding_model ?? "text2vec-base",
            };
        }
    } catch (error) {
        console.error("加载参数配置失败:", error);
        ElMessage.error("加载参数配置失败");
    }
};

// 保存配置
const handleSubmit = async () => {
    submitLoading.value = true;
    try {
        await updateKnowledgeBaseParams(props.knowledgeBaseId, initForm.value);
        ElMessage.success("参数配置保存成功");
    } catch (error) {
        console.error("保存参数配置失败:", error);
        ElMessage.error("保存参数配置失败：" + (error.response?.data?.message || error.message));
    } finally {
        submitLoading.value = false;
    }
};

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