<template>
    <div class="ai-chat-interface">
        <!-- 左侧对话记录 -->
        <div class="chat-history">
            <div class="history-header">
                <span>对话列表</span>
                <el-button type="primary" link @click="createNewChat" class="new-chat-button">+ 新建</el-button>
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

                <div class="header-actions" style="margin-left: auto; display: flex; gap: 12px; align-items: center;">
                    <el-icon class="setting-icon" style="cursor: pointer;" @click="openSettingDialog">
                        <Setting />
                    </el-icon>
                    <el-button type="primary" @click="openTicketDialog">提交工单</el-button>
                </div>
            </div>


            <!-- 聊天内容 -->
            <div class="chat-content">
                <div v-for="message in messages" :key="message.id" class="message-wrapper"
                    :class="{ 'user-wrapper': message.isUser }">
                    <div class="message" :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }">
                        {{ message.text }}
                    </div>

                    <!-- 来源追溯区：仅 AI 消息且有来源时显示 -->
                    <div v-if="!message.isUser && message.sources && message.sources.length" class="sources-box">
                        <el-collapse>
                            <el-collapse-item v-for="(src, i) in message.sources" :key="i"
                                :title="`来源 ${src.rank}: ${src.snippet.slice(0, 50)}...`">
                                <div class="source-detail">
                                    <p><b>排名:</b> {{ src.rank }}</p>
                                    <p><b>知识库ID:</b> {{ src.kb_id }}</p>
                                    <p><b>文档ID:</b> {{ src.document_id }}</p>
                                    <p><b>分块ID:</b> {{ src.chunk_id }}</p>
                                    <p><b>片段:</b> {{ src.snippet }}</p>
                                </div>
                            </el-collapse-item>
                        </el-collapse>
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
            <!-- 关键修改：传递当前对话ID给设置组件 -->
            <ChatSetting :chat-id="activeChat" @close="showSettingDialog = false" />
        </el-dialog>

        <!-- 提交工单对话框 -->
        <!-- 提交工单对话框 -->
        <el-dialog v-model="showTicketDialog" title="提交工单" width="50%" :destroy-on-close="true">
            <el-form ref="ticketForm" :model="ticketData" :rules="ticketRules" label-width="120px">
                <el-form-item label="问题类型" prop="issueType">
                    <el-select v-model="ticketData.issueType" placeholder="请选择问题类型">
                        <el-option label="事实性错误" value="fact_error"></el-option>
                        <el-option label="相关知识待补充/更新" value="knowledge_update"></el-option>
                        <el-option label="自相矛盾" value="contradiction"></el-option>
                        <el-option label="多源信息冲突" value="conflict_info"></el-option>
                        <el-option label="格式问题" value="format_issue"></el-option>
                        <el-option label="其他" value="other"></el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="自定义类型" prop="customType" v-if="ticketData.issueType === 'other'">
                    <el-input v-model="ticketData.customType" placeholder="请输入具体的问题类型" />
                </el-form-item>

                <el-form-item label="问题详情" prop="issueDetail">
                    <el-input v-model="ticketData.issueDetail" type="textarea" :rows="5"
                        placeholder="请详细描述您遇到的问题，包括上下文、期望结果等" />
                </el-form-item>
            </el-form>


            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="showTicketDialog = false">取消</el-button>
                    <el-button type="primary" @click="submitTicket">提交</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { debounce } from 'lodash';
import { getChatList, getChatDetail, createChat, sendChatMessage, updateChatMessages, deleteChat } from '@/api/chat';
import { createTicket } from '@/api/ticket';
import ChatSetting from '@/components/dialogs/ChatSetting.vue';
import { el } from 'date-fns/locale';
import { useRoute } from 'vue-router'

const route = useRoute()


