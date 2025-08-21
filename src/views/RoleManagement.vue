<template>
    <div class="role-management">
        <!-- 顶部筛选行 -->
        <el-row :gutter="16">
            <el-col :span="6">
                <el-select v-model="filters.roleKey" placeholder="选择角色" clearable style="width: 100%">
                    <el-option label="全部角色" value="all" />
                    <el-option v-for="opt in roleNameOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-col>
            <el-col :span="6">
                <el-select v-model="filters.roleType" placeholder="选择角色类型" clearable style="width: 100%">
                    <el-option label="全部类型" value="all" />
                    <el-option v-for="opt in roleTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-col>
            <el-col :span="12" class="text-right">
                <el-button type="primary" @click="onSearch">查询</el-button>
                <el-button @click="onReset">重置</el-button>
            </el-col>
        </el-row>

        <!-- 表格标题区 -->
        <div class="table-header">
            <div class="title">角色列表</div>
            <div class="actions">
                <el-button type="primary" @click="onCreate">新建角色</el-button>
            </div>
        </div>

        <!-- 列表 -->
        <el-table :data="filteredRoles" style="width: 100%" stripe>
            <el-table-column prop="name" label="角色名" width="180" />
            <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip />
            <el-table-column prop="typeLabel" label="角色类型" width="140" />
            <el-table-column prop="userCount" label="用户数" width="100" />
            <el-table-column label="操作" width="260" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" @click="onViewInfo(row)">角色信息</el-button>
                    <el-button size="small" @click="onViewPerms(row)" type="primary" plain>角色权限</el-button>
                    <el-button size="small" @click="onManageAssignees(row)" type="success" plain>授权人</el-button>
                </template>
            </el-table-column>
        </el-table>
        
        <!-- 弹窗组件区域 -->
        <CreateRole ref="createRoleRef" @success="refresh" />
        <RoleInfo ref="roleInfoRef" />
        <RolePermissions ref="rolePermRef" @success="refresh" />
        <RoleAssignees ref="roleAssigneesRef" @success="refresh" />
    </div>
    
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ROLES, ROLE_LABELS } from '@/constants/roles'
import CreateRole from '@/components/dialogs/CreateRole.vue'
import RoleInfo from '@/components/dialogs/RoleInfo.vue'
import RolePermissions from '@/components/dialogs/RolePermissions.vue'
import RoleAssignees from '@/components/dialogs/RoleAssignees.vue'
import { getRoleList } from '@/api/role'

// 角色类型映射
const RoleType = {
    PLATFORM: 'platform',
    KB: 'kb',
    NORMAL: 'normal'
}

const RoleTypeLabels = {
    [RoleType.PLATFORM]: '平台级',
    [RoleType.KB]: '知识库级',
    [RoleType.NORMAL]: '普通级'
}

// 顶部筛选
const filters = ref({
    roleKey: 'all',
    roleType: 'all'
})

const roleNameOptions = computed(() => [
    { value: ROLES.USER, label: ROLE_LABELS[ROLES.USER] },
    { value: ROLES.KB_ADMIN, label: ROLE_LABELS[ROLES.KB_ADMIN] },
    { value: ROLES.KB_OWNER, label: ROLE_LABELS[ROLES.KB_OWNER] },
    { value: ROLES.SUPER_ADMIN, label: ROLE_LABELS[ROLES.SUPER_ADMIN] },
    { value: ROLES.PLATFORM_ADMIN, label: ROLE_LABELS[ROLES.PLATFORM_ADMIN] }
])

const roleTypeOptions = [
    { value: RoleType.PLATFORM, label: RoleTypeLabels[RoleType.PLATFORM] },
    { value: RoleType.KB, label: RoleTypeLabels[RoleType.KB] },
    { value: RoleType.NORMAL, label: RoleTypeLabels[RoleType.NORMAL] }
]

// 数据（从后端 Mock 获取）
const allRoles = ref([])

const normalizeRoleItem = (item) => {
    const id = item.id || item.key || item.roleId || item.name
    const type = item.type
    return {
        id,
        key: item.key || item.id || id,
        name: item.name,
        description: item.description,
        type,
        typeLabel: item.typeLabel || RoleTypeLabels[type] || '',
        userCount: item.userCount ?? 0
    }
}

const fetchRoles = async () => {
    const params = {
        roleKey: filters.value.roleKey === 'all' ? undefined : filters.value.roleKey,
        roleType: filters.value.roleType === 'all' ? undefined : filters.value.roleType,
        page: 1,
        size: 50
    }
    try {
        const res = await getRoleList(params)
        const items = res.items || res.list || []
        allRoles.value = items.map(normalizeRoleItem)
    } catch (e) {
        // 失败兜底为空列表
        allRoles.value = []
    }
}

const filteredRoles = computed(() => {
    return allRoles.value.filter(r => {
        const byRole = filters.value.roleKey === 'all' || r.key === filters.value.roleKey
        const byType = filters.value.roleType === 'all' || r.type === filters.value.roleType
        return byRole && byType
    })
})

const onReset = () => {
    filters.value = { roleKey: 'all', roleType: 'all' }
}

const onSearch = () => { fetchRoles() }

const onCreate = () => {
    createRoleRef.value?.open()
}

const onViewInfo = (row) => {
    roleInfoRef.value?.open(row)
}

const onViewPerms = (row) => {
    rolePermRef.value?.open(row)
}

const onManageAssignees = (row) => {
    roleAssigneesRef.value?.open(row)
}

const createRoleRef = ref(null)
const roleInfoRef = ref(null)
const rolePermRef = ref(null)
const roleAssigneesRef = ref(null)

const refresh = () => {
    fetchRoles()
}

onMounted(() => {
    fetchRoles()
})
</script>

<style scoped>
.role-management {
    padding: 20px;
}

.text-right {
    display: flex;
    justify-content: right;
    gap: 8px;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    margin-bottom: 10px;
}

.table-header .title {
    font-size: 16px;
    font-weight: 600;
}

.el-table {
    margin-top: 20px;
}

.el-table {
    margin-top: 10px;
}
</style>