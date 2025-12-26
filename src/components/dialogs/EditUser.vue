<template>
  <el-dialog v-model="visible" title="编辑用户" :width="dialogWidth" :before-close="handleClose" :fullscreen="isMobile">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <el-form-item label="用户名称" prop="userName">
        <el-input v-model="formData.userName" placeholder="请输入用户名称" clearable />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" clearable />
      </el-form-item>

      <el-form-item label="部门" prop="department">
        <el-select v-model="formData.department" placeholder="请选择部门" style="width: 100%" clearable>
          <el-option v-for="dept in departmentOptions" :key="dept.id" :label="dept.name" :value="dept.name" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { updateUser } from '@/api/user'
import { getDepartments } from '@/api/department'

const emit = defineEmits(['user-updated'])

const visible = ref(false)
const currentUserId = ref(null)

const isMobile = computed(() => window.innerWidth <= 768)
const dialogWidth = computed(() => isMobile.value ? '95%' : '500px')

const formData = reactive({
  userName: '',
  email: '',
  department: ''
})

const departmentOptions = ref([])

const rules = {
  userName: [
    { required: true, message: '请输入用户名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ]
}

const formRef = ref(null)

const fetchDepartments = async () => {
  try {
    const response = await getDepartments()
    if (response && response.data && response.data.items) {
      departmentOptions.value = response.data.items.map(d => ({ id: d.id, name: d.name }))
    } else if (response && response.items) {
      departmentOptions.value = response.items.map(d => ({ id: d.id, name: d.name }))
    } else if (Array.isArray(response)) {
      departmentOptions.value = response.map(d => ({ id: d.id, name: d.name }))
    } else {
      departmentOptions.value = []
    }
  } catch (error) {
    console.error('获取部门数据失败', error)
    ElMessage.error('获取部门数据失败: ' + (error.message || '未知错误'))
    departmentOptions.value = []
  }
}

const open = (row) => {
  currentUserId.value = row.id
  formData.userName = row.userName
  formData.email = row.email
  formData.department = row.department
  visible.value = true
  fetchDepartments()
}

const handleClose = () => {
  formRef.value?.resetFields()
  visible.value = false
  currentUserId.value = null
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    const payload = {
      userName: formData.userName,
      email: formData.email,
      department: formData.department
    }
    const resp = await updateUser(currentUserId.value, payload)
    ElMessage.success('用户信息更新成功')
    emit('user-updated', resp?.data || resp)
    handleClose()
  } catch (error) {
    const backendMessage = error?.response?.data?.message
    const msg = backendMessage || error?.message || '未知错误'
    ElMessage.error('更新失败: ' + msg)
    console.error('更新用户失败', error?.response || error)
  }
}

defineExpose({ open })
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