const activeChat = ref('');
const chatHistory = ref([]);
const messages = ref([]);
const inputMessage = ref('');
const isSending = ref(false);
const eventSource = ref(null);
const showSettingDialog = ref(false);
const showTicketDialog = ref(false);
const ticketData = ref({
    issueType: '',
    customType: '',   // 统一叫 customType
    issueDetail: '',
});
const ticketRules = {
    issueType: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
    customType: [
        {
            required: true,
            message: '请输入具体的问题类型',
            trigger: 'blur',
            validator: (_, value, callback) => {
                if (ticketData.value.issueType === 'other' && !value) {
                    callback(new Error('请输入具体的问题类型'));
                } else {
                    callback();
                }
            }
        }
    ],
    issueDetail: [{ required: true, message: '请填写问题详情', trigger: 'blur' }]
};
const ticketForm = ref(null);

const openTicketDialog = () => {
    showTicketDialog.value = true;
};

const submitTicket = async () => {
    if (!activeChat.value) {
        ElMessage.warning('请先选择一个对话或创建新对话');
        return;
    }

    const formRef = ticketForm.value;
    await formRef.validate(async (valid) => {
        if (!valid) return;

        try {
            const response = await createTicket({
                chatId: activeChat.value,
                issueType: ticketData.value.issueType === 'other'
                    ? ticketData.value.customType
                    : ticketData.value.issueType,
                issueDetail: ticketData.value.issueDetail
            });

            // 假设接口返回结构是 { code:200, data:{ ticket_id:"t_66" } }
            const ticketId = response.data?.ticket_id || '未知ID';

            ElMessage({
                type: 'success',
                message: `工单提交成功（ID: ${ticketId}）`,
                duration: 5000   // 停留 5 秒（默认是 3 秒）
            });

            showTicketDialog.value = false;
            ticketData.value = { issueType: '', customType: '', issueDetail: '' };
        } catch (error) {
            console.error('提交工单错误:', error);
            ElMessage.error('提交工单失败，请稍后重试');
        }

    });
};

// 打开设置弹窗 - 添加检查是否有选中对话
const openSettingDialog = () => {
    if (!activeChat.value) {
        ElMessage.warning('请先选择一个对话或创建新对话');
        return;
    }
    showSettingDialog.value = true;
};

// 更新 chatHistory 中的消息
const updateMessagesInHistory = (chatId, msgs) => {
    const chat = chatHistory.value.find(c => c.id === chatId);
    if (chat) chat.messages = [...msgs];
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
        // 确保 sources 保留下来
        messages.value = (detail.messages || []).map(m => ({
            ...m,
            sources: m.sources || []
        }));
        updateMessagesInHistory(chatId, messages.value);
    } catch (error) {
        console.error('获取对话详情错误:', error);
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

// 发送消息（带防抖，带 sources）
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

        const aiMsg = { id: Date.now().toString(), text: '', isUser: false, sources: [] };
        messages.value.push(aiMsg);

        try {
            const response = await sendChatMessage(activeChat.value, userMsg.text);
            const sseUrl = response.sseUrl;

            eventSource.value = new EventSource(sseUrl);

            eventSource.value.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === 'chunk') {
                    aiMsg.text += data.content;
                    if (data.sources) {
                        aiMsg.sources = data.sources;
                    }
                } else if (data.type === 'end') {
                    eventSource.value.close();
                    eventSource.value = null;
                    isSending.value = false;
                    if (!aiMsg.text) {
                        aiMsg.text = '[无响应内容]';
                    }
                    updateChatMessages(activeChat.value, messages.value).catch((error) => {
                        console.error('更新消息错误:', error);
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
            console.error('API错误:', error);
            ElMessage.error('请求失败，请检查网络');
            isSending.value = false;
            if (!aiMsg.text) aiMsg.text = '[请求失败]';
        }
    }
}, 500);

// 创建新对话
const createNewChat = async () => {
    try {
        const res = await createChat({ title: `新对话` });
        const newChat = {
            id: String(res.chat_id),
            title: res.title || `新对话 ${res.chatid}`,
            messages: []
        };
        chatHistory.value.push(newChat);
        activeChat.value = newChat.id;
        messages.value = [];
    } catch (error) {
        console.error('创建对话错误:', error);
        ElMessage.error('创建新对话失败');
    }
};

