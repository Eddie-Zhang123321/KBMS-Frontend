<template>
    <el-dialog v-model="visible" title="编辑用户" :width="dialogWidth" :before-close="handleClose" :fullscreen="isMobile">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
            <el-form-item label="用户ID">
                <el-input v-model="formData.userId" disabled />
            </el-form-item>

            <el-form-item label="用户名" prop="userName">
                <el-input v-model="formData.userName" placeholder="请输入用户名" clearable />
            </el-form-item>

            <el-form-item label="角色" prop="role">
                <el-select v-model="formData.role" placeholder="请选择角色" style="width: 100%">
                    <el-option label="平台管理员" value="platform_admin" />
                    <el-option label="超级管理员" value="super_admin" />
                    <el-option label="知识库所有人" value="kb_owner" />
                    <el-option label="知识库管理员" value="kb_admin" />
                    <el-option label="普通用户" value="user" />
                </el-select>
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
                <el-input v-model="formData.phone" placeholder="请输入手机号" clearable />
            </el-form-item>

            <el-form-item label="状态" prop="status">
                <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                    <el-option label="开启" value="开启" />
                    <el-option label="关闭" value="关闭" />
                </el-select>
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { updateUserStatus } from '@/api/user'

const visible = ref(false)
const submitting = ref(false)

// 响应式计算属性
const isMobile = computed(() => window.innerWidth <= 768)
const dialogWidth = computed(() => isMobile.value ? '95%' : '520px')
const formRef = ref(null)

const formData = reactive({
    userId: '',
    userName: '',
    role: '',
    phone: '',
    status: ''
})

const rules = {
    userName: [ { required: true, message: '请输入用户名', trigger: 'blur' } ],
    role: [ { required: true, message: '请选择角色', trigger: 'change' } ],
    status: [ { required: true, message: '请选择状态', trigger: 'change' } ],
}

const open = (row) => {
    visible.value = true
    formData.userId = row.userId
    formData.userName = row.userName
    formData.role = row.role
    formData.phone = row.phone
    formData.status = row.status
}

const handleClose = () => {
    visible.value = false
}

const emit = defineEmits(['success'])

const submit = async () => {
    try {
        submitting.value = true
        await formRef.value.validate()
        await updateUserStatus(formData.userId, {
            userName: formData.userName,
            role: formData.role,
            phone: formData.phone,
            status: formData.status
        })
        ElMessage.success('用户更新成功')
        visible.value = false
        emit('success', { ...formData })
    } catch (e) {
        // 已有校验与请求提示
    } finally {
        submitting.value = false
    }
}

defineExpose({ open })
</script>

<style scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .dialog-footer {
        flex-direction: column;
        gap: 8px;
    }
    
    .dialog-footer .el-button {
        width: 100%;
    }
    
    :deep(.el-form-item__label) {
        width: 80px !important;
    }
    
    :deep(.el-dialog__body) {
        padding: 20px 15px;
    }
}
</style>


