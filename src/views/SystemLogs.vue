<template>
    <div class="system-logs">
        <!-- 筛选区域 -->
        <el-row :gutter="16" class="filter-row">
            <el-col :span="18" class="filter-inputs">
                <el-input 
                    placeholder="请输入操作人" 
                    v-model="filterForm.operator" 
                    clearable
                    style="width: 200px; margin-right: 16px;"
                />
                <el-select 
                    v-model="filterForm.module" 
                    placeholder="请选择操作模块" 
                    style="width: 200px; margin-right: 16px;"
                    clearable
                >
                    <el-option 
                        v-for="module in availableModules" 
                        :key="module" 
                        :label="module" 
                        :value="module" 
                    />
                </el-select>
                <el-select 
                    v-model="filterForm.timeRange" 
                    placeholder="请选择时间范围" 
                    style="width: 200px;"
                    clearable
                >
                    <el-option label="一周内" value="week" />
                    <el-option label="一月内" value="month" />
                    <el-option label="一年内" value="year" />
                    <el-option label="全部" value="all" />
                </el-select>
            </el-col>
            <el-col :span="6" class="button-group">
                <el-button type="primary" @click="handleSearch">查询</el-button>
                <el-button @click="handleReset">重置</el-button>
            </el-col>
        </el-row>
        
        <!-- 日志表格 -->
        <el-table :data="paginatedData" style="width: 100%" v-loading="loading" stripe :row-style="{ height: '60px' }">
            <el-table-column prop="timestamp" label="时间" width="220" />
            <el-table-column prop="operator" label="操作人" width="160" />
            <el-table-column prop="module" label="操作模块" width="200" />
            <el-table-column prop="details" label="操作详情" />
        </el-table>
        
        <!-- 分页组件 -->
        <el-pagination 
            v-model:current-page="currentPage"
            :total="total"
            :page-size="pageSize"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
            style="margin-top: 20px; justify-content: flex-start;"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 筛选表单
const filterForm = ref({
    operator: '',
    module: '',
    timeRange: ''
})

// 加载状态
const loading = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 用户角色和权限
const userRole = ref('')
const availableModules = ref([])

// 硬编码的日志数据
const allLogs = ref([
    { timestamp: '2025-09-22 09:38:25', operator: '李桂芬', module: '租户管理', details: '新租户创建：测试公司B' },
    { timestamp: '2025-09-20 09:30:25', operator: '李桂芬', module: '租户管理', details: '新租户创建：测试公司A' },
    { timestamp: '2025-09-18 09:26:10', operator: '周恩圣', module: '用户管理', details: '添加用户：张三' },
    { timestamp: '2025-09-16 09:29:45', operator: '柳梦佳', module: '角色权限管理', details: '移除超级管理员：李四' },
    { timestamp: '2025-09-16 08:28:13', operator: '王晓', module: '知识库管理', details: '删除知识库：金融投资指南' },
    { timestamp: '2025-09-15 09:12:30', operator: '张明慧', module: '系统参数设置', details: '更新系统配置：调整用户数量限制' },
    { timestamp: '2025-09-14 16:45:20', operator: '钱程', module: '租户管理', details: '删除租户：无效公司' },
    { timestamp: '2025-09-13 14:30:15', operator: '李强', module: '知识库管理', details: '新增知识库：产品手册' },
    { timestamp: '2025-09-12 11:25:43', operator: '王博雅', module: '知识库管理', details: '删除知识库：过期文档' },
    { timestamp: '2025-08-30 16:41:37', operator: '王博雅', module: '用户管理', details: '删除用户：王五' },
    { timestamp: '2025-08-28 16:33:50', operator: '李强', module: '角色权限管理', details: '添加超级管理员：李四' },
    { timestamp: '2025-08-28 16:11:22', operator: '王淑琴', module: '系统参数设置', details: '修改系统参数：超时时间' },
    { timestamp: '2025-08-28 14:20:41', operator: '赵静', module: '租户管理', details: '新租户注册：ABC公司' },
    { timestamp: '2025-08-21 19:09:38', operator: '王晓', module: '用户管理', details: '禁用用户：王五' },
    { timestamp: '2025-08-21 14:18:16', operator: '刘璐', module: '角色权限管理', details: '删除角色：访客B' },
    { timestamp: '2025-08-21 14:18:19', operator: '刘璐', module: '角色权限管理', details: '删除角色：访客A' },
    { timestamp: '2025-08-20 16:45:20', operator: '李强', module: '知识库管理', details: '删除知识库：临时文档' },
    { timestamp: '2025-08-19 11:56:56', operator: '马晓云', module: '用户管理', details: '重置用户密码：赵六' },
    { timestamp: '2025-08-19 11:44:35', operator: '李强', module: '系统参数设置', details: '修改日志保留时间' },
    { timestamp: '2025-08-19 10:31:15', operator: '姜梦', module: '租户管理', details: '修改租户配置：DEF集团' },
    { timestamp: '2025-08-18 10:25:36', operator: '张敏', module: '用户管理', details: '批量导入8名用户' },
    { timestamp: '2025-08-17 15:30:21', operator: '张敏', module: '知识库管理', details: '新增知识库：技术文档' },
    { timestamp: '2025-08-17 10:55:45', operator: '王晓', module: '角色权限管理', details: '更新角色描述：审核员' },
    { timestamp: '2025-08-16 15:39:16', operator: '赵志远', module: '租户管理', details: '暂停租户服务：GHI公司' },
    { timestamp: '2025-08-16 15:22:25', operator: '王晓', module: '知识库管理', details: '新增知识库：金融投资指南' },
    { timestamp: '2025-08-16 15:05:47', operator: '王晓', module: '角色权限管理', details: '删除用户：临时用户' },
    { timestamp: '2025-08-16 14:30:59', operator: '孙一洋', module: '系统参数设置', details: '更新数据库连接配置' },
])

