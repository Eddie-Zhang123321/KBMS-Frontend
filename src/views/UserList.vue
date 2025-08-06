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
                <el-menu v-if="!isCollapsed" :default-active="selectedDepartmentId" class="el-menu-vertical-demo"
                    @select="handleDepartmentSelect">
                    <template v-for="department in departments" :key="department.id">
                        <!-- 有子部门时显示可展开菜单 -->
                        <el-sub-menu v-if="department.children && department.children.length"
                            :index="department.id.toString()">
                            <template #title>
                                <span>{{ department.name }}</span>
                            </template>
                            <el-menu-item v-for="child in department.children" :key="child.id"
                                :index="child.id.toString()">
                                {{ child.name }}
                            </el-menu-item>
                        </el-sub-menu>

                        <!-- 没有子部门时显示普通菜单项 -->
                        <el-menu-item v-else :index="department.id.toString()">
                            <span>{{ department.name }}</span>
                        </el-menu-item>
                    </template>
                </el-menu>
            </el-col>

            <!-- 右侧用户信息展示 -->
            <el-col :span="isCollapsed ? 23 : 20">
                <el-row :gutter="16" class="filter-row">
                    <el-col :span="5">
                        <el-input placeholder="请输入用户ID" v-model="filters.userId" clearable></el-input>
                    </el-col>
                    <el-col :span="5">
                        <el-input placeholder="请输入用户名" v-model="filters.userName" clearable></el-input>
                    </el-col>
                    <el-col :span="5">
                        <el-select v-model="filters.role" placeholder="选择角色" style="width: 100%">
                            <el-option label="全部" value=""></el-option>
                            <el-option label="管理员" value="管理员"></el-option>
                            <el-option label="超管" value="超管"></el-option>
                        </el-select>
                    </el-col>
                    <el-col :span="5">
                        <el-select v-model="filters.status" placeholder="选择状态" style="width: 100%">
                            <el-option label="全部" value=""></el-option>
                            <el-option label="开启" value="开启"></el-option>
                            <el-option label="关闭" value="关闭"></el-option>
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
                    <el-button type="primary">批量删除</el-button>
                    <el-button type="primary">用户导出</el-button>
                </el-row>

                <!-- 用户列表 -->
                <el-table :data="users" style="width: 100%" stripe>
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
import { DArrowRight, DArrowLeft } from '@element-plus/icons-vue'; // 引入箭头图标
import { getDepartments } from '@/api/department'; // 导入部门API
import { getUserList, deleteUser } from '@/api/user'; // 用户APIx
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
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const isCollapsed = ref(false); // 控制菜单收起状态

// 获取部门数据
onMounted(() => {
    fetchDepartments();
    fetchUserList();
});

// 获取部门数据
const fetchDepartments = async () => {
    try {
        const response = await getDepartments();
        departments.value = response; // 假设接口返回部门的树形结构
    } catch (error) {
        console.error('获取部门数据失败', error);
    }
};

// 获取用户数据
const fetchUserList = async () => {
    const params = {
        departmentId: selectedDepartmentId.value,
        userId: filters.value.userId,
        userName: filters.value.userName,
        role: filters.value.role,
        status: filters.value.status,
        page: pageNum.value,
        size: pageSize.value
    };

    try {
        const response = await getUserList(params);
        users.value = response.items;
        total.value = response.total;
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
    console.log('编辑用户', row);
};

// 删除用户
const handleDelete = (row) => {
    console.log('删除用户', row);
    deleteUser(row.userId).then(() => {
        fetchUserList();
    }).catch((error) => {
        console.error('删除失败', error);
    });
};

// 分页变更
const handlePageChange = (newPage) => {
    pageNum.value = newPage;
    fetchUserList();
};

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
