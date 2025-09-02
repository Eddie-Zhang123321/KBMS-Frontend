<template>
    <div class="tenant-management">
        <el-row :gutter="16" class="filter-row">
            <el-col :span="6">
                <el-input
                    placeholder="请输入租户名称"
                    v-model="filters.tenantName"
                    clearable
                    @clear="search"
                ></el-input>
            </el-col>
            <el-col :span="6">
                <el-input
                    placeholder="请输入租户编号"
                    v-model="filters.tenantCode"
                    clearable
                    @clear="search"
                ></el-input>
            </el-col>
            <el-col :span="6">
                <el-select
                    v-model="filters.tenantStatus"
                    placeholder="选择状态"
                    style="width: 100%"
                    clearable
                    @clear="search"
                >
                    <el-option label="开通" value="开通"></el-option>
                    <el-option label="关闭" value="关闭"></el-option>
                </el-select>
            </el-col>
            <el-col :span="6" class="button-group">
                <el-button type="primary" @click="search">查询</el-button>
                <el-button @click="reset">重置</el-button>
            </el-col>
        </el-row>
        
        <el-row class="batch-actions">
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">批量删除</el-button>
            <el-button type="primary" @click="handleBatchAdd">新增租户</el-button>
        </el-row>

        <el-table
            ref="tableRef"
            :data="paginatedData"
            style="width: 100%"
            stripe
            v-loading="loading"
            @selection-change="onSelectionChange"
        >
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

        <el-pagination 
            :current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
        />

        <CreateTenant ref="createTenantDialog" @success="onCreateOrEditSuccess" />
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus'
import { ElTable, ElTableColumn, ElInput, ElButton, ElTag, ElPagination, ElRow, ElCol, ElSelect, ElOption, ElIcon } from 'element-plus';
import { FolderOpened } from '@element-plus/icons-vue';
import { getTenantList, updateTenant, deleteTenant } from '@/api/tenant';
import CreateTenant from '@/components/dialogs/CreateTenant.vue';
import { useUserStore } from '@/stores/user';

// 筛选条件
const filters = ref({
    tenantName: '',
    tenantCode: '',
    tenantStatus: ''
});

// 数据相关
const allTenants = ref([]);  // 所有租户数据
const filteredTenants = ref([]);  // 筛选后的租户数据
const selectedRows = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const tableRef = ref(null);

// 组件引用
const createTenantDialog = ref(null);

// 计算属性：分页后的数据
const paginatedData = computed(() => {
    if (!filteredTenants.value || !Array.isArray(filteredTenants.value)) {
        return [];
    }
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredTenants.value.slice(start, end);
});

// 计算属性：总条数
const total = computed(() => {
    if (!filteredTenants.value || !Array.isArray(filteredTenants.value)) {
        return 0;
    }
    return filteredTenants.value.length;
});

// 监听筛选条件变化，自动触发搜索
watch(filters, () => {
    // 确保组件已初始化
    if (allTenants.value && Array.isArray(allTenants.value)) {
        applyFilters();
        currentPage.value = 1;
    }
}, { deep: true });

// 组件加载时获取租户列表
onMounted(() => {
    // 确保初始数据结构正确
    if (!allTenants.value) {
        allTenants.value = [];
    }
    if (!filteredTenants.value) {
        filteredTenants.value = [];
    }
    fetchTenantList();
});

// 获取所有租户数据
const fetchTenantList = async () => {
    loading.value = true;
    
    try {
        // 获取所有租户数据（不分页）
        const params = {
            page: 1,
            size: 9999  // 获取所有数据
        };
        
        const response = await getTenantList(params);
        // 确保数据是数组格式
        allTenants.value = (response && response.items && Array.isArray(response.items)) 
            ? response.items 
            : (Array.isArray(response) ? response : []);
        
        // 应用筛选条件
        applyFilters();
    } catch (error) {
        console.error("获取租户数据失败", error);
        ElMessage.error('获取租户数据失败: ' + (error.message || '未知错误'));
        allTenants.value = [];
        filteredTenants.value = [];
    } finally {
        loading.value = false;
    }
};

