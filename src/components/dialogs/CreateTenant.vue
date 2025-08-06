<template>
    <el-dialog v-model="visible" title="新增租户" width="500px" :before-close="handleClose">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
            <el-form-item label="租户编码" prop="tenantCode">
                <el-input v-model="formData.tenantCode" placeholder="请输入租户编码" clearable />
            </el-form-item>

            <el-form-item label="租户名称" prop="tenantName">
                <el-input v-model="formData.tenantName" placeholder="请输入租户名称" clearable />
            </el-form-item>

            <el-form-item label="租户状态" prop="tenantStatus">
                <el-select v-model="formData.tenantStatus" placeholder="请选择状态" style="width: 100%">
                    <el-option label="开通" value="开通"></el-option>
                    <el-option label="关闭" value="关闭"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="有效期" prop="expiry">
                <el-date-picker
                    v-model="formData.expiry"
                    type="date"
                    placeholder="请选择日期"
                    style="width: 100%"
                />
            </el-form-item>

            <el-form-item label="租户管理员" prop="tenantAdmin">
                <el-input v-model="formData.tenantAdmin" placeholder="请输入管理员姓名" clearable />
            </el-form-item>

            <el-form-item label="管理员电话" prop="phone">
                <el-input v-model="formData.phone" placeholder="请输入电话号码" clearable />
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

// 控制弹窗显示
const visible = ref(false);

// 表单数据
const formData = reactive({
    tenantCode: '',
    tenantName: '',
    tenantStatus: '开通', // 默认状态为“开通”
    expiry: null, // 有效期
    tenantAdmin: '',
    phone: ''
});

// 表单验证规则
const rules = {
    tenantCode: [
        { required: true, message: '请输入租户编码', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    tenantName: [
        { required: true, message: '请输入租户名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    tenantStatus: [
        { required: true, message: '请选择租户状态', trigger: 'change' }
    ],
    expiry: [
        { required: true, message: '请选择有效期', trigger: 'change' }
    ],
    tenantAdmin: [
        { required: true, message: '请输入管理员姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    phone: [
        { required: true, message: '请输入管理员电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号码', trigger: 'blur' }
    ]
};

const formRef = ref(null);

// 打开弹窗
const open = () => {
    visible.value = true;
    // 重置表单数据
    formData.tenantCode = '';
    formData.tenantName = '';
    formData.tenantStatus = '开通';
    formData.expiry = null;
    formData.tenantAdmin = '';
    formData.phone = '';
};

// 关闭弹窗
const handleClose = () => {
    formRef.value?.resetFields(); // 重置表单验证
    visible.value = false;
};

// 提交表单
const submitForm = async () => {
    try {
        await formRef.value.validate(); // 验证表单
        // 模拟 API 调用（替换为实际 createTenant API）
        console.log('提交数据:', formData);
        // 假设 API 调用成功
        // await createTenant(formData);
        ElMessage.success('租户创建成功');
        handleClose();
    } catch (error) {
        console.error('表单验证失败:', error);
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