<template>
    <el-dialog title="添加数据源" v-model="dialogVisible" width="30%" @close="handleClose">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="数据源类型" prop="type">
                <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%" @change="handleTypeChange">
                    <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>

            <el-form-item v-if="form.type !== 'url'" label="上传文件" prop="files">
                <el-upload ref="uploadRef" :action="uploadUrl" :on-success="handleUploadSuccess"
                    :on-error="handleUploadError" :before-upload="beforeUpload" :auto-upload="false"
                    :file-list="fileList" :limit="5" :on-exceed="handleExceed" multiple>
                    <el-button size="small" type="primary">选择文件</el-button>
                    <template #tip>
                        <div class="el-upload__tip">
                            支持扩展名：.pdf .doc .docx .txt 等，单个文件大小不超过 2MB
                        </div>
                    </template>
                </el-upload>

                <el-table :data="fileList" size="small" style="margin-top: 10px" v-if="fileList.length > 0">
                    <el-table-column prop="name" label="文件名" />
                    <el-table-column prop="size" label="大小(KB)" :formatter="formatFileSize" />
                    <el-table-column label="状态">
                        <template #default="{ row }">
                            <el-tag v-if="row.status === 'success'" size="small" type="success">已上传</el-tag>
                            <el-tag v-else-if="row.status === 'ready'" size="small">待上传</el-tag>
                            <el-tag v-else size="small" type="danger">失败</el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="submitForm" :loading="submitting">
                    {{ submitting ? '提交中...' : '确定' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { createDataSource } from '@/api/Knowledgebase'

const route = useRoute()

const props = defineProps({
    visible: { type: Boolean, required: true }
})
const emit = defineEmits(['update:visible', 'add'])

const dialogVisible = ref(false)
watch(() => props.visible, (newVal) => {
    dialogVisible.value = newVal
})

const formRef = ref(null)
const uploadRef = ref(null)
const fileList = ref([])
const form = ref({
    type: ''
})

const databaseId = ref(route.params.id || route.path.split('/').pop())
const uploadUrl = import.meta.env.VITE_API_BASE_URL + '/upload'
const submitting = ref(false)

const typeOptions = [
    { label: '文档', value: 'document' },
    { label: '图像', value: 'image' },
    { label: '结构化', value: 'structured' }
]

const rules = {
    type: [{ required: true, message: '请选择数据源类型', trigger: 'change' }],
    files: [{
        validator: (_, __, callback) => {
            const hasFiles = fileList.value.length > 0
            if (form.value.type !== 'url' && !hasFiles) {
                callback(new Error('请至少选择一个文件'))
            } else {
                callback()
            }
        },
        trigger: 'change'
    }]
}

const handleTypeChange = (val) => {
    if (val === 'url') {
        fileList.value = []
    }
}

const handleExceed = () => {
    ElMessage.warning(`最多上传 ${uploadRef.value?.attrs?.limit || 5} 个文件`)
}

const handleUploadSuccess = (response, file) => {
    ElMessage.success(`${file.name} 上传成功`)
}

const handleUploadError = (err, file) => {
    ElMessage.error(`${file.name} 上传失败: ${err.message || '未知错误'}`)
}

const formatFileSize = (row) => {
    return (row.size / 1024).toFixed(2)
}

const handleClose = () => {
    if (submitting.value) {
        ElMessageBox.confirm('正在提交中，确定要关闭吗？', '提示', {
            type: 'warning',
        }).then(() => {
            emit('update:visible', false)
        }).catch(() => { })
    } else {
        emit('update:visible', false)
    }
}

const submitForm = async () => {
    if (submitting.value) return
    submitting.value = true

    try {
        await formRef.value.validate()

        const uploadFiles = uploadRef.value?.uploadFiles || []
        const pendingFiles = uploadFiles.filter(file => file.status === 'ready')

        if (form.value.type !== 'url' && pendingFiles.length === 0 && uploadFiles.length === 0) {
            ElMessage.error('请至少选择一个文件')
            submitting.value = false
            return
        }

        let uploadedFilesData = []

        if (pendingFiles.length > 0) {
            ElMessage.info('正在上传文件，请稍候...')
            uploadRef.value?.submit()

            const checkUploadComplete = () => {
                return new Promise((resolve, reject) => {
                    const interval = setInterval(() => {
                        const currentFiles = uploadRef.value?.uploadFiles || []
                        const stillPending = currentFiles.filter(f => f.status === 'ready').length
                        const hasError = currentFiles.some(f => f.status === 'error')

                        if (stillPending === 0) {
                            clearInterval(interval)
                            if (hasError) {
                                reject(new Error('部分文件上传失败'))
                            } else {
                                resolve()
                            }
                        }
                    }, 500)

                    setTimeout(() => {
                        clearInterval(interval)
                        reject(new Error('上传超时'))
                    }, 30000)
                })
            }

            try {
                await checkUploadComplete()
                ElMessage.success('所有文件上传成功')
            } catch (uploadErr) {
                ElMessage.error(uploadErr.message)
                submitting.value = false
                return
            }
        }

        const successFiles = (uploadRef.value?.uploadFiles || []).filter(f => f.status === 'success')
        uploadedFilesData = successFiles.map(file => ({
            name: file.name,
            size: file.size
        }))

        const payload = {
            type: form.value.type,
            files: uploadedFilesData
        }

        const res = await createDataSource(databaseId.value, payload)

        if (res.code === 0 || res.success) {
            ElMessage.success('数据源创建成功')
            emit('add', {
                ...form.value,
                files: uploadedFilesData
            })
            emit('update:visible', false)
        } else {
            ElMessage.error(res.message || '创建数据源失败')
        }

    } catch (error) {
        ElMessage.error('提交失败: ' + (error.message || '未知错误'))
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped>
.dialog-footer {
    text-align: right;
}
</style>
