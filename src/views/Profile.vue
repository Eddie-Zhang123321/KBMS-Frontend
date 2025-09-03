<!-- src/views/Profile.vue -->
<template>
  <div class="profile-page">
    <!-- 用户信息区域 -->
    <el-card class="profile-card">
      <div class="user-info-section">
        <!-- 左侧头像和退出 -->
        <div class="avatar-section">
          <div class="avatar-container">
            <el-avatar :size="80" :src="userInfo.avatar || defaultAvatar" class="user-avatar" @click="showAvatarSelector = true">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="avatar-upload">
              <el-button size="small" type="primary" @click="showAvatarSelector = true">
                更换头像
              </el-button>
            </div>
          </div>
          <div class="logout-link" @click="handleLogout">
            <el-icon><ArrowRight /></el-icon>
            <span>退出账号</span>
          </div>
        </div>

        <!-- 右侧用户信息 -->
        <div class="info-section">
          <div class="info-header">
            <div class="title-section">
              <h2>用户信息</h2>
              <div class="role-badge">
                <el-icon><Star /></el-icon>
                <span>{{ getRoleDisplayName(userInfo.roles) }}</span>
              </div>
            </div>
            <div class="action-buttons">
              <el-button type="primary" @click="showEditInfoDialog = true">
                修改信息
              </el-button>
              <el-button type="primary" @click="showChangePasswordDialog = true">
                修改密码
              </el-button>
            </div>
          </div>

          <div class="info-details">
            <div class="info-item">
              <span class="label">用户名：</span>
              <span class="value">{{ userInfo.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">所属租户：</span>
              <span class="value">{{ userInfo.tenantName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="label">密码：</span>
              <span class="value">******</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱：</span>
              <span class="value">{{ userInfo.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">加入知识库：</span>
              <span class="value">
                <el-link type="primary" @click="showKnowledgeBases">
                  {{ userInfo.knowledgeBaseCount || 0 }}个
                </el-link>
              </span>
            </div>
            <div class="info-item">
              <span class="label">最近登录：</span>
              <span class="value">{{ userInfo.lastLoginTime || '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 偏好设置区域 -->
    <el-card class="preferences-card">
      <div class="preferences-section">
        <h3>偏好设置</h3>
        <div class="preferences-form">
          <el-form :model="preferences" label-width="120px">
            <el-form-item label="默认进入页面：">
              <el-select v-model="preferences.defaultPage" placeholder="请选择默认页面">
                <el-option
                  v-for="page in availableDefaultPages"
                  :key="page.value"
                  :label="page.label"
                  :value="page.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="系统语言：">
              <el-select v-model="preferences.language" placeholder="请选择语言">
                <el-option label="中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item label="接收通知：">
              <el-radio-group v-model="preferences.notifications">
                <el-radio :value="true">开启</el-radio>
                <el-radio :value="false">关闭</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="savePreferences">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>

    <!-- 修改信息对话框 -->
    <el-dialog v-model="showEditInfoDialog" title="修改信息" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditInfoDialog = false">取消</el-button>
        <el-button type="primary" @click="updateUserInfo">确定</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="showChangePasswordDialog" title="修改密码" width="500px">
      <el-form :model="passwordForm" label-width="100px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="updatePassword">确定</el-button>
      </template>
    </el-dialog>

    <!-- 知识库列表对话框 -->
    <el-dialog v-model="showKnowledgeBasesDialog" title="加入的知识库" width="600px">
      <el-table :data="knowledgeBases" style="width: 100%">
        <el-table-column prop="name" label="知识库名称" />
        <el-table-column prop="role" label="角色" />
        <el-table-column prop="joinTime" label="加入时间" />
      </el-table>
    </el-dialog>

    <!-- 头像选择对话框 -->
    <el-dialog v-model="showAvatarSelector" title="选择头像" width="400px">
      <div class="avatar-grid">
        <div
          v-for="avatar in presetAvatars"
          :key="avatar.name"
          class="avatar-item"
          @click="selectPresetAvatar(avatar)"
        >
          <el-avatar :size="60" :src="avatar.url">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="avatar-name">{{ avatar.name }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Star,
  ArrowRight
} from '@element-plus/icons-vue'
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserPreferences,
  updateUserPreferences,
  getUserKnowledgeBases
} from '@/api/user'
import defaultAvatar from '@/assets/avatar.jpg'
import { ROLES } from '@/constants/roles'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const userInfo = ref({})
const preferences = reactive({
  defaultPage: 'dashboard',
  language: 'zh-CN',
  notifications: true
})

// 对话框控制
const showEditInfoDialog = ref(false)
const showChangePasswordDialog = ref(false)
const showKnowledgeBasesDialog = ref(false)
const showAvatarSelector = ref(false)

// 表单数据
const editForm = reactive({
  username: '',
  email: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordFormRef = ref()
const knowledgeBases = ref([])

// 计算属性：根据用户角色获取可用的默认页面选项
const availableDefaultPages = computed(() => {
  const pages = [
    { label: '工作台', value: 'dashboard' },
    { label: '知识库列表', value: 'knowledge' }
  ]

  // 超级管理员和平台管理员可以看到系统管理中心
  if (userStore.hasRole(ROLES.SUPER_ADMIN) || userStore.hasRole(ROLES.PLATFORM_ADMIN)) {
    pages.push({ label: '系统管理中心', value: 'system' })
  }

  // 只有平台管理员可以看到租户管理中心
  if (userStore.hasRole(ROLES.PLATFORM_ADMIN)) {
    pages.push({ label: '租户管理中心', value: 'tenant' })
  }

  return pages
})

// 预设头像列表
const presetAvatars = [
  { name: '默认头像', url: defaultAvatar },
  { name: '头像1', url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiM0MDllZmYiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMDkxIDEyIDE2IDEwLjIwOTEgMTYgOEMxNiA1Ljc5MDg2IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwODYgOCA4QzggMTAuMjA5MSA5Ljc5MDg2IDEyIDEyIDEyWiIvPgo8cGF0aCBkPSJNMTIgMTRDMTAgMzMuMTMgMTAgMzMuMTMgMTAgMzMuMTNDMTAgMzMuMTMgMTAgMzMuMTMgMTIgMTRaIi8+Cjwvc3ZnPgo8L3N2Zz4K' },
  { name: '头像2', url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNmNTY2NzIiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMDkxIDEyIDE2IDEwLjIwOTEgMTYgOEMxNiA1Ljc5MDg2IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwODYgOCA4QzggMTAuMjA5MSA5Ljc5MDg2IDEyIDEyIDEyWiIvPgo8cGF0aCBkPSJNMTIgMTRDMTAgMzMuMTMgMTAgMzMuMTMgMTAgMzMuMTNDMTAgMzMuMTMgMTAgMzMuMTMgMTIgMTRaIi8+Cjwvc3ZnPgo8L3N2Zz4K' },
  { name: '头像3', url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNmZmQ3MDAiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMDkxIDEyIDE2IDEwLjIwOTEgMTYgOEMxNiA1Ljc5MDg2IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwODYgOCA4QzggMTAuMjA5MSA5Ljc5MDg2IDEyIDEyIDEyWiIvPgo8cGF0aCBkPSJNMTIgMTRDMTAgMzMuMTMgMTAgMzMuMTMgMTAgMzMuMTNDMTAgMzMuMTMgMTAgMzMuMTMgMTIgMTRaIi8+Cjwvc3ZnPgo8L3N2Zz4K' }
]

// 密码验证规则
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 获取角色显示名称
const getRoleDisplayName = (roles) => {
  if (!roles || roles.length === 0) return '普通用户'

  const roleMap = {
    'super_admin': '超级管理员',
    'platform_admin': '平台管理员',
    'kb_owner': '知识库所有者',
    'kb_admin': '知识库管理员',
    'user': '普通用户'
  }

  const highestRole = roles.find(role => roleMap[role]) || roles[0]
  return roleMap[highestRole] || highestRole
}

// 初始化数据
const initData = async () => {
  try {
    // 获取用户详细信息
    const profileRes = await getUserProfile()

    // 优先使用用户存储中的数据，然后用服务器数据覆盖
    userInfo.value = {
      ...profileRes,
      ...userStore.user,
      avatar: userStore.user?.avatar || profileRes?.avatar || defaultAvatar
    }

    // 更新用户存储中的数据
    if (profileRes) {
      userStore.setUserFromResponse({
        user: userInfo.value,
        tenant: userStore.tenant,
        roles: userStore.roles
      })
    }

    // 获取偏好设置
    try {
      const preferencesRes = await getUserPreferences()
      Object.assign(preferences, preferencesRes)
      // 同步到用户store
      userStore.setPreferences(preferencesRes)
    } catch (error) {
      console.warn('Failed to fetch preferences in Profile:', error)
      // 尝试从store中获取偏好设置
      if (userStore.preferences) {
        Object.assign(preferences, userStore.preferences)
      } else {
        // 使用默认偏好设置
        const defaultPreferences = {
          defaultPage: 'dashboard',
          language: 'zh-CN',
          notifications: true
        }
        Object.assign(preferences, defaultPreferences)
        userStore.setPreferences(defaultPreferences)
      }
    }

    // 初始化编辑表单
    editForm.username = userInfo.value.username
    editForm.email = userInfo.value.email
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
    // 即使获取失败，也使用存储中的数据
    if (userStore.user) {
      userInfo.value = {
        ...userStore.user,
        avatar: userStore.user?.avatar || defaultAvatar
      }
      editForm.username = userStore.user.username
      editForm.email = userStore.user.email
    }
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消
  }
}

// 显示知识库列表
const showKnowledgeBases = async () => {
  try {
    const res = await getUserKnowledgeBases()
    knowledgeBases.value = res
    showKnowledgeBasesDialog.value = true
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    ElMessage.error('获取知识库列表失败')
  }
}

// 更新用户信息
const updateUserInfo = async () => {
  try {
    await updateUserProfile(editForm)
    userInfo.value.email = editForm.email
    showEditInfoDialog.value = false
    ElMessage.success('信息更新成功')
  } catch (error) {
    console.error('更新用户信息失败:', error)
    ElMessage.error('更新用户信息失败')
  }
}

// 修改密码
const updatePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })

    showChangePasswordDialog.value = false
    // 清空表单
    Object.assign(passwordForm, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    ElMessage.success('密码修改成功')
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    } else {
      console.error('修改密码失败:', error)
      ElMessage.error('修改密码失败')
    }
  }
}

// 保存偏好设置
const savePreferences = async () => {
  try {
    await updateUserPreferences(preferences)
    // 同步到用户store
    userStore.setPreferences({ ...preferences })
    ElMessage.success('偏好设置保存成功')
  } catch (error) {
    console.error('保存偏好设置失败:', error)
    ElMessage.error('保存偏好设置失败')
  }
}

// 选择预设头像并保存到服务器
const selectPresetAvatar = async (avatar) => {
  try {
    // 调用 API 保存头像到服务器
    await updateUserProfile({
      email: userInfo.value.email, // 保持原有邮箱
      avatar: avatar.url // 新的头像 URL
    })

    // 同步更新用户存储中的头像信息
    if (userStore.user) {
      userStore.user.avatar = avatar.url
      // 更新 localStorage 中的用户数据
      localStorage.setItem('user', JSON.stringify(userStore.user))
    }

    // 更新前端头像显示
    userInfo.value.avatar = avatar.url

    showAvatarSelector.value = false
    ElMessage.success('头像更新成功')
  } catch (error) {
    console.error('更新头像失败:', error)
    ElMessage.error('更新头像失败')
    // 如果保存失败，回滚前端头像显示
    userInfo.value.avatar = userStore.user?.avatar || defaultAvatar
  }
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
.profile-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.profile-card,
.preferences-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-info-section {
  display: flex;
  gap: 40px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  border: 3px solid #e6e6e6;
  cursor: pointer;
  transition: border-color 0.3s;
}

.user-avatar:hover {
  border-color: #409eff;
}

.avatar-upload {
  margin-top: 5px;
}

.logout-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s;
}

.logout-link:hover {
  color: #409eff;
}

.info-section {
  flex: 1;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-section h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.role-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.info-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 100px;
}

.value {
  color: #333;
  flex: 1;
}

.preferences-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.preferences-form {
  max-width: 400px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.avatar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.avatar-item:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.avatar-name {
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-info-section {
    flex-direction: column;
    gap: 20px;
  }

  .info-header {
    flex-direction: column;
    gap: 15px;
  }

  .info-details {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .avatar-grid {
    grid-template-columns: 1fr;
  }
}
</style>