<template>
  <div class="permission-tab">
    <!-- 知识库访问状态区 -->
    <div class="access-control-section">
      <div class="section-header">
        <h3>知识库访问权限</h3>
        <el-radio-group
          v-model="accessMode"
          @change="handleAccessModeChange"
          :disabled="!canEditAccessMode"
        >
          <!-- 用 :label 绑定常量 -->
          <el-radio :label="PUBLIC">公开</el-radio>
          <el-radio :label="PRIVATE">私有</el-radio>
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
          <el-icon><User /></el-icon>
          <span>所有者</span>
        </div>
        <div class="user-list">
          <el-tag
            v-if="owner && owner.id"
            :key="owner.id"
            type="danger"
            :closable="false"  
          >
            {{ owner.name }}
          </el-tag>

          <el-button
            v-if="canChangeOwner"
            type="primary"
            size="small"
            @click="openUserDialog('owner')"
          >
            {{ owner && owner.id ? '更换所有者' : '+ 添加所有者' }}
          </el-button>

          <div v-else class="no-permission-hint">
            <el-icon><Lock /></el-icon>
            <span>只有所有者或超级管理员可以更改所有者</span>
          </div>
        </div>
        <p class="hint-text">所有者拥有最高权限，可修改知识库设置</p>
      </div>

      <!-- 管理员管理 -->
      <div class="permission-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>管理员</span>
        </div>
        <div class="user-list">
          <el-tag
            v-for="admin in admins"
            :key="admin.id"
            type="warning"
            :closable="canManageAdmins"
            @close="removeUser('admin', admin.id)"
          >
            {{ admin.name }}
          </el-tag>
          <el-button
            v-if="canManageAdmins"
            type="primary"
            size="small"
            @click="openUserDialog('admin')"
          >
            + 添加管理员
          </el-button>
        </div>
        <p class="hint-text">管理员可编辑知识库内容</p>
      </div>

      <!-- 私有知识库的访问成员 -->
      <div v-if="accessMode === PRIVATE" class="permission-section">
        <div class="section-title">
          <el-icon><View /></el-icon>
          <span>访问成员</span>
        </div>
        <div class="user-list">
          <el-tag
            v-for="member in members"
            :key="member.id"
            :closable="canManageMembers"
            @close="removeUser('member', member.id)"
          >
            {{ member.name }}
          </el-tag>
          <el-button
            v-if="canManageMembers"
            type="primary"
            size="small"
            @click="openUserDialog('member')"
          >
            + 添加成员
          </el-button>
        </div>
        <p class="hint-text">私有知识库的指定访问人员</p>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="action-footer">
      <el-button
        type="primary"
        :loading="saving"
        @click="savePermissions"
        :disabled="!hasChanges || !canSaveChanges || !owner?.id"
      >
        保存更改
      </el-button>
    </div>

    <!-- 添加用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="`添加${roleMap[currentRole]}`"
      width="600px"
    >
      <user-selector
        :exclude-users="excludedUsers"
        @select="handleAddUser"
        @cancel="userDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { User, Setting, View, Lock } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { useKBStore } from '@/stores/kb'
import {
  getKnowledgeBasePermissions,
  updateKnowledgeBasePermissions
} from '@/api/Knowledgebase'
import UserSelector from '@/components/UserSelector.vue'

const route = useRoute()
const kbStore = useKBStore()

// 常量定义
const PUBLIC = 1
const PRIVATE = 0

// 权限数据
const accessMode = ref(PUBLIC)
const owner = ref(null) // { id:number, name:string, avatar?:number }
const admins = ref([])  // [{ id, name, avatar? }]
const members = ref([]) // [{ id, name, avatar? }]
const originalData = ref(null)

// UI状态
const loading = ref(false)
const saving = ref(false)
const userDialogVisible = ref(false)
const currentRole = ref('')

// 角色映射
const roleMap = {
  owner: '所有者',
  admin: '管理员',
  member: '成员'
}

// 计算属性 - 权限控制
const userRole = computed(() => kbStore.userRole) // 0:viewer 1:admin 2:owner 3:superAdmin
const isSuperAdmin = computed(() => userRole.value === 3)
const isOwner = computed(() => userRole.value === 2)
const isAdmin = computed(() => userRole.value === 1)

// 权限检查（如需更严格可改为仅 superAdmin/owner）
const canEditAccessMode = computed(() => isSuperAdmin.value || isOwner.value || isAdmin.value)
// 若只允许超管/所有者改这些，将上面三处改成：isSuperAdmin.value || isOwner.value
const canChangeOwner   = computed(() => isSuperAdmin.value || isOwner.value)
const canManageAdmins  = computed(() => isSuperAdmin.value || isOwner.value || isAdmin.value)
const canManageMembers = computed(() => isSuperAdmin.value || isOwner.value || isAdmin.value)
const canSaveChanges   = computed(() => isSuperAdmin.value || isOwner.value || isAdmin.value)

// 统一字符串化的排除列表，避免 number/string 不一致
const excludedUsers = computed(() => {
  const allAssigned = [
    ...(owner.value?.id ? [owner.value.id] : []),
    ...admins.value.map(u => u.id),
    ...members.value.map(u => u.id)
  ]
  return allAssigned.map(id => String(id))
})

