<template>
    <div class="role-management">
        <!-- 顶部筛选行 -->
        <el-row :gutter="16">
            <el-col :span="6">
                <el-select 
                    v-model="tempFilters.roleKey" 
                    placeholder="选择角色" 
                    clearable 
                    style="width: 100%"
                >
                    <el-option label="全部角色" value="all" />
                    <el-option 
                        v-for="opt in roleNameOptions" 
                        :key="opt.value" 
                        :label="opt.label" 
                        :value="opt.value" 
                    />
                </el-select>
            </el-col>
            <el-col :span="6">
                <el-select 
                    v-model="tempFilters.roleType" 
                    placeholder="选择角色类型" 
                    clearable 
                    style="width: 100%"
                >
                    <el-option label="全部类型" value="all" />
                    <el-option 
                        v-for="opt in roleTypeOptions" 
                        :key="opt.value" 
                        :label="opt.label" 
                        :value="opt.value" 
                    />
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
        <el-table :data="filterRoles" style="width: 100%" stripe>
            <el-table-column prop="name" label="角色名" width="180" />
            <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip />
            <el-table-column prop="typeLabel" label="角色类型" width="140" />
            <el-table-column prop="userCount" label="用户数" width="100" />
            <el-table-column label="操作" width="260" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" @click="onViewInfo(row)">角色信息</el-button>
                    <el-button size="small" @click="onViewPerms(row)" type="primary" plain>角色权限</el-button>
                    
                    <!-- 仅对普通用户添加tooltip -->
                    <el-tooltip 
                        v-if="row.key === 'user'" 
                        content="将跳转到用户管理页面" 
                        placement="top"
                    >
                        <el-button 
                            size="small" 
                            @click="onManageAssignees(row)" 
                            type="success" 
                            plain
                        >
                            授权人
                        </el-button>
                    </el-tooltip>
                    
                    <!-- 其他角色的授权人按钮不需要tooltip -->
                    <el-button 
                        v-else
                        size="small" 
                        @click="onManageAssignees(row)" 
                        type="success" 
                        plain
                    >
                        授权人
                    </el-button>
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
import CreateRole from '@/components/dialogs/CreateRole.vue'
import RoleInfo from '@/components/dialogs/RoleInfo.vue'
import RolePermissions from '@/components/dialogs/RolePermissions.vue'
import RoleAssignees from '@/components/dialogs/RoleAssignees.vue'
// 移除原有的接口导入
// import { getRoleList } from '@/api/role'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
const router = useRouter()


// 角色类型映射
const RoleType = {
    PLATFORM: 'platform',
    KB: 'kb',
    TENANT: 'tenant',
    NORMAL: 'normal'
}

const RoleTypeLabels = {
    [RoleType.PLATFORM]: '平台级',
    [RoleType.KB]: '知识库级',
    [RoleType.TENANT]: '租户级',
    [RoleType.NORMAL]: '普通级'
}

// 顶部筛选
const filters = ref({
    roleKey: 'all',
    roleType: 'all'
})

// 硬编码角色列表
const allRoles = ref([
    {
        "id": "r-platform_admin",
        "key": "platform_admin",
        "name": "平台管理员",
        "description": "平台级最高权限，管理全局与租户资源",
        "type": "platform",
        "typeLabel": "平台级",
        "userCount": 2,
        // 新增额外的角色详情信息
        "createdAt": "2023-01-15",
        "updatedAt": "2023-09-20",
        "permissions": [
            "全局系统配置",
            "租户管理",
            "用户管理",
            "角色管理"
        ]
    },
    {
        "id": "r-super_admin",
        "key": "super_admin",
        "name": "超级管理员",
        "description": "高权限管理员，可管理系统设置与用户",
        "type": "tenant", 
        "typeLabel": "租户级", 
        "userCount": 5,
        "createdAt": "2023-02-01",
        "updatedAt": "2023-09-20",
        "permissions": [
            "系统设置",
            "用户管理",
            "知识库管理",
            "角色管理"
        ]
    },
    {
        "id": "r-kb_owner",
        "key": "kb_owner",
        "name": "知识库所有人",
        "description": "负责知识库整体配置与授权",
        "type": "kb",
        "typeLabel": "知识库级",
        "userCount": 8,
        "createdAt": "2023-03-10",
        "updatedAt": "2023-09-20",
        "permissions": [
            "知识库配置",
            "知识库授权",
            "知识库成员管理",
            "知识库创建与删除"
        ]
    },
    {
        "id": "r-kb_admin",
        "key": "kb_admin",
        "name": "知识库管理员",
        "description": "负责知识库日常管理与维护",
        "type": "kb",
        "typeLabel": "知识库级",
        "userCount": 13,
        "createdAt": "2023-04-05",
        "updatedAt": "2023-09-20",
        "permissions": [
            "知识库编辑",
            "知识库成员管理",
            "知识库日常维护"
        ]
    },
    {
        "id": "r-user",
        "key": "user",
        "name": "普通用户",
        "description": "普通用户，具备基础使用权限",
        "type": "normal",
        "typeLabel": "普通级",
        "userCount": 120,
        "createdAt": "2023-05-20",
        "updatedAt": "2023-09-20",
        "permissions": [
            "基础知识库浏览",
            "基于知识库智能问答",
            "基本操作权限"
        ]
    }
])

