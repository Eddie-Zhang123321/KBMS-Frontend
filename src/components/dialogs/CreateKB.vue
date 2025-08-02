<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, Plus } from '@element-plus/icons-vue'
import { createKnowledgeBase } from '@/api/Knowledgebase'

const dialogVisible = ref(false)
const form = reactive({
    name: '',
    description: '',
    avatar: null
})

// 处理头像上传
const handleAvatarUpload = (file) => {
    if (file.size > 2 * 1024 * 1024) {
        ElMessage.error('头像大小不能超过2MB')
        return false
    }
    // Check if file is valid before creating object URL
    if (file instanceof Blob) {
        form.avatar = URL.createObjectURL(file)
    }
    return false
}

// 删除头像
const removeAvatar = () => {
    if (form.avatar) {
        URL.revokeObjectURL(form.avatar)
    }
    form.avatar = null
}

// 关闭弹窗
const handleClose = (done) => {
    dialogVisible.value = false
    if (form.avatar) {
        URL.revokeObjectURL(form.avatar)
        form.avatar = null
    }
    done()
}

// 提交
const handleSubmit = async () => {
    const submitData = {
        name: form.name,
        description: form.description
    }
    try {
        await createKnowledgeBase(submitData)
        ElMessage.success('知识库创建成功')
        dialogVisible.value = false
    } catch (error) {
        ElMessage.error('知识库创建失败')
        console.error('Error creating knowledge base:', error)
    }
    if (form.avatar) {
        URL.revokeObjectURL(form.avatar)
    }
    form.name = ''
    form.description = ''
    form.avatar = null
}

// 暴露 open 方法
defineExpose({
    open: () => {
        dialogVisible.value = true
    }
})
</script>

<template>
    <el-dialog v-model="dialogVisible" title="新建知识库" width="600px" :before-close="handleClose"
        style="--el-dialog-border-radius:30px">
        <div class="form-container">
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
                <el-button v-if="form.avatar" type="danger" size="small" @click="removeAvatar" style="margin-top: 10px">
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

        <template #footer>
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" @click="handleSubmit">确定</el-button>
        </template>
    </el-dialog>
</template>

<style scoped>
.form-container {
    padding: 20px;
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
</style>