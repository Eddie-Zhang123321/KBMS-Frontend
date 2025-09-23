<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createKnowledgeBase } from '@/api/Knowledgebase'

const dialogVisible = ref(false)
const submitting = ref(false)

// 响应式计算属性
const isMobile = computed(() => window.innerWidth <= 768)
const dialogWidth = computed(() => isMobile.value ? '95%' : '800px')

// 预设封面
const presetCovers = [
    { id: 1, url: new URL('@/assets/covers/technology.png', import.meta.url).href, name: '科技' },
    { id: 2, url: new URL('@/assets/covers/finance.png', import.meta.url).href, name: '金融' },
    { id: 3, url: new URL('@/assets/covers/business.png', import.meta.url).href, name: '商业' },
    { id: 4, url: new URL('@/assets/covers/design.png', import.meta.url).href, name: '设计' },
    { id: 5, url: new URL('@/assets/covers/law.png', import.meta.url).href, name: '法规' },
    { id: 6, url: new URL('@/assets/covers/default.png', import.meta.url).href, name: '默认' } // Fix the spelling here
];

// 表单数据
const form = reactive({
    name: '',
    description: '',
    icon: null,
    chunk_size: 100,
    chunk_overlap: 20,
    separator: '\n\n',
    embedding_model: 'text2vec-base',
    access_mode: 0,        // 默认私有
    vector_store: 'faiss', // 默认 faiss
    tags: ["金融"]               // 多选标签
})

// 表单规则
const rules = {
    name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
    icon: [{ required: true, message: '请选择封面', trigger: 'change' }],
    access_mode: [{ required: true, message: '请选择访问模式', trigger: 'change' }]
}

const formRef = ref(null)

// 选择封面
const selectCover = (coverId) => {
    form.icon = coverId
}

// 重置
const resetForm = () => {
    Object.assign(form, {
        name: '',
        description: '',
        icon: null,
        chunk_size: 100,
        chunk_overlap: 20,
        separator: '\n\n',
        embedding_model: 'text2vec-base',
        access_mode: 0,
        vector_store: 'faiss',
        tags: []
    })
}

// 关闭
const handleClose = () => {
    dialogVisible.value = false
    resetForm()
}

// 提交
const handleSubmit = () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return
        submitting.value = true
        try {
            const res = await createKnowledgeBase({ ...form })
            if (res) {
                ElMessage.success('知识库创建成功')
                dialogVisible.value = false
                resetForm()
                emit('success')
            } else {
                ElMessage.error(res.message || '创建失败')
            }
        } catch (err) {
            console.error('创建失败:', err)
            ElMessage.error('创建知识库失败，请重试')
        } finally {
            submitting.value = false
        }
    })
}

defineExpose({
    open: () => { dialogVisible.value = true }
})

const emit = defineEmits(['success'])
</script>

