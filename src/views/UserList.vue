<template>
    <div class="user-management">
        <el-row :gutter="16">
            <el-col :span="isCollapsed ? 1 : 4" class="department-col hidden-sm-and-down">
                <div class="collapse-toggle" @click.stop="toggleCollapse">
                    <el-icon>
                        <DArrowRight v-if="isCollapsed" />
                        <DArrowLeft v-else />
                    </el-icon>
                </div>
                <el-menu v-if="!isCollapsed" :default-active="selectedDepartment" class="el-menu-vertical-demo"
                    @select="handleDepartmentSelect">
                    <el-menu-item v-for="department in departments" :key="department.id"
                        :index="department.id.toString()">
                        <span>{{ department.name }}</span>
                    </el-menu-item>
                </el-menu>
            </el-col>

            <el-col :span="isCollapsed ? 23 : 20" :xs="24" :sm="24" class="right-panel">
                <el-row :gutter="16" class="filter-row">
                    <el-col :span="6" :xs="24" :sm="12">
                        <el-input placeholder="请输入用户ID" v-model="filters.id" clearable></el-input>
                    </el-col>
                    <el-col :span="6" :xs="24" :sm="12">
                        <el-input placeholder="请输入用户名" v-model="filters.userName" clearable></el-input>
                    </el-col>
                    <el-col :span="6" :xs="24" :sm="12" class="hidden-md-and-up">
                        <el-select v-model="selectedDepartment" placeholder="选择部门" style="width: 100%">
                            <el-option label="全部部门" :value="null" />
                            <el-option v-for="department in departments" :key="department.id" :label="department.name"
                                :value="department.id.toString()" />
                        </el-select>
                    </el-col>
                    <el-col :span="6" :xs="24" :sm="12">
                        <el-select v-model="filters.tenantSuperAdmin" placeholder="选择角色" style="width: 100%">
                            <el-option label="全部" :value="null" />
                            <el-option label="超级管理员" :value="true" />
                            <el-option label="普通用户" :value="false" />
                        </el-select>
                    </el-col>
                    <el-col :span="6" :xs="24" :sm="12">
                        <el-select v-model="filters.status" placeholder="选择状态" style="width: 100%">
                            <el-option label="全部" :value="null" />
                            <el-option label="开通" :value="1" />
                            <el-option label="关闭" :value="0" />
                            <el-option label="待审核" :value="2" />
                        </el-select>
                    </el-col>
                    <el-col :span="6" :xs="24" :sm="12" class="button-group">
                        <el-button type="primary" @click="search">查询</el-button>
                        <el-button @click="reset">重置</el-button>
                    </el-col>
                </el-row>

                <el-row :gutter="16" class="batch-actions" style="margin-top: 20px;">
                    <el-col :span="24">
                        <el-button type="danger" @click="createUser">新增</el-button>
                        <CreateUSER ref="createDialog" @user-created="handleUserCreated" />
                        <el-button type="primary" @click="openBatchImport">批量导入</el-button>
                        <BatchImport ref="batchImport" @import-success="fetchUserList" />
                        <el-button type="primary" :disabled="selectedRows.length === 0"
                            @click="handleBatchDeleteUsers">批量删除</el-button>
                        <el-button type="primary" :disabled="selectedRows.length === 0"
                            @click="handleExportSelectedUsers">用户导出</el-button>
                    </el-col>
                </el-row>

                <el-table ref="tableRef" :data="paginatedData" style="width: 100%" stripe
                    @selection-change="onSelectionChange" v-loading="loading">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="id" label="用户ID" width="80" />
                    <el-table-column prop="userName" label="用户名" />
                    <el-table-column prop="role" label="角色" width="120">
                        <template #default="{ row }">
                            <el-tag :type="row.tenantSuperAdmin ? 'warning' : 'info'">
                                {{ row.tenantSuperAdmin ? '超级管理员' : '普通用户' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="department" label="所属部门" class-name="hidden-sm-and-down" />
                    <el-table-column prop="email" label="邮箱" class-name="hidden-md-and-down" />
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'danger' : 'warning'">
                                {{ row.status === 1 ? '开通' : row.status === 0 ? '关闭' : '待审核' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="createTime" label="加入时间" width="160" class-name="hidden-sm-and-down" />
                    <el-table-column label="操作" width="200">
                        <template #default="{ row }">
                            <el-button v-if="row.status !== 2" size="small" type="warning"
                                @click="handleToggleStatus(row)">
                                {{ row.status === 1 ? '关闭' : '开通' }}
                            </el-button>
                            <el-button v-if="row.status === 2" size="small" type="primary"
                                @click="handleApproveStatus(row)">
                                审核
                            </el-button>
                            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
                        </template>
                    </el-table-column>
                    <template #empty>
                        <div style="padding: 40px 0; text-align: center; color: #999;">
                            <el-icon style="font-size: 48px; margin-bottom: 16px;">
                                <FolderOpened />
                            </el-icon>
                            <p>暂无数据</p>
                            <p style="font-size: 12px; margin-top: 8px;">
                                请尝试调整筛选条件或 <el-button link @click="reset">清除所有筛选</el-button>
                            </p>
                        </div>
                    </template>
                </el-table>

                <el-pagination v-model:current-page="currentPage" :total="total" :page-size="pageSize"
                    layout="total, prev, pager, next, jumper" @current-change="handlePageChange" />
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
// ... (script 脚本部分保持不变) ...
import { ref, onMounted, computed, watch } from 'vue';
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
    ElIcon
} from 'element-plus';
import { ElMessageBox, ElMessage } from 'element-plus'
import { DArrowRight, DArrowLeft, FolderOpened } from '@element-plus/icons-vue';
import { getDepartments } from '@/api/department';
import { getUserList, deleteUser, updateUserStatus, batchDeleteUsers } from '@/api/user';
import CreateUSER from '@/components/dialogs/CreateUser.vue'
import BatchImport from '@/components/dialogs/BatchImport.vue';

const createDialog = ref()
const batchImport = ref()
const filters = ref({
    id: '',
    userName: '',
    tenantSuperAdmin: null,
    status: null
});
const createUser = () => {
    createDialog.value.open()
}

const handleUserCreated = () => {
    currentPage.value = 1
    fetchUserList()
    ElMessage.success('新用户已添加到列表中')
}

const openBatchImport = () => {
    if (batchImport.value) {
        batchImport.value.open();
    } else {
        console.error('batchImport ref is not available');
    }
}

const departments = ref([]);
const selectedDepartment = ref(null);
const userList = ref([]);
const selectedRows = ref([])
const tableRef = ref(null)
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const isCollapsed = ref(false);

const paginatedData = computed(() => {
    return userList.value || [];
});

watch(currentPage, () => {
    fetchUserList();
}, { immediate: false });

onMounted(async () => {
    await fetchDepartments();
    await fetchUserList();
});

const fetchDepartments = async () => {
    try {
        const response = await getDepartments();
        if (response && response.data && response.data.items) {
            departments.value = response.data.items.map(d => ({ id: d.id, name: d.name }));
        } else if (response && response.items) {
            departments.value = response.items.map(d => ({ id: d.id, name: d.name }));
        } else if (Array.isArray(response)) {
            departments.value = response.map(d => ({ id: d.id, name: d.name }));
        } else {
            departments.value = [];
        }
    } catch (error) {
        console.error('获取部门数据失败', error);
        ElMessage.error('获取部门数据失败: ' + (error.message || '未知错误'));
        departments.value = [];
    }
};

const fetchUserList = async () => {
    loading.value = true;
    try {
        const params = {
            page: currentPage.value,
            pageSize: pageSize.value,
            ...filters.value
        };
        if (selectedDepartment.value) {
            const department = departments.value.find(d => d.id.toString() === selectedDepartment.value);
            if (department) {
                params.department = department.name;
            }
        }
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
                delete params[key];
            }
        });
        const response = await getUserList(params);
        if (response && response.data && response.data.items) {
            userList.value = response.data.items;
            total.value = response.data.total || 0;
        } else if (response && response.items) {
            userList.value = response.items;
            total.value = response.total || 0;
        } else if (Array.isArray(response)) {
            userList.value = response;
            total.value = response.length;
        } else {
            userList.value = [];
            total.value = 0;
        }
    } catch (error) {
        console.error('获取用户数据失败', error);
        ElMessage.error('获取用户数据失败: ' + (error.message || '未知错误'));
        userList.value = [];
        total.value = 0;
    } finally {
        loading.value = false;
    }
};

