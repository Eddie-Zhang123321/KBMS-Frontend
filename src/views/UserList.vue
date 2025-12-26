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
                <el-menu v-if="!isCollapsed" :default-active="selectedDepartment" class="el-menu-vertical-demo" @select="handleDepartmentSelect">
                    <el-menu-item v-for="department in departments" :key="department.id" :index="department.id.toString()">
                        <span>{{ department.name }}</span>
                    </el-menu-item>
                </el-menu>
            </el-col>

            <!-- 右侧用户信息展示 -->
            <el-col :span="isCollapsed ? 23 : 20">
                <el-row :gutter="16" class="filter-row">
                    <el-col :span="4">
                        <el-input placeholder="请输入用户ID" v-model="filters.id" clearable></el-input>
                    </el-col>
                    <el-col :span="4">
                        <el-input placeholder="请输入用户名" v-model="filters.userName" clearable></el-input>
                    </el-col>
                    <el-col :span="4">
                        <el-select v-model="filters.tenantSuperAdmin" placeholder="选择角色" style="width: 100%">
                            <el-option label="全部" :value="null" />
                            <el-option label="超级管理员" :value="true" />
                            <el-option label="普通用户" :value="false" />
                        </el-select>
                    </el-col>
                    <el-col :span="4">
                        <el-select v-model="filters.status" placeholder="选择状态" style="width: 100%">
                            <el-option label="全部" :value="null" />
                            <el-option label="开通" :value="1" />
                            <el-option label="关闭" :value="0" />
                            <el-option label="待审核" :value="2" />
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
                    <CreateUSER ref="createDialog" @user-created="handleUserCreated" />
                    <el-button type="primary" @click="openBatchImport">批量导入</el-button>
                    <BatchImport ref="batchImport" @import-success="fetchUserList" />
                    <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleBatchDeleteUsers">批量删除</el-button>
                    <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleExportSelectedUsers">用户导出</el-button>
                </el-row>

                <!-- 用户列表 -->
                <el-table ref="tableRef" :data="paginatedData" style="width: 100%" stripe @selection-change="onSelectionChange" v-loading="loading" :row-style="{ height: '50px' }">
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
                    <el-table-column prop="department" label="所属部门" />
                    <el-table-column prop="email" label="邮箱" />
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'danger' : 'warning'">
                                {{ row.status === 1 ? '开通' : row.status === 0 ? '关闭' : '待审核' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="createTime" label="加入时间" width="160" />
                    <el-table-column label="操作" width="260">
                        <template #default="{ row }">
                            <el-button v-if="row.status !== 2" size="small" type="warning" @click="handleToggleStatus(row)">
                                {{ row.status === 1 ? '关闭' : '开通' }}
                            </el-button>
                            <el-button v-if="row.status === 2" size="small" type="primary" @click="handleApproveStatus(row)">
                                审核
                            </el-button>
                            <el-button size="small" type="primary" plain @click="handleEdit(row)">编辑</el-button>
                            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
                        </template>
                    </el-table-column>
                    
                    <!-- 空数据提示 -->
                    <template #empty>
                        <div style="padding: 40px 0; text-align: center; color: #999;">
                            <el-icon style="font-size: 48px; margin-bottom: 16px;"><FolderOpened /></el-icon>
                            <p>暂无数据</p>
                            <p style="font-size: 12px; margin-top: 8px;">
                                请尝试调整筛选条件或 <el-button link @click="reset">清除所有筛选</el-button>
                            </p>
                        </div>
                    </template>
                </el-table>

                <!-- 编辑用户弹窗 -->
                <EditUser ref="editDialog" @user-updated="handleUserUpdated" />

                <el-pagination 
                    v-model:current-page="currentPage"
                    :total="total"
                    :page-size="pageSize"
                    layout="total, prev, pager, next, jumper"
                    @current-change="handlePageChange"
                />

            </el-col>
        </el-row>
    </div>
</template>

<script setup>
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
    ElSubMenu,
    ElIcon
} from 'element-plus';
import { ElMessageBox, ElMessage } from 'element-plus'
import { DArrowRight, DArrowLeft, FolderOpened } from '@element-plus/icons-vue'; // 引入箭头图标
import { getDepartments } from '@/api/department'; // 导入部门API
import { getUserList, deleteUser, updateUserStatus, batchDeleteUsers } from '@/api/user'; // 用户API
import CreateUSER from '@/components/dialogs/CreateUser.vue'
import EditUser from '@/components/dialogs/EditUser.vue'
import BatchImport from '@/components/dialogs/BatchImport.vue';
import { useUserStore } from '@/stores/user'; // Import user store
const createDialog = ref()
const editDialog = ref()
const batchImport = ref()
// 筛选条件
const filters = ref({
    id: '',
    userName: '',
    tenantSuperAdmin: null, // 改为布尔值筛选
    status: null
});
const createUser = () => {
    console.log('创建用户')
    createDialog.value.open()
}

// 处理用户创建成功
const handleUserCreated = (newUser) => {
    console.log('用户创建成功，新用户数据:', newUser)
    
    // 将新用户添加到本地列表的开头
    if (newUser && typeof newUser === 'object') {
        userList.value.unshift(newUser)
        total.value = total.value + 1
        
        // 重置到第一页，确保能看到新用户
        currentPage.value = 1
        
        // 显示成功消息
        ElMessage.success('新用户已添加到列表中')
    } else {
        // 如果没有新用户数据，则重新请求数据
        console.log('没有新用户数据，重新请求用户列表')
        fetchUserList()
    }
}

// 编辑用户
const handleEdit = (row) => {
    if (editDialog.value) {
        editDialog.value.open(row)
    }
}

// 处理用户更新成功
const handleUserUpdated = (updatedUser) => {
    if (updatedUser && typeof updatedUser === 'object') {
        const idx = userList.value.findIndex(u => u.id === updatedUser.id)
        if (idx !== -1) {
            userList.value[idx] = { ...userList.value[idx], ...updatedUser }
        }
    } else {
        fetchUserList()
    }
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

// 数据相关
const departments = ref([]);
const selectedDepartment = ref(null); // 记录选中的部门ID
const userList = ref([]); // 用户数据列表
const selectedRows = ref([])
const tableRef = ref(null)
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10); // 固定每页10条数据
const loading = ref(false);
const isCollapsed = ref(false); // 控制菜单收起状态

// 计算属性：分页后的数据（现在直接使用服务端分页）
const paginatedData = computed(() => {
    return userList.value || [];
});

// 监听分页变化
watch(currentPage, () => {
    fetchUserList();
}, { immediate: false });

// 组件加载时获取数据
onMounted(async () => {
    await fetchDepartments();
    await fetchUserList();
});

// 获取部门数据
const fetchDepartments = async () => {
    try {
        const response = await getDepartments();
        console.log('部门数据响应:', response);
        
        // 处理响应数据，使用正确的API格式
        if (response && response.data && response.data.items) {
            // 使用正确的响应结构：response.data.items
            departments.value = response.data.items.map(d => ({ id: d.id, name: d.name }));
            console.log('部门数据解析成功:', departments.value.length, '个部门');
        } else if (response && response.items) {
            // 兼容直接返回items的情况
            departments.value = response.items.map(d => ({ id: d.id, name: d.name }));
            console.log('部门数据解析成功(兼容格式):', departments.value.length, '个部门');
        } else if (Array.isArray(response)) {
            // 兼容直接返回数组的情况
            departments.value = response.map(d => ({ id: d.id, name: d.name }));
            console.log('部门数据解析成功(数组格式):', departments.value.length, '个部门');
        } else {
            console.warn('部门数据解析失败，响应格式:', response);
            departments.value = [];
        }
    } catch (error) {
        console.error('获取部门数据失败', error);
        ElMessage.error('获取部门数据失败: ' + (error.message || '未知错误'));
        departments.value = [];
    }
};

// 获取用户数据（支持服务端分页和筛选）
const fetchUserList = async () => {
    loading.value = true;
    
    try {
        // 构建查询参数，租户ID已通过X-Tenant-Id请求头自动传递
        const params = {
            page: currentPage.value,
            pageSize: pageSize.value,
            ...filters.value
        };

        // 添加部门筛选（使用部门名称）
        if (selectedDepartment.value) {
            // 根据部门ID找到部门名称
            const department = departments.value.find(d => d.id.toString() === selectedDepartment.value);
            if (department) {
                // 传递部门名称，这是最常用的筛选方式
                params.department = department.name;
                console.log('部门筛选 - 部门ID:', selectedDepartment.value, '部门名称:', department.name);
            } else {
                console.warn('未找到对应的部门信息，部门ID:', selectedDepartment.value);
            }
        }

        // 移除空值参数（与API层保持一致）
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
                delete params[key];
            }
        });
        
        console.log('=== fetchUserList 开始 ===');
        console.log('请求参数:', params);
        
        const response = await getUserList(params);
        console.log('响应数据:', response);
        
        // 处理响应数据，使用正确的API格式
        if (response && response.data && response.data.items) {
            // 使用正确的响应结构：response.data.items
            userList.value = response.data.items;
            total.value = response.data.total || 0;
            console.log('用户列表数据解析成功:', userList.value.length, '条记录');
        } else if (response && response.items) {
            // 兼容直接返回items的情况
            userList.value = response.items;
            total.value = response.total || 0;
            console.log('用户列表数据解析成功(兼容格式):', userList.value.length, '条记录');
        } else if (Array.isArray(response)) {
            // 兼容直接返回数组的情况
            userList.value = response;
            total.value = response.length;
            console.log('用户列表数据解析成功(数组格式):', userList.value.length, '条记录');
        } else {
            console.warn('用户列表数据解析失败，响应格式:', response);
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

// 部门选择
const handleDepartmentSelect = (key) => {
    console.log('=== 部门选择开始 ===');
    console.log('选中的部门ID:', key);
    console.log('当前部门列表:', departments.value);
    
    // 如果点击的是当前已选中的部门，则取消选择
    if (selectedDepartment.value === key) {
        selectedDepartment.value = null;
        console.log('取消部门筛选');
    } else {
        selectedDepartment.value = key;
        console.log('选择部门筛选:', key);
    }
    
    currentPage.value = 1; // 重置到第一页
    
    console.log('准备调用fetchUserList，当前选中部门:', selectedDepartment.value);
    fetchUserList(); // 选择部门后重新获取用户数据
    console.log('=== 部门选择结束 ===');
};

// 修改查询按钮函数，添加筛选参数
const search = () => {
    console.log('=== 查询按钮点击开始 ===');
    console.log('当前筛选条件:', filters.value);
    console.log('当前选中部门:', selectedDepartment.value);
    
    currentPage.value = 1; // 重置到第一页
    
    console.log('准备调用fetchUserList');
    fetchUserList();
    
    // 检查是否有筛选条件
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
    console.log('=== 查询按钮点击结束 ===');
};

// 重置筛选条件
const reset = () => {
    filters.value = {
        id: '',
        userName: '',
        tenantSuperAdmin: null,
        status: null
    };
    selectedDepartment.value = null; // 重置部门选择
    currentPage.value = 1;
    // 主动调用获取数据
    fetchUserList();
};

// 切换用户状态
const handleToggleStatus = (row) => {
    const newStatus = row.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? '开通' : '关闭';
    
    ElMessageBox.confirm(`确认${action}用户「${row.userName}」吗？`, '提示', { type: 'warning' })
      .then(async () => {
        try {
          const response = await updateUserStatus(row.id, { status: newStatus });
          ElMessage.success(`用户已${action}`);
          
          // 直接更新本地状态（因为接口返回 data: null）
          const index = userList.value.findIndex(user => user.id === row.id);
          if (index !== -1) {
            userList.value[index] = { ...userList.value[index], status: newStatus };
          }
        } catch (error) {
          console.error('状态切换失败:', error);
          ElMessage.error(`${action}失败: ${error.message || '未知错误'}`);
        }
      })
      .catch(() => {});
};

// 审核用户状态
const handleApproveStatus = (row) => {
    ElMessageBox.confirm(`确认审核通过用户「${row.userName}」吗？`, '提示', { type: 'warning' })
      .then(async () => {
        try {
          const response = await updateUserStatus(row.id, { status: 1 }); // 审核通过设为开通状态
          ElMessage.success('用户审核通过');
          
          // 使用返回的数据更新本地列表
          const updatedUser = response?.data || response;
          if (updatedUser) {
            const index = userList.value.findIndex(user => user.id === row.id);
            if (index !== -1) {
              userList.value[index] = { ...userList.value[index], ...updatedUser };
            }
          } else {
            // 如果没有返回数据，直接更新本地状态
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
      .catch(() => {});
};

// 删除用户
const handleDelete = (row) => {
    ElMessageBox.confirm(`确认删除用户「${row.userName}」吗？`, '提示', { type: 'warning' })
      .then(async () => {
        try {
          await deleteUser(row.id);
          ElMessage.success('已删除');
          
          // 从本地列表中移除删除的用户
          const index = userList.value.findIndex(user => String(user.id) === String(row.id));
          if (index !== -1) {
            userList.value.splice(index, 1);
            // 更新总数
            total.value = Math.max(0, total.value - 1);
            
            // 如果当前页没有数据了，且不是第一页，则跳转到上一页
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
      .catch(() => {});
};

// 分页变更
const handlePageChange = (newPage) => {
    currentPage.value = newPage;
    fetchUserList();
};

// 勾选变化
const onSelectionChange = (rows) => {
    selectedRows.value = rows || []
}

// 批量删除所选用户
const handleBatchDeleteUsers = async () => {
    if (selectedRows.value.length === 0) return
    const ids = selectedRows.value.map(r => r.id)
    
    try {
        await ElMessageBox.confirm(`确认批量删除选中的 ${ids.length} 位用户吗？`, '提示', { type: 'warning' })
        
        console.log('开始批量删除用户，用户ID列表:', ids)
        
        const response = await batchDeleteUsers(ids)
        console.log('批量删除响应:', response)
        
        // 处理响应数据
        const result = response?.data || response
        
        if (result && result.deletedCount !== undefined) {
            const deletedCount = result.deletedCount || 0
            const deletedIds = result.deletedUserIds || []
            
            if (deletedCount > 0) {
                // 从本地列表中移除成功删除的用户
                userList.value = userList.value.filter(u => !deletedIds.includes(u.id))
                total.value = Math.max(0, total.value - deletedCount)
                
                // 清空选择
                tableRef.value?.clearSelection()
                selectedRows.value = []
                
                ElMessage.success(`成功删除 ${deletedCount} 个用户`)
                
                // 如果当前页没有数据了，且不是第一页，则跳转到上一页
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

// 导出所选用户为 CSV 并下载
const handleExportSelectedUsers = () => {
    if (selectedRows.value.length === 0) {
        ElMessage.warning('请先勾选需要导出的用户')
        return
    }
    const headers = ['用户ID','用户名','角色','部门','邮箱','状态','加入时间']
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
    const ts = new Date().toISOString().replace(/[-:T]/g,'').slice(0,14)
    a.href = url
    a.download = `users_export_${ts}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

/* 响应式设计 */
@media (max-width: 768px) {
    .user-management {
        padding: 10px;
    }
    
    .department-col {
        display: none; /* 移动端隐藏部门菜单 */
    }
    
    .filter-row .el-col {
        margin-bottom: 10px;
    }
    
    .filter-row .el-col:not(:last-child) {
        margin-bottom: 10px;
    }
    
    .button-group {
        display: flex;
        gap: 10px;
    }
    
    .button-group .el-button {
        flex: 1;
    }
    
    .batch-actions {
        flex-direction: column;
        gap: 10px;
    }
    
    .batch-actions .el-button {
        width: 100%;
    }
    
    .user-table {
        font-size: 12px;
    }
    
    .user-table .el-table__cell {
        padding: 8px 4px;
    }
    
    .user-table .el-button {
        padding: 4px 8px;
        font-size: 12px;
    }
}

@media (max-width: 480px) {
    .user-management {
        padding: 5px;
    }
    
    .filter-row .el-col {
        margin-bottom: 8px;
    }
    
    .user-table {
        font-size: 11px;
    }
    
    .user-table .el-table__cell {
        padding: 6px 2px;
    }
}
</style>
