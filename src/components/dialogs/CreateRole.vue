<template>
    <el-dialog v-model="visible" title="新建角色" width="520px" :before-close="handleClose">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="96px" label-position="right">
            <el-form-item label="角色名" prop="name">
                <el-input v-model="formData.name" placeholder="请输入角色名" clearable />
            </el-form-item>

            <el-form-item label="描述" prop="description">
                <el-input v-model="formData.description" placeholder="请输入描述" type="textarea" :rows="3" />
            </el-form-item>

            <el-form-item label="角色类型" prop="type">
                <el-select v-model="formData.type" placeholder="请选择角色类型" style="width: 100%">
                    <el-option label="平台级" value="platform" />
                    <el-option label="知识库级" value="kb" />
                    <el-option label="普通级" value="normal" />
                </el-select>
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { createRole } from '@/api/role'

const visible = ref(false)
const submitting = ref(false)

const formData = reactive({
    name: '',
    description: '',
    type: ''
})

const rules = {
    name: [
        { required: true, message: '请输入角色名', trigger: 'blur' },
        { min: 2, max: 32, message: '长度在 2 到 32 个字符', trigger: 'blur' }
    ],
    description: [
        { required: true, message: '请输入描述', trigger: 'blur' },
        { min: 2, max: 200, message: '长度在 2 到 200 个字符', trigger: 'blur' }
    ],
    type: [
        { required: true, message: '请选择角色类型', trigger: 'change' }
    ]
}

const formRef = ref(null)

const open = () => {
    visible.value = true
}

const handleClose = () => {
    formRef.value?.resetFields()
    visible.value = false
}

const submitForm = async () => {
    try {
        submitting.value = true
        await formRef.value.validate()
        await createRole({ ...formData })
        ElMessage.success('创建成功')
        handleClose()
        emit('success')
    } catch (error) {
        if (error) {
            ElMessage.error(error.message || '创建失败')
        }
    } finally {
        submitting.value = false
    }
}

const emit = defineEmits(['success'])

defineExpose({ open })
</script>

<style scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>


