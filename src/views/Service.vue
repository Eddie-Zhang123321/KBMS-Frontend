<template>
    <div class="ai-chat-interface">
        <!-- 左侧对话记录 -->
        <div class="chat-history">
            <div class="history-header">
                <span>对话列表</span>
                <el-button type="primary" link @click="createNewChat">+ 新建</el-button>
            </div>
            <el-menu :default-active="activeChat" class="chat-menu" @select="handleSelect">
                <el-menu-item v-for="chat in chatHistory" :key="chat.id" :index="chat.id">
                    <span>{{ chat.title }}</span>
                </el-menu-item>
            </el-menu>
        </div>

        <!-- 右侧对话区域 -->
        <div class="chat-area">
            <!-- 顶部助手信息 -->
            <div class="chat-header">
                <img class="assistant-avatar" src="@/assets/logo.png" alt="助手头像" />
                <span class="assistant-name">平台小助手</span>
            </div>

            <!-- 聊天内容 -->
            <div class="chat-content">
                <div v-for="message in messages" :key="message.id" class="message-wrapper"
                    :class="{ 'user-wrapper': message.isUser }">
                    <div class="message" :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }">
                        {{ message.text }}
                    </div>
                </div>
            </div>

            <!-- 输入框 -->
            <div class="chat-input">
                <el-input v-model="inputMessage" placeholder="请输入问题..." @keyup.enter="sendMessage" />
                <el-button type="primary" @click="sendMessage" :disabled="isSending">发送</el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { sendChatMessage } from '@/api/chat'

const activeChat = ref('1')
const chatHistory = ref([
    {
        id: '1', title: '金融市场分析', messages: [
            { id: 1, text: 'hello', isUser: true },
            { id: 2, text: '你好，现在我来为你解答', isUser: false }
        ]
    },
    { id: '2', title: '知识库问答', messages: [] }
])
const messages = ref(chatHistory.value[0].messages)
const inputMessage = ref('')
const isSending = ref(false) // 控制发送按钮禁用
let eventSource = null // EventSource 实例

const handleSelect = (index) => {
    activeChat.value = index
    messages.value =
        chatHistory.value.find((chat) => chat.id === index).messages || []
}

const sendMessage = async () => {
    if (inputMessage.value.trim() && !isSending.value) {
        const userMsg = {
            id: messages.value.length + 1,
            text: inputMessage.value,
            isUser: true
        }
        messages.value.push(userMsg)
        inputMessage.value = ''
        isSending.value = true

        // 创建一个 pending AI 消息
        const aiMsg = {
            id: messages.value.length + 1,
            text: '',
            isUser: false
        }
        messages.value.push(aiMsg)

        try {
            // 调用封装的 API 发送消息并启动流
            const response = await sendChatMessage(activeChat.value, userMsg.text)
            const sseUrl = response.data.sseUrl // 假设后端返回 SSE URL

            // 使用 EventSource 连接 SSE 流
            eventSource = new EventSource(sseUrl)

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data)
                if (data.type === 'chunk') {
                    aiMsg.text += data.content // 流式追加文本
                } else if (data.type === 'end') {
                    eventSource.close()
                    isSending.value = false
                }
            }

            eventSource.onerror = (error) => {
                console.error('SSE error:', error)
                aiMsg.text += '\n[错误: 连接失败]'
                eventSource.close()
                isSending.value = false
            }
        } catch (error) {
            console.error('API error:', error)
            aiMsg.text = '[错误: 请求失败]'
            isSending.value = false
        }
    }
}

const createNewChat = () => {
    const newId = String(chatHistory.value.length + 1)
    chatHistory.value.push({ id: newId, title: `新对话 ${newId}`, messages: [] })
    activeChat.value = newId
    messages.value = []
}

// 组件卸载时关闭 SSE 连接
onUnmounted(() => {
    if (eventSource) {
        eventSource.close()
    }
})
</script>

<style scoped>
.ai-chat-interface {
    display: flex;
    height: 100%;
    /* 让父容器决定高度 */
    background: #f9fafb;
}

/* 左侧对话列表 */
.chat-history {
    width: 240px;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
}

.history-header {
    padding: 12px;
    font-weight: bold;
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-menu {
    flex: 1;
    border-right: none;
    overflow-y: auto;
}

/* 右侧对话区域 */
.chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
}

/* 顶部助手信息 */
.chat-header {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #fff;
}

.assistant-avatar {
    width: 34px;
    height: 34px;
    background: #e5e7eb;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 10px;
}

.assistant-name {
    font-weight: bold;
}

/* 聊天内容 */
.chat-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.message-wrapper {
    display: flex;
    margin-bottom: 10px;
}

.user-wrapper {
    justify-content: flex-end;
}

.message {
    max-width: 60%;
    padding: 10px 14px;
    border-radius: 12px;
    line-height: 1.5;
}

.user-message {
    background-color: #dbeafe;
    align-self: flex-end;
}

.ai-message {
    background-color: #f3f4f6;
    align-self: flex-start;
}

/* 输入框 */
.chat-input {
    padding: 12px;
    border-top: 1px solid #e5e7eb;
    background: #fff;
    display: flex;
    gap: 10px;
}

.chat-input .el-input {
    flex: 1;
}
</style>