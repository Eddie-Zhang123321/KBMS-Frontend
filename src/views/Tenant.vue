<template>
    <div class="tenant-management">
        <el-row :gutter="16" class="filter-row">
            <el-col :span="6">
                <el-input
                    placeholder="请输入租户名称"
                    v-model="filters.tenantName"
                    clearable
                ></el-input>
            </el-col>
            <el-col :span="6">
                <el-input
                    placeholder="请输入租户编号"
                    v-model="filters.code"
                    clearable
                ></el-input>
            </el-col>
            <el-col :span="6">
                <el-select
                    v-model="filters.status"
                    placeholder="选择状态"
                    style="width: 100%"
                    clearable
                >
                    <el-option label="开通" :value="1"></el-option>
                    <el-option label="关闭" :value="0"></el-option>
                </el-select>
            </el-col>
            <el-col :span="6" class="button-group">
                <el-button type="primary" @click="search">查询</el-button>
                <el-button @click="reset">重置</el-button>
            </el-col>
        </el-row>
        
        <el-row class="batch-actions">
            <el-button type="primary" @click="handleBatchAdd">新增租户</el-button>
        </el-row>

        <el-table
            ref="tableRef"
            :data="paginatedData"
            style="width: 100%"
            stripe
            v-loading="loading"
        >
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
            <el-table-column prop="superAdmin" label="租户管理员" />
            <el-table-column prop="email" label="管理员邮箱" />
            <el-table-column label="操作" width="220">
                <template #default="{ row }">
                    <el-button size="small" type="warning" @click="handleToggleStatus(row)">
                        {{ row.status === 1 ? '关闭' : '开通' }}
                    </el-button>
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
            v-model:current-page="currentPage"
            :total="total"
            :page-size="pageSize"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
        />

        <CreateTenant ref="createTenantDialog" @success="onCreateOrEditSuccess" />
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus'
import { ElTable, ElTableColumn, ElInput, ElButton, ElTag, ElPagination, ElRow, ElCol, ElSelect, ElOption, ElIcon } from 'element-plus';
import { FolderOpened } from '@element-plus/icons-vue';
import { getTenantList, updateTenantStatus, deleteTenant } from '@/api/tenant';
import CreateTenant from '@/components/dialogs/CreateTenant.vue';
import { useUserStore } from '@/stores/user';

// 筛选条件
const filters = ref({
    tenantName: '',
    code: '',
    status: null
});

// 数据相关
const tenantList = ref([]);  // 租户数据列表
const currentPage = ref(1);
const pageSize = ref(10); // 固定每页10条数据
const total = ref(0);  // 总条数
const loading = ref(false);
const tableRef = ref(null);

// 组件引用
const createTenantDialog = ref(null);

// 计算属性：分页后的数据（现在直接使用服务端分页）
const paginatedData = computed(() => {
    return tenantList.value || [];
});

// 监听分页变化
watch(currentPage, () => {
    fetchTenantList();
}, { immediate: false });

// 组件加载时获取租户列表
onMounted(() => {
    fetchTenantList();
});

// 获取租户数据（支持服务端分页和筛选）
const fetchTenantList = async () => {
    loading.value = true;
    
    try {
        // 构建查询参数
        const params = {
            page: currentPage.value,
            pageSize: pageSize.value,
            ...filters.value
        };
        
        const response = await getTenantList(params);
        
        // 处理响应数据
        if (response && response.items) {
            // 过滤掉 page 和 pageSize 参数
            const filteredItems = response.items.map(item => {
                const { page, pageSize, ...cleanItem } = item;
                return cleanItem;
            });
            tenantList.value = filteredItems;
            total.value = response.total || 0;
        } else if (Array.isArray(response)) {
            // 兼容直接返回数组的情况，同样过滤掉 page 和 pageSize 参数
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

// 修改查询按钮函数，添加筛选参数
const search = () => {
    currentPage.value = 1; // 重置到第一页
    fetchTenantList();
    ElMessage.success('筛选完成');
};

// 重置筛选条件
const reset = () => {
    filters.value = {
        tenantName: '',
        code: '',
        status: null
    };
    currentPage.value = 1;
    // 主动调用获取数据
    fetchTenantList();
};

// 切换租户状态
const handleToggleStatus = (row) => {
    const newStatus = row.status === 1 ? 0 : 1;
    const action = newStatus === 1 ? '开通' : '关闭';
    
    ElMessageBox.confirm(`确认${action}租户「${row.tenantName}」吗？`, '提示', { type: 'warning' })
      .then(async () => {
        try {
          const response = await updateTenantStatus(row.id, { status: newStatus });
          ElMessage.success(`租户已${action}`);
          
          // 使用返回的数据更新本地列表
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
      .catch(() => {});
};

// 删除租户
const handleDelete = (row) => {
    ElMessageBox.confirm(`确认删除租户「${row.tenantName}」吗？`, '提示', { type: 'warning' })
      .then(async () => {
        try {
          await deleteTenant(row.id);
          ElMessage.success('已删除');
          
          // 从本地列表中移除删除的租户
          const index = tenantList.value.findIndex(tenant => tenant.id === row.id);
          if (index !== -1) {
            tenantList.value.splice(index, 1);
            // 更新总数
            total.value = Math.max(0, total.value - 1);
            
            // 如果当前页没有数据了，且不是第一页，则跳转到上一页
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
      .catch(() => {});
};


// 新增租户
const handleBatchAdd = () => {
    createTenantDialog.value?.open();
};

// 新增成功处理
const onCreateOrEditSuccess = ({ mode, row }) => {
    if (mode === 'create' && row) {
        // 过滤掉 page 和 pageSize 参数
        const { page, pageSize, ...cleanRow } = row;
        
        // 将新创建的租户添加到列表开头
        tenantList.value.unshift(cleanRow);
        // 更新总数
        total.value = total.value + 1;
        
        // 如果当前页已满，跳转到第一页显示新数据
        if (tenantList.value.length > pageSize.value) {
            currentPage.value = 1;
            fetchTenantList();
        }
    }
};

// 分页变更
const handlePageChange = (newPage) => {
    currentPage.value = newPage;
    fetchTenantList();
};
</script>

<style scoped>
:deep(.el-table .el-table__row) {
  height: 50px; /* 设置为你想要的行高 */
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
</style>