<template>
    <el-dialog v-model="visible" title="新增租户" width="500px" :before-close="handleClose">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
            <el-form-item label="租户名称" prop="tenantName">
                <el-input v-model="formData.tenantName" placeholder="请输入租户名称" clearable />
            </el-form-item>

            <el-form-item label="租户状态" prop="tenantStatus">
                <el-select v-model="formData.tenantStatus" placeholder="请选择状态" style="width: 100%">
                    <el-option label="开通" :value="1"></el-option>
                    <el-option label="关闭" :value="0"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="租户管理员" prop="adminNamen">
                <el-input v-model="formData.adminName" placeholder="请输入管理员姓名" clearable />
            </el-form-item>

            <el-form-item label="管理员邮箱" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱地址" clearable />
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
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { createTenant } from '@/api/tenant'

// 控制弹窗显示
const visible = ref(false);

// 表单数据
const formData = reactive({
    tenantName: '',
    tenantStatus: 1, // 默认状态为"开通" (1)
    adminName: '',
    email: ''
});

// 表单验证规则
const rules = {
    tenantName: [
        { required: true, message: '请输入租户名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    tenantStatus: [
        { required: true, message: '请选择租户状态', trigger: 'change' }
    ],
    adminName: [
        { required: true, message: '请输入管理员姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入管理员邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ]
};

const formRef = ref(null);

// 打开弹窗
const open = () => {
    visible.value = true
    // 重置表单数据
    formData.tenantName = ''
    formData.tenantStatus = 1
    formData.adminName = ''
    formData.email = ''
}

// 关闭弹窗
const handleClose = () => {
    formRef.value?.resetFields(); // 重置表单验证
    visible.value = false;
};

// 提交表单
const emit = defineEmits(['success'])

const submitForm = async () => {
    try {
        await formRef.value.validate();
        const res = await createTenant({ ...formData })
        const newId = res?.id || res?.data?.id || `t-${Date.now()}`
        ElMessage.success('租户创建成功')
        
        const payload = {
            mode: 'create',
            row: {
                id: newId,
                code: res?.code || res?.data?.code || `T${Date.now()}`,
                tenantName: formData.tenantName,
                tenantStatus: formData.tenantStatus,
                adminName: formData.adminName,
                email: formData.email
            }
        }
        handleClose()
        emit('success', payload)
    } catch (error) {
        console.error('提交失败:', error)
    }
};

// 暴露方法给父组件
defineExpose({ open });
</script>

<style scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>