<template>
    <el-dialog v-model="dialogVisible" title="新建知识库" :width="dialogWidth" :before-close="handleClose"
        :fullscreen="isMobile" style="--el-dialog-border-radius:12px">
        <div class="form-container">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">

                <!-- 封面选择 -->
                <div class="cover-section">
                    <div class="section-title">
                        <span class="title-icon">🖼️</span>
                        <span>选择知识库封面</span>
                    </div>
                    <el-form-item prop="icon">
                        <div class="cover-selection">
                            <div v-for="cover in presetCovers" :key="cover.id" class="cover-item"
                                :class="{ selected: form.icon === cover.id }" @click="selectCover(cover.id)">
                                <img :src="cover.url" :alt="cover.name" class="cover-image" />
                                <div class="cover-name">{{ cover.name }}</div>
                            </div>
                        </div>
                    </el-form-item>
                </div>

                <!-- 基本信息 -->
                <div class="basic-info-section">
                    <div class="section-title">
                        <span class="title-icon">📝</span>
                        <span>基本信息</span>
                    </div>
                    <el-form-item label="知识库名称" prop="name">
                        <el-input v-model="form.name" placeholder="请输入知识库名称" size="large" />
                    </el-form-item>
                    <el-form-item label="描述信息">
                        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
                    </el-form-item>

                    <!-- 访问模式 -->
                    <el-form-item label="访问模式" prop="access_mode">
                        <el-radio-group v-model="form.access_mode">
                            <el-radio :label="0">私有</el-radio>
                            <el-radio :label="1">公开</el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <!-- 标签选择 -->
                    <el-form-item label="标签">
                        <el-select v-model="form.tags" multiple filterable allow-create default-first-option
                            placeholder="输入或选择标签" style="width: 100%">
                            <el-option v-for="tag in form.tags" :key="tag" :label="tag" :value="tag" />
                        </el-select>
                    </el-form-item>
                </div>

                <!-- 参数设置 -->
                <div class="params-section">
                    <div class="section-title">
                        <span class="title-icon">⚙️</span>
                        <span>初始化参数设置</span>
                    </div>
                    <div class="params-grid">
                        <div class="param-item">
                            <label class="param-label">分块大小</label>
                            <el-input-number v-model="form.chunk_size" :min="100" :max="5000" :step="100"
                                size="large" />
                            <span class="param-desc">字符数</span>
                        </div>
                        <div class="param-item">
                            <label class="param-label">重叠大小</label>
                            <el-input-number v-model="form.chunk_overlap" :min="0" :max="1000" :step="50"
                                size="large" />
                            <span class="param-desc">字符数</span>
                        </div>
                        <div class="param-item full-width">
                            <label class="param-label">分隔符</label>
                            <el-input v-model="form.separator" placeholder="例如：\n\n" size="large" />
                        </div>
                        <div class="param-item full-width">
                            <label class="param-label">嵌入模型</label>
                            <el-select v-model="form.embedding_model" placeholder="选择模型" size="large"
                                class="model-select">
                                <el-option label="text2vec-base" value="text2vec-base" />
                                <el-option label="text2vec-large" value="text2vec-large" />
                            </el-select>
                        </div>
                    </div>
                </div>
            </el-form>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose" size="large">取消</el-button>
                <el-button type="primary" @click="handleSubmit" size="large" :loading="submitting">
                    {{ submitting ? '创建中...' : '创建知识库' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style scoped>
.form-container {
    padding: 0 20px;
    max-height: 60vh;
    overflow-y: auto;
}

.section-title {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-weight: 600;
    color: #1f2937;
    font-size: 16px;
}

.title-icon {
    margin-right: 8px;
    font-size: 18px;
}

/* 封面选择区域 */
.cover-section {
    margin-bottom: 24px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.cover-selection {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.cover-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
}

.cover-item:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cover-item.selected {
    border-color: #3b82f6;
    background: #f0f9ff;
}

.cover-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
    margin-bottom: 8px;
}

.cover-name {
    font-size: 12px;
    color: #6b7280;
    text-align: center;
}

/* 基本信息区域 */
.basic-info-section {
    margin-bottom: 24px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.info-form {
    :deep(.el-form-item__label) {
        font-weight: 500;
        color: #374151;
    }

    :deep(.el-input__inner) {
        border-radius: 8px;
    }
}

/* 参数设置区域 */
.params-section {
    padding: 20px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.params-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.param-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.param-item.full-width {
    grid-column: 1 / -1;
}

.param-label {
    font-weight: 500;
    color: #374151;
    font-size: 14px;
}

.param-desc {
    font-size: 12px;
    color: #6b7280;
}

.model-select {
    width: 100%;
}

:deep(.el-input-number) {
    width: 100%;
}

:deep(.el-input-number .el-input__inner) {
    text-align: center;
}

/* 底部按钮 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 0 0;
}

:deep(.el-button) {
    border-radius: 8px;
    padding: 12px 24px;
}

:deep(.el-button--large) {
    font-size: 14px;
}

/* 滚动条样式 */
.form-container::-webkit-scrollbar {
    width: 6px;
}

.form-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.form-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.form-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .cover-selection {
        grid-template-columns: repeat(2, 1fr);
    }

    .params-grid {
        grid-template-columns: 1fr;
    }
}
</style>