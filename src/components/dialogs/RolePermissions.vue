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

const visible = ref(false)
const currentRole = ref(null)
const loading = ref(false)
const submitting = ref(false)

// 特殊角色权限映射
const specialRolePermissions = {
    '超级管理员': {
        type: 'tenant',
        checkedKeys: [
            // 系统管理
            'sys.users', 'sys.roles', 'sys.logs', 'sys.settings',
            // 知识库级系统管理
            'kbsys.users', 'kbsys.roles', 'kbsys.logs', 'kbsys.settings',
            // 知识库管理
            'kb.view', 'kb.edit', 'kb.create', 'kb.delete',
            // 用户管理
            'user.view', 'user.create', 'user.edit', 'user.delete'
        ]
    },
    '知识库所有人': {
        type: 'kb',
        checkedKeys: [
            // 知识库管理
            'kb.view', 'kb.create', 'kb.edit', 'kb.delete',
            // 知识库级系统管理
            'kbsys.users', 'kbsys.roles', 'kbsys.logs', 'kbsys.settings'
        ]
    },
    '知识库管理员': {
        type: 'kb',
        checkedKeys: [
            'kb.view', 'kb.edit',
            // 知识库级系统管理
            'kbsys.users',  'kbsys.logs', 'kbsys.settings'
        ]
    }
}

// 更新权限树数据，增加租户级权限
const permissionData = {
    'platform': [
        { id: 'sys', label: '平台级系统管理', children: [
            { id: 'sys.users', label: '租户管理' },
            { id: 'sys.roles', label: '角色管理' },
            { id: 'sys.logs', label: '系统日志' },
            { id: 'sys.settings', label: '系统设置' }
        ]}
    ],
    'tenant': [ // 新增租户级权限树
        { id: 'sys', label: '租户级系统管理', children: [
            { id: 'sys.users', label: '用户管理' },
            { id: 'sys.roles', label: '角色管理' },
            { id: 'sys.logs', label: '系统日志' },
            { id: 'sys.settings', label: '系统设置' }
        ]},
        { id: 'kbsys', label: '知识库级系统管理', children: [
            { id: 'kbsys.users', label: '知识库级人员管理' },
            { id: 'kbsys.roles', label: '知识库级角色管理' },
            { id: 'kbsys.logs', label: '系统日志' },
            { id: 'kbsys.settings', label: '系统设置' }
        ]},
        { id: 'kb', label: '知识库管理', children: [
            { id: 'kb.view', label: '查看知识库' },
            { id: 'kb.edit', label: '编辑知识库' },
            { id: 'kb.create', label: '创建知识库' },
            { id: 'kb.delete', label: '删除知识库' }
        ]},
        { id: 'user_management', label: '用户管理', children: [
            { id: 'user.view', label: '查看用户' },
            { id: 'user.create', label: '创建用户' },
            { id: 'user.edit', label: '编辑用户' },
            { id: 'user.delete', label: '删除用户' }
        ]}
    ],
    'kb': [
        { id: 'kbsys', label: '知识库级系统管理', children: [
            { id: 'kbsys.users', label: '知识库级人员管理' },
            { id: 'kbsys.roles', label: '知识库级角色管理' },
            { id: 'kbsys.logs', label: '系统日志' },
            { id: 'kbsys.settings', label: '系统设置' }
        ]},
        { id: 'kb', label: '知识库管理', children: [
            { id: 'kb.view', label: '查看知识库' },
            { id: 'kb.edit', label: '编辑知识库' },
            { id: 'kb.create', label: '创建知识库' },
            { id: 'kb.delete', label: '删除知识库' }
        ]}
    ],
    'normal': [
        { id: 'kb', label: '知识库', children: [
            { id: 'kb.view', label: '查看' }
        ]}
    ]
}

const treeData = ref([])
const checkedKeys = ref([])

const open = (row) => {
    currentRole.value = row
    visible.value = true

    // 先检查是否是特殊角色
    const specialRole = specialRolePermissions[row.name]
    if (specialRole) {
        treeData.value = permissionData[specialRole.type]
        checkedKeys.value = specialRole.checkedKeys
        return
    }

    // 根据角色类型硬编码权限
    switch(row.type) {
        case 'platform':
            treeData.value = permissionData['platform']
            checkedKeys.value = [
                'sys.users', 'sys.roles', 'sys.logs', 'sys.settings'
            ]
            break
        case 'tenant': // 新增租户级处理
            treeData.value = permissionData['tenant']
            checkedKeys.value = [
                // 系统管理
                'sys.users', 'sys.roles', 'sys.logs', 'sys.settings',
                // 知识库级系统管理
                'kbsys.users', 'kbsys.roles', 'kbsys.logs', 'kbsys.settings',
                // 知识库管理
                'kb.view', 'kb.edit', 'kb.create', 'kb.delete',
                // 用户管理
                'user.view', 'user.create', 'user.edit', 'user.delete'
            ]
            break
        case 'kb':
            treeData.value = permissionData['kb']
            checkedKeys.value = [
                // 知识库管理
                'kb.view', 'kb.edit',
                // 知识库级系统管理
                'kbsys.users', 'kbsys.logs', 'kbsys.settings'
            ]
            break
        case 'normal':
        default:
            treeData.value = permissionData['normal']
            checkedKeys.value = ['kb.view']
    }
}

const handleClose = () => {
    visible.value = false
    currentRole.value = null
    treeData.value = []
    checkedKeys.value = []
}

const onCheckChange = (data, checked) => {
    // 可根据需要联动
}

const save = () => {
    try {
        submitting.value = true
        ElMessage.success('保存成功')
        handleClose()
        emit('success')
    } catch (e) {
        ElMessage.error('保存失败')
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


