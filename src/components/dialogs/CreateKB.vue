<template>
    <el-dialog v-model="dialogVisible" :title="isMobile ? '新建' : '新建知识库'" :before-close="handleClose"
        class="custom-dialog" :width="isMobile ? '90%' : '600px'">
        <div class="form-container">
            <el-form ref="formRef" :model="form" :rules="rules" :label-width="isMobile ? '70px' : '80px'">
                <!-- 步骤指示器 -->
                <div class="step-indicator" v-if="isMobile">
                    <span :class="{ active: currentStep === 0 }">1. 封面</span>
                    <span :class="{ active: currentStep === 1 }">2. 信息</span>
                    <span :class="{ active: currentStep === 2 }">3. 参数</span>
                </div>

                <!-- 步骤 1: 封面选择 -->
                <div v-show="currentStep === 0" class="cover-section">
                    <div class="section-title">
                        <span class="title-icon">🖼️</span>
                        <span>选择知识库封面</span>
                    </div>
                    <el-form-item prop="icon" error-strategy="custom">
                        <div class="cover-selection">
                            <div v-for="cover in presetCovers" :key="cover.id" class="cover-item"
                                :class="{ selected: form.icon === cover.id }" @click="selectCover(cover.id)"
                                role="button" :aria-label="`选择封面 ${cover.name}`" tabindex="0"
                                @keydown.enter="selectCover(cover.id)">
                                <img :src="cover.url" :alt="cover.name" class="cover-image" loading="lazy" />
                                <div class="cover-name">{{ cover.name }}</div>
                            </div>
                        </div>
                    </el-form-item>
                </div>

                <!-- 步骤 2: 基本信息 -->
                <div v-show="currentStep === 1" class="basic-info-section">
                    <div class="section-title">
                        <span class="title-icon">📝</span>
                        <span>基本信息</span>
                    </div>
                    <el-form-item label="知识库名称" prop="name">
                        <el-input ref="nameInputRef" v-model="form.name" placeholder="请输入知识库名称" size="default" clearable
                            aria-label="输入知识库名称" />
                    </el-form-item>
                    <el-form-item label="描述信息">
                        <el-input v-model="form.description" type="textarea" :rows="isMobile ? 2 : 3"
                            placeholder="请输入描述" size="default" clearable aria-label="输入描述信息" />
                    </el-form-item>
                    <el-form-item label="访问模式" prop="access_mode">
                        <el-radio-group v-model="form.access_mode" size="default" aria-label="选择访问模式">
                            <el-radio :label="0">私有</el-radio>
                            <el-radio :label="1">公开</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="标签">
                        <el-select v-model="form.tags" multiple filterable allow-create default-first-option
                            placeholder="输入或选择标签" style="width: 100%" size="default" clearable aria-label="选择或输入标签">
                            <el-option v-for="tag in form.tags" :key="tag" :label="tag" :value="tag" />
                        </el-select>
                    </el-form-item>
                </div>

                <!-- 步骤 3: 参数设置 -->
                <div v-show="currentStep === 2" class="params-section">
                    <div class="section-title">
                        <span class="title-icon">⚙️</span>
                        <span>初始化参数设置</span>
                    </div>
                    <div class="params-grid">
                        <div class="param-item">
                            <label class="param-label">分块大小</label>
                            <el-tooltip content="文本分块的字符数，建议100-5000" placement="top">
                                <el-input-number v-model="form.chunk_size" :min="100" :max="5000" :step="100"
                                    size="default" aria-label="设置分块大小" />
                            </el-tooltip>
                            <span class="param-desc">字符数</span>
                        </div>
                        <div class="param-item">
                            <label class="param-label">重叠大小</label>
                            <el-tooltip content="分块间的重叠字符数，建议0-1000" placement="top">
                                <el-input-number v-model="form.chunk_overlap" :min="0" :max="1000" :step="50"
                                    size="default" aria-label="设置重叠大小" />
                            </el-tooltip>
                            <span class="param-desc">字符数</span>
                        </div>
                        <div class="param-item full-width">
                            <label class="param-label">分隔符</label>
                            <el-input v-model="form.separator" placeholder="例如：\n\n" size="default" clearable
                                aria-label="输入分隔符" />
                        </div>
                        <div class="param-item full-width">
                            <label class="param-label">嵌入模型</label>
                            <el-select v-model="form.embedding_model" placeholder="选择模型" size="default"
                                class="model-select" clearable aria-label="选择嵌入模型">
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
                <div class="action-group">
                    <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
                    <el-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</el-button>
                    <el-button v-if="currentStep === 2" type="primary" :loading="submitting" @click="handleSubmit">
                        {{ submitting ? '创建中...' : '创建知识库' }}
                    </el-button>
                </div>
                <el-button @click="handleClose">取消</el-button>
            </div>
        </template>


