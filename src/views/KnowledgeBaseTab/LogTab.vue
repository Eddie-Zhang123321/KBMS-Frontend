<template>
    <div class="log-tab">
        <div class="section">
            <div class="section-title">知识库修改记录</div>
            <el-table :data="logRecords" stripe style="width: 100%">
                <el-table-column prop="timestamp" label="时间" width="180" />
                <el-table-column prop="operator" label="操作人" width="120" />
                <el-table-column prop="action" label="操作类型" width="120" />
                <el-table-column prop="description" label="描述" />
            </el-table>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const logRecords = ref([
    {
        timestamp: '2022-08-16 15:03:02',
        operator: '张三',
        action: '创建',
        description: '创建知识库“金翻科技”',
    },
    {
        timestamp: '2022-08-16 11:03:11',
        operator: '李四',
        action: '更新',
        description: '更新知识库描述',
    },
    {
        timestamp: '2022-08-16 00:50:47',
        operator: '王五',
        action: '删除',
        description: '删除数据源“合同”',
    },
    {
        timestamp: '2022-08-14 21:16:30',
        operator: '赵六',
        action: '上传',
        description: '上传文件“API文档.pdf”',
    },
    {
        timestamp: '2022-08-12 11:53:58',
        operator: '孙七',
        action: '权限调整',
        description: '添加管理员“李四”',
    },
    {
        timestamp: '2022-08-11 15:24:24',
        operator: '周八',
        action: '状态更改',
        description: '将知识库设为私有',
    },
    {
        timestamp: '2022-08-11 15:12:22',
        operator: '吴九',
        action: '同步',
        description: '同步数据源“数据库”',
    },
])
</script>

<style scoped>
.log-tab {
    padding: 20px;
}

.section {
    margin-bottom: 24px;
}

.section-title {
    font-weight: bold;
    margin-bottom: 12px;
}
</style>