<template>
    <el-dialog v-model="visible" :title="`角色信息 - ${role?.name || ''}`" width="660px" :before-close="handleClose">
        <el-descriptions :column="1" border>
            <el-descriptions-item label="角色名">{{ role?.name }}</el-descriptions-item>
            <el-descriptions-item label="描述">{{ role?.description }}</el-descriptions-item>
            <el-descriptions-item label="角色类型">{{ role?.typeLabel }}</el-descriptions-item>
            <el-descriptions-item label="用户数">{{ role?.userCount }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ role?.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="最后更新时间">{{ role?.updatedAt }}</el-descriptions-item>
            <el-descriptions-item label="权限列表">
                <el-tag 
                    v-for="(permission, index) in role?.permissions" 
                    :key="index" 
                    type="info" 
                    style="margin-right: 8px; margin-bottom: 8px;"
                >
                    {{ permission }}
                </el-tag>
            </el-descriptions-item>
        </el-descriptions>

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">关闭</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const role = ref(null)

const open = (row) => {
    role.value = row
    visible.value = true
}

const handleClose = () => {
    visible.value = false
}

defineExpose({ open })
</script>

<style scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
}

.el-descriptions {
    margin-bottom: 20px;
}
</style>


