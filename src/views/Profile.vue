<!-- src/views/Profile.vue -->
<template>
    <div class="profile-page">
        <h1>个人中心</h1>
        <el-card class="profile-card">
            <el-form label-width="120px">
                <el-form-item label="用户名">
                    <el-input v-model="userInfo.username" disabled />
                </el-form-item>
                <el-form-item label="邮箱">
                    <el-input v-model="userInfo.email" disabled />
                </el-form-item>
                <el-form-item label="角色">
                    <el-tag>{{ userInfo.role }}</el-tag>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="updateProfile">更新信息</el-button>
                    <el-button type="danger" @click="changePassword">修改密码</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'  // 假设使用 Pinia store
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const userInfo = ref({})  // 用户信息

onMounted(() => {
    // 从 store 或 API 获取用户信息
    if (userStore.userInfo) {
        userInfo.value = userStore.userInfo
    } else {
        // 可选：调用 API 获取详情，例如从 user.js 的 getUserDetail
        // getUserDetail(userStore.userId).then(res => { userInfo.value = res })
    }
})

const updateProfile = () => {
    ElMessage.success('信息更新成功')  // TODO: 实际调用 API
}

const changePassword = () => {
    ElMessage.info('跳转到修改密码页面')  // TODO: 实现逻辑
}
</script>

<style scoped>
.profile-page {
    padding: 20px;
}

.profile-card {
    max-width: 600px;
    margin: 0 auto;
}
</style>