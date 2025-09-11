<template>
    <div class="back">
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <img src='@/assets/logo.png' alt="Logo" class="logo">
                    <h1>InsightFlow</h1>
                    <p>请输入您的账号密码</p>
                </div>

                <el-form ref="loginForm" :model="form" :rules="rules" @keyup.enter="handleLogin">
                    <el-form-item prop="email">
                        <el-input v-model="form.email" placeholder="请输入邮箱" size="large">
                            <template #prefix>
                                <el-icon>
                                    <User />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>

                    <el-form-item prop="password">
                        <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large"
                            show-password>
                            <template #prefix>
                                <el-icon>
                                    <Lock />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>

                    <el-checkbox v-model="rememberMe" class="remember-me">记住我</el-checkbox>

                    <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
                        登 录
                    </el-button>
                </el-form>

                <div class="login-footer">
                    <el-link type="info" @click="showForgetDialog">忘记密码?</el-link>
                    <el-divider direction="vertical" />
                    <el-link type="primary" @click="showRegisterDialog">注册账号</el-link>
                </div>
            </div>

            <!-- 背景装饰元素 -->
            <div class="decoration-circle circle-1"></div>
            <div class="decoration-circle circle-2"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const form = reactive({
    email: '',
    password: ''
})

// 表单验证规则
const rules = reactive({
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在6到20个字符', trigger: 'blur' }
    ]
})

const rememberMe = ref(false)
const loading = ref(false)

// 登录处理
const handleLogin = async () => {
    try {
        loading.value = true
        await userStore.login(form)   //  调用 Pinia 的 login 动作

        // 登录接口已经返回了完整的用户信息，无需再次调用 auth/me

        // 获取用户偏好设置以确定默认跳转页面
        try {
            await userStore.fetchPreferences()
        } catch (error) {
            console.warn('Failed to fetch preferences after login:', error)
        }

        ElMessage.success('登录成功')
        router.push(userStore.defaultPage)  // 跳转到用户设置的默认页面
    } catch (error) {
        const msg = error?.message || error?.data?.message || error?.response?.data?.message || '登录失败'
        ElMessage.error(msg)
    } finally {
        loading.value = false
    }
}

const showForgetDialog = () => {
    ElMessage.info('请联系管理员重置密码')
}

const showRegisterDialog = () => {
    router.push('/register')
}
</script>

<style scoped>
.back {
    background-image: url('@/assets/login-bg.svg');
    background-size: cover;
    /* 确保图片覆盖整个区域 */
    background-position: center;
    background-repeat: no-repeat;
    width: 100vw;
    height: 100vh;
}

.login-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    position: relative;
    overflow: hidden;
}

.login-card {
    width: 420px;
    max-width: 90vw;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    z-index: 1;
    transition: all 0.3s ease;
}

.login-card:hover {
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.login-header h1 {
    font-size: 24px;
    color: #303133;
    margin: 15px 0 5px;
}

.login-header p {
    font-size: 14px;
    color: #909399;
}

.logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
}

.remember-me {
    margin-bottom: 20px;
}

.login-btn {
    width: 100%;
    font-size: 16px;
    letter-spacing: 2px;
    height: 48px;
}

.login-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
}

.decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(64, 158, 255, 0.1);
}

.circle-1 {
    width: 300px;
    height: 300px;
    top: -100px;
    left: -100px;
}

.circle-2 {
    width: 200px;
    height: 200px;
    bottom: -50px;
    right: -50px;
}

/* 响应式设计 */

@media (max-width: 768px) {
    .role-management {
        padding: 8px;
        /* 减少整体内边距以节省空间 */
    }

    /* 筛选区域优化 */
    .filter-row .el-col {
        margin-bottom: 12px;
        /* 增加列间距以提高可读性 */
    }

    .filter-row .el-select {
        width: 100%;
        /* 确保下拉框占满宽度 */
    }

    .filter-row .el-button {
        width: 100%;
        /* 按钮占满宽度 */
        font-size: 16px;
        /* 增大字体以提高触控友好性 */
        padding: 12px;
        /* 增加按钮内边距 */
    }

    .text-right {
        justify-content: flex-start;
        /* 按钮左对齐 */
        flex-direction: column;
        /* 垂直排列按钮 */
        gap: 12px;
        /* 增加按钮间距 */
    }

    /* 表头优化 */
    .table-header {
        flex-direction: column;
        /* 垂直排列标题和操作按钮 */
        align-items: flex-start;
        /* 左对齐 */
        gap: 8px;
        /* 增加间距 */
        margin-top: 12px;
        margin-bottom: 8px;
    }

    .table-header .title {
        font-size: 14px;
        /* 减小标题字体 */
        font-weight: 500;
        /* 减轻字体重量 */
    }

    .table-header .actions .el-button {
        width: 100%;
        /* 新建角色按钮占满宽度 */
        font-size: 16px;
        /* 增大字体 */
        padding: 12px;
        /* 增加内边距 */
    }

    /* 表格优化 */
    .el-table {
        margin-top: 8px;
        /* 减少表格上边距 */
    }

    /* 调整表格列宽和字体 */
    :deep(.el-table__header th) {
        font-size: 14px;
        /* 减小表头字体 */
        padding: 8px 0;
        /* 减少表头内边距 */
    }

    :deep(.el-table__cell) {
        font-size: 14px;
        /* 减小单元格字体 */
        padding: 6px 0;
        /* 减少单元格内边距 */
    }

    /* 动态调整列宽 */
    :deep(.el-table__column:nth-child(1)) {
        /* 角色名列 */
        width: 30% !important;
        /* 占屏幕宽度的30% */
    }

    :deep(.el-table__column:nth-child(2)) {
        /* 描述列 */
        width: 35% !important;
        /* 占屏幕宽度的35% */
    }

    :deep(.el-table__column:nth-child(3)) {
        /* 角色类型列 */
        width: 20% !important;
        /* 占屏幕宽度的20% */
    }

    :deep(.el-table__column:nth-child(4)) {
        /* 用户数列 */
        width: 15% !important;
        /* 占屏幕宽度的15% */
    }

    :deep(.el-table__column:nth-child(5)) {
        /* 操作列 */
        width: 100% !important;
        /* 操作列占满剩余空间 */
    }

    /* 操作列按钮优化 */
    :deep(.el-table__cell .cell .el-button) {
        width: 100%;
        /* 按钮占满单元格宽度 */
        margin-bottom: 8px;
        /* 按钮垂直排列，增加间距 */
        font-size: 14px;
        /* 减小字体 */
        padding: 10px;
        /* 增加内边距以提高触控友好性 */
    }

    /* 隐藏多余的按钮边距 */
    :deep(.el-table__cell .cell .el-button + .el-button) {
        margin-left: 0;
        /* 移除按钮间的水平间距 */
    }

    /* 确保表格内容左对齐 */
    :deep(.el-table__cell .cell) {
        text-align: left !important;
    }
}
</style>
