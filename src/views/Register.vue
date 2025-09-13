<template>
    <div class="back">
        <CubeBackground />
        <div class="register-container">
            <div class="register-card">
                <div class="register-header">
                    <img src='@/assets/logo.png' alt="Logo" class="logo">
                    <h1>InsightFlow</h1>
                    <p>注册新账号</p>
                </div>

                <el-tabs v-model="activeTab" class="register-tabs">
                    <el-tab-pane label="企业注册" name="tenant">
                        <el-form ref="tenantFormRef" :model="tenantForm" :rules="tenantRules" @submit.prevent>
                            <el-form-item prop="tenantName">
                                <el-input v-model="tenantForm.tenantName" placeholder="请输入租户名称" size="large">
                                    <template #prefix>
                                        <el-icon><OfficeBuilding /></el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>

                            <el-form-item prop="superAdmin">
                                <el-input v-model="tenantForm.superAdmin" placeholder="请输入超级管理员姓名" size="large">
                                    <template #prefix>
                                        <el-icon><User /></el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>

                            <el-form-item prop="email">
                                <el-input v-model="tenantForm.email" placeholder="请输入超级管理员邮箱" size="large">
                                    <template #prefix>
                                        <el-icon><Message /></el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>

                            <el-form-item prop="password">
                                <el-input v-model="tenantForm.password" type="password" placeholder="请输入登录密码" size="large" show-password>
                                    <template #prefix>
                                        <el-icon><Lock /></el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>

                            <el-button type="primary" size="large" class="register-btn" :loading="tenantLoading" @click="handleTenantRegister">
                                注 册
                            </el-button>
                        </el-form>
                    </el-tab-pane>

                    <el-tab-pane label="用户注册" name="user">
                        <el-form ref="userFormRef" :model="userForm" :rules="userRules" @submit.prevent>
                            <el-form-item prop="userName">
                                <el-input v-model="userForm.userName" placeholder="请输入用户名" size="large">
                                    <template #prefix>
                                        <el-icon><User /></el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>

                            <el-form-item prop="email">
                                <el-input v-model="userForm.email" placeholder="请输入邮箱" size="large">
                                    <template #prefix>
                                        <el-icon><Message /></el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>

                            <el-form-item prop="code">
                                <el-input v-model="userForm.code" placeholder="请输入租户编码" size="large" type="number">
                                    <template #prefix>
                                        <el-icon><OfficeBuilding /></el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>

                            <el-form-item prop="department">
                                <el-input v-model="userForm.department" placeholder="请输入所属部门" size="large">
                                    <template #prefix>
                                        <el-icon><OfficeBuilding /></el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>


                            <el-form-item prop="password">
                                <el-input v-model="userForm.password" type="password" placeholder="请输入登录密码" size="large" show-password>
                                    <template #prefix>
                                        <el-icon><Lock /></el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>

                            <el-button type="primary" size="large" class="register-btn" :loading="userLoading" @click="handleUserRegister">
                                注 册
                            </el-button>
                        </el-form>
                    </el-tab-pane>
                </el-tabs>

                <div class="register-footer">
                    <el-link type="primary" @click="goToLogin">返回登录</el-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
    User, 
    Lock, 
    Message, 
    OfficeBuilding
} from '@element-plus/icons-vue'
import { tenantRegisterAPI, userRegisterAPI } from '@/api/user'
import CubeBackground from '@/components/CubeBackground.vue'

const router = useRouter()

// 活跃的Tab
const activeTab = ref('tenant')

// 企业注册表单
const tenantForm = reactive({
    tenantName: '',
    superAdmin: '',
    email: '',
    password: ''
})

// 用户注册表单
const userForm = reactive({
    userName: '',
    email: '',
    code: '',
    department: '',
    password: ''
})

