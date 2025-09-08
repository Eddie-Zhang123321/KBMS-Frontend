<template>
    <el-container class="main-container">
        <!-- 顶部固定横条 -->
        <el-header class="top-header" height="56px">
            <div class="header-content">
                <!-- 左侧 Logo -->
                <div class="logo-container">
                    <img src="@/assets/logo.png" alt="Logo" class="logo" />
                    <span class="system-name" v-if="!isMobile">知识管理系统</span>
                </div>

                <!-- 移动端：汉堡菜单 -->
                <el-icon v-if="isMobile" class="mobile-menu-toggle" @click="sidebarVisible = true">
                    <Menu />
                </el-icon>

                <!-- 桌面端：用户与租户 -->
                <div v-if="!isMobile" class="header-right">
                    <span class="tenant">租户：{{ tenantName }}</span>
                    <div class="roles" v-if="roleLabels.length">
                        <el-tag v-for="(r, i) in roleLabels" :key="i" size="small" type="info">
                            {{ r }}
                        </el-tag>
                    </div>
                    <div class="user-info">
                        <el-dropdown>
                            <span class="el-dropdown-link">
                                <el-avatar :size="28" :src="userAvatar" />
                                <span class="username">{{ displayName }}</span>
                                <el-icon>
                                    <ArrowDown />
                                </el-icon>
                            </span>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item @click="$router.push('/profile')">
                                        个人中心
                                    </el-dropdown-item>
                                    <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </div>
            </div>
        </el-header>

        <el-container>
            <!-- 移动端侧边栏 Drawer -->
            <el-drawer v-model="sidebarVisible" direction="ltr" size="80%" :with-header="false">
                <div class="drawer-header">
                    <el-avatar :size="40" :src="userAvatar" />
                    <div class="user-meta">
                        <div class="username">{{ displayName }}</div>
                        <div class="roles">
                            <el-tag v-for="(r, i) in roleLabels" :key="i" size="small" type="info">
                                {{ r }}
                            </el-tag>
                        </div>
                    </div>
                </div>
                <Sidebar />
                <div class="drawer-footer">
                    <el-button type="danger" plain block @click="handleLogout">
                        退出登录
                    </el-button>
                </div>
            </el-drawer>

            <!-- 桌面端侧边栏 -->
            <el-aside v-if="!isMobile" width="220px" class="aside-container">
                <Sidebar />
            </el-aside>

            <!-- 主内容 -->
            <el-main class="main-content">
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import Sidebar from "@/components/SideBar.vue";
import { ArrowDown, Menu } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { computed, onMounted, onUnmounted, ref } from "vue";

const router = useRouter();
const userStore = useUserStore();

const tenantName = computed(() => userStore.displayTenantName);
const roleLabels = computed(() => {
    const labels = [];
    if (userStore.platformAdmin) labels.push("平台管理员");
    if (userStore.tenantSuperAdmin) labels.push("超级管理员");
    return labels;
});
const displayName = computed(() => userStore.user?.username || "用户");
const userAvatar = computed(() => userStore.userAvatar);

const isMobile = ref(false);
const sidebarVisible = ref(false);

const checkIsMobile = () => {
    isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
});

onUnmounted(() => {
    window.removeEventListener("resize", checkIsMobile);
});

const handleLogout = async () => {
    userStore.logout();
    await router.push("/login");
};
</script>

<style scoped>
.main-container {
    height: 100vh;
    font-size: 14px;
}

.top-header {
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 0;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;
    padding: 0 15px;
}

.logo-container {
    display: flex;
    align-items: center;
}

.logo {
    width: 30px;
    height: 30px;
    margin-right: 10px;
}

.system-name {
    font-size: 16px;
    font-weight: bold;
    color: #333;
}

.mobile-menu-toggle {
    font-size: 20px;
    cursor: pointer;
}

/* 桌面端右侧 */
.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.tenant {
    font-size: 14px;
    color: #666;
}

.roles {
    display: flex;
    gap: 6px;
}

.user-info {
    display: flex;
    align-items: center;
}

.username {
    margin: 0 6px;
    font-size: 14px;
}

/* Drawer 样式 */
.drawer-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    border-bottom: 1px solid #eee;
}

.user-meta .username {
    font-weight: bold;
    font-size: 15px;
}

.drawer-footer {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;


    padding: 12px;
    margin: 0;
    z-index: 10;
}

/* 主内容 */
.main-content {
    background-color: #f5f7fa;
    padding: 12px;
    height: calc(100vh - 56px);
    overflow-y: auto;
}
</style>
