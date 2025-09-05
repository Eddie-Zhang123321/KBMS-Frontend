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

                <div class="tenant">租户：{{ tenantName }}</div>
                <div class="roles" v-if="roleLabels.length">
                    <el-tag v-for="(r, i) in roleLabels" :key="i" size="small" type="info" class="role-tag">{{ r }}</el-tag>
                </div>

                <!-- 用户信息 -->
                <div class="user-info">
                    <el-dropdown>
                        <span class="el-dropdown-link">
                            <el-avatar :size="30" :src="userAvatar" />
                            <span class="username">{{ displayName }}</span>
                            <el-icon><ArrowDown /></el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="$router.push('/profile')">个人中心</el-dropdown-item>
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
import Sidebar from '@/components/SideBar.vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { computed, onMounted, onUnmounted } from 'vue'
// 移除默认头像导入，使用store中的头像

const router = useRouter()
const userStore = useUserStore() // 使用具体的 store 实例
const tenantName = computed(() => userStore.displayTenantName)
const roleLabels = computed(() => {
  const labels = []
  if (userStore.platformAdmin) {
    labels.push('平台管理员')
  }
  if (userStore.tenantSuperAdmin) {
    labels.push('超级管理员')
  }
  return labels
})
const displayName = computed(() => userStore.user?.username || '用户')
const userAvatar = computed(() => {
  return userStore.userAvatar
})

let refreshInterval = null

// 定期刷新用户信息
const refreshUserInfo = async () => {
  if (userStore.token) {
    try {
      await userStore.fetchMe()
      console.log('User info refreshed successfully')
    } catch (e) {
    //   console.warn('Failed to refresh user info:', e)
      // 即使刷新失败，也继续使用当前缓存的数据
      // 不显示错误消息给用户，因为这是后台刷新
      // 检查错误类型，如果是网络错误则不记录
    //   if (e && e.message && !e.message.includes('Network Error')) {
    //     console.warn('Non-network error during user refresh:', e)
    //   }
    }
  }
}

onMounted(() => {
  // 每15分钟刷新一次用户信息（企业级应用通常使用较短的刷新间隔）
  refreshInterval = setInterval(refreshUserInfo, 15 * 60 * 1000)

  // 页面加载后立即刷新一次用户信息（延迟1秒执行，确保应用完全加载）
  setTimeout(() => {
    refreshUserInfo()
  }, 1000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

const handleLogout = async () => {
  userStore.logout()

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

.tenant {
    position: absolute;
    right: 300px;
    margin-right: 10px;
}

.roles {
    position: absolute;
    right: 180px;
    margin-right: 10px;
}

.user-info {
    display: flex;
    align-items: center;
    /* 确保整个用户信息区域垂直居中 */
}

.roles {
    display: flex;
    align-items: center;
    gap: 6px;
}

.role-tag {
    margin-left: 6px;
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
