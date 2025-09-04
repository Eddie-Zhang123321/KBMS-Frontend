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
                    <el-icon class="delete-icon" @click.stop="deleteChatSession(chat.id)">
                        <Delete />
                    </el-icon>
                </el-menu-item>
            </el-menu>
        </div>

        <!-- 右侧对话区域 -->
        <div class="chat-area">
            <!-- 聊天头部 -->
            <div class="chat-header">
                <div class="header-left" style="display: flex; align-items: center;">
                    <img class="assistant-avatar" src="@/assets/logo.png" alt="助手头像" />
                    <span class="assistant-name">平台小助手</span>
                </div>
                <el-icon class="setting-icon" style="margin-left: auto; cursor: pointer;" @click="openSettingDialog">
                    <Setting />
                </el-icon>
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

        <!-- 设置对话框 -->
        <el-dialog v-model="showSettingDialog" title="问答设置" width="50%" :destroy-on-close="true">
            <ChatSetting />
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { debounce } from 'lodash';
import { getChatList, getChatDetail, createChat, sendChatMessage, updateChatMessages, deleteChat } from '@/api/chat';
import ChatSetting from '@/components/dialogs/ChatSetting.vue';

const activeChat = ref('');
const chatHistory = ref([]); // [{id, title, messages?}]
const messages = ref([]);
const inputMessage = ref('');
const isSending = ref(false);
const eventSource = ref(null);
const showSettingDialog = ref(false);

// 打开设置弹窗
const openSettingDialog = () => {
    showSettingDialog.value = true;
};

// 更新 chatHistory 中的消息
const updateMessagesInHistory = (chatId, msgs) => {
    const chat = chatHistory.value.find(c => c.id === chatId);
    if (chat) {
        chat.messages = [...msgs];
    }
};

// 切换会话
const handleSelect = async (chatId) => {
    if (eventSource.value) {
        eventSource.value.close();
        eventSource.value = null;
    }
    activeChat.value = chatId;

    try {
        const detail = await getChatDetail(chatId);
        messages.value = detail.messages || [];
        updateMessagesInHistory(chatId, messages.value);
    } catch (error) {
        console.error('Fetch chat detail error:', error);
        ElMessage.error('加载对话详情失败');
        messages.value = [];
    }
};

// 删除对话
const deleteChatSession = async (chatId) => {
    const chat = chatHistory.value.find(c => c.id === chatId);
    const title = chat?.title || '该对话';

    try {
        await ElMessageBox.confirm(`确定删除对话 "${title}" 吗？`, '警告', {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
        });
        await deleteChat(chatId);

        const index = chatHistory.value.findIndex(c => c.id === chatId);
        chatHistory.value.splice(index, 1);

        if (activeChat.value === chatId) {
            activeChat.value = '';
            messages.value = [];
            if (chatHistory.value.length > 0) {
                await handleSelect(chatHistory.value[0].id);
            }
        }

        ElMessage.success('删除成功');
    } catch {
        ElMessage.info('已取消删除');
    }
};

// 发送消息（带防抖）
const sendMessage = debounce(async () => {
    if (inputMessage.value.trim() && !isSending.value && activeChat.value) {
        const userMsg = {
            id: Date.now().toString(),
            text: inputMessage.value,
            isUser: true,
        };
        messages.value.push(userMsg);
        inputMessage.value = '';
        isSending.value = true;

        const aiMsg = { id: Date.now().toString(), text: '', isUser: false };
        messages.value.push(aiMsg);

        try {
            const response = await sendChatMessage(activeChat.value, userMsg.text);
            const sseUrl = response.sseUrl;

            eventSource.value = new EventSource(sseUrl);

            eventSource.value.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'chunk') {
                    aiMsg.text += data.content;
                } else if (data.type === 'end') {
                    eventSource.value.close();
                    eventSource.value = null;
                    isSending.value = false;
                    if (!aiMsg.text) {
                        aiMsg.text = '[无响应内容]';
                    }
                    updateChatMessages(activeChat.value, messages.value).catch((error) => {
                        console.error('Update messages error:', error);
                        ElMessage.error('消息同步失败');
                    });
                    updateMessagesInHistory(activeChat.value, messages.value);
                }
            };

            eventSource.value.onerror = () => {
                ElMessage.error('连接失败，请稍后重试');
                eventSource.value.close();
                eventSource.value = null;
                isSending.value = false;
                if (!aiMsg.text) aiMsg.text = '[连接失败]';
            };
        } catch (error) {
            console.error('API error:', error);
            ElMessage.error('请求失败，请检查网络');
            isSending.value = false;
            if (!aiMsg.text) aiMsg.text = '[请求失败]';
        }
    }
}, 500);

// 创建新对话
const createNewChat = async () => {
    try {
        const newId = String(Date.now());
        const newChat = { id: newId, title: `新对话 ${newId}`, messages: [] };
        await createChat({ title: newChat.title });
        chatHistory.value.push(newChat);
        activeChat.value = newId;
        messages.value = [];
    } catch (error) {
        console.error('Create chat error:', error);
        ElMessage.error('创建新对话失败');
    }
};

// 初始化加载对话列表
onMounted(async () => {
    try {
        const response = await getChatList();
        chatHistory.value = response.map((chat) => ({
            ...chat,
            id: String(chat.id),
        }));
        if (chatHistory.value.length) {
            await handleSelect(chatHistory.value[0].id);
        }
    } catch (error) {
        console.error('Fetch chat list error:', error);
        ElMessage.error('加载对话列表失败');
    }
});

onUnmounted(() => {
    if (eventSource.value) {
        eventSource.value.close();
        eventSource.value = null;
    }
});
</script>


<style scoped>
.ai-chat-interface {
    display: flex;
    height: 100%;
    background: #f9fafb;
}

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

.chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fff;
}

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

.ai-message:empty::before {
    content: '正在加载...';
    color: #999;
    font-style: italic;
}

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

.setting-icon {
    font-size: 18px;
    color: #666;
    transition: color 0.2s;
}

.setting-icon:hover {
    color: #409eff;
}

.delete-icon {
    position: absolute;
    right: 10px;
    padding: 4px;
    color: #999;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.2s ease, color 0.2s ease;
    cursor: pointer;
}

.delete-icon:hover {
    color: #f56c6c;
}

.el-menu-item:hover .delete-icon,
.el-menu-item.is-active .delete-icon {
    opacity: 1;
}
</style>
