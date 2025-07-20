<template>
    <el-container class="main-container">
        <!-- 顶部固定横条 -->
        <el-header class="top-header" height="60px">
            <div class="header-content">
                <!-- Logo -->
                <div class="logo-container">
                    <img src="@/assets/logo.png" alt="Logo" class="logo">
                    <span class="system-name">知识管理系统</span>
                </div>

                <!-- 用户信息 -->
                <div class="user-info">
                    <el-dropdown>
                        <span class="el-dropdown-link">
                            <el-avatar :size="30" src="@/assets/avatar.jpg" />
                            <span class="username">管理员</span>
                            <el-icon><arrow-down /></el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item>个人中心</el-dropdown-item>
                                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </div>
        </el-header>

        <el-container>
            <!-- 侧边栏 -->
            <el-aside width="220px" class="aside-container">
                <Sidebar />
            </el-aside>

            <!-- 主内容区 -->
            <el-main class="main-content">
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user' // 导入具体的 store

const router = useRouter()
const userStore = useUserStore() // 使用具体的 store 实例

const handleLogout = async () => {
  userStore.$reset() // 清空 Pinia 中的用户状态

  // 跳转到登录页面
  await router.push('/login')
}
</script>

<style scoped>
/* 顶部横条样式 */
.top-header {
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
}

.header-content {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
}

.logo-container {
    display: flex;
    align-items: center;
}

.logo {
    width: 32px;
    height: 32px;
    margin-right: 12px;
}

.system-name {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

.user-info {
    display: flex;
    align-items: center;
    /* 确保整个用户信息区域垂直居中 */
}

.el-dropdown-link {
    display: flex;
    align-items: center;
    /* 使下拉菜单内的元素垂直居中 */
}

.username {
    margin: 0 8px;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    /* 确保文本垂直居中 */
    height: 100%;
    /* 继承父元素高度 */
}

/* 其他原有样式保持不变 */
.main-container {
    height: 100vh;
}

.aside-container {
    background-color: #545c64;
    color: #fff;
    height: calc(100vh - 60px);
}

.main-content {
    background-color: #f5f7fa;
    padding: 0px;
    height: calc(100vh - 60px);
    overflow-y: auto;
}
</style>