// 动态角色选项，从硬编码的角色列表中生成
const roleNameOptions = computed(() => {
    const uniqueRoles = new Map()
    allRoles.value.forEach(role => {
        if (role.key && role.name) {
            uniqueRoles.set(role.key, { value: role.key, label: role.name })
        }
    })
    return Array.from(uniqueRoles.values())
})

const roleTypeOptions = [
    { value: RoleType.PLATFORM, label: RoleTypeLabels[RoleType.PLATFORM] },
    { value: RoleType.KB, label: RoleTypeLabels[RoleType.KB] },
    { value: RoleType.TENANT, label: RoleTypeLabels[RoleType.TENANT] },
    { value: RoleType.NORMAL, label: RoleTypeLabels[RoleType.NORMAL] }
]

const filteredRoles = computed(() => {
    // 不再自动过滤，保留原始列表
    return allRoles.value
})

// 存储筛选条件的临时变量
const tempFilters = ref({
    roleKey: 'all',
    roleType: 'all'
})

// 实际应用的筛选条件
const appliedFilters = ref({
    roleKey: 'all',
    roleType: 'all'
})

// 筛选方法
const filterRoles = computed(() => {
    return allRoles.value.filter(r => {
        const byRole = appliedFilters.value.roleKey === 'all' || r.key === appliedFilters.value.roleKey
        const byType = appliedFilters.value.roleType === 'all' || r.type === appliedFilters.value.roleType
        return byRole && byType
    })
})

const onReset = () => {
    // 重置临时筛选条件
    tempFilters.value = { roleKey: 'all', roleType: 'all' }
    // 重置应用的筛选条件
    appliedFilters.value = { roleKey: 'all', roleType: 'all' }
}

const onSearch = () => {
    // 将临时筛选条件应用到实际筛选条件
    appliedFilters.value = { ...tempFilters.value }
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
    // 获取当前用户角色（从localStorage）
    const currentUserRole = localStorage.getItem('userRole')

    // 调用授权人组件的权限检查方法
    const assigneesRef = roleAssigneesRef.value
    const canOpen = assigneesRef.canOpenAssignees(row, currentUserRole)

    if (canOpen === false) {
        ElMessage.warning('您没有权限查看该角色的授权人')
        return
    }

    if (canOpen === 'redirect_to_user_management') {
        router.push({ name: 'UsersList' })
        return
    }

    assigneesRef.open(row)
}

const createRoleRef = ref(null)
const roleInfoRef = ref(null)
const rolePermRef = ref(null)
const roleAssigneesRef = ref(null)

const refresh = () => {
    // 从 localStorage 中获取最新的角色列表
    const roleManagementStore = localStorage.getItem('roleManagementStore')
    if (roleManagementStore) {
        const store = JSON.parse(roleManagementStore)
        allRoles.value = store.allRoles
    }
}

// 在页面加载时初始化 localStorage 中的角色列表
onMounted(() => {
    const roleManagementStore = localStorage.getItem('roleManagementStore')
    if (!roleManagementStore) {
        // 如果不存在，则使用初始角色列表并存储到 localStorage
        const initialStore = {
            allRoles: allRoles.value
        }
        localStorage.setItem('roleManagementStore', JSON.stringify(initialStore))
    }
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
    font-size: 18px; /* 增大标题字体 */
    font-weight: 700;
}

.el-table {
    margin-top: 20px;
    height: calc(80vh - 120px); /* 动态计算表格高度 */
    overflow: auto;
}

/* 增大表格内容字体大小 */
.el-table {
    font-size: 14px; /* 默认字体大小 */
}

.el-table .cell {
    font-size: 14px; /* 单元格字体大小 */
    line-height: 1.5; /* 增加行高 */
}

/* 操作按钮样式 */
.el-table .el-button {
    font-size: 12px;
    padding: 8px 12px;
    margin: 0 4px; /* 增加按钮之间的间距 */
}

/* 表格行高 */
.el-table .el-table__row {
    height: 120px; /* 增加行高 */
}

/* 表头样式 */
.el-table .el-table__header-wrapper .el-table__header {
    font-weight: bold;
    background-color: #f5f7fa; /* 浅灰色背景 */
}
</style>
