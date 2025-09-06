<template>
  <div class="profile-page">
    <!-- 用户信息区域 -->
    <el-card class="profile-card">
      <div class="user-info-section">
        <!-- 左侧头像和退出 -->
        <div class="avatar-section">
          <div class="avatar-container">
            <el-avatar :size="80" :src="userStore.userAvatar" class="user-avatar" @click="showAvatarSelector = true">
              <el-icon><User /></el-icon>
            </el-avatar>
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
                <span>{{ getRoleDisplayName() }}</span>
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
              <span class="label">加入时间：</span>
              <span class="value">{{ userInfo.createTime || '—' }}</span>
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
        <el-table-column prop="createTime" label="加入时间" />
      </el-table>
    </el-dialog>

    <!-- 头像选择对话框 -->
    <el-dialog v-model="showAvatarSelector" title="选择头像" width="400px">
      <div class="cover-selection">
        <div
          v-for="avatar in presetAvatars"
          :key="avatar.id"
          class="cover-item"
          :class="{ selected: userInfo.avatarId === avatar.id }"
          @click="selectPresetAvatar(avatar.id)"
        >
          <img :src="avatar.url" :alt="avatar.name" class="cover-image" />
          <div class="cover-name">{{ avatar.name }}</div>
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
  getUserKnowledgeBases,
  updateUserAvatar
} from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

// 导入头像资源
import avatar1 from '@/assets/avatar/avatar1.jpg'
import avatar2 from '@/assets/avatar/avatar2.jpg'
import avatar3 from '@/assets/avatar/avatar3.jpg'
import avatar4 from '@/assets/avatar/avatar4.jpg'
import avatar5 from '@/assets/avatar/avatar5.jpg'
import avatar6 from '@/assets/avatar/avatar6.jpg'

// 预设头像列表 - 使用简单的id
const presetAvatars = [
  { id: 1, name: '头像1', url: avatar1 },
  { id: 2, name: '头像2', url: avatar2 },
  { id: 3, name: '头像3', url: avatar3 },
  { id: 4, name: '头像4', url: avatar4 },
  { id: 5, name: '头像5', url: avatar5 },
  { id: 6, name: '头像6', url: avatar6 }
]

// 默认头像为第一个预设头像
const defaultAvatar = avatar1

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
  if (userStore.tenantSuperAdmin || userStore.platformAdmin) {
    pages.push({ label: '系统管理中心', value: 'system' })
  }

  // 只有平台管理员可以看到租户管理中心
  if (userStore.platformAdmin) {
    pages.push({ label: '租户管理中心', value: 'tenant' })
  }

  return pages
})

// 密码验证规则
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
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
const getRoleDisplayName = () => {
  const labels = []
  if (userStore.platformAdmin) {
    labels.push('平台管理员')
  }
  if (userStore.tenantSuperAdmin) {
    labels.push('超级管理员')
  }

  if (labels.length === 0) {
    return '普通用户'
  }

  return labels.join('、')
}

// 选择预设头像并保存到后端
const selectPresetAvatar = async (avatarId) => {
  try {
    // 找到对应的头像URL
    const selectedAvatar = presetAvatars.find(avatar => avatar.id === avatarId)
    if (!selectedAvatar) {
      ElMessage.error('头像选择失败')
      return
    }

    // 调用后端API更新头像（只传递头像ID）
    await updateUserAvatar({ avatar: avatarId })

    // 更新本地数据
    userInfo.value.avatar = selectedAvatar.url
    userInfo.value.avatarId = avatarId

    // 更新用户store（只传递头像ID）
    userStore.updateUserAvatar(avatarId)

    showAvatarSelector.value = false
    ElMessage.success('头像更新成功')
    console.log('头像已更新并保存到本地缓存:', { avatarId, url: selectedAvatar.url })
  } catch (error) {
    console.error('更新头像失败:', error)
    ElMessage.error('更新头像失败')
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning'
    })

    // 清除本地存储
    localStorage.clear()

    // 清除用户store
    userStore.logout()

    // 跳转到登录页
    router.push('/login')

    ElMessage.success('已退出登录')
  } catch (error) {
    // 用户取消退出
  }
}

// 更新用户信息
const updateUserInfo = async () => {
  try {
    const response = await updateUserProfile({
      email: editForm.email
    })

    // 更新本地数据
    userInfo.value.email = editForm.email

    // 更新localStorage中的用户信息
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    currentUser.email = editForm.email
    localStorage.setItem('user', JSON.stringify(currentUser))

    // 更新用户store
    if (userStore.user) {
      userStore.user.email = editForm.email
    }

    showEditInfoDialog.value = false
    ElMessage.success('信息更新成功')
    console.log('用户信息已更新并保存到本地缓存')
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

    // 重置表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''

    showChangePasswordDialog.value = false
    ElMessage.success('密码修改成功')
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error('修改密码失败')
  }
}

