<template>
    <div class="tenant-management">
        <el-row :gutter="16">
            <el-col :span="6">
                <el-input placeholder="请输入租户名称" v-model="filters.tenantName" clearable></el-input>
            </el-col>
            <el-col :span="6">
                <el-input placeholder="请输入租户编号" v-model="filters.tenantCode" clearable></el-input>
            </el-col>
            <el-col :span="6">
                <el-select v-model="filters.tenantStatus" placeholder="选择状态" style="width: 100%">
                    <el-option label="开通" value="开通"></el-option>
                    <el-option label="关闭" value="关闭"></el-option>
                </el-select>
            </el-col>
            <el-col :span="5" class="text-right">
                <el-button type="primary" @click="search">查询</el-button>
                <el-button @click="reset">重置</el-button>
            </el-col>
        </el-row>
        <el-row class="batch-actions" style="margin-top: 20px;">
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">批量删除</el-button>
            <el-button type="primary" @click="handleBatchAdd">新增租户</el-button>
        </el-row>
        <el-table :data="tenants" style="width: 100%" stripe @selection-change="onSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="序号" width="60" />
            <el-table-column prop="tenantCode" label="租户编码" />
            <el-table-column prop="tenantName" label="租户名称" />
            <el-table-column prop="tenantStatus" label="租户状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.tenantStatus === '开通' ? 'success' : 'danger'">
                        {{ row.tenantStatus }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="expiry" label="有效期" />
            <el-table-column prop="tenantAdmin" label="租户管理员" />
            <el-table-column prop="phone" label="管理员电话" />
            <el-table-column label="操作" width="220">
                <template #default="{ row }">
                    <el-button size="small" type="success" @click="handleEdit(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total" layout="prev, pager, next"
            @current-change="handlePageChange" @size-change="handleSizeChange" />

        <CreateTenant ref="createTenantDialog" @success="onCreateOrEditSuccess" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus'
import { ElTable, ElTableColumn, ElInput, ElButton, ElTag, ElPagination, ElRow, ElCol, ElSelect, ElOption } from 'element-plus';
import { getTenantList, updateTenant, deleteTenant } from '@/api/tenant'; // 导入封装好的 API 方法
import CreateTenant from '@/components/dialogs/CreateTenant.vue'; // 导入 CreateTenant 组件

const filters = ref({
    tenantName: '',
    tenantCode: '',
    tenantStatus: ''  // 新增租户状态过滤
});

const tenants = ref([]);
const selectedRows = ref([]);  // 记录选中的租户
const total = ref(0);
const pageNum = ref(1);  // 当前页
const pageSize = ref(10);  // 每页条数

const createTenantDialog = ref(null); // 定义 ref 用于控制 CreateTenant

// 组件加载时获取租户列表
onMounted(() => {
    fetchTenantList();
});

const fetchTenantList = async () => {
    const params = {
        tenantName: filters.value.tenantName || undefined,
        tenantCode: filters.value.tenantCode || undefined,
        tenantStatus: filters.value.tenantStatus || undefined,
        page: pageNum.value,
        size: pageSize.value
    };

    try {
        const response = await getTenantList(params);  // 调用封装好的接口
        tenants.value = response.items;  // 假设返回的数据结构是 { items: [], total: 150 }
        total.value = response.total;
    } catch (error) {
        console.error("获取租户数据失败", error);
    }
};

const search = () => {
    pageNum.value = 1; // 重置到第一页
    fetchTenantList();
};

const reset = () => {
    filters.value = { tenantName: '', tenantCode: '', tenantStatus: '' };
    fetchTenantList();
};

const handleEdit = (row) => {
    createTenantDialog.value?.open('edit', row)
};

const handleDelete = (row) => {
    ElMessageBox.confirm(`确认删除租户「${row.tenantName}」吗？`, '提示', { type: 'warning' })
      .then(async () => {
        await deleteTenant(row.id)
        // 本地移除，避免额外请求
        tenants.value = tenants.value.filter(t => String(t.id) !== String(row.id))
        total.value = Math.max(0, total.value - 1)
        ElMessage.success('已删除')
        //fetchTenantList() 
      })
      .catch(() => {})
};

// 批量删除
const handleBatchDelete = () => {
    const ids = selectedRows.value.map(row => row.id)
    if (ids.length === 0) return
    ElMessageBox.confirm(`确认批量删除选中的 ${ids.length} 个租户吗？`, '提示', { type: 'warning' })
      .then(async () => {
        await Promise.all(ids.map(id => deleteTenant(id)))
        ElMessage.success('批量删除成功')
        selectedRows.value = []
        fetchTenantList()
      })
      .catch(() => {})
};

// 表格勾选变更
const onSelectionChange = (rows) => {
    selectedRows.value = rows || []
};

const handleBatchAdd = () => {
    createTenantDialog.value?.open('create'); // 调用 CreateTenant 的 open 方法
};

// 新增/编辑成功：优先本地更新，减少一次请求；若无法匹配则回退刷新
const onCreateOrEditSuccess = ({ mode, row }) => {
    if (mode === 'edit') {
        const idx = tenants.value.findIndex(t => String(t.id) === String(row.id))
        if (idx >= 0) {
            tenants.value[idx] = { ...tenants.value[idx], ...row }
            return
        }
    }
    if (mode === 'create') {
        // 按当前筛选条件决定是否展示新创建项
        const matchName = !filters.value.tenantName || String(row.tenantName).includes(filters.value.tenantName)
        const matchCode = !filters.value.tenantCode || String(row.tenantCode).includes(filters.value.tenantCode)
        const matchStatus = !filters.value.tenantStatus || row.tenantStatus === filters.value.tenantStatus
        if (matchName && matchCode && matchStatus) {
            tenants.value = [row, ...tenants.value]
        }
        total.value += 1
        return
    }
    fetchTenantList()
}


// 分页变更
const handlePageChange = (newPage) => {
    pageNum.value = newPage;
    fetchTenantList();
};

// 每页条数变更
const handleSizeChange = (newSize) => {
    pageSize.value = newSize;
    fetchTenantList();
};
</script>

<style scoped>
.tenant-management {
    padding: 20px;
}

.el-table {
    margin-top: 20px;
}

.el-pagination {
    margin-top: 20px;
    text-align: center;
}

.text-right {
    display: flex;
    justify-content: right;
}
.batch-actions {
    display: flex;
    justify-content: right;
    margin-top: 20px;
    margin-right: 60px;
}
</style>
