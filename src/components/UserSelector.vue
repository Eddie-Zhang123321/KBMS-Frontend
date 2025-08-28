<template>
  <div class="user-selector">
    <el-input v-model="searchQuery" placeholder="搜索用户" clearable @input="handleSearch">
      <template #prefix>
        <el-icon>
          <Search />
        </el-icon>
      </template>
    </el-input>

    <div class="search-results">
      <el-checkbox-group v-model="selectedUserIds">
        <div v-for="user in filteredUsers" :key="user.userId" class="user-item">
          <el-checkbox :label="user.userId" :disabled="isUserExcluded(user.userId)">
            <div class="user-info">
              <el-avatar :size="32" :src="user.avatar || ''" />
              <div class="user-details">
                <div class="user-name">{{ user.userName }}</div>
                <div class="user-meta">
                  <span class="user-phone">{{ user.phone }}</span>
                  <el-tag :type="user.status === '开启' ? 'success' : 'danger'" size="small">
                    {{ user.status }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-checkbox>
        </div>
      </el-checkbox-group>

      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon">
          <Loading />
        </el-icon>
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
      <el-button type="primary" @click="confirm" :disabled="selectedUserIds.length === 0">
        确认
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getUsersByTenant } from '@/api/user'

const props = defineProps({
  excludeUsers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'cancel'])

const userStore = useUserStore()
const searchQuery = ref('')
const allUsers = ref([])
const selectedUserIds = ref([])
const loading = ref(false)

const fetchUsersByTenant = async () => {
  try {
    loading.value = true
    const tenantId = userStore.user?.id
    if (!tenantId) {
      ElMessage.error('无法获取租户信息')
      return
    }

    const response = await getUsersByTenant(tenantId)
    console.log('API响应:', response)
    // 根据新的响应结构提取数据
    if (response.items) {
      allUsers.value = response.items
      console.log('获取到的用户列表:', allUsers.value)
    } else {
      ElMessage.error('获取用户列表失败: 数据格式不正确')
      allUsers.value = []
    }

  } catch (error) {
    console.error('获取用户列表失败详情:', error)
    ElMessage.error('获取用户列表失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 根据搜索词过滤用户，同时排除已分配角色的用户
const filteredUsers = computed(() => {
  let users = allUsers.value.filter(user => !isUserExcluded(user.userId))

  if (!searchQuery.value) {
    return users
  }

  const query = searchQuery.value.toLowerCase()
  return users.filter(user =>
    (user.userName?.toLowerCase().includes(query)) ||
    (user.phone?.includes(query)) ||
    (user.userId?.toLowerCase().includes(query))
  )
})


// 检查用户是否已被排除
const isUserExcluded = (userId) => {
  return props.excludeUsers.includes(userId)
}

// 搜索处理
const handleSearch = () => {
  // 本地过滤
}

// 确认选择
const confirm = () => {
  const selectedUsers = allUsers.value.filter(
    user => selectedUserIds.value.includes(user.userId) && !isUserExcluded(user.userId)
  )
  emit('select', selectedUsers)
}

// 取消
const cancel = () => {
  emit('cancel')
}

// 初始化时获取用户数据
onMounted(() => {
  fetchUsersByTenant()
})
</script>

<style scoped>
.user-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 500px;
}

.search-results {
  flex: 1;
  max-height: 350px;
  overflow-y: auto;
  margin: 12px 0;
}

.user-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.user-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 8px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #909399;
}

.loading-icon {
  margin-right: 8px;
  animation: rotating 2s linear infinite;
}

.selected-count {
  padding: 8px 0;
  font-size: 12px;
  color: #409EFF;
  text-align: center;
}

.action-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>