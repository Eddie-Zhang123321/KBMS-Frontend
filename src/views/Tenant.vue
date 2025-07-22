<template>
    <div class="tenant-management">
        <el-row :gutter="16">
            <el-col :span="5">
                <el-input placeholder="请输入租户名称" v-model="filters.tenantName" clearable></el-input>
            </el-col>
            <el-col :span="5">
                <el-input placeholder="请输入租户编号" v-model="filters.tenantCode" clearable></el-input>
            </el-col>
            <el-col :span="4">
                <el-select v-model="filters.tenantStatus" placeholder="选择状态" style="width: 100%">
                    <el-option label="全部" value=""></el-option>
                    <el-option label="开通" value="开通"></el-option>
                    <el-option label="关闭" value="关闭"></el-option>
                </el-select>
            </el-col>
            <el-col :span="4" class="text-right">
                <el-button type="primary" @click="search">查询</el-button>
                <el-button @click="reset">重置</el-button>
            </el-col>
        </el-row>
        <el-row class="batch-actions" style="margin-top: 20px;">
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">批量删除</el-button>
            <el-button type="primary" @click="handleBatchEdit" :disabled="selectedRows.length === 0">批量编辑</el-button>
            <el-button type="primary" @click="handleBatchAdd">新增租户</el-button>
        </el-row>
        <el-table :data="tenants" style="width: 100%" stripe>
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
            <el-table-column label="操作" width="180">
                <template #default="{ row }">
                    <el-button size="small" type="success" @click="handleEdit(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total" layout="prev, pager, next"
            @current-change="handlePageChange" @size-change="handleSizeChange" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElTable, ElTableColumn, ElInput, ElButton, ElTag, ElPagination, ElRow, ElCol, ElSelect, ElOption } from 'element-plus';
import { getTenantList, createTenant, updateTenant, deleteTenant } from '@/api/tenant'; // 导入封装好的 API 方法

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

// 组件加载时获取租户列表
onMounted(() => {
    fetchTenantList();
});

const fetchTenantList = async () => {
    const params = {
        tenantName: filters.value.tenantName,
        tenantCode: filters.value.tenantCode,
        tenantStatus: filters.value.tenantStatus,  // 加入租户状态过滤
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
    console.log('编辑租户', row);
    // 假设编辑操作需要更新租户信息
    updateTenant(row.id, { tenantName: '更新后的名称' }).then(() => {
        fetchTenantList();  // 更新后重新获取租户列表
    }).catch((error) => {
        console.error('更新失败', error);
    });
};

const handleDelete = (row) => {
    console.log('删除租户', row);
    // 调用删除接口
    deleteTenant(row.id).then(() => {
        fetchTenantList();  // 删除后重新获取租户列表
    }).catch((error) => {
        console.error('删除失败', error);
    });
};

// 批量删除
const handleBatchDelete = () => {
    const ids = selectedRows.value.map(row => row.id);
    console.log('批量删除租户', ids);
    // 批量删除操作
    Promise.all(ids.map(id => deleteTenant(id))).then(() => {
        fetchTenantList();  // 删除后重新获取租户列表
        selectedRows.value = [];  // 清空选中项
    }).catch((error) => {
        console.error('批量删除失败', error);
    });
};

// 批量编辑
const handleBatchEdit = () => {
    const ids = selectedRows.value.map(row => row.id);
    console.log('批量编辑租户', ids);
    // 批量编辑操作
    // 你可以根据实际需求批量更新租户信息
};

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

.batch-actions {
    margin-top: 20px;
}
</style>