// 保存偏好设置
const savePreferences = async () => {
  try {
    const response = await updateUserPreferences(preferences)

    // 更新localStorage中的偏好设置
    localStorage.setItem('preferences', JSON.stringify(preferences))

    // 更新用户store中的偏好设置
    userStore.setPreferences(preferences)

    ElMessage.success('偏好设置保存成功')
  } catch (error) {
    console.error('保存偏好设置失败:', error)
    ElMessage.error('保存偏好设置失败')
  }
}

// 显示知识库列表
const showKnowledgeBases = async () => {
  try {
    const kbList = await getUserKnowledgeBases()
    knowledgeBases.value = kbList || []
    showKnowledgeBasesDialog.value = true
  } catch (error) {
    console.error('获取知识库列表失败:', error)
    ElMessage.error('获取知识库列表失败')
  }
}

const initData = async () => {
  try {
    // 先从localStorage获取缓存数据
    const cachedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const cachedPreferences = JSON.parse(localStorage.getItem('preferences') || '{}')
    const cachedAvatarId = parseInt(localStorage.getItem('avatar')) || 1

    // 总是从服务器获取完整数据，但保留用户修改的邮箱和头像
    const profileRes = await getUserProfile()

    // 处理头像ID到URL的映射
    let avatarUrl = defaultAvatar
    let avatarId = cachedAvatarId || profileRes.avatar || 1
    
    // 根据ID获取对应的头像URL
    const avatarMapping = presetAvatars.find(a => a.id === avatarId)
    avatarUrl = avatarMapping ? avatarMapping.url : defaultAvatar

    // 使用服务器数据，但保留用户修改的邮箱
    userInfo.value = {
      id: profileRes.id || userStore.user?.id,
      username: profileRes.username || userStore.user?.username || '未知用户',
      email: cachedUser.email || profileRes.email || userStore.user?.email || '', // 优先使用缓存的邮箱
      tenantName: profileRes.tenantName || userStore.tenantName || '—',
      knowledgeBaseCount: profileRes.knowledgeBaseCount || 0,
      createTime: profileRes.createTime || '—',
      roles: profileRes.roles || userStore.roles || [],
      avatar: avatarUrl,
      avatarId: avatarId
    }

    // 保存完整数据到localStorage
    localStorage.setItem('user', JSON.stringify({
      id: userInfo.value.id,
      username: userInfo.value.username,
      email: userInfo.value.email,
      avatar: avatarId
    }))
    localStorage.setItem('avatar', avatarId.toString())

    // 更新用户store
    userStore.updateUserAvatar(avatarId)

    // 获取偏好设置
    try {
      const preferencesRes = await getUserPreferences()
      Object.assign(preferences, preferencesRes)

      // 更新localStorage中的偏好设置
      localStorage.setItem('preferences', JSON.stringify(preferencesRes))
      userStore.setPreferences(preferencesRes)
    } catch (error) {
      console.warn('Failed to fetch preferences, using cached or default:', error)
      // 使用缓存的偏好设置或默认值
      const defaultPreferences = {
        defaultPage: cachedPreferences.defaultPage || 'dashboard',
        language: cachedPreferences.language || 'zh-CN',
        notifications: cachedPreferences.notifications !== undefined ? cachedPreferences.notifications : true
      }
      Object.assign(preferences, defaultPreferences)
      localStorage.setItem('preferences', JSON.stringify(defaultPreferences))
      userStore.setPreferences(defaultPreferences)
    }

    // 初始化编辑表单
    editForm.username = userInfo.value.username
    editForm.email = userInfo.value.email

  } catch (error) {
    console.error('获取用户信息失败，使用本地缓存数据:', error)

    // 完全使用本地存储的数据作为兜底
    const cachedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const cachedPreferences = JSON.parse(localStorage.getItem('preferences') || '{}')
    const cachedAvatarId = parseInt(localStorage.getItem('avatar')) || 1

    // 根据ID获取对应的头像URL
    const avatarMapping = presetAvatars.find(a => a.id === cachedAvatarId)
    const avatarUrl = avatarMapping ? avatarMapping.url : defaultAvatar

    userInfo.value = {
      id: cachedUser.id || userStore.user?.id,
      username: cachedUser.username || userStore.user?.username || '未知用户',
      email: cachedUser.email || userStore.user?.email || '',
      tenantName: userStore.tenantName || '—',
      knowledgeBaseCount: 0,
      createTime: '—',
      roles: userStore.roles || [],
      avatar: avatarUrl,
      avatarId: cachedAvatarId
    }

    // 使用缓存的偏好设置
    Object.assign(preferences, {
      defaultPage: cachedPreferences.defaultPage || 'dashboard',
      language: cachedPreferences.language || 'zh-CN',
      notifications: cachedPreferences.notifications !== undefined ? cachedPreferences.notifications : true
    })

    editForm.username = userInfo.value.username
    editForm.email = userInfo.value.email
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

.cover-selection {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 20px;
}

.cover-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.cover-item:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cover-item.selected {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.cover-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 8px;
}

.cover-name {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
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
}
</style>