const handleDepartmentSelect = (key) => {
    if (selectedDepartment.value === key) {
        selectedDepartment.value = null;
    } else {
        selectedDepartment.value = key;
    }
    currentPage.value = 1;
    fetchUserList();
};

const search = () => {
    currentPage.value = 1;
    fetchUserList();
    const hasFilters = (filters.value.id && filters.value.id.trim()) ||
        (filters.value.userName && filters.value.userName.trim()) ||
        (filters.value.tenantSuperAdmin !== null && filters.value.tenantSuperAdmin !== undefined) ||
        (filters.value.status !== null && filters.value.status !== undefined) ||
        selectedDepartment.value;
    if (hasFilters) {
        ElMessage.success('筛选完成');
    } else {
        ElMessage.info('显示所有用户');
    }
};

const reset = () => {
    filters.value = {
        id: '',
        userName: '',
        tenantSuperAdmin: null,
        status: null
    };
    selectedDepartment.value = null;
    currentPage.value = 1;
    fetchUserList();
};

const handleToggleStatus = (row) => {
    const newStatus = row.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? '开通' : '关闭';
    ElMessageBox.confirm(`确认${action}用户「${row.userName}」吗？`, '提示', { type: 'warning' })
        .then(async () => {
            try {
                const response = await updateUserStatus(row.id, { status: newStatus });
                ElMessage.success(`用户已${action}`);
                const updatedUser = response?.data || response;
                if (updatedUser) {
                    const index = userList.value.findIndex(user => user.id === row.id);
                    if (index !== -1) {
                        userList.value[index] = { ...userList.value[index], ...updatedUser };
                    }
                } else {
                    const index = userList.value.findIndex(user => user.id === row.id);
                    if (index !== -1) {
                        userList.value[index] = { ...userList.value[index], status: newStatus };
                    }
                }
            } catch (error) {
                console.error('状态切换失败:', error);
                ElMessage.error(`${action}失败: ${error.message || '未知错误'}`);
            }
        })
        .catch(() => { });
};

