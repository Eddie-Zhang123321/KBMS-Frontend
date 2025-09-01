<template>
    <el-dialog title="添加数据源" v-model="dialogVisible" width="30%" @close="handleClose">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="数据源类型" prop="type">
                <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%" @change="handleTypeChange">
                    <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>

            <el-form-item label="上传文件" prop="files" v-if="form.type === 'document'">
                <el-upload ref="uploadRef" :action="uploadUrl" :data="extraParams" :before-upload="beforeUpload"
                    :file-list="fileList" :limit="5" :on-exceed="handleExceed" :on-change="handleFileChange" multiple
                    :auto-upload="false">
                    <el-button size="small" type="primary">选择文件</el-button>
                    <template #tip>
                        <div class="el-upload__tip">
                            支持扩展名：.pdf .doc .docx .txt 等，单个文件大小不超过 2MB
                        </div>
                    </template>
                </el-upload>
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
import { ref, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()

const props = defineProps({
    visible: { type: Boolean, required: true }
})
const emit = defineEmits(['update:visible', 'add'])

const dialogVisible = ref(false)
watch(() => props.visible, (newVal) => {
    dialogVisible.value = newVal
})

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

const formRef = ref(null)
const uploadRef = ref(null)
const fileList = ref([])
const form = ref({
    type: 'document'
})

const knowledgeBaseId = ref(route.params.id || route.path.split('/').pop())
const uploadUrl = import.meta.env.VITE_DEV_BASE_API + '/datasource/upload'
const submitting = ref(false)

const typeOptions = [
    { label: '文档', value: 'document' }
]

const rules = {
    type: [{ required: true, message: '请选择数据源类型', trigger: 'change' }],
    files: [{
        validator: (rule, value, callback) => {
            if (form.value.type === 'document' && fileList.value.length === 0) {
                callback(new Error('请至少选择一个文件'))
            } else {
                callback()
            }
        },
        trigger: ['change', 'blur']
    }]
}

const extraParams = {
    init_config_id: 1,
    uploader_id: 1,
    tenant_id: 1
}

const handleTypeChange = (val) => {
    if (val !== 'document') {
        fileList.value = []
        if (uploadRef.value) {
            uploadRef.value.clearFiles()
        }
    }
}

const handleExceed = () => {
    ElMessage.warning(`最多上传 ${uploadRef.value?.attrs?.limit || 5} 个文件`)
}

const beforeUpload = (file) => {
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

const handleFileChange = (file, fileListParam) => {
    fileList.value = fileListParam
}

const submitForm = async () => {
    if (submitting.value) return

    try {
        await formRef.value.validate()
        submitting.value = true

        if (form.value.type === 'url') {
            emit('add', { type: 'url' })
            dialogVisible.value = false
            return
        }

        if (form.value.type === 'database') {
            emit('add', { type: 'database' })
            dialogVisible.value = false
            return
        }

        // For 'document' type
        if (fileList.value.length === 0) {
            ElMessage.error('请至少选择一个文件')
            return
        }

        const formData = new FormData()
        fileList.value.forEach((file) => {
            formData.append('file', file.raw)
        })
        formData.append('init_config_id', extraParams.init_config_id)
        formData.append('uploader_id', extraParams.uploader_id)
        formData.append('tenant_id', extraParams.tenant_id)

        const response = await axios.post(uploadUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (response.data.message == "success") {
            ElMessage.success('创建成功')
            emit('add', { type: 'document', data: response.data.data })
            dialogVisible.value = false
        } else {
            ElMessage.error(`上传失败: ${response.data.message || '未知错误'}`)
        }
    } catch (error) {
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
        })
    }
})
</script>

<style scoped>
.dialog-footer {
    text-align: right;
}
</style>