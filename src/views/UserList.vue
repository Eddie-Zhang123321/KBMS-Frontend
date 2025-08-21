<template>
    <div class="user-management">
        <el-row :gutter="16">
            <!-- 左侧部门菜单 -->
            <el-col :span="isCollapsed ? 1 : 4" class="department-col">
                <!-- 展开/收起图标 -->
                <div class="collapse-toggle" @click.stop="toggleCollapse">
                    <el-icon>
                        <DArrowRight v-if="isCollapsed" />
                        <DArrowLeft v-else />
                    </el-icon>
                </div>
                <!-- 部门菜单 -->
                <el-menu v-if="!isCollapsed" :default-active="selectedDepartmentId" class="el-menu-vertical-demo" @select="handleDepartmentSelect">
                    <el-menu-item v-for="department in departments" :key="department.id" :index="department.id.toString()">
                        <span>{{ department.name }}</span>
                    </el-menu-item>
                </el-menu>
            </el-col>

            <!-- 右侧用户信息展示 -->
            <el-col :span="isCollapsed ? 23 : 20">
                <el-row :gutter="16" class="filter-row">
                    <el-col :span="4">
                        <el-input placeholder="请输入用户ID" v-model="filters.userId" clearable></el-input>
                    </el-col>
                    <el-col :span="4">
                        <el-input placeholder="请输入用户名" v-model="filters.userName" clearable></el-input>
                    </el-col>
                    <el-col :span="4">
                        <el-select v-model="filters.role" placeholder="选择角色" style="width: 100%">
                            <el-option label="全部" value="" />
                            <el-option label="平台管理员" value="platform_admin" />
                            <el-option label="超级管理员" value="super_admin" />
                            <el-option label="知识库所有人" value="kb_owner" />
                            <el-option label="知识库管理员" value="kb_admin" />
                            <el-option label="普通用户" value="user" />
                        </el-select>
                    </el-col>
                    <el-col :span="4">
                        <el-select v-model="filters.status" placeholder="选择状态" style="width: 100%">
                            <el-option label="全部" value="" />
                            <el-option label="开启" value="开启" />
                            <el-option label="关闭" value="关闭" />
                        </el-select>
                    </el-col>
                    <el-col :span="4" class="button-group">
                        <el-button type="primary" @click="search">查询</el-button>
                        <el-button @click="reset">重置</el-button>
                    </el-col>
                </el-row>
                <!-- 批量操作 -->
                <el-row class="batch-actions" style="margin-top: 20px;">
                    <el-button type="danger" @click="createUser">新增</el-button>
                    <CreateUSER ref="createDialog" />
                    <el-button type="primary" @click="openBatchImport">批量导入</el-button>
                    <BatchImport ref="batchImport" @import-success="fetchUserList" />
                    <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleBatchDeleteUsers">批量删除</el-button>
                    <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleExportSelectedUsers">用户导出</el-button>
                </el-row>

                <!-- 用户列表 -->
                <el-table ref="tableRef" :data="users" style="width: 100%" stripe @selection-change="onSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="userId" label="用户ID" />
                    <el-table-column prop="userName" label="用户名" />
                    <el-table-column prop="role" label="角色" />
                    <el-table-column prop="phone" label="手机号" />
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status === '开启' ? 'success' : 'danger'">
                                {{ row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="lastModified" label="最近修改" />
                    <el-table-column label="操作" width="200">
                        <template #default="{ row }">
                            <el-button size="small" type="success" @click="handleEdit(row)">编辑</el-button>
                            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total" layout="prev, pager, next"
                    @current-change="handlePageChange" />

                <EditUser ref="editUserRef" @success="onUserEditSuccess" />
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
    ElTable,
    ElTableColumn,
    ElInput,
    ElButton,
    ElSelect,
    ElOption,
    ElTag,
    ElPagination,
    ElRow,
    ElCol,
    ElMenu,
    ElMenuItem,
    ElSubMenu  // 新增导入
} from 'element-plus';
import { ElMessageBox, ElMessage } from 'element-plus'
import { DArrowRight, DArrowLeft } from '@element-plus/icons-vue'; // 引入箭头图标
import { getDepartments } from '@/api/department'; // 导入部门API
import { getUserList, deleteUser } from '@/api/user'; // 用户API
import EditUser from '@/components/dialogs/EditUser.vue'
import CreateUSER from '@/components/dialogs/CreateUser.vue'
import BatchImport from '@/components/dialogs/BatchImport.vue';
const createDialog = ref()
const batchImport = ref()
const filters = ref({
    userId: '',
    userName: '',
    role: '',
    status: ''
});
const createUser = () => {
    console.log('创建用户')
    createDialog.value.open()
}

// 打开批量导入弹窗
const openBatchImport = () => {
    if (batchImport.value) {
        console.log('Opening BatchImport:', batchImport.value);
        batchImport.value.open();
    } else {
        console.error('batchImport ref is not available');
    }
}

const departments = ref([]);
const selectedDepartmentId = ref(null); // 记录选中的部门ID
const users = ref([]);
const selectedRows = ref([])
const tableRef = ref(null)
const editUserRef = ref(null)
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const isCollapsed = ref(false); // 控制菜单收起状态

// 获取部门数据并按首个部门加载用户
onMounted(async () => {
    await fetchDepartments();
    // 初始不选部门 → 显示所有用户
    await fetchUserList();
});

// 获取部门数据
const fetchDepartments = async () => {
    try {
        const response = await getDepartments();
        // 改为一级部门结构：[{ id, name }]
        departments.value = (response.items || response || []).map(d => ({ id: d.id, name: d.name }))
    } catch (error) {
        console.error('获取部门数据失败', error);
    }
};

// 获取用户数据
const fetchUserList = async () => {
    // 后端仅按 departmentId 返回集合；前端本地执行筛选与分页
    const params = {
        departmentId: selectedDepartmentId.value || undefined,
        // 为确保拿到足够数据，直接拉取较大 size（Mock 环境无分页压力）
        page: 1,
        size: 9999
    };

    try {
        const response = await getUserList(params);
        const raw = response
        let items = Array.isArray(raw) ? raw : (raw.items || raw.list || [])

        // 本地筛选
        if (selectedDepartmentId.value) {
            items = items.filter(u => String(u.departmentId) === String(selectedDepartmentId.value))
        }
        if (filters.value.userId) {
            const q = String(filters.value.userId)
            items = items.filter(u => String(u.userId).includes(q))
        }
        if (filters.value.userName) {
            const q = String(filters.value.userName).toLowerCase()
            items = items.filter(u => String(u.userName || '').toLowerCase().includes(q))
        }
        if (filters.value.role) {
            items = items.filter(u => u.role === filters.value.role)
        }
        if (filters.value.status) {
            items = items.filter(u => u.status === filters.value.status)
        }

        // 本地分页
        const start = (pageNum.value - 1) * pageSize.value
        const end = start + pageSize.value
        total.value = items.length
        users.value = items.slice(start, end)
    } catch (error) {
        console.error('获取用户数据失败', error);
    }
};

// 部门选择
const handleDepartmentSelect = (key) => {
    selectedDepartmentId.value = key;
    fetchUserList(); // 选择部门后重新获取用户数据
};

// 查询用户
const search = () => {
    pageNum.value = 1;
    fetchUserList();
};

// 重置筛选条件
const reset = () => {
    filters.value = { userId: '', userName: '', role: '', status: '' };
    fetchUserList();
};

// 编辑用户
const handleEdit = (row) => {
    editUserRef.value?.open(row)
};

// 删除用户
const handleDelete = (row) => {
    ElMessageBox.confirm(`确认删除用户「${row.userName}」吗？`, '提示', { type: 'warning' })
      .then(() => deleteUser(row.userId))
      .then(() => {
        users.value = users.value.filter(u => String(u.userId) !== String(row.userId))
        total.value = Math.max(0, total.value - 1)
        ElMessage.success('已删除')
      })
      .catch(() => {})
};

// 分页变更
const handlePageChange = (newPage) => {
    pageNum.value = newPage;
    fetchUserList();
};

// 勾选变化
const onSelectionChange = (rows) => {
    selectedRows.value = rows || []
}

// 批量删除所选用户
const handleBatchDeleteUsers = async () => {
    if (selectedRows.value.length === 0) return
    const ids = selectedRows.value.map(r => r.userId)
    try {
        await ElMessageBox.confirm(`确认批量删除选中的 ${ids.length} 位用户吗？`, '提示', { type: 'warning' })
        await Promise.all(ids.map(id => deleteUser(id)))
        users.value = users.value.filter(u => !ids.includes(u.userId))
        total.value = Math.max(0, total.value - ids.length)
        tableRef.value?.clearSelection()
        selectedRows.value = []
        ElMessage.success('批量删除成功')
    } catch (_) {}
}

// 导出所选用户为 CSV 并下载
const handleExportSelectedUsers = () => {
    if (selectedRows.value.length === 0) {
        ElMessage.warning('请先勾选需要导出的用户')
        return
    }
    const headers = ['用户ID','用户名','角色','手机号','状态','部门ID','最近修改']
    const escape = (val) => {
        const s = val == null ? '' : String(val)
        const needWrap = /[",\n]/.test(s)
        const escaped = s.replace(/"/g, '""')
        return needWrap ? `"${escaped}"` : escaped
    }
    const rows = selectedRows.value.map(u => [u.userId, u.userName, u.role, u.phone, u.status, u.departmentId, u.lastModified].map(escape).join(','))
    const content = '\ufeff' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ts = new Date().toISOString().replace(/[-:T]/g,'').slice(0,14)
    a.href = url
    a.download = `users_export_${ts}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

const onUserEditSuccess = (payload) => {
    const idx = users.value.findIndex(u => String(u.userId) === String(payload.userId))
    if (idx >= 0) {
        users.value[idx] = { ...users.value[idx], ...payload }
    } else {
        fetchUserList()
    }
}

// 切换菜单收起/展开
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
};
</script>

<style scoped>
.user-management {
    padding: 20px;
    padding-left: 0px;
}

.el-table {
    margin-top: 20px;
}

.el-pagination {
    margin-top: 20px;
    text-align: center;
}

.filter-row {
    margin-bottom: 20px;
}

.filter-row .button-group {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

.button-group {
    position: absolute;
    right: 10px;
}

.batch-actions {
    justify-content: right;
    margin-top: 20px;
    margin-bottom: 20px;

    .el-button {
        margin: 7px;
    }
}

.el-menu-vertical-demo {
    height: 100%;
    border-right: 1px solid #ebeef5;
}

.department-col {
    min-height: 100%;
    transition: width 0.3s;
}

.collapse-toggle {
    padding-right: 10px;
    display: flex;
    justify-content: right;
    align-items: center;
    height: 40px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
    cursor: pointer;
    transition: all 0.3s;
}

.collapse-toggle :deep(.el-icon) {
    font-size: 16px;
    transition: transform 0.3s;
}

.collapse-toggle :deep(.el-icon--left) {
    transform: rotate(180deg);
}

.menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
}
</style>
