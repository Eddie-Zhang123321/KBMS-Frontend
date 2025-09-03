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
                    <el-form-item prop="username">
                        <el-input v-model="form.username" placeholder="请输入用户名" size="large">
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
    username: '',
    password: ''
})

// 表单验证规则
const rules = reactive({
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 4, max: 16, message: '长度在4到16个字符', trigger: 'blur' }
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
    ElMessage.info('请联系管理员开通账号')
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
</style>