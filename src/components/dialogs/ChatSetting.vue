<template>
    <div class="chat-setting">
        <el-form :model="form" label-width="120px" :disabled="loading">
            <!-- 检索策略设置 -->
            <h3>检索策略设置</h3>

            <el-form-item label="Top-K">
                <el-slider v-model="form.topK" :min="1" :max="20" show-input />
                <div class="form-tip">设置检索返回的最相关文本片段数量</div>
            </el-form-item>

            <el-form-item label="相似度阈值">
                <el-slider v-model="form.similarityThreshold" :min="0" :max="1" :step="0.05" show-input />
                <div class="form-tip">设置匹配的最小相似度，值越高匹配越严格</div>
            </el-form-item>

        

            <!-- 知识库权重设置 -->
            <h3>知识库权重设置</h3>
            <div class="knowledge-base-weights">
                <div v-for="(kb, index) in form.knowledgeBaseWeights" :key="kb.id" class="kb-item">
                    <span class="kb-name">{{ kb.name }}</span>
                    <el-slider v-model="kb.weight" :min="0" :max="100" :step="10" show-input
                        style="width: 300px; margin: 0 15px;" />
                    <span class="kb-weight">{{ kb.weight }}%</span>
                </div>
                <div class="weight-tip">注意：所有权重总和应为100%</div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
                <el-button type="primary" @click="saveSettings" :loading="saving">保存设置</el-button>
                <el-button @click="resetSettings">重置</el-button>
                <el-button @click="closeDialog">取消</el-button>
            </div>
        </el-form>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getChatSettings, updateChatSettings } from '@/api/chat'

const props = defineProps({
    chatId: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['close'])

// 表单数据
const form = ref({
    topK: 5,
    similarityThreshold: 0.7,
    knowledgeBaseWeights: []
})



// 加载状态
const loading = ref(false)
const saving = ref(false)

// 计算权重总和
const totalWeight = computed(() => {
    return form.value.knowledgeBaseWeights.reduce((sum, kb) => sum + kb.weight, 0)
})

// 监听权重变化，确保总和不超过100
watch(() => form.value.knowledgeBaseWeights, (newWeights) => {
    if (totalWeight.value > 100) {
        // 找到最后一个被修改的权重项并调整
        const lastIndex = newWeights.length - 1
        if (lastIndex >= 0) {
            newWeights[lastIndex].weight = Math.max(0, 100 - (totalWeight.value - newWeights[lastIndex].weight))
        }
    }
}, { deep: true })

// 获取设置
const fetchSettings = async () => {
    loading.value = true
    try {
        const settings = await getChatSettings(props.chatId)
        form.value = { ...settings }
    } catch (error) {
        console.error('获取设置失败:', error)
        ElMessage.error('获取设置失败')
    } finally {
        loading.value = false
    }
}

// 保存设置
const saveSettings = async () => {
    // 验证权重总和
    if (totalWeight.value !== 100) {
        ElMessage.warning('知识库权重总和必须为100%')
        return
    }

    saving.value = true
    try {
        await updateChatSettings(props.chatId, form.value)
        ElMessage.success('设置保存成功')
        emit('close')
    } catch (error) {
        console.error('保存设置失败:', error)
        ElMessage.error('保存设置失败')
    } finally {
        saving.value = false
    }
}

// 重置设置
const resetSettings = () => {
    fetchSettings()
}

// 关闭对话框
const closeDialog = () => {
    emit('close')
}

// 组件挂载时获取设置
onMounted(() => {
    fetchSettings()
})
</script>

<style scoped>
.chat-setting {
    padding: 10px;
}

h3 {
    margin: 20px 0 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
    color: #409EFF;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
}

.knowledge-base-weights {
    margin-bottom: 20px;
}

.kb-item {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
}

.kb-name {
    width: 120px;
    text-align: right;
    padding-right: 15px;
}

.kb-weight {
    width: 50px;
    text-align: center;
}

.weight-tip {
    font-size: 12px;
    color: #E6A23C;
    margin-top: 10px;
    text-align: center;
}

.action-buttons {
    text-align: center;
    margin-top: 30px;
}
</style>