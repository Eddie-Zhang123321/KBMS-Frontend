<template>
    <div class="tenant-management">
        <el-row :gutter="16" class="filter-row">
            <el-col :span="6" :xs="24" :sm="12">
                <el-input placeholder="请输入租户名称" v-model="filters.tenantName" clearable></el-input>
            </el-col>
            <el-col :span="6" :xs="24" :sm="12">
                <el-input placeholder="请输入租户编号" v-model="filters.code" clearable></el-input>
            </el-col>
            <el-col :span="6" :xs="24" :sm="12">
                <el-select v-model="filters.status" placeholder="选择状态" style="width: 100%" clearable>
                    <el-option label="开通" :value="1"></el-option>
                    <el-option label="关闭" :value="0"></el-option>
                </el-select>
            </el-col>
            <el-col :span="6" :xs="24" :sm="12" class="button-group">
                <el-button type="primary" @click="search">查询</el-button>
                <el-button @click="reset">重置</el-button>
            </el-col>
        </el-row>

        <el-row class="batch-actions">
            <el-button type="primary" @click="handleBatchAdd">新增租户</el-button>
        </el-row>

        <el-table ref="tableRef" :data="paginatedData" style="width: 100%" stripe v-loading="loading">
            <el-table-column prop="id" label="序号" width="60" />
            <el-table-column prop="code" label="租户编码" />
            <el-table-column prop="tenantName" label="租户名称" />
            <el-table-column prop="status" label="租户状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                        {{ row.status === 1 ? '开通' : '关闭' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="superAdmin" label="租户管理员" class-name="hidden-sm-and-down" />
            <el-table-column prop="email" label="管理员邮箱" class-name="hidden-sm-and-down" />
            <el-table-column label="操作" width="220">
                <template #default="{ row }">
                    <el-button size="small" type="warning" @click="handleToggleStatus(row)">
                        {{ row.status === 1 ? '关闭' : '开通' }}
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

        <CreateTenant ref="createTenantDialog" @success="onCreateOrEditSuccess" />
    </div>
</template>

<script setup>
// ... (script 脚本部分保持不变) ...
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus'
import { ElTable, ElTableColumn, ElInput, ElButton, ElTag, ElPagination, ElRow, ElCol, ElSelect, ElOption, ElIcon } from 'element-plus';
import { FolderOpened } from '@element-plus/icons-vue';
import { getTenantList, updateTenantStatus, deleteTenant } from '@/api/tenant';
import CreateTenant from '@/components/dialogs/CreateTenant.vue';
import { useUserStore } from '@/stores/user';

const filters = ref({
    tenantName: '',
    code: '',
    status: null
});

const tenantList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const loading = ref(false);
const tableRef = ref(null);
const createTenantDialog = ref(null);

const paginatedData = computed(() => {
    return tenantList.value || [];
});

watch(currentPage, () => {
    fetchTenantList();
}, { immediate: false });

onMounted(() => {
    fetchTenantList();
});

const fetchTenantList = async () => {
    loading.value = true;
    try {
        const params = {
            page: currentPage.value,
            pageSize: pageSize.value,
            ...filters.value
        };

        const response = await getTenantList(params);

        if (response && response.items) {
            const filteredItems = response.items.map(item => {
                const { page, pageSize, ...cleanItem } = item;
                return cleanItem;
            });
            tenantList.value = filteredItems;
            total.value = response.total || 0;
        } else if (Array.isArray(response)) {
            const filteredItems = response.map(item => {
                const { page, pageSize, ...cleanItem } = item;
                return cleanItem;
            });
            tenantList.value = filteredItems;
            total.value = filteredItems.length;
        } else {
            tenantList.value = [];
            total.value = 0;
        }
    } catch (error) {
        console.error("获取租户数据失败", error);
        ElMessage.error('获取租户数据失败: ' + (error.message || '未知错误'));
        tenantList.value = [];
        total.value = 0;
    } finally {
        loading.value = false;
    }
};

const search = () => {
    currentPage.value = 1;
    fetchTenantList();
    ElMessage.success('筛选完成');
};

const reset = () => {
    filters.value = {
        tenantName: '',
        code: '',
        status: null
    };
    currentPage.value = 1;
    fetchTenantList();
};

const handleToggleStatus = (row) => {
    const newStatus = row.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? '开通' : '关闭';

    ElMessageBox.confirm(`确认${action}租户「${row.tenantName}」吗？`, '提示', { type: 'warning' })
        .then(async () => {
            try {
                const response = await updateTenantStatus(row.id, { status: newStatus });
                ElMessage.success(`租户已${action}`);

                const updatedTenant = response?.data || response;
                if (updatedTenant) {
                    const index = tenantList.value.findIndex(tenant => tenant.id === row.id);
                    if (index !== -1) {
                        tenantList.value[index] = { ...tenantList.value[index], ...updatedTenant };
                    }
                }
            } catch (error) {
                console.error('状态切换失败:', error);
                ElMessage.error(`${action}失败: ${error.message || '未知错误'}`);
            }
        })
        .catch(() => { });
};

const handleDelete = (row) => {
    ElMessageBox.confirm(`确认删除租户「${row.tenantName}」吗？`, '提示', { type: 'warning' })
        .then(async () => {
            try {
                await deleteTenant(row.id);
                ElMessage.success('已删除');

                const index = tenantList.value.findIndex(tenant => tenant.id === row.id);
                if (index !== -1) {
                    tenantList.value.splice(index, 1);
                    total.value = Math.max(0, total.value - 1);

                    if (tenantList.value.length === 0 && currentPage.value > 1) {
                        currentPage.value = currentPage.value - 1;
                        fetchTenantList();
                    }
                }
            } catch (error) {
                console.error('删除失败:', error);
                ElMessage.error('删除失败: ' + (error.message || '未知错误'));
            }
        })
        .catch(() => { });
};

const handleBatchAdd = () => {
    createTenantDialog.value?.open();
};

const onCreateOrEditSuccess = ({ mode, row }) => {
    if (mode === 'create' && row) {
        const { page, pageSize, ...cleanRow } = row;
        tenantList.value.unshift(cleanRow);
        total.value = total.value + 1;
        if (tenantList.value.length > pageSize.value) {
            currentPage.value = 1;
            fetchTenantList();
        }
    }
};

const handlePageChange = (newPage) => {
    currentPage.value = newPage;
    fetchTenantList();
};
</script>

<style scoped>
/* 确保表格行高统一 */
.el-table :deep(.el-table__row) {
    height: 50px;
}

/* 隐藏桌面端元素 */
.hidden-sm-and-down {
    display: none;
}

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

/* 移动端适配：屏幕宽度小于 768px */
@media (max-width: 768px) {
    .tenant-management {
        padding: 10px;
    }

    /* 筛选表单布局 */
    .filter-row .el-col {
        width: 100% !important;
        margin-bottom: 8px;
    }

    .filter-row .button-group {
        justify-content: flex-start;
        margin-top: 10px;
    }

    .filter-row .button-group .el-button {
        width: 50%;
    }

    /* 批量操作按钮 */
    .batch-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .batch-actions .el-button {
        width: 100%;
        margin: 6px 0 !important;
    }

    /* 表格优化 */
    .el-table {
        overflow-x: auto;
        white-space: nowrap;
    }

    .el-table :deep(.cell .el-button) {
        padding: 2px 6px;
        font-size: 12px;
        min-height: 26px;
    }

    /* 分页器缩小 */
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