</el-dialog>
</template>

<script setup>
import { ref, reactive, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createKnowledgeBase } from '@/api/Knowledgebase'

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const nameInputRef = ref(null)
const currentStep = ref(0) // Track the current form step

// 检测是否为移动端
const isMobile = ref(window.innerWidth <= 768)

// 监听窗口大小变化
const handleResize = () => {
    isMobile.value = window.innerWidth <= 768
}
window.addEventListener('resize', handleResize)

// 响应式计算属性
const isMobile = computed(() => window.innerWidth <= 768)
const dialogWidth = computed(() => isMobile.value ? '95%' : '800px')

// Preset covers
const presetCovers = [
    { id: 1, url: '/covers/technology.png', name: '科技' },
    { id: 2, url: '/covers/education.png', name: '教育' },
    { id: 3, url: '/covers/business.png', name: '商业' },
    { id: 4, url: '/covers/design.png', name: '设计' },
    { id: 5, url: '/covers/health.png', name: '健康' },
    { id: 6, url: '/covers/default.png', name: '默认' }
]

// Form data
const form = reactive({
    name: '',
    description: '',
    icon: null,
    chunk_size: 1000,
    chunk_overlap: 200,
    separator: '\n\n',
    embedding_model: 'text2vec-base',
    access_mode: 0,
    vector_store: 'faiss',
    tags: ['金融']
})

// Form validation rules
const rules = {
    name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
    icon: [{ required: true, message: '请选择封面', trigger: 'change' }],
    access_mode: [{ required: true, message: '请选择访问模式', trigger: 'change' }]
}

// Select cover
const selectCover = (coverId) => {
    form.icon = coverId
}

// Reset form
const resetForm = () => {
    Object.assign(form, {
        name: '',
        description: '',
        icon: null,
        chunk_size: 1000,
        chunk_overlap: 200,
        separator: '\n\n',
        embedding_model: 'text2vec-base',
        access_mode: 0,
        vector_store: 'faiss',
        tags: []
    })
}

// Close dialog
const handleClose = () => {
    dialogVisible.value = false
    currentStep.value = 0
    resetForm()
}

// Navigate to next step
const nextStep = () => {
    if (currentStep.value === 0) {
        formRef.value.validateField('icon', (valid) => {
            if (valid) currentStep.value++
        })
    } else if (currentStep.value === 1) {
        formRef.value.validateField('name', (valid) => {
            if (valid) currentStep.value++
        })
    } else {
        currentStep.value++
    }
}

// Navigate to previous step
const prevStep = () => {
    if (currentStep.value > 0) currentStep.value--
}

// Submit form
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

// Open dialog and focus name input
const open = () => {
    dialogVisible.value = true
    currentStep.value = 0
    nextTick(() => {
        if (currentStep.value === 1 && nameInputRef.value) {
            nameInputRef.value.focus()
        }
    })
}