// 初始化加载对话列表
onMounted(async () => {
    try {
        const response = await getChatList()
        chatHistory.value = response.map(chat => ({
            ...chat,
            id: String(chat.id),
        }))

        let targetChatId = route.query.chatId ? String(route.query.chatId) : null

        if (targetChatId && chatHistory.value.find(c => c.id === targetChatId)) {
            await handleSelect(targetChatId)
        } else if (chatHistory.value.length) {
            await handleSelect(chatHistory.value[0].id)
        }
    } catch (error) {
        console.error('获取对话列表错误:', error)
        ElMessage.error('加载对话列表失败')
    }
})

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
    height: 90vh;
    font-family: "Helvetica Neue", Arial, sans-serif;
    background: #f4f6f8;
    overflow: hidden;
}

/* 左侧历史列表 */
.chat-history {
    width: 260px;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    background: #fff;
    box-shadow: 2px 0 6px rgba(0, 0, 0, 0.03);
    overflow: hidden;
}

.history-header {
    position: sticky;
    /* 固定在 chat-history 容器顶部 */
    top: 0;
    z-index: 10;
    /* 确保 header 在内容上方 */
    padding: 14px 16px;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid #e0e0e0;
    background: #f9fafb;
    display: flex;
    justify-content: space-between;
    /* “对话列表”和“新建”按钮两端对齐 */
    align-items: center;
}

.new-chat-button {
    margin-left: auto;
    /* 确保“新建”按钮靠右 */
}

.chat-menu {
    flex: 1;
    overflow-y: auto;
    padding-top: 8px;
    /* 防止内容被 header 遮挡 */
}

.el-menu-item {
    position: relative;
    padding: 10px 16px;
    border-radius: 8px;
    margin: 4px 8px;
    transition: all 0.2s;
}

.el-menu-item:hover {
    background-color: #e6f0ff;
}

.el-menu-item.is-active {
    background-color: #cce0ff;
    font-weight: 600;
}

.delete-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.2s, color 0.2s;
    cursor: pointer;
}

.el-menu-item:hover .delete-icon,
.el-menu-item.is-active .delete-icon {
    opacity: 1;
}

.delete-icon:hover {
    color: #f56c6c;
}

/* 右侧聊天区 */
.chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #fdfdfd;
    overflow: hidden;
}

.chat-header {
    position: fixed;
    bottom: 100;
    left: 480px;
    /* 左侧历史列表宽度 */
    right: 0;
    padding: 12px 24px;
    background: #fff;
    display: flex;
    gap: 12px;
    z-index: 10;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid #e0e0e0;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
}

.assistant-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    margin-right: 10px;
}

.assistant-name {
    font-weight: 600;
    font-size: 15px;
}

/* 消息区内容自适应高度 */
.chat-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 70px;
    /* 留出输入框空间 */
    scroll-behavior: smooth;
    display: flex;
    flex-direction: column;
    gap: 8px;
}


/* 消息气泡 */
.message-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.user-wrapper {
    align-items: flex-end;
}

.message {
    max-width: 65%;
    padding: 12px 16px;
    border-radius: 16px;
    line-height: 1.6;
    word-break: break-word;
    font-size: 14px;
}

.user-message {
    background: linear-gradient(120deg, #90caf9, #42a5f5);
    color: #fff;
}

.ai-message {
    background: #f3f4f6;
    color: #333;
}

.ai-message:empty::before {
    content: '正在加载...';
    color: #999;
    font-style: italic;
}

/* 来源追溯卡片 */
.sources-box {
    margin-top: 4px;
    max-width: 80%;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px;
    font-size: 13px;
    word-break: break-word;
}

.source-detail p {
    margin: 2px 0;
    color: #555;
}

.el-collapse-item__wrap {
    background: #f9fafb;
    border-radius: 6px;
    padding: 8px 12px;
    margin-top: 4px;
}

/* 输入区固定在底部 */
.chat-input {
    position: fixed;
    bottom: 0;
    left: 480px;
    /* 左侧历史列表宽度 */
    right: 0;
    padding: 12px 24px;
    background: #fff;
    display: flex;
    gap: 12px;
    z-index: 10;
    border-top: 1px solid #e0e0e0;
}


.chat-input .el-input {
    flex: 1;
}

.el-button--primary:disabled {
    background-color: #90caf9;
    cursor: not-allowed;
}
</style>