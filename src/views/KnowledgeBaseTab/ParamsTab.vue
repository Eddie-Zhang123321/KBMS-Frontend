<template>
    <div class="params-tab">
        <!-- 初始化策略区 -->
        <div class="section">
            <h3 class="section-title">
                <el-icon>
                    <Edit />
                </el-icon>
                初始化策略区（分片预览按钮）
            </h3>
            <el-radio-group v-model="initStrategy">
                <el-radio label="smart">智能初始化</el-radio>
                <el-radio label="template">模板初始化</el-radio>
                <el-radio label="default">默认初始化</el-radio>
            </el-radio-group>

            <!-- 默认初始化参数 -->
            <div v-if="initStrategy === 'default'" class="init-params">
                <el-form label-width="120px">
                    <el-form-item label="chunk size:">
                        <el-input v-model="form.chunkSize" />
                    </el-form-item>
                    <el-form-item label="chunk overlap:">
                        <el-input v-model="form.chunkOverlap" />
                    </el-form-item>
                    <el-form-item label="separator:">
                        <el-input v-model="form.separator" />
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
                    <el-input v-model="form.topK" />
                </el-form-item>
                <el-form-item label="相似度阈值:">
                    <el-input v-model="form.similarity" />
                </el-form-item>
                <el-form-item label="embedding 模型选择:">
                    <el-select v-model="form.searchEmbedding" placeholder="选择模型">
                        <el-option label="text2vec-base" value="text2vec-base" />
                        <el-option label="text2vec-large" value="text2vec-large" />
                    </el-select>
                </el-form-item>
                <el-form-item label="QA 模式选择:">
                    <el-select v-model="form.qaMode" placeholder="选择模式">
                        <el-option label="单段问答" value="single" />
                        <el-option label="多段问答" value="multi" />
                    </el-select>
                </el-form-item>
            </el-form>
        </div>

        <!-- 确定按钮 -->
        <div class="footer">
            <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { Edit, Search } from "@element-plus/icons-vue";

const initStrategy = ref("smart");

const form = ref({
    chunkSize: 5,
    chunkOverlap: 5,
    separator: "",
    initEmbedding: "text2vec-base",
    topK: 5,
    similarity: 0.8,
    searchEmbedding: "text2vec-base",
    qaMode: "single",
});

const handleSubmit = () => {
    console.log("提交参数:", {
        initStrategy: initStrategy.value,
        ...form.value,
    });
};
</script>

<style scoped>
.params-tab {
    padding: 20px;
}

.section {
    margin-bottom: 30px;
}

.section-title {
    display: flex;
    align-items: center;
    font-weight: bold;
    margin-bottom: 15px;
}

.section-title .el-icon {
    margin-right: 8px;
}

.init-params {
    margin-top: 15px;
}

.footer {
    margin-top: 20px;
    text-align: left;
}
</style>
