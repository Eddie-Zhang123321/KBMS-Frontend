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
                    <!-- 分块大小 -->
                    <el-form-item label="分块大小:">
                        <el-input-number v-model="initForm.chunkSize" :min="100" :max="5000" placeholder="请输入分块大小" />
                        <el-tooltip placement="top" effect="light">
                            <template #content>
                                <div class="tooltip-content">
                                    <strong>分块大小</strong><br>
                                    文本分割时每个块的最大字符数。<br>
                                    • 值太小：可能丢失上下文信息<br>
                                    • 值太大：影响处理效率和准确性<br>
                                    <em>推荐值：500-1500</em>
                                </div>
                            </template>
                            <el-icon class="help-icon">
                                <InfoFilled />
                            </el-icon>
                        </el-tooltip>
                    </el-form-item>

                    <!-- 分块重叠 -->
                    <el-form-item label="分块重叠:">
                        <el-input-number v-model="initForm.chunkOverlap" :min="0" :max="1000" placeholder="请输入分块重叠大小" />
                        <el-tooltip placement="top" effect="light">
                            <template #content>
                                <div class="tooltip-content">
                                    <strong>分块重叠</strong><br>
                                    相邻文本块之间的重叠字符数。<br>
                                    • 作用：保持上下文的连贯性<br>
                                    • 通常设置为分块大小的10%-20%<br>
                                    <em>推荐值：50-300</em>
                                </div>
                            </template>
                            <el-icon class="help-icon">
                                <InfoFilled />
                            </el-icon>
                        </el-tooltip>
                    </el-form-item>

                    <!-- 分隔符 -->
                    <el-form-item label="分隔符:">
                        <el-input v-model="initForm.separator" placeholder="例如：\n\n" />
                        <el-tooltip placement="top" effect="light">
                            <template #content>
                                <div class="tooltip-content">
                                    <strong>分隔符</strong><br>
                                    用于分割文本的字符或字符串。<br>
                                    • \n\n：双换行（段落分割）<br>
                                    • \n：单换行<br>
                                    • 。：句号<br>
                                    • 自定义：根据文档结构设置<br>
                                    <em>默认：\n\n（段落分割）</em>
                                </div>
                            </template>
                            <el-icon class="help-icon">
                                <InfoFilled />
                            </el-icon>
                        </el-tooltip>
                    </el-form-item>

                    <!-- 嵌入模型 -->
                    <el-form-item label="嵌入模型:">
                        <el-select v-model="initForm.embedding_model" placeholder="选择模型" style="width: 100%">
                            <el-option label="text2vec-base" value="text2vec-base" />
                            <el-option label="text2vec-large" value="text2vec-large" />
                        </el-select>
                        <el-tooltip placement="top" effect="light">
                            <template #content>
                                <div class="tooltip-content">
                                    <strong>嵌入模型</strong><br>
                                    将文本转换为向量表示的模型。<br>
                                    • <strong>text2vec-base</strong>：基础版本，速度快<br>
                                    • <strong>text2vec-large</strong>：增强版本，准确度高<br>
                                    <em>根据需求平衡速度与精度</em>
                                </div>
                            </template>
                            <el-icon class="help-icon">
                                <InfoFilled />
                            </el-icon>
                        </el-tooltip>
                    </el-form-item>
                </el-form>

                <!-- 参数说明卡片 -->
                <div class="param-description-card">
                    <div class="card-header">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                        <span>参数配置说明</span>
                    </div>
                    <div class="card-content">
                        <div class="param-item-desc">
                            <span class="param-name">分块策略：</span>
                            <span class="param-desc">合理的分块设置能显著提升检索准确性和效率</span>
                        </div>
                        <div class="param-item-desc">
                            <span class="param-name">模型选择：</span>
                            <span class="param-desc">根据数据量和精度要求选择合适的嵌入模型</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 确定按钮 -->
        <div class="footer">
            <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
                <template #loading>
                    <el-icon class="is-loading">
                        <Loading />
                    </el-icon>
                    保存中...
                </template>
                保存配置
            </el-button>
            <el-button @click="loadParams">重置</el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Edit, InfoFilled, Loading } from "@element-plus/icons-vue";
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
            ElMessage.success("参数已重置");
        }
    } catch (error) {
        console.error("加载参数配置失败:", error);
        ElMessage.error("加载参数配置失败");
    }
};

// 保存配置
const handleSubmit = async () => {
    // 验证参数合理性
    if (initForm.value.chunkOverlap >= initForm.value.chunkSize) {
        ElMessage.warning("分块重叠大小不能大于或等于分块大小");
        return;
    }

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
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-title {
    display: flex;
    align-items: center;
    font-weight: bold;
    margin-bottom: 15px;
    color: #303133;
    font-size: 16px;
}

.section-title .el-icon {
    margin-right: 8px;
    color: #409eff;
}

.init-params {
    margin-top: 15px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border-left: 4px solid #409eff;
}

.footer {
    margin-top: 20px;
    text-align: left;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
}

:deep(.el-form-item) {
    margin-bottom: 20px;
    position: relative;
}

:deep(.el-form-item__label) {
    font-weight: 600;
    color: #606266;
}

:deep(.el-input-number) {
    width: 100%;
}

.help-icon {
    margin-left: 8px;
    color: #909399;
    cursor: help;
    font-size: 14px;
    transition: color 0.3s;
}

.help-icon:hover {
    color: #409eff;
}

/* 参数说明卡片 */
.param-description-card {
    margin-top: 25px;
    padding: 16px;
    background: linear-gradient(135deg, #f0f7ff 0%, #f8f9fa 100%);
    border: 1px solid #d1e9ff;
    border-radius: 6px;
}

.card-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
    color: #409eff;
}

.card-header .el-icon {
    margin-right: 6px;
    font-size: 16px;
}

.param-item-desc {
    display: flex;
    margin-bottom: 8px;
    font-size: 13px;
    line-height: 1.5;
}

.param-name {
    font-weight: 500;
    color: #303133;
    min-width: 80px;
}

.param-desc {
    color: #606266;
    flex: 1;
}

/* 工具提示内容样式 */
.tooltip-content {
    max-width: 280px;
    line-height: 1.6;
    font-size: 13px;
}

.tooltip-content strong {
    color: #409eff;
    margin-bottom: 4px;
    display: inline-block;
}

.tooltip-content em {
    color: #67c23a;
    font-style: normal;
    font-weight: 500;
    margin-top: 4px;
    display: inline-block;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .params-tab {
        padding: 15px;
    }

    .section {
        padding: 15px;
        margin-bottom: 20px;
    }

    .init-params {
        padding: 15px;
    }

    :deep(.el-form-item__label) {
        width: 100px !important;
    }
}
</style>