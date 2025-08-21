<template>
    <el-dialog v-model="visible" :title="`角色权限 - ${currentRole?.name || ''}`" width="720px" :before-close="handleClose">
        <el-tree
            v-loading="loading"
            :data="treeData"
            show-checkbox
            node-key="id"
            default-expand-all
            :default-checked-keys="checkedKeys"
            @check-change="onCheckChange"
        />

        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="save" :loading="submitting">保存</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getRolePermissions, updateRolePermissions } from '@/api/role'

const visible = ref(false)
const currentRole = ref(null)
const loading = ref(false)
const submitting = ref(false)
const treeData = ref([])
const checkedKeys = ref([])

const open = async (row) => {
    currentRole.value = row
    visible.value = true
    await fetchPermissions()
}

const handleClose = () => {
    visible.value = false
    currentRole.value = null
    treeData.value = []
    checkedKeys.value = []
}

const fetchPermissions = async () => {
    try {
        loading.value = true
        const res = await getRolePermissions(currentRole.value.id || currentRole.value.key)
        // 期望后端返回 { tree: [], checkedKeys: [] }
        treeData.value = res.tree || []
        checkedKeys.value = res.checkedKeys || []
    } catch (e) {
        // 若尚无后端，给出一个示例树
        treeData.value = [
            { id: 'sys', label: '系统管理', children: [
                { id: 'sys.users', label: '用户管理' },
                { id: 'sys.roles', label: '角色管理' },
                { id: 'sys.logs', label: '系统日志' }
            ]},
            { id: 'kb', label: '知识库', children: [
                { id: 'kb.view', label: '查看' },
                { id: 'kb.edit', label: '编辑' }
            ]}
        ]
        checkedKeys.value = []
    } finally {
        loading.value = false
    }
}

const onCheckChange = (data, checked) => {
    // 可根据需要联动
}

const save = async () => {
    try {
        submitting.value = true
        const id = currentRole.value.id || currentRole.value.key
        await updateRolePermissions(id, { checkedKeys: checkedKeys.value })
        ElMessage.success('保存成功')
        handleClose()
        emit('success')
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
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>