// 筛选后的日志数据
const filteredLogs = ref([...allLogs.value])

// 初始化用户权限
const initUserPermissions = () => {
    // 从localStorage获取用户身份信息
    const platformAdmin = JSON.parse(localStorage.getItem('platformAdmin')) || false
    const tenantSuperAdmin = JSON.parse(localStorage.getItem('tenantSuperAdmin')) || false
    
    // 根据身份设置可访问的模块
    if (platformAdmin) {
        // 平台管理员：租户管理、系统参数设置
        userRole.value = 'platformAdmin'
        availableModules.value = ['租户管理', '系统参数设置']
    } else if (tenantSuperAdmin) {
        // 租户超级管理员：用户管理、角色权限管理、知识库管理
        userRole.value = 'tenantSuperAdmin'
        availableModules.value = ['用户管理', '角色权限管理', '知识库管理']
    } else {
        // 普通用户：无权限查看系统日志
        userRole.value = 'normalUser'
        availableModules.value = []
    }
    
    // 根据权限过滤日志数据
    filterLogsByPermission()
}

// 根据权限过滤日志数据
const filterLogsByPermission = () => {
    if (userRole.value === 'platformAdmin') {
        // 平台管理员只能看到租户管理和系统参数设置的日志
        filteredLogs.value = allLogs.value.filter(log => 
            log.module === '租户管理' || log.module === '系统参数设置'
        )
    } else if (userRole.value === 'tenantSuperAdmin') {
        // 租户超级管理员只能看到用户管理、角色权限管理和知识库管理的日志
        filteredLogs.value = allLogs.value.filter(log => 
            log.module === '用户管理' || log.module === '角色权限管理' || log.module === '知识库管理'
        )
    } else {
        // 普通用户不显示任何日志
        filteredLogs.value = []
    }
}

// 计算总数据量
const total = computed(() => filteredLogs.value.length)

// 计算当前页显示的数据
const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredLogs.value.slice(start, end)
})

// 获取时间范围对应的日期
const getTimeRangeDate = (range) => {
    const now = new Date()
    switch (range) {
        case 'week':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        case 'month':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        case 'year':
            return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        default:
            return null
    }
}

// 查询功能
const handleSearch = () => {
    loading.value = true
    currentPage.value = 1 // 重置到第一页
    
    // 模拟异步操作
    setTimeout(() => {
        // 首先根据权限过滤数据
        let result = [...allLogs.value]
        
        // 根据权限过滤
        if (userRole.value === 'platformAdmin') {
            result = result.filter(log => 
                log.module === '租户管理' || log.module === '系统参数设置'
            )
        } else if (userRole.value === 'tenantSuperAdmin') {
            result = result.filter(log => 
                log.module === '用户管理' || log.module === '角色权限管理' || log.module === '知识库管理'
            )
        } else {
            result = []
        }
        
        // 按操作人筛选
        if (filterForm.value.operator) {
            result = result.filter(log => 
                log.operator.toLowerCase().includes(filterForm.value.operator.toLowerCase())
            )
        }
        
        // 按操作模块筛选
        if (filterForm.value.module) {
            result = result.filter(log => log.module === filterForm.value.module)
        }
        
        // 按时间范围筛选
        if (filterForm.value.timeRange && filterForm.value.timeRange !== 'all') {
            const startDate = getTimeRangeDate(filterForm.value.timeRange)
            result = result.filter(log => {
                const logDate = new Date(log.timestamp)
                return logDate >= startDate
            })
        }
        
        filteredLogs.value = result
        loading.value = false
    }, 500)
}

// 重置功能
const handleReset = () => {
    filterForm.value = {
        operator: '',
        module: '',
        timeRange: ''
    }
    currentPage.value = 1
    // 重置时也要根据权限过滤数据
    filterLogsByPermission()
}

// 分页变化处理
const handlePageChange = (page) => {
    currentPage.value = page
}

// 组件挂载时初始化权限
onMounted(() => {
    initUserPermissions()
})
</script>

<style scoped>
.system-logs {
    padding: 20px;
}

.filter-row {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
}

.filter-inputs {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
}

.button-group {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
}

.button-group .el-button {
    margin: 0;
}

/* 表格行高优化 */
:deep(.el-table .el-table__row) {
    height: 60px;
}

:deep(.el-table .el-table__cell) {
    padding: 15px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .system-logs {
        padding: 10px;
    }
    
    .filter-row {
        flex-direction: column;
        align-items: stretch;
    }
    
    .filter-inputs {
        margin-bottom: 15px;
    }
    
    .filter-inputs .el-row .el-col {
        margin-bottom: 10px;
    }
    
    .button-group {
        justify-content: center;
        gap: 10px;
    }
    
    .button-group .el-button {
        flex: 1;
        max-width: 120px;
    }
}
</style>