// 应用筛选条件
const applyFilters = () => {
    // 确保 allTenants.value 是数组
    if (!allTenants.value || !Array.isArray(allTenants.value)) {
        filteredTenants.value = [];
        return;
    }
    
    let result = [...allTenants.value];
    
    // 租户名称筛选
    if (filters.value.tenantName) {
        const nameFilter = filters.value.tenantName.toLowerCase().trim();
        result = result.filter(tenant => 
            tenant.tenantName && tenant.tenantName.toLowerCase().includes(nameFilter)
        );
    }
    
    // 租户编号筛选
    if (filters.value.tenantCode) {
        const codeFilter = filters.value.tenantCode.toLowerCase().trim();
        result = result.filter(tenant => 
            tenant.tenantCode && tenant.tenantCode.toLowerCase().includes(codeFilter)
        );
    }
    
    // 租户状态筛选
    if (filters.value.tenantStatus) {
        result = result.filter(tenant => 
            tenant.tenantStatus === filters.value.tenantStatus
        );
    }
    
    filteredTenants.value = result;
    currentPage.value = 1;  // 重置到第一页
};

// 查询按钮
const search = () => {
    applyFilters();
    ElMessage.success('筛选完成');
};

// 重置筛选条件
const reset = () => {
    filters.value = {
        tenantName: '',
        tenantCode: '',
        tenantStatus: ''
    };
    // 重置后会自动触发 watch 进行筛选
};

// 编辑租户
const handleEdit = (row) => {
    createTenantDialog.value?.open('edit', row);
};

// 删除租户
const handleDelete = (row) => {
    ElMessageBox.confirm(`确认删除租户「${row.tenantName}」吗？`, '提示', { type: 'warning' })
      .then(async () => {
        await deleteTenant(row.id);
        // 从所有数据中移除
        allTenants.value = allTenants.value.filter(t => String(t.id) !== String(row.id));
        // 重新应用筛选
        applyFilters();
        ElMessage.success('已删除');
      })
      .catch(() => {});
};

// 批量删除
const handleBatchDelete = () => {
    const ids = selectedRows.value.map(row => row.id);
    if (ids.length === 0) return;
    
    ElMessageBox.confirm(`确认批量删除选中的 ${ids.length} 个租户吗？`, '提示', { type: 'warning' })
      .then(async () => {
        await Promise.all(ids.map(id => deleteTenant(id)));
        ElMessage.success('批量删除成功');
        selectedRows.value = [];
        
        // 从所有数据中移除
        allTenants.value = allTenants.value.filter(t => !ids.includes(t.id));
        // 重新应用筛选
        applyFilters();
      })
      .catch(() => {});
};

// 表格勾选变更
const onSelectionChange = (rows) => {
    selectedRows.value = rows || [];
};

// 新增租户
const handleBatchAdd = () => {
    createTenantDialog.value?.open('create');
};

// 新增/编辑成功处理
const onCreateOrEditSuccess = ({ mode, row }) => {
    if (mode === 'edit') {
        const idx = allTenants.value.findIndex(t => String(t.id) === String(row.id));
        if (idx >= 0) {
            allTenants.value[idx] = { ...allTenants.value[idx], ...row };
        }
    } else if (mode === 'create') {
        allTenants.value.unshift(row);
    }
    
    // 重新应用筛选以包含新数据
    applyFilters();
};

// 分页变更
const handlePageChange = (newPage) => {
    currentPage.value = newPage;
};

// 每页条数变更
const handleSizeChange = (newSize) => {
    pageSize.value = newSize;
    currentPage.value = 1;
};
</script>

<style scoped>
.tenant-management {
    padding: 20px;
}

.filter-row {
    margin-bottom: 20px;
}

.button-group {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
}

.batch-actions {
    display: flex;
    justify-content: flex-end;
    margin: 20px 0;
    gap: 10px;
}

.el-table {
    margin-top: 20px;
}

.el-pagination {
    margin-top: 20px;
    text-align: right;
}
</style>