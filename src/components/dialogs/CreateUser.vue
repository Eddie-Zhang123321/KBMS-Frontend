<template>
    <el-dialog v-model="visible" title="新增用户" width="500px" :before-close="handleClose">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
            <el-form-item label="用户名称" prop="username">
                <el-input v-model="formData.username" placeholder="请输入用户名称" clearable />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱" clearable />
            </el-form-item>

            <el-form-item label="角色" prop="role">
                <el-select v-model="formData.role" placeholder="请选择角色" style="width: 100%">
                    <el-option v-for="item in roleOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>

            <el-form-item label="默认密码" prop="password">
                <el-input v-model="formData.password" placeholder="请输入默认密码" show-password clearable />
            </el-form-item>
        </el-form>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="submitForm">确定</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 控制弹窗显示
const visible = ref(false)

// 表单数据
const formData = reactive({
    username: '',
    email: '',
    role: 'user',
    password: ''
})

// 角色选项
const roleOptions = [
    { label: '普通用户', value: 'user' },
    { label: '管理员', value: 'admin' },
    { label: '超级管理员', value: 'superadmin' }
]

// 表单验证规则
const rules = {
    username: [
        { required: true, message: '请输入用户名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    role: [
        { required: true, message: '请选择角色', trigger: 'change' }
    ],
    password: [
        { required: true, message: '请输入默认密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ]
}

const formRef = ref(null)

// 打开弹窗
const open = () => {
    visible.value = true
}

// 关闭弹窗
const handleClose = () => {
    formRef.value?.resetFields()
    visible.value = false
}

// 提交表单
const submitForm = async () => {
    try {
        await formRef.value.validate()
        // 这里替换为实际的API调用
        // await createUser(formData)
        ElMessage.success('用户创建成功')
        handleClose()
    } catch (error) {
        console.error('表单验证失败:', error)
    }
}

// 暴露方法给父组件
defineExpose({ open })
</script>

<style scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>