// hasChanges：排序后再拍快照，避免顺序导致的误报
const hasChanges = computed(() => {
  if (!originalData.value) return false
  const snapshot = JSON.stringify(buildSnapshot())
  return snapshot !== originalData.value
})

function buildSnapshot () {
  const normalize = (arr) => [...arr].sort((a, b) => Number(a.id) - Number(b.id))
  return {
    access_mode: accessMode.value,
    owner: owner.value,
    admins: normalize(admins.value),
    members: accessMode.value === PRIVATE ? normalize(members.value) : []
  }
}

// 方法
const loadPermissions = async () => {
  try {
    loading.value = true
    const res = await getKnowledgeBasePermissions(route.params.id)
    const responseData = res.data || res

    accessMode.value = responseData.access_mode ?? PRIVATE
    owner.value = responseData.owner
      ? { id: Number(responseData.owner.id), name: responseData.owner.name, avatar: responseData.owner.avatar ?? 0 }
      : null
    admins.value = (responseData.admins ?? []).map(a => ({
      id: Number(a.id), name: a.name, avatar: a.avatar ?? 0
    }))
    members.value = (responseData.members ?? []).map(m => ({
      id: Number(m.id), name: m.name, avatar: m.avatar ?? 0
    }))

    originalData.value = JSON.stringify(buildSnapshot())
  } catch (error) {
    ElMessage.error('获取权限失败: ' + (error.response?.data?.message || error.message))
    owner.value = null
    admins.value = []
    members.value = []
  } finally {
    loading.value = false
  }
}

const savePermissions = async () => {
  if (!owner.value?.id) {
    ElMessage.warning('必须指定所有者')
    return
  }

  try {
    saving.value = true

    const payloadMembers = accessMode.value === PRIVATE ? members.value : []

    await updateKnowledgeBasePermissions(route.params.id, {
      access_mode: accessMode.value,
      user_roles: {
        owner: Number(owner.value.id),
        admins: admins.value.map(u => Number(u.id)),
        members: payloadMembers.map(u => Number(typeof u === 'object' ? u.id : u))
      }
    })

    // 保持与快照口径一致
    members.value = payloadMembers
    originalData.value = JSON.stringify(buildSnapshot())
    ElMessage.success('权限更新成功')

    // 可选：保存后刷新当前用户在该KB下的实际角色，保持UI一致
    // await kbStore.refreshRoleForKB(route.params.id)

  } catch (error) {
    ElMessage.error('保存权限失败: ' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

const handleAccessModeChange = async (mode) => {
  if (mode === PUBLIC) {
    if (!owner.value) {
      ElMessage.warning('公开知识库必须指定一名所有者')
      accessMode.value = PRIVATE
      return
    }
    if (members.value.length) {
      const ok = await ElMessageBox.confirm(
        '切换为公开将清空访问成员列表，是否继续？',
        '确认',
        { type: 'warning' }
      ).catch(() => false)
      if (!ok) {
        accessMode.value = PRIVATE
        return
      }
    }
    members.value = []
  }
  // 切到私有无需额外处理
}

const openUserDialog = (role) => {
  if (role === 'owner' && !canChangeOwner.value) {
    ElMessage.warning('您没有权限更改所有者')
    return
  }
  if (role === 'admin' && !canManageAdmins.value) {
    ElMessage.warning('您没有权限管理管理员')
    return
  }
  if (role === 'member' && !canManageMembers.value) {
    ElMessage.warning('您没有权限管理成员')
    return
  }

  currentRole.value = role
  userDialogVisible.value = true
}

// 支持把已有管理员/成员晋升为所有者；与其它列表互斥
const handleAddUser = (users) => {
  users.forEach(user => {
    const uid = Number(user.id ?? user.userId)
    const uname = user.userName ?? user.name ?? ''
    const userObj = { id: uid, name: uname, avatar: user.avatar ?? 0 }

    if (currentRole.value === 'owner') {
      // 从其它列表移除
      admins.value  = admins.value.filter(u => u.id !== uid)
      members.value = members.value.filter(u => u.id !== uid)
      // 旧 owner 是否降级为 admin 可按制度决定，这里不自动降级
      owner.value = userObj
      return
    }

    const exists = (owner.value?.id === uid)
      || admins.value.some(u => u.id === uid)
      || members.value.some(u => u.id === uid)
    if (exists) return

    if (currentRole.value === 'admin') admins.value.push(userObj)
    else members.value.push(userObj)
  })

  userDialogVisible.value = false
}

const removeUser = async (role, userId) => {
  if (role === 'owner') {
    // 所有者不支持“移除”，只支持“更换”，不给入口
    ElMessage.warning('请使用“更换所有者”来修改所有者')
    return
  }
  if (role === 'admin' && !canManageAdmins.value) {
    ElMessage.warning('您没有权限移除管理员')
    return
  }
  if (role === 'member' && !canManageMembers.value) {
    ElMessage.warning('您没有权限移除成员')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要移除该${roleMap[role]}吗?`,
      '提示',
      { type: 'warning' }
    )
    if (role === 'admin') {
      admins.value = admins.value.filter(u => u.id !== userId)
    } else if (role === 'member') {
      members.value = members.value.filter(u => u.id !== userId)
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadPermissions()
})
</script>

<style scoped>
.permission-tab { padding: 20px; }
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
.access-hint { margin-top: 12px; }
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
  align-items: center;
}
.no-permission-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 14px;
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
