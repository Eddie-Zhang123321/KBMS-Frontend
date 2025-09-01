<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, Plus } from '@element-plus/icons-vue'
import { createKnowledgeBase, uploadFile } from '@/api/Knowledgebase'

const dialogVisible = ref(false)
const submitting = ref(false)

const form = reactive({
    name: '',
    description: '',
    avatar: null,       // 预览用
    avatarFile: null,   // 上传用
    chunkSize: 1000,
    chunkOverlap: 200,
    separator: '\n\n',
    initEmbedding: 'text2vec-base'
})

// 上传头像预览
const handleAvatarUpload = (file) => {
    const rawFile = file.raw
    if (!rawFile) return false

    if (rawFile.size > 2 * 1024 * 1024) {
        ElMessage.error('头像大小不能超过2MB')
        return false
    }

    form.avatar = URL.createObjectURL(rawFile)
    form.avatarFile = rawFile
    return false // 阻止 el-upload 自动上传
}

// 删除头像
const removeAvatar = () => {
    if (form.avatar) URL.revokeObjectURL(form.avatar)
    form.avatar = null
    form.avatarFile = null
}

// 关闭弹窗
const handleClose = () => {
    dialogVisible.value = false
    resetForm()
}

// 重置表单
const resetForm = () => {
    Object.assign(form, {
        name: '',
        description: '',
        avatar: null,
        avatarFile: null,
        chunkSize: 1000,
        chunkOverlap: 200,
        separator: '\n\n',
        initEmbedding: 'text2vec-base'
    })
}

// 提交
const handleSubmit = async () => {
    if (!form.name) {
        ElMessage.warning('请填写知识库名称')
        return
    }

    if (submitting.value) return
    submitting.value = true

    try {
        let avatarUrl = ''
        if (form.avatarFile) {
            // 上传头像到后端
            const fd = new FormData()
            fd.append('file', form.avatarFile)
            const res = await uploadFile(fd) // 假设返回 { url: 'xxx' }
            avatarUrl = res.url
        }

        const submitData = {
            name: form.name,
            description: form.description,
            avatar: avatarUrl,
            chunk_config: {
                chunkSize: form.chunkSize,
                chunkOverlap: form.chunkOverlap,
                separator: form.separator,
                initEmbedding: form.initEmbedding
            }
        }

        await createKnowledgeBase(submitData)
        ElMessage.success('知识库创建成功')
        dialogVisible.value = false
        resetForm()
    } catch (error) {
        ElMessage.error('知识库创建失败')
        console.error(error)
    } finally {
        submitting.value = false
    }
}

// 暴露方法
defineExpose({
    open: () => { dialogVisible.value = true }
})
</script>
