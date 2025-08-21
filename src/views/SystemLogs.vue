<template>
    <div class="system-logs">
        <h1>系统日志</h1>
        <p>这里是系统日志的页面内容。您可以显示日志列表、搜索过滤等。</p>
        <!-- 示例：日志表格 -->
        <el-table :data="logs" style="width: 100%">
            <el-table-column prop="timestamp" label="时间" />
            <el-table-column prop="user" label="用户" />
            <el-table-column prop="action" label="操作" />
            <el-table-column prop="details" label="详情" />
        </el-table>
    </div>
</template>

<script setup>
import { ref } from 'vue'

// 示例数据（实际中从 API 获取）
const logs = ref([
    { timestamp: '2025-08-13 10:00', user: 'admin', action: '登录', details: '成功登录系统' },
    { timestamp: '2025-08-13 10:05', user: 'user1', action: '创建用户', details: '添加新用户' }
])
</script>

<style scoped>
.system-logs {
    padding: 20px;
}
</style>