defineExpose({ open })

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
/* Dialog base styles */
:deep(.custom-dialog) {
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    background: var(--el-bg-color, #ffffff);
}

/* Form container */
.form-container {
    padding: 0 12px;
    max-height: 70vh;
    overflow-y: auto;
}

/* Step indicator */
.step-indicator {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary, #6b7280);
    border-bottom: 1px solid var(--el-border-color-light, #e5e7eb);
    padding: 8px 0;
}

.step-indicator span {
    padding: 4px 8px;
    border-radius: 4px;
}

.step-indicator span.active {
    background: var(--el-color-primary, #2563eb);
    color: var(--el-color-white, #ffffff);
}

/* Section title */
.section-title {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary, #1f2a44);
    font-size: 14px;
}

.title-icon {
    margin-right: 6px;
    font-size: 16px;
}

/* Cover selection */
.cover-section {
    margin-bottom: 16px;
    padding: 12px;
    background: var(--el-bg-color-overlay, #f9fafb);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-light, #e5e7eb);
}

.cover-selection {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    justify-content: center;
}

.cover-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    border: 2px solid var(--el-border-color-light, #e5e7eb);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--el-bg-color, #ffffff);
}

.cover-item:hover {
    border-color: var(--el-color-primary, #2563eb);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.cover-item.selected {
    border-color: var(--el-color-primary, #2563eb);
    background: var(--el-fill-color-light, #eff6ff);
}

.cover-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 4px;
}

.cover-name {
    font-size: 12px;
    color: var(--el-text-color-secondary, #6b7280);
    text-align: center;
}

/* Basic info section */
.basic-info-section {
    margin-bottom: 16px;
    padding: 12px;
    background: var(--el-bg-color, #ffffff);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-light, #e5e7eb);
}

/* Parameters section */
.params-section {
    padding: 12px;
    background: var(--el-bg-color, #ffffff);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-light, #e5e7eb);
}

.params-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.param-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.param-item.full-width {
    grid-column: 1 / -1;
}

.param-label {
    font-weight: 500;
    color: var(--el-text-color-regular, #374151);
    font-size: 13px;
}

.param-desc {
    font-size: 11px;
    color: var(--el-text-color-secondary, #6b7280);
}

.model-select {
    width: 100%;
}

/* Form item styles */
:deep(.el-form-item) {
    width: auto;
    padding-right: 5px;
    margin-bottom: 15px;
}

:deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-regular, #374151);
    font-size: 13px;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select .el-input__inner) {
    border-radius: 6px;
    font-size: 13px;
    padding: 8px;
}

:deep(.el-input-number) {
    width: 100%;
}

:deep(.el-input-number .el-input__inner) {
    text-align: center;
}

/* Footer buttons */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 0;
}

:deep(.el-button) {
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 13px;
    min-height: 36px;
    transition: background-color 0.2s ease, transform 0.1s ease;
}

/* Scrollbar styles */
.form-container::-webkit-scrollbar {
    width: 4px;
}

.form-container::-webkit-scrollbar-track {
    background: var(--el-fill-color-light, #f1f5f9);
    border-radius: 2px;
}

.form-container::-webkit-scrollbar-thumb {
    background: var(--el-border-color, #cbd5e1);
    border-radius: 2px;
}

.form-container::-webkit-scrollbar-thumb:hover {
    background: var(--el-border-color-dark, #94a3b8);
}

/* Mobile styles */
@media (max-width: 768px) {
    :deep(.custom-dialog) {
        width: 90%;
        max-width: 600px;
        margin: 20px auto;
        border-radius: 8px;
    }

    .form-container {
        padding: 8px;
        max-height: 80vh;
        overflow-y: auto;
    }

    .step-indicator {
        font-size: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--el-border-color-light, #e5e7eb);
    }

    .section-title {
        font-size: 13px;
        margin-bottom: 8px;
    }

    .title-icon {
        font-size: 14px;
    }

    .cover-section {
        padding: 8px;
        margin-bottom: 12px;
    }

    .cover-selection {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .cover-item {
        padding: 6px;
    }

    .cover-image {
        width: 64px;
        height: 64px;
    }

    .cover-name {
        font-size: 12px;
    }

    .basic-info-section {
        padding: 8px;
        margin-bottom: 12px;
    }

    .params-section {
        padding: 8px;
    }

    .params-grid {
        grid-template-columns: 1fr;
        gap: 10px;
    }

    :deep(.el-form-item) {
        margin-bottom: 10px;
    }

    :deep(.el-form-item__label) {
        font-size: 13px;
    }

    :deep(.el-input__inner),
    :deep(.el-textarea__inner),
    :deep(.el-select .el-input__inner) {
        font-size: 13px;
        padding: 6px 8px;
    }

    :deep(.el-textarea__inner) {
        min-height: 56px;
    }

    :deep(.el-radio) {
        margin-right: 14px;
        font-size: 13px;
    }

    .dialog-footer {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px 0;
    }

    /* 操作按钮组：上一步/下一步/创建 */
    .dialog-footer .action-group {
        display: flex;
        gap: 8px;
    }

    .dialog-footer .action-group :deep(.el-button) {
        flex: 1;
        /* 平分宽度 */
    }

    /* 取消按钮单独占满一行 */
    .dialog-footer> :deep(.el-button:last-child) {
        width: 100%;
    }

    :deep(.el-button) {
        width: 100%;
        font-size: 13px;
        padding: 10px;
        box-sizing: border-box;
    }

    .cover-item:active {
        background: var(--el-fill-color-light, #eef4ff);
        transform: scale(0.97);
    }

    :deep(.el-button:active) {
        background: var(--el-color-primary-dark-2, #1d4ed8);
        transform: scale(0.98);
    }
}
</style>