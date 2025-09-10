<template>
    <div class="role-management">
        <el-row :gutter="16" class="filter-row">
            <el-col :span="6" :xs="24" :sm="12" :lg="6">
                <el-select v-model="filters.roleKey" placeholder="选择角色" clearable style="width: 100%">
                    <el-option label="全部角色" value="" />
                    <el-option v-for="opt in roleNameOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-col>
            <el-col :span="6" :xs="24" :sm="12" :lg="6">
                <el-select v-model="filters.roleType" placeholder="选择角色类型" clearable style="width: 100%">
                    <el-option label="全部类型" value="" />
                    <el-option v-for="opt in roleTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
            </el-col>
            <el-col :span="12" :xs="24" :sm="24" :lg="12" class="text-right">
                <el-button type="primary" @click="fetchRoles">查询</el-button>
                <el-button @click="onReset">重置</el-button>
            </el-col>
        </el-row>

        <div class="table-header">
            <div class="title">角色列表</div>
            <div class="actions">
                <el-button type="primary" @click="onCreate">新建角色</el-button>
            </div>
        </div>

        <el-table :data="roleList" v-loading="loading" style="width: 100%" stripe>
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

        <CreateRole ref="createRoleRef" @success="refresh" />
        <RoleInfo ref="roleInfoRef" />
        <RolePermissions ref="rolePermRef" @success="refresh" />
        <RoleAssignees ref="roleAssigneesRef" @success="refresh" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
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
    roleKey: '', // 使用空字符串作为“全部”的默认值，更符合 Element Plus clearable 的行为
    roleType: ''
})

const loading = ref(false)

// 动态角色选项，从实际的角色列表中生成
const roleNameOptions = ref([])

const roleTypeOptions = [
    { value: RoleType.PLATFORM, label: RoleTypeLabels[RoleType.PLATFORM] },
    { value: RoleType.KB, label: RoleTypeLabels[RoleType.KB] },
    { value: RoleType.NORMAL, label: RoleTypeLabels[RoleType.NORMAL] }
]

// 数据
const roleList = ref([])

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
    loading.value = true
    const params = {
        roleKey: filters.value.roleKey || undefined,
        roleType: filters.value.roleType || undefined,
        page: 1,
        size: 50
    }
    try {
        const res = await getRoleList(params)
        const items = res.items || res.list || []
        // 更新主列表
        roleList.value = items.map(normalizeRoleItem)

        // 同时更新角色名称筛选选项
        const uniqueRoles = new Map()
        roleList.value.forEach(role => {
            if (role.key && role.name) {
                uniqueRoles.set(role.key, { value: role.key, label: role.name })
            }
        })
        roleNameOptions.value = Array.from(uniqueRoles.values())

    } catch (e) {
        ElMessage.error('获取角色列表失败，请稍后再试。')
        roleList.value = []
    } finally {
        loading.value = false
    }
}

const onReset = () => {
    filters.value = { roleKey: '', roleType: '' }
    fetchRoles() // 重置后立即查询
}

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
    margin-top: 10px;
}

/* 响应式布局优化 */
@media (max-width: 768px) {
    .filter-row .el-col {
        margin-bottom: 10px;
    }

    .text-right {
        justify-content: flex-start;
    }
}
</style>