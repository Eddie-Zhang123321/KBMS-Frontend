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
      <el-checkbox-group v-model="selectedUsers">
        <div v-for="user in searchResults" :key="user.id" class="user-item">
          <el-checkbox :label="user.id">
            <div class="user-info">
              <el-avatar :size="32" :src="user.avatar" />
              <div class="user-name">{{ user.name }}</div>
            </div>
          </el-checkbox>
        </div>
      </el-checkbox-group>

      <el-empty v-if="searchResults.length === 0" description="暂无用户" />
    </div>

    <div class="action-footer">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="confirm">确认</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { searchUsers } from '@/api/Knowledgebase'
import { debounce } from 'lodash-es'

const props = defineProps({
  excludeUsers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'cancel'])

const searchQuery = ref('')
const searchResults = ref([])
const selectedUsers = ref([])
const loading = ref(false)

const handleSearch = debounce(async () => {
  if (!searchQuery.value) {
    searchResults.value = []
    return
  }

  try {
    loading.value = true
    const res = await searchUsers(searchQuery.value)
    searchResults.value = res.data.filter(
      user => !props.excludeUsers.includes(user.id)
    )
  } catch (error) {
    console.error('搜索用户失败:', error)
  } finally {
    loading.value = false
  }
}, 500)

const confirm = () => {
  const selected = searchResults.value.filter(
    user => selectedUsers.value.includes(user.id)
  )
  emit('select', selected)
}

const cancel = () => {
  emit('cancel')
}

watch(searchQuery, () => {
  selectedUsers.value = []
})
</script>

<style scoped>
.user-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
  margin: 12px 0;
}

.user-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 8px;
}

.user-name {
  font-size: 14px;
}

.action-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>