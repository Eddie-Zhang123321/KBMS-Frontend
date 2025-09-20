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

                <!-- 移动端菜单按钮 -->
                <el-button 
                    class="mobile-menu-btn" 
                    @click="toggleSidebar"
                    :icon="sidebarCollapsed ? 'Expand' : 'Fold'"
                    circle
                    size="small"
                />

                <!-- 桌面端信息显示 -->
                <div class="desktop-info">
                    <div class="tenant" v-if="!userStore.platformAdmin">租户：{{ tenantName }}</div>
                    <div class="roles" v-if="roleLabels.length">
                        <el-tag v-for="(r, i) in roleLabels" :key="i" size="small" type="info" class="role-tag">{{ r }}</el-tag>
                    </div>
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
            <el-aside 
                :width="sidebarWidth" 
                class="aside-container"
                :class="{ 'sidebar-collapsed': sidebarCollapsed }"
            >
                <Sidebar />
            </el-aside>

            <!-- 主内容区 -->
            <el-main class="main-content" :class="{ 'content-expanded': sidebarCollapsed }">
                <router-view />
            </el-main>
        </el-container>

        <!-- 移动端遮罩层 -->
        <div 
            v-if="!sidebarCollapsed && isMobile" 
            class="sidebar-overlay" 
            @click="toggleSidebar"
        ></div>
    </el-container>
</template>

<script setup>
import Sidebar from '@/components/SideBar.vue'
import { ArrowDown, Expand, Fold } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const router = useRouter()
const userStore = useUserStore()

// 响应式状态
const sidebarCollapsed = ref(false)
const isMobile = ref(false)

// 计算属性
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

const sidebarWidth = computed(() => {
  if (isMobile.value) {
    return sidebarCollapsed.value ? '0px' : '220px'
  }
  return sidebarCollapsed.value ? '64px' : '220px'
})

// 检测屏幕尺寸
const checkScreenSize = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth <= 768
  
  // 如果从移动端切换到桌面端，自动显示侧边栏
  if (wasMobile && !isMobile.value) {
    sidebarCollapsed.value = false
    console.log('切换到桌面端，自动显示侧边栏')
  }
  // 如果切换到移动端，自动隐藏侧边栏
  else if (!wasMobile && isMobile.value) {
    sidebarCollapsed.value = true
    console.log('切换到移动端，自动隐藏侧边栏')
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 监听窗口大小变化
const handleResize = () => {
  checkScreenSize()
}

let refreshInterval = null

// 定期刷新用户信息
const refreshUserInfo = async () => {
  // 用户信息已在登录时获取，无需重复刷新
}

onMounted(() => {
  // 初始化屏幕尺寸检测
  checkScreenSize()
  window.addEventListener('resize', handleResize)

  // 每15分钟刷新一次用户信息
  refreshInterval = setInterval(refreshUserInfo, 15 * 60 * 1000)

  // 页面加载后立即刷新一次用户信息
  setTimeout(() => {
    refreshUserInfo()
  }, 1000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  window.removeEventListener('resize', handleResize)
})

const handleLogout = async () => {
  userStore.logout()
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
    position: relative;
}

.logo-container {
    display: flex;
    align-items: center;
    flex: 1;
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

/* 移动端菜单按钮 */
.mobile-menu-btn {
    display: none;
    margin-right: 10px;
}

/* 桌面端信息显示 */
.desktop-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: flex-end; 
  margin-right: 50px;
}

.tenant {
  font-size: 14px;
  color: #666;
  margin-right: 10px;  /* 增加租户信息和角色标签之间的间距 */
}

.roles {
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-tag {
    margin-left: 6px;
}

.user-info {
    display: flex;
    align-items: center;
}

.el-dropdown-link {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.username {
    margin: 0 8px;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    height: 100%;
}

/* 主容器样式 */
.main-container {
    height: 100vh;
}

.aside-container {
    background-color: #545c64;
    color: #fff;
    height: calc(100vh - 60px);
    transition: width 0.3s ease;
    position: relative;
    z-index: 10;
}

.aside-container.sidebar-collapsed {
    width: 0 !important;
    overflow: hidden;
}

.main-content {
    background-color: #f5f7fa;
    padding: 0px;
    height: calc(100vh - 60px);
    overflow-y: auto;
    transition: margin-left 0.3s ease;
}

.main-content.content-expanded {
    margin-left: 0;
}

/* 移动端遮罩层 */
.sidebar-overlay {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 5;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .header-content {
        padding: 0 15px;
    }
    
    .mobile-menu-btn {
        display: block;
    }
    
    .desktop-info {
        display: none;
    }
    
    .system-name {
        font-size: 16px;
    }
    
    .logo {
        width: 28px;
        height: 28px;
        margin-right: 8px;
    }
    
    .username {
        display: none;
    }
    
    .aside-container {
        position: fixed;
        top: 60px;
        left: 0;
        height: calc(100vh - 60px);
        z-index: 20;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    }
    
    .main-content {
        margin-left: 0;
    }
}

@media (max-width: 480px) {
    .header-content {
        padding: 0 10px;
    }
    
    .system-name {
        font-size: 14px;
    }
    
    .logo {
        width: 24px;
        height: 24px;
        margin-right: 6px;
    }
}

/* 平板端优化 */
@media (min-width: 769px) and (max-width: 1024px) {
    .desktop-info {
        gap: 15px;
    }
    
    .tenant {
        font-size: 13px;
    }
    
    .system-name {
        font-size: 16px;
    }
}
</style>
