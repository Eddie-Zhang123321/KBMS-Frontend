<template>
    <el-dialog v-model="visible" title="新增用户" :width="dialogWidth" :before-close="handleClose" :fullscreen="isMobile">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
            <el-form-item label="用户名称" prop="userName">
                <el-input v-model="formData.userName" placeholder="请输入用户名称" clearable />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱" clearable />
            </el-form-item>

            <el-form-item label="部门" prop="department">
                <el-select v-model="formData.department" placeholder="请选择部门" style="width: 100%" clearable>
                    <el-option v-for="dept in departmentOptions" :key="dept.id" :label="dept.name" :value="dept.name" />
                </el-select>
            </el-form-item>

            <el-form-item label="角色" prop="tenantSuperAdmin">
                <el-select v-model="formData.tenantSuperAdmin" placeholder="请选择角色" style="width: 100%">
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createUser } from '@/api/user'
import { getDepartments } from '@/api/department'

// 定义事件
const emit = defineEmits(['user-created'])

// 控制弹窗显示
const visible = ref(false)

// 响应式计算属性
const isMobile = computed(() => window.innerWidth <= 768)
const dialogWidth = computed(() => isMobile.value ? '95%' : '500px')

// 表单数据
const formData = reactive({
    userName: '',  // 与用户列表字段保持一致
    email: '',
    tenantSuperAdmin: false,  // 角色字段改为布尔值
    password: '',
    department: ''  // 添加部门字段
})

// 角色选项
const roleOptions = [
    { label: '普通用户', value: false },
    { label: '超级管理员', value: true }
]

// 部门选项
const departmentOptions = ref([])

// 表单验证规则
const rules = {
    userName: [
        { required: true, message: '请输入用户名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    tenantSuperAdmin: [
        { required: true, message: '请选择角色', trigger: 'change' }
    ],
    password: [
        { required: true, message: '请输入默认密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    department: [
        { required: true, message: '请选择部门', trigger: 'change' },
        { 
            validator: (rule, value, callback) => {
                if (!value) {
                    callback(new Error('请选择部门'))
                } else if (!departmentOptions.value.some(dept => dept.name === value)) {
                    callback(new Error('请选择有效的部门'))
                } else {
                    callback()
                }
            }, 
            trigger: 'change' 
        }
    ]
}

const formRef = ref(null)

// 获取部门数据
const fetchDepartments = async () => {
    try {
        const response = await getDepartments()
        console.log('部门数据响应:', response)
        
        // 处理响应数据，使用正确的API格式
        if (response && response.data && response.data.items) {
            departmentOptions.value = response.data.items.map(d => ({ id: d.id, name: d.name }))
        } else if (response && response.items) {
            departmentOptions.value = response.items.map(d => ({ id: d.id, name: d.name }))
        } else if (Array.isArray(response)) {
            departmentOptions.value = response.map(d => ({ id: d.id, name: d.name }))
        } else {
            console.warn('部门数据解析失败，响应格式:', response)
            departmentOptions.value = []
        }
        
        console.log('部门选项:', departmentOptions.value)
    } catch (error) {
        console.error('获取部门数据失败', error)
        ElMessage.error('获取部门数据失败: ' + (error.message || '未知错误'))
        departmentOptions.value = []
    }
}

// 打开弹窗
const open = () => {
    visible.value = true
    // 每次打开弹窗时获取最新的部门数据
    fetchDepartments()
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
        
        console.log('创建用户数据:', formData)
        
        // 调用创建用户API
        const response = await createUser(formData)
        console.log('创建用户响应:', response)
        
        ElMessage.success('用户创建成功')
        
        // 通知父组件刷新用户列表
        emit('user-created', response?.data || response)
        
        handleClose()
    } catch (error) {
        console.error('创建用户失败:', error)
        ElMessage.error('创建用户失败: ' + (error.message || '未知错误'))
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