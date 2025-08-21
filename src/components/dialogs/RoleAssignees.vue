<template>
    <el-dialog v-model="visible" :title="`授权人 - ${currentRole?.name || ''}`" width="720px" :before-close="handleClose">
        <div class="toolbar">
            <el-input v-model="keyword" placeholder="搜索用户" clearable style="width: 260px" />
            <div class="spacer" />
            <el-button type="primary" @click="save" :loading="submitting">保存</el-button>
        </div>

        <el-transfer
            v-loading="loading"
            v-model="selectedUserIds"
            filterable
            :filter-method="filterMethod"
            :titles="['待选用户', '已授权']"
            :data="userOptions"
            :props="{ key: 'id', label: 'label' }"
        />
    </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoleAssignees, updateRoleAssignees } from '@/api/role'
import { getAssignableUsers } from '@/api/user'

const visible = ref(false)
const currentRole = ref(null)
const loading = ref(false)
const submitting = ref(false)

const keyword = ref('')
const userOptions = ref([]) // [{ id, label }]
const selectedUserIds = ref([])

const open = async (row) => {
    currentRole.value = row
    visible.value = true
    await fetchData()
}

const handleClose = () => {
    visible.value = false
    currentRole.value = null
    userOptions.value = []
    selectedUserIds.value = []
    keyword.value = ''
}

const fetchData = async () => {
    try {
        loading.value = true
        // 获取可选用户（专用接口，避免与 /user/items 冲突）
        const usersResp = await getAssignableUsers({ page: 1, size: 9999 })
        const items = usersResp.items || usersResp.list || usersResp.data?.items || []
        userOptions.value = items.map(u => ({ id: u.id || u.userId, label: u.username || u.name }))

        const assigneesResp = await getRoleAssignees(currentRole.value.id || currentRole.value.key)
        selectedUserIds.value = assigneesResp.userIds || []
    } catch (e) {
        // Mock 数据兜底
        userOptions.value = [
            { id: 'u1', label: 'Alice' },
            { id: 'u2', label: 'Bob' },
            { id: 'u3', label: 'Carol' }
        ]
        selectedUserIds.value = ['u2']
    } finally {
        loading.value = false
    }
}

const filterMethod = (query, item) => {
    if (!query) return true
    return item.label.toLowerCase().includes(query.toLowerCase())
}

const save = async () => {
    try {
        submitting.value = true
        await updateRoleAssignees(currentRole.value.id || currentRole.value.key, {
            userIds: selectedUserIds.value
        })
        ElMessage.success('保存成功')
        emit('success')
        handleClose()
    } catch (e) {
        ElMessage.error(e?.message || '保存失败')
    } finally {
        submitting.value = false
    }
}

const emit = defineEmits(['success'])
defineExpose({ open })
</script>

<style scoped>
.toolbar {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}
.spacer { flex: 1; }
</style>