const handleApproveStatus = (row) => {
    ElMessageBox.confirm(`确认审核通过用户「${row.userName}」吗？`, '提示', { type: 'warning' })
        .then(async () => {
            try {
                const response = await updateUserStatus(row.id, { status: 1 });
                ElMessage.success('用户审核通过');
                const updatedUser = response?.data || response;
                if (updatedUser) {
                    const index = userList.value.findIndex(user => user.id === row.id);
                    if (index !== -1) {
                        userList.value[index] = { ...userList.value[index], ...updatedUser };
                    }
                } else {
                    const index = userList.value.findIndex(user => user.id === row.id);
                    if (index !== -1) {
                        userList.value[index] = { ...userList.value[index], status: 1 };
                    }
                }
            } catch (error) {
                console.error('审核失败:', error);
                ElMessage.error(`审核失败: ${error.message || '未知错误'}`);
            }
        })
        .catch(() => { });
};

const handleDelete = (row) => {
    ElMessageBox.confirm(`确认删除用户「${row.userName}」吗？`, '提示', { type: 'warning' })
        .then(async () => {
            try {
                await deleteUser(row.id);
                ElMessage.success('已删除');
                const index = userList.value.findIndex(user => String(user.id) === String(row.id));
                if (index !== -1) {
                    userList.value.splice(index, 1);
                    total.value = Math.max(0, total.value - 1);
                    if (userList.value.length === 0 && currentPage.value > 1) {
                        currentPage.value = currentPage.value - 1;
                        fetchUserList();
                    }
                }
            } catch (error) {
                console.error('删除失败:', error);
                ElMessage.error('删除失败: ' + (error.message || '未知错误'));
            }
        })
        .catch(() => { });
};

const handlePageChange = (newPage) => {
    currentPage.value = newPage;
    fetchUserList();
};

const onSelectionChange = (rows) => {
    selectedRows.value = rows || []
}

