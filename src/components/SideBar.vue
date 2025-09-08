<template>
    <el-menu :default-active="activeMenu" class="el-menu-vertical" router :collapse="false" @select="handleSelect">
        <el-menu-item index="/dashboard">
            <el-icon><icon-menu /></el-icon>
            <span>工作台</span>
        </el-menu-item>

        <el-menu-item index="/knowledgelist">
            <el-icon>
                <document />
            </el-icon>
            <span>知识库管理中心</span>
        </el-menu-item>

        <el-menu-item index="/service">
            <el-icon>
                <setting />
            </el-icon>
            <span>知识服务中心</span>
        </el-menu-item>

        <el-sub-menu index="system" v-if="canSeeSystemCenter">
            <template #title>
                <el-icon>
                    <monitor />
                </el-icon>
                <span>系统管理中心</span>
            </template>
            <el-menu-item index="/system/users" v-if="!userStore.platformAdmin">用户管理</el-menu-item>
            <el-menu-item index="/system/roles">角色权限管理</el-menu-item>
            <el-menu-item index="/system/settings">系统参数</el-menu-item>
            <el-menu-item index="/system/logs">系统日志</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/tenant" v-if="canSeeTenantCenter">
            <el-icon><office-building /></el-icon>
            <span>租户管理中心</span>
        </el-menu-item>

        <el-menu-item index="/profile">
            <el-icon>
                <user />
            </el-icon>
            <span>个人中心</span>
        </el-menu-item>
    </el-menu>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
    Menu as IconMenu,
    Document,
    Setting,
    Monitor,
    OfficeBuilding,
    User
} from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = ref(route.path)
const userStore = useUserStore()

const canSeeSystemCenter = computed(() =>
    userStore.platformAdmin || userStore.tenantSuperAdmin
)
const canSeeTenantCenter = computed(() => userStore.platformAdmin)

// 监听路由变化
watch(() => route.path, (newPath) => {
    activeMenu.value = newPath
})

// 处理菜单选择（可选）
const handleSelect = (index) => {
    console.log('菜单选中:', index)
    // console.log('当前用户角色:', roles.value)
    // console.log('canSeeTenantCenter:', canSeeTenantCenter.value)
}
</script>

<style scoped>
.el-menu-vertical:not(.el-menu--collapse) {
    width: 220px;
    min-height: 100%;
}

.el-menu {
    border-right: none;
    height: 100%;
}

/* 移动端优化 */
@media (max-width: 768px) {
    .el-menu-vertical:not(.el-menu--collapse) {
        width: 100%;
    }
    
    .el-menu-item {
        padding: 0 20px !important;
    }
    
    .el-sub-menu .el-menu-item {
        padding-left: 40px !important;
    }
}

/* 平板端优化 */
@media (min-width: 769px) and (max-width: 1024px) {
    .el-menu-vertical:not(.el-menu--collapse) {
        width: 200px;
    }
}
</style>