// 企业注册表单验证规则
const tenantRules = reactive({
    tenantName: [
        { required: true, message: '请输入租户名称', trigger: 'blur' }
    ],
    superAdmin: [
        { required: true, message: '请输入超级管理员姓名', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在6到20个字符', trigger: 'blur' }
    ]
})

// 用户注册表单验证规则
const userRules = reactive({
    userName: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    code: [
        { required: true, message: '请输入租户编码', trigger: 'blur' },
        { 
            validator: (rule, value, callback) => {
                if (value && !/^\d+$/.test(value)) {
                    callback(new Error('租户编码必须为数字'))
                } else {
                    callback()
                }
            }, 
            trigger: 'blur' 
        }
    ],
    department: [
        { required: true, message: '请输入所属部门', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在6到20个字符', trigger: 'blur' }
    ]
})

const tenantLoading = ref(false)
const userLoading = ref(false)

const tenantFormRef = ref(null)
const userFormRef = ref(null)

// 企业注册处理
const handleTenantRegister = async () => {
    const valid = await tenantFormRef.value.validate()
    if (!valid) return

    try {
        tenantLoading.value = true
        const response = await tenantRegisterAPI(tenantForm)
        
        // 由于HTTP拦截器可能返回null（当data为null时），需要重新获取完整响应
        if (response === null) {
            // 重新调用API获取完整响应
            const fullResponse = await fetch('/api/tenant/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tenantForm)
            })
            const result = await fullResponse.json()
            
            if (result.code === 200) {
                ElMessage.success(result.message || '企业注册成功')
                router.push('/login')
            } else {
                // 不再重复显示错误消息，因为 http.js 已经处理了错误消息
                router.push('/login')
            }
        } else {
            // 正常响应处理
            if (response.code === 200) {
                ElMessage.success(response.message || '企业注册成功')
                router.push('/login')
            } else {
                // 不再重复显示错误消息，因为 http.js 已经处理了错误消息
                router.push('/login')
            }
        }
    } catch (error) {
        // 不再重复显示错误消息，因为 http.js 已经处理了错误消息
        router.push('/login')
    } finally {
        tenantLoading.value = false
    }
}

// 用户注册处理
const handleUserRegister = async () => {
    const valid = await userFormRef.value.validate()
    if (!valid) return

    try {
        userLoading.value = true
        const response = await userRegisterAPI(userForm)
        
        // 根据响应码处理注册结果
        switch(response.code) {
            case 200:
                ElMessage.success(response.message || '用户注册成功')
                router.push('/login')
                break
            case 1008:  // 租户编码不存在
                ElMessage.error(response.message || '租户编码不存在，请检查')
                break
            case 1009:  // 部门不存在
                ElMessage.error(response.message || '部门不存在，请检查')
                break
            default:
                // 其他未知错误
                ElMessage.error(response.message || '用户注册失败')
        }
    } catch (error) {
        // 如果是业务逻辑错误，阻止 http.js 中的错误提示
        if (error.code === 1008 || error.code === 1009) {
            // 阻止默认错误处理
            error.preventDefault = true
        }
        throw error
    } finally {
        userLoading.value = false
    }
}

// 返回登录页面
const goToLogin = () => {
    router.push('/login')
}
</script>

<style scoped>
/* 复用登录页面的样式 */
.back {
    width: 100vw;
    height: 100vh;
    position: relative;
}

.register-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    z-index: 1;
}

.register-card {
    width: 420px;
    max-width: 95vw;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    z-index: 10;
    transition: all 0.3s ease;
}

.register-card:hover {
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.register-header {
    text-align: center;
    margin-bottom: 30px;
}

.register-header h1 {
    font-size: 24px;
    color: #303133;
    margin: 15px 0 5px;
}

.register-header p {
    font-size: 14px;
    color: #909399;
}

.logo {
    width: 80px;
    height: 80px;
    object-fit: contain;
}

.register-btn {
    width: 100%;
    font-size: 16px;
    letter-spacing: 2px;
    height: 48px;
    margin-top: 20px;
}

.register-footer {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
}

.register-tabs {
    margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .register-container {
        padding: 20px;
    }
    
    .register-card {
        width: 100%;
        max-width: 400px;
        padding: 30px 20px;
        margin: 0 10px;
    }
    
    .register-header h1 {
        font-size: 20px;
    }
    
    .logo {
        width: 60px;
        height: 60px;
    }
    
    .register-btn {
        height: 44px;
        font-size: 16px;
    }
    
    .circle-1 {
        width: 200px;
        height: 200px;
        top: -50px;
        left: -50px;
    }
    
    .circle-2 {
        width: 150px;
        height: 150px;
        bottom: -30px;
        right: -30px;
    }
}

@media (max-width: 480px) {
    .register-card {
        padding: 20px 15px;
        margin: 0 5px;
    }
    
    .register-header h1 {
        font-size: 18px;
    }
    
    .logo {
        width: 50px;
        height: 50px;
    }
    
    .register-header p {
        font-size: 13px;
    }
}
</style>
