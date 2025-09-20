<template>
  <div class="user-selector">
    <el-input v-model="searchQuery" placeholder="搜索用户" clearable @input="handleSearch">
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <div class="search-results">
      <el-checkbox-group v-model="selectedUserIds">
        <div v-for="user in filteredUsers" :key="user.id" class="user-item">
          <!-- 统一用字符串 label，避免类型不一致 -->
          <el-checkbox :label="String(user.id)" :disabled="isUserExcluded(user.id)">
            <div class="user-info">
              <el-avatar :size="32" :src="user.avatar || ''" />
              <div class="user-details">
                <div class="user-name">{{ user.userName }}</div>
                <div class="user-meta">
                  <span class="user-email">{{ user.email }}</span>
                  <el-tag :type="user.status === 1 ? 'success' : 'danger'" size="small">
                    {{ user.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-checkbox>
        </div>
      </el-checkbox-group>

      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <el-empty v-else-if="filteredUsers.length === 0 && searchQuery" description="未找到相关用户" />
      <el-empty v-else-if="filteredUsers.length === 0" description="暂无用户数据" />
    </div>

    <div class="selected-count" v-if="selectedUserIds.length > 0">
      已选择 {{ selectedUserIds.length }} 个用户
    </div>

    <div class="action-footer">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="confirm" :disabled="selectedUserIds.length === 0">确认</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getUserList } from '@/api/user'

const props = defineProps({
  excludeUsers: {
    type: Array,
    default: () => []
  },
  // 如果需要回显初始选中（父组件可传 {id,name} 列表）
  initialSelectedUsers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'cancel'])

const userStore = useUserStore()
const searchQuery = ref('')
const allUsers = ref([])       // 统一结构：{ id:number, userName, email, status, avatar? }
const selectedUserIds = ref([]) // 存字符串 ID
const loading = ref(false)

// 回显初始选中
watch(
  () => props.initialSelectedUsers,
  (newVal) => {
    if (Array.isArray(newVal) && newVal.length > 0) {
      selectedUserIds.value = newVal.map(u => String(u.id))
    }
  },
  { immediate: true }
)

const fetchUsersByTenant = async () => {
  try {
    loading.value = true
    const tenantId = userStore?.tenantId
    if (!tenantId) {
      ElMessage.error('无法获取租户信息')
      return
    }

    // 响应体：{ items, total }（网关已剥离 code/message）
    const resp = await getUserList(tenantId)
    const items = resp?.items ?? []

    // 仅保留启用用户 status === 1，并统一字段
    allUsers.value = items
      .filter(u => Number(u.status) === 1)
      .map(u => ({
        id: Number(u.id),
        userName: u.userName || '',
        email: u.email || '',
        status: Number(u.status),
        avatar: u.avatar || ''
      }))
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败: ' + (error.message || '未知错误'))
    allUsers.value = []
  } finally {
    loading.value = false
  }
}

// 根据搜索词过滤用户，同时排除已分配角色的用户
const filteredUsers = computed(() => {
  const excluded = props.excludeUsers.map(String)
  const base = allUsers.value.filter(u => !excluded.includes(String(u.id)))

  const q = (searchQuery.value || '').toLowerCase()
  if (!q) return base

  return base.filter(u => {
    const name = (u.userName || '').toLowerCase()
    const email = (u.email || '').toLowerCase()
    const sid = String(u.id).toLowerCase()
    return name.includes(q) || email.includes(q) || sid.includes(q)
  })
})

// 检查用户是否已被排除（统一字符串比较）
const isUserExcluded = (userId) => {
  return props.excludeUsers.map(String).includes(String(userId))
}

// 搜索处理（本地过滤即可）
const handleSearch = () => { /* no-op */ }

// 确认：返回完整用户对象列表，交由父组件提取 id/name
const confirm = () => {
  const set = new Set(selectedUserIds.value.map(String))
  const selectedUsers = allUsers.value.filter(u => set.has(String(u.id)))
  emit('select', selectedUsers)
}

// 取消
const cancel = () => emit('cancel')

// 初始化
onMounted(() => {
  fetchUsersByTenant()
})
</script>

<style scoped>
.user-selector { display: flex; flex-direction: column; gap: 16px; height: 500px; }
.search-results { flex: 1; max-height: 350px; overflow-y: auto; margin: 12px 0; }
.user-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.user-item:last-child { border-bottom: none; }
.user-info { display: flex; align-items: center; gap: 12px; margin-left: 8px; }
.user-details { display: flex; flex-direction: column; gap: 4px; }
.user-name { font-size: 14px; font-weight: 500; }
.user-meta { display: flex; align-items: center; gap: 8px; }
.user-email { font-size: 12px; color: #909399; }
.loading-state { display: flex; align-items: center; justify-content: center; padding: 20px; color: #909399; }
.loading-icon { margin-right: 8px; animation: rotating 2s linear infinite; }
.selected-count { padding: 8px 0; font-size: 12px; color: #409EFF; text-align: center; }
.action-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
@keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
