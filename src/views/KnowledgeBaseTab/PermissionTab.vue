<template>
    <div class="permission-tab">
        <!-- 知识库访问状态区 -->
        <div class="access-control-section">
            <div class="section-header">
                <h3>知识库访问权限</h3>
                <el-radio-group v-model="accessMode" @change="handleAccessModeChange">
                    <el-radio label="public">公开</el-radio>
                    <el-radio label="private">私有</el-radio>
                </el-radio-group>
            </div>

            <div v-if="accessMode === 'private'" class="access-hint">
                <el-alert type="info" :closable="false">
                    私有知识库仅限以下指定人员访问
                </el-alert>
            </div>
            <div v-else class="access-hint">
                <el-alert type="success" :closable="false">
                    公开知识库对所有用户可见，但编辑仍需权限
                </el-alert>
            </div>
        </div>

        <!-- 权限管理区 -->
        <div class="permission-management">
            <!-- 所有者管理 -->
            <div class="permission-section">
                <div class="section-title">
                    <el-icon>
                        <User />
                    </el-icon>
                    <span>所有者</span>
                </div>
                <div class="user-list">
                    <el-tag v-for="owner in owners" :key="owner.id" type="danger" closable
                        @close="removeUser('owner', owner.id)">
                        {{ owner.name }}
                    </el-tag>
                    <el-button type="primary" size="small" @click="openUserDialog('owner')">
                        + 添加所有者
                    </el-button>
                </div>
                <p class="hint-text">所有者拥有最高权限，可修改知识库设置</p>
            </div>

            <!-- 管理员管理 -->
            <div class="permission-section">
                <div class="section-title">
                    <el-icon>
                        <Setting />
                    </el-icon>
                    <span>管理员</span>
                </div>
                <div class="user-list">
                    <el-tag v-for="manager in managers" :key="manager.id" type="warning" closable
                        @close="removeUser('manager', manager.id)">
                        {{ manager.name }}
                    </el-tag>
                    <el-button type="primary" size="small" @click="openUserDialog('manager')">
                        + 添加管理员
                    </el-button>
                </div>
                <p class="hint-text">管理员可编辑知识库内容</p>
            </div>

            <!-- 私有知识库的访问成员 -->
            <div v-if="accessMode === 'private'" class="permission-section">
                <div class="section-title">
                    <el-icon>
                        <View />
                    </el-icon>
                    <span>访问成员</span>
                </div>
                <div class="user-list">
                    <el-tag v-for="member in members" :key="member.id" closable
                        @close="removeUser('member', member.id)">
                        {{ member.name }}
                    </el-tag>
                    <el-button type="primary" size="small" @click="openUserDialog('member')">
                        + 添加成员
                    </el-button>
                </div>
                <p class="hint-text">私有知识库的指定访问人员</p>
            </div>
        </div>


    </div>
</template>

<script setup>
import { ref } from 'vue'
import { User, Setting, View } from '@element-plus/icons-vue'


// 知识库访问模式
const accessMode = ref('public') // public / private

// 用户列表数据
const owners = ref([{ id: 1, name: '张三' }])
const managers = ref([{ id: 2, name: '李四' }, { id: 3, name: '王五' }])
const members = ref([])

// 对话框控制
const dialogVisible = ref(false)
const currentRole = ref('')

// 切换访问模式
const handleAccessModeChange = (mode) => {
    if (mode === 'public' && owners.value.length === 0) {
        ElMessage.warning('公开知识库必须至少指定一名所有者')
        accessMode.value = 'private'
        return
    }
    ElMessage.success(`已设置为${mode === 'public' ? '公开' : '私有'}模式`)
}

// 打开用户选择对话框
const openUserDialog = (role) => {
    currentRole.value = role
    dialogVisible.value = true
}

// 添加用户
const handleAddUser = (users) => {
    users.forEach(user => {
        if (currentRole.value === 'owner') {
            if (!owners.value.some(o => o.id === user.id)) {
                owners.value.push(user)
            }
        } else if (currentRole.value === 'manager') {
            if (!managers.value.some(m => m.id === user.id)) {
                managers.value.push(user)
            }
        } else if (currentRole.value === 'member') {
            if (!members.value.some(m => m.id === user.id)) {
                members.value.push(user)
            }
        }
    })
}

// 移除用户
const removeUser = (role, userId) => {
    if (role === 'owner' && owners.value.length <= 1) {
        ElMessage.warning('必须保留至少一名所有者')
        return
    }

    if (role === 'owner') {
        owners.value = owners.value.filter(u => u.id !== userId)
    } else if (role === 'manager') {
        managers.value = managers.value.filter(u => u.id !== userId)
    } else {
        members.value = members.value.filter(u => u.id !== userId)
    }
}
</script>

<style scoped>
.permission-tab {
    padding: 20px;
}

.access-control-section {
    margin-bottom: 24px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.access-hint {
    margin-top: 12px;
}

.permission-management {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.permission-section {
    padding: 16px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: bold;
}

.user-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
}

.hint-text {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
}
</style>