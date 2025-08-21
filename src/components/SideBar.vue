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
            <el-menu-item index="/system/users">用户管理</el-menu-item>
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
import { ROLES } from '@/constants/roles'
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
const roles = computed(() => userStore.roles || [])

const canSeeSystemCenter = computed(() =>
    roles.value.includes(ROLES.SUPER_ADMIN) || roles.value.includes(ROLES.PLATFORM_ADMIN)
)
const canSeeTenantCenter = computed(() => roles.value.includes(ROLES.PLATFORM_ADMIN))

// 监听路由变化
watch(() => route.path, (newPath) => {
    activeMenu.value = newPath
})

// 处理菜单选择（可选）
const handleSelect = (index) => {
    console.log('菜单选中:', index)
}
</script>

<style scoped>
.el-menu-vertical:not(.el-menu--collapse) {
    width: 220px;
    min-height: 100%;
}

.el-menu {
    border-right: none;
}
</style>