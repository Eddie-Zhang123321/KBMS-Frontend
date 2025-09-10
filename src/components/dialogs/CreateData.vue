<!-- src/components/dialogs/CreateData.vue -->
<template>
    <el-dialog title="添加数据源" v-model="dialogVisible" width="600px" @close="handleClose">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="数据源类型" prop="type">
                <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%" @change="handleTypeChange">
                    <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>

            <!-- 文档上传区域 -->
            <el-form-item label="上传文件" prop="files" v-if="form.type === 'document'">
                <el-upload ref="uploadRef" :file-list="fileList" :limit="5" :on-exceed="handleExceed"
                    :on-change="handleFileChange" :before-upload="beforeDocumentUpload" multiple :auto-upload="false">
                    <el-button size="small" type="primary">选择文件</el-button>
                    <template #tip>
                        <div class="el-upload__tip">
                            支持扩展名：.pdf .doc .docx .txt 等，单个文件大小不超过 2MB
                        </div>
                    </template>
                </el-upload>
            </el-form-item>

            <!-- 图片上传区域 -->
            <el-form-item label="上传图片" prop="images" v-if="form.type === 'image'">
                <el-upload ref="imageUploadRef" :file-list="imageList" :limit="10" :on-exceed="handleExceed"
                    :on-change="handleImageChange" :before-upload="beforeImageUpload" multiple :auto-upload="false"
                    list-type="picture-card" :on-preview="handlePictureCardPreview">
                    <el-icon>
                        <Plus />
                    </el-icon>
                    <template #tip>
                        <div class="el-upload__tip">
                            支持扩展名：.jpg .jpeg .png .gif .bmp 等，单个图片大小不超过 5MB
                        </div>
                    </template>
                </el-upload>
            </el-form-item>

            <!-- 初始化策略选择 -->
            <el-form-item label="初始化策略" prop="initStrategy">
                <el-radio-group v-model="form.initStrategy" @change="handleStrategyChange">
                    <el-radio value="smart">智能初始化</el-radio>
                    <el-radio value="default">默认初始化</el-radio>
                    <el-radio value="custom">自定义初始化</el-radio>
                </el-radio-group>
            </el-form-item>

            <!-- 自定义初始化参数 -->
            <div v-if="form.initStrategy === 'custom'" class="custom-init-params">
                <div class="params-section">
                    <h4 class="params-title">自定义初始化参数</h4>
                    <div class="params-grid">
                        <div class="param-item">
                            <label class="param-label">分块大小</label>
                            <el-input-number v-model="form.customConfig.chunkSize" :min="100" :max="5000" :step="100"
                                size="small" />
                            <span class="param-desc">字符数</span>
                        </div>
                        <div class="param-item">
                            <label class="param-label">重叠大小</label>
                            <el-input-number v-model="form.customConfig.chunkOverlap" :min="0" :max="1000" :step="50"
                                size="small" />
                            <span class="param-desc">字符数</span>
                        </div>
                        <div class="param-item full-width">
                            <label class="param-label">分隔符</label>
                            <el-input v-model="form.customConfig.separator" placeholder="例如：\n\n" size="small" />
                        </div>
                        <div class="param-item full-width">
                            <label class="param-label">嵌入模型</label>
                            <el-select v-model="form.customConfig.embeddingModel" placeholder="选择模型" size="small"
                                class="model-select">
                                <el-option label="text2vec-base" value="text2vec-base" />
                                <el-option label="text2vec-large" value="text2vec-large" />
                            </el-select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 策略说明 -->
            <el-form-item v-if="form.initStrategy !== 'custom'" class="strategy-description">
                <div class="description-content">
                    <template v-if="form.initStrategy === 'smart'">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                        <span>智能初始化将自动分析内容，智能选择最佳的分块策略和参数</span>
                    </template>
                    <template v-else-if="form.initStrategy === 'default'">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                        <span>使用本知识库默认参数进行初始化</span>
                    </template>
                </div>
            </el-form-item>
        </el-form>

        <!-- 图片预览对话框 -->
        <el-dialog v-model="imagePreviewVisible" title="图片预览" width="60%">
            <img w-full :src="previewImageUrl" alt="Preview Image" style="max-width: 100%;" />
        </el-dialog>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose" :disabled="submitting">取消</el-button>
                <el-button type="primary" @click="submitForm" :loading="submitting">
                    {{ submitting ? '提交中...' : '确定' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { InfoFilled, Plus } from '@element-plus/icons-vue'
import { createDataSource } from '@/api/Knowledgebase' // 修改API调用

const route = useRoute()

const props = defineProps({
    visible: { type: Boolean, required: true }
})
const emit = defineEmits(['update:visible', 'add'])

const dialogVisible = ref(false)
watch(() => props.visible, (newVal) => {
    console.log('props.visible changed:', newVal)
    dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
    console.log('dialogVisible changed:', newVal)
    emit('update:visible', newVal)
})

const handleClose = () => {
    if (submitting.value) {
        ElMessageBox.confirm('正在提交中，确定要关闭吗？', '提示', {
            type: 'warning',
        }).then(() => {
            emit('update:visible', false)
            resetForm()
        }).catch(() => { })
    } else {
        emit('update:visible', false)
        resetForm()
    }
}

const formRef = ref(null)
const uploadRef = ref(null)
const imageUploadRef = ref(null)
const fileList = ref([])
const imageList = ref([])
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

const form = reactive({
    type: 'document',
    initStrategy: 'smart',
    customConfig: {
        chunkSize: 1000,
        chunkOverlap: 200,
        separator: '\n\n',
        embeddingModel: 'text2vec-base'
    }
})

const knowledgeBaseId = ref(route.params.id || route.path.split('/').pop())
const submitting = ref(false)

const typeOptions = [
    { label: '文档', value: 'document' },
    { label: '图片', value: 'image' }
]

const rules = {
    type: [{ required: true, message: '请选择数据源类型', trigger: 'change' }],
    files: [{
        validator: (rule, value, callback) => {
            if (form.type === 'document' && fileList.value.length === 0) {
                callback(new Error('请至少选择一个文件'))
            } else {
                callback()
            }
        },
        trigger: ['change', 'blur']
    }],
    images: [{
        validator: (rule, value, callback) => {
            if (form.type === 'image' && imageList.value.length === 0) {
                callback(new Error('请至少选择一张图片'))
            } else {
                callback()
            }
        },
        trigger: ['change', 'blur']
    }],
    initStrategy: [{ required: true, message: '请选择初始化策略', trigger: 'change' }]
}

const handleTypeChange = (val) => {
    // 切换类型时清空文件列表
    if (val === 'document') {
        imageList.value = []
        if (imageUploadRef.value) {
            imageUploadRef.value.clearFiles()
        }
    } else if (val === 'image') {
        fileList.value = []
        if (uploadRef.value) {
            uploadRef.value.clearFiles()
        }
    }
}

const handleStrategyChange = (strategy) => {
    console.log('初始化策略变更:', strategy)
}

const handleExceed = () => {
    ElMessage.warning(`最多上传 ${form.type === 'document' ? 5 : 10} 个文件`)
}

const beforeDocumentUpload = (file) => {
    const validTypes = ['pdf', 'doc', 'docx', 'txt']
    const extension = file.name.split('.').pop().toLowerCase()
    const isLt2M = file.size / 1024 / 1024 < 2

    if (!validTypes.includes(extension)) {
        ElMessage.error(`不支持 ${extension} 格式的文件`)
        return false
    }

    if (!isLt2M) {
        ElMessage.error('文件大小不能超过 2MB')
        return false
    }

    return true
}

const beforeImageUpload = (file) => {
    const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    const extension = file.name.split('.').pop().toLowerCase()
    const isLt5M = file.size / 1024 / 1024 < 5

    if (!validTypes.includes(extension)) {
        ElMessage.error(`不支持 ${extension} 格式的图片`)
        return false
    }

    if (!isLt5M) {
        ElMessage.error('图片大小不能超过 5MB')
        return false
    }

    return true
}

const handleFileChange = (file, fileListParam) => {
    fileList.value = fileListParam
    console.log('File list updated:', fileList.value.map(f => f.name))
}

const handleImageChange = (file, imageListParam) => {
    imageList.value = imageListParam
    console.log('Image list updated:', imageList.value.map(f => f.name))
}

const handlePictureCardPreview = (file) => {
    previewImageUrl.value = file.url
    imagePreviewVisible.value = true
}

const resetForm = () => {
    form.type = 'document'
    form.initStrategy = 'smart'
    form.customConfig = {
        chunkSize: 1000,
        chunkOverlap: 200,
        separator: '\n\n',
        embeddingModel: 'text2vec-base'
    }
    fileList.value = []
    imageList.value = []
    if (uploadRef.value) {
        uploadRef.value.clearFiles()
    }
    if (imageUploadRef.value) {
        imageUploadRef.value.clearFiles()
    }
    console.log('Form reset')
}

const submitForm = async () => {
    if (submitting.value) return

    try {
        await formRef.value.validate()
        submitting.value = true

        // 创建FormData并添加所有文件
        const formData = new FormData()
        formData.append('knowledge_base_id', knowledgeBaseId.value)
        formData.append('type', form.type)

        // 初始化策略
        const strategyMap = {
            smart: 0,
            default: 1,
            custom: 2
        }
        const initStrategyType = strategyMap[form.initStrategy]
        if (initStrategyType === undefined) {
            ElMessage.error('无效的初始化策略')
            return
        }
        formData.append('init_strategy_type', initStrategyType)

        // 自定义配置
        if (form.initStrategy === 'custom') {
            const customConfig = {
                embedding_model: form.customConfig.embeddingModel,
                chunk_size: form.customConfig.chunkSize,
                chunk_overlap: form.customConfig.chunkOverlap,
                separator: form.customConfig.separator
            }
            formData.append('custom_config', JSON.stringify(customConfig))
        }

        // 处理文件上传
        if (form.type === 'document') {
            if (fileList.value.length === 0) {
                ElMessage.error('请至少选择一个文件')
                return
            }

            // 添加文件
            fileList.value.forEach((file) => {
                formData.append('files', file.raw)
            })
        }
        // 处理图片上传
        else if (form.type === 'image') {
            if (imageList.value.length === 0) {
                ElMessage.error('请至少选择一张图片')
                return
            }

            // 添加图片
            imageList.value.forEach((file) => {
                formData.append('images', file.raw)
            })
        }

        console.log('Creating data source with:', {
            knowledge_base_id: knowledgeBaseId.value,
            type: form.type,
            files: form.type === 'document' ? fileList.value.map(f => f.name) : null,
            images: form.type === 'image' ? imageList.value.map(f => f.name) : null,
            init_strategy_type: initStrategyType,
            custom_config: form.initStrategy === 'custom' ? form.customConfig : null
        })

        // 调用API上传文件并创建数据源
        const response = await createDataSource(knowledgeBaseId.value, formData)
        console.log('Create data source response:', response)

        // 检查响应
        if (response.message === 'success' || response.success) {
            ElMessage.success('数据源添加成功')
            emit('add', {
                type: form.type,
                initStrategy: form.initStrategy,
                customConfig: form.initStrategy === 'custom' ? form.customConfig : null,
                data: response.data || response
            })
            dialogVisible.value = false
            resetForm()
        } else {
            ElMessage.error(`创建数据源失败: ${response.message || '未知错误'}`)
        }
    } catch (error) {
        console.error('提交错误:', error)
        ElMessage.error(error.message || '提交失败')
    } finally {
        submitting.value = false
    }
}

watch(dialogVisible, (newVal) => {
    if (newVal) {
        nextTick(() => {
            if (uploadRef.value) {
                console.log('uploadRef initialized:', uploadRef.value)
            } else {
                console.error('uploadRef 未正确初始化')
            }
            if (imageUploadRef.value) {
                console.log('imageUploadRef initialized:', imageUploadRef.value)
            } else {
                console.error('imageUploadRef 未正确初始化')
            }
        })
    }
})
</script>

<style scoped>
/* 样式保持不变 */
.dialog-footer {
    text-align: right;
}

.custom-init-params {
    margin: 16px 0;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.params-title {
    margin: 0 0 12px 0;
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
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
    color: #374151;
    font-size: 13px;
}

.param-desc {
    font-size: 11px;
    color: #6b7280;
}

.model-select {
    width: 100%;
}

.strategy-description {
    margin-top: -10px;
}

.description-content {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: #f0f9ff;
    border-radius: 4px;
    border: 1px solid #bae6fd;
    color: #0369a1;
    font-size: 13px;
}

.description-content .el-icon {
    margin-right: 6px;
    font-size: 14px;
}

:deep(.el-input-number) {
    width: 100%;
}

:deep(.el-input-number .el-input__inner) {
    text-align: center;
}

:deep(.el-radio-group) {
    display: flex;
    gap: 20px;
}
</style>