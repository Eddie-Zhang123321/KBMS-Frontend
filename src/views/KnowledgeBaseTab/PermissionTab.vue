<template>
    <div class="permission-tab">
        <!-- 知识库访问状态区 -->
        <div class="access-control-section">
            <div class="section-header">
                <h3>知识库访问权限</h3>
                <el-radio-group v-model="accessMode" @change="handleAccessModeChange">
                    <el-radio :value="PUBLIC">公开</el-radio>
                    <el-radio :value="PRIVATE">私有</el-radio>
                </el-radio-group>
            </div>

            <div v-if="accessMode === PRIVATE" class="access-hint">
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
            <div v-if="accessMode === PRIVATE" class="permission-section">
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

        <!-- 保存按钮 -->
        <div class="action-footer">
            <el-button type="primary" :loading="saving" @click="savePermissions" :disabled="!hasChanges">
                保存更改
            </el-button>
        </div>

        <!-- 添加用户对话框 -->
        <el-dialog v-model="userDialogVisible" :title="`添加${roleMap[currentRole]}`" width="600px">
            <user-selector :exclude-users="excludedUsers" @select="handleAddUser" @cancel="userDialogVisible = false" />
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { User, Setting, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import {
    getKnowledgeBasePermissions,
    updateKnowledgeBasePermissions
} from '@/api/Knowledgebase'
import UserSelector from '@/components/UserSelector.vue'

const route = useRoute()

// 常量定义
const PUBLIC = 'public'
const PRIVATE = 'private'

// 权限数据
const accessMode = ref(PUBLIC)
const owners = ref([])
const managers = ref([])
const members = ref([])
const originalData = ref(null)

// UI状态
const loading = ref(false)
const saving = ref(false)
const userDialogVisible = ref(false)
const currentRole = ref('')

// 角色映射
const roleMap = {
    owner: '所有者',
    manager: '管理员',
    member: '成员'
}

// 计算属性
const excludedUsers = computed(() => {
    return [
        ...owners.value.map(u => u.id),
        ...managers.value.map(u => u.id),
        ...members.value.map(u => u.id)
    ]
})

const hasChanges = computed(() => {
    if (!originalData.value) return false

    const current = JSON.stringify({
        access_mode: accessMode.value,
        owners: owners.value,
        managers: managers.value,
        members: members.value
    })

    return current !== originalData.value
})

// 方法
const loadPermissions = async () => {
    try {
        loading.value = true
        const res = await getKnowledgeBasePermissions(route.params.id)

        // 调试日志 - 打印完整响应
        console.log('API响应:', res)

        // 修改数据提取方式
        const responseData = res.data?.data || res.data || res

        if (!responseData) {
            throw new Error('API返回数据格式不正确')
        }

        accessMode.value = responseData.access_mode || 'private'
        owners.value = responseData.owners || []
        managers.value = responseData.managers || []
        members.value = responseData.members || []

        originalData.value = JSON.stringify({
            access_mode: accessMode.value,
            owners: owners.value,
            managers: managers.value,
            members: members.value
        })
    } catch (error) {
        console.error('获取权限失败详情:', error)
        ElMessage.error('获取权限失败: ' + (error.response?.data?.message || error.message))
    } finally {
        loading.value = false
    }
}
const savePermissions = async () => {
    try {
        saving.value = true

        await updateKnowledgeBasePermissions(route.params.id, {
            access_mode: accessMode.value,
            user_roles: {
                owners: owners.value.map(u => u.id),
                managers: managers.value.map(u => u.id),
                members: members.value.map(u => u.id)
            }
        })

        // 更新原始数据
        originalData.value = JSON.stringify({
            access_mode: accessMode.value,
            owners: owners.value,
            managers: managers.value,
            members: members.value
        })

        ElMessage.success('权限更新成功')
    } catch (error) {
        ElMessage.error('保存权限失败: ' + error.message)
    } finally {
        saving.value = false
    }
}

const handleAccessModeChange = async (mode) => {
    if (mode === PUBLIC && owners.value.length === 0) {
        ElMessage.warning('公开知识库必须至少指定一名所有者')
        accessMode.value = PRIVATE
        return
    }
}

const openUserDialog = (role) => {
    currentRole.value = role
    userDialogVisible.value = true
}

// 在 PermissionTab.vue 中修改 handleAddUser 方法
const handleAddUser = (users) => {
    const targetArray =
        currentRole.value === 'owner' ? owners.value :
            currentRole.value === 'manager' ? managers.value :
                members.value

    users.forEach(user => {
        // 根据新的用户数据结构调整
        const userObj = {
            id: user.userId,        // 使用 userId 作为 id
            name: user.userName,    // 使用 userName 作为 name
            // 可以添加其他需要的字段
            phone: user.phone,
            status: user.status
        }

        if (!targetArray.some(u => u.id === userObj.id)) {
            targetArray.push(userObj)
        }
    })

    userDialogVisible.value = false
}
const removeUser = async (role, userId) => {
    if (role === 'owner' && owners.value.length <= 1) {
        ElMessage.warning('必须保留至少一名所有者')
        return
    }

    try {
        await ElMessageBox.confirm(
            `确定要移除该${roleMap[role]}吗?`,
            '提示',
            { type: 'warning' }
        )

        if (role === 'owner') {
            owners.value = owners.value.filter(u => u.id !== userId)
        } else if (role === 'manager') {
            managers.value = managers.value.filter(u => u.id !== userId)
        } else {
            members.value = members.value.filter(u => u.id !== userId)
        }
    } catch {
        // 用户取消
    }
}

// 初始化
onMounted(() => {
    loadPermissions()
})
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

.action-footer {
    margin-top: 24px;
    text-align: right;
}
</style>