const handleBatchDeleteUsers = async () => {
    if (selectedRows.value.length === 0) return
    const ids = selectedRows.value.map(r => r.id)
    try {
        await ElMessageBox.confirm(`确认批量删除选中的 ${ids.length} 位用户吗？`, '提示', { type: 'warning' })
        const response = await batchDeleteUsers(ids)
        const result = response?.data || response
        if (result && result.deletedCount !== undefined) {
            const deletedCount = result.deletedCount || 0
            const deletedIds = result.deletedUserIds || []
            if (deletedCount > 0) {
                userList.value = userList.value.filter(u => !deletedIds.includes(u.id))
                total.value = Math.max(0, total.value - deletedCount)
                tableRef.value?.clearSelection()
                selectedRows.value = []
                ElMessage.success(`成功删除 ${deletedCount} 个用户`)
                if (userList.value.length === 0 && currentPage.value > 1) {
                    currentPage.value = currentPage.value - 1
                    fetchUserList()
                }
            } else {
                ElMessage.warning('没有成功删除任何用户')
            }
        } else {
            ElMessage.error(`批量删除失败: ${result?.message || '未知错误'}`)
        }
    } catch (error) {
        console.error('批量删除失败:', error)
        ElMessage.error('批量删除失败: ' + (error.message || '未知错误'))
    }
}

const handleExportSelectedUsers = () => {
    if (selectedRows.value.length === 0) {
        ElMessage.warning('请先勾选需要导出的用户')
        return
    }
    const headers = ['用户ID', '用户名', '角色', '部门', '邮箱', '状态', '加入时间']
    const escape = (val) => {
        const s = val == null ? '' : String(val)
        const needWrap = /[",\n]/.test(s)
        const escaped = s.replace(/"/g, '""')
        return needWrap ? `"${escaped}"` : escaped
    }
    const rows = selectedRows.value.map(u => [
        u.id,
        u.userName,
        u.tenantSuperAdmin ? '超级管理员' : '普通用户',
        u.department,
        u.email,
        u.status === 1 ? '开通' : u.status === 0 ? '关闭' : '待审核',
        u.createTime
    ].map(escape).join(','))
    const content = '\ufeff' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    a.href = url
    a.download = `users_export_${ts}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

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

.el-table :deep(.el-table__row) {
    height: 42px;
}

.el-table :deep(.el-table__cell) {
    padding: 5px 0;
}

.el-pagination {
    margin-top: 20px;
    text-align: center;
}

.filter-row {
    margin-bottom: 20px;
}

.button-group {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

.batch-actions {
    display: flex;
    justify-content: right;
    margin-top: 20px;
    margin-bottom: 20px;
}

.batch-actions .el-button {
    margin: 7px;
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

/* 隐藏桌面端元素，用于响应式 */
.hidden-sm-and-down {
    display: none;
}

.hidden-md-and-down {
    display: none;
}

/* 移动端适配：屏幕宽度小于 768px（手机） */
@media (max-width: 768px) {
    .user-management {
        padding: 10px;
    }

    /* 显示移动端部门筛选 */
    .filter-row .hidden-md-and-up {
        display: block !important;
    }

    .filter-row .el-col {
        width: 100% !important;
        margin-bottom: 8px;
    }

    .filter-row .button-group {
        display: flex;
        flex-direction: row;
        width: 100%;
        justify-content: flex-start;
        margin-top: 10px;
    }

    .filter-row .button-group .el-button {
        flex: 1;
        margin: 0 4px 0 0;
    }

    .batch-actions {
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }

    .batch-actions .el-button {
        width: 100%;
        margin: 6px 0 !important;
    }

    .el-table {
        overflow-x: auto;
        white-space: nowrap;
    }

    .el-table :deep(.cell .el-button) {
        padding: 2px 6px;
        font-size: 12px;
        min-height: 26px;
    }

    .el-pagination {
        text-align: center;
        padding: 10px 0;
    }

    .el-pagination :deep(.el-pager li),
    .el-pagination :deep(button) {
        min-width: 28px;
        height: 28px;
        line-height: 28px;
        font-size: 13px;
    }
}
</style>