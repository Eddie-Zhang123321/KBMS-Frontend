<script setup>
import { ref, reactive, onMounted, onUpdated } from 'vue' // 添加 onUpdated 导入

const dialogVisible = ref(false) // 默认不显示弹窗
const step = ref(0)

const form = reactive({
    name: '',
    description: '',
    avatar: null, // 新增头像字段
    fields: [{ name: '', type: 'text' }]
})

// 处理头像上传
const handleAvatarUpload = (file) => {
    // 这里可以添加文件类型和大小校验
    if (file.size > 2 * 1024 * 1024) {
        ElMessage.error('头像大小不能超过2MB')
        return false
    }

    // 创建预览URL
    form.avatar = URL.createObjectURL(file)
    return false // 阻止自动上传，我们将在提交时统一处理
}

// 删除头像
const removeAvatar = () => {
    form.avatar = null
}

// 下一步
const nextStep = () => {
    if (step.value === 0 && !form.name) {
        ElMessage.warning('请输入知识库名称')
        return
    }
    step.value++
}

// 关闭弹窗
const handleClose = (done) => {
    dialogVisible.value = false
    step.value = 0
    // 清除头像预览
    if (form.avatar) {
        URL.revokeObjectURL(form.avatar)
        form.avatar = null
    }
    done()
}

// 提交
const handleSubmit = () => {
    console.log('提交表单:', form)
    dialogVisible.value = false
    step.value = 0

    // 这里可以添加实际的上传逻辑
    // 例如将form.avatar上传到服务器

    // 重置表单
    form.name = ''
    form.description = ''
    form.avatar = null
    form.fields = [{ name: '', type: 'text' }]

    // 清除头像预览
    if (form.avatar) {
        URL.revokeObjectURL(form.avatar)
    }
}

// 字段增删
const addField = () => form.fields.push({ name: '', type: 'text' })
const removeField = (index) => form.fields.splice(index, 1)

// 类型文本
const fieldTypeLabel = (type) => ({
    text: '文本',
    number: '数字',
    date: '日期'
}[type] || '未知')

// 暴露 open 方法
defineExpose({
    open: () => {
        console.log('打开创建知识库弹窗')
        dialogVisible.value = true
        step.value = 0
    }
})

// 调试生命周期
onMounted(() => {
    console.log('CreateKB 组件已挂载')
})

onUpdated(() => {
    console.log('CreateKB 组件已更新')
})
</script>

<template>
    <el-dialog v-model="dialogVisible" title="新建知识库" width="600px" :before-close="handleClose"
        style="--el-dialog-border-radius:30px">
        <div class="step-form-dialog">
            <el-steps :active="step" finish-status="success" align-center>
                <el-step title="基本信息" />
                <el-step title="数据源类型" />
                <el-step title="上传" />
            </el-steps>

            <div v-show="step === 0" class="step-content">
                <div class="avatar-upload-container">
                    <el-upload class="avatar-uploader" action="" :show-file-list="false" :on-change="handleAvatarUpload"
                        :auto-upload="false" drag>
                        <div v-if="form.avatar" class="avatar-preview">
                            <img :src="form.avatar" class="avatar" />
                            <div class="avatar-hover">
                                <el-icon>
                                    <Camera />
                                </el-icon>
                                <span>点击更换</span>
                            </div>
                        </div>
                        <div v-else class="avatar-upload-tip">
                            <el-icon>
                                <Plus />
                            </el-icon>
                            <div class="el-upload__text">点击或拖拽上传头像</div>
                            <div class="el-upload__hint">建议尺寸：200×200像素</div>
                        </div>
                    </el-upload>
                    <el-button v-if="form.avatar" type="danger" size="small" @click="removeAvatar"
                        style="margin-top: 10px">
                        删除头像
                    </el-button>
                </div>

                <el-form :model="form" label-width="100px">
                    <el-form-item label="知识库名称">
                        <el-input v-model="form.name" placeholder="请输入名称" />
                    </el-form-item>
                    <el-form-item label="描述">
                        <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
                    </el-form-item>
                </el-form>
            </div>

            <div v-show="step === 1" class="step-content">
                <div v-for="(item, index) in form.fields" :key="index" class="field-item" style="margin-bottom: 12px">
                    <el-input v-model="item.name" placeholder="字段名" style="width: 200px; margin-right: 10px" />
                    <el-select v-model="item.type" placeholder="字段类型" style="width: 150px; margin-right: 10px">
                        <el-option label="文本" value="text" />
                        <el-option label="数字" value="number" />
                        <el-option label="日期" value="date" />
                    </el-select>
                    <el-button type="danger" icon="el-icon-delete" @click="removeField(index)">删除</el-button>
                </div>
                <el-button type="primary" @click="addField">添加字段</el-button>
            </div>

            <div v-show="step === 2" class="step-content">
                <p>请确认以下信息：</p>
                <div class="preview-avatar" v-if="form.avatar">
                    <img :src="form.avatar" class="avatar" />
                </div>
                <p><strong>名称：</strong>{{ form.name }}</p>
                <p><strong>描述：</strong>{{ form.description }}</p>
                <p><strong>字段：</strong></p>
                <ul>
                    <li v-for="(item, index) in form.fields" :key="index">
                        {{ item.name }}（{{ fieldTypeLabel(item.type) }}）
                    </li>
                </ul>
            </div>
        </div>

        <template #footer>
            <el-button v-if="step > 0" @click="step--">上一步</el-button>
            <el-button v-if="step < 2" type="primary" @click="nextStep">下一步</el-button>
            <el-button v-else type="primary" @click="handleSubmit">创建</el-button>
        </template>
    </el-dialog>
</template>



<style scoped>
.step-form-dialog {
    padding: 20px;
}

.step-content {
    margin-top: 20px;
}

.avatar-upload-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.avatar-uploader {
    width: 150px;
    height: 150px;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

.avatar-uploader:hover {
    border-color: var(--el-color-primary);
}

.avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-preview {
    position: relative;
    width: 100%;
    height: 100%;
}

.avatar-hover {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s;
}

.avatar-preview:hover .avatar-hover {
    opacity: 1;
}

.avatar-upload-tip {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: var(--el-text-color-secondary);
}

.avatar-upload-tip .el-icon {
    font-size: 28px;
    margin-bottom: 8px;
}

.el-upload__text {
    font-size: 14px;
    margin-bottom: 4px;
}

.el-upload__hint {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
}

.preview-avatar {
    width: 80px;
    height: 80px;
    margin-bottom: 15px;
    border-radius: 4px;
    overflow: hidden;
}

.preview-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>