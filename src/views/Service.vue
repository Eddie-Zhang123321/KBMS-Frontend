<template>
    <div class="ai-chat-interface">
        <!-- 移动端对话列表图标 -->
        <div v-if="isMobile" class="mobile-chat-list-icon" @click="toggleChatHistory">
            <el-icon>
                <Expand v-if="!chatHistoryVisible" />
                <Fold v-else />
            </el-icon>
        </div>

        <!-- 左侧对话记录 -->
        <div class="chat-history" :class="{
            'chat-history-mobile': isMobile,
            'chat-history-visible': chatHistoryVisible || !isMobile
        }">
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

        <!-- 移动端遮罩层 -->
        <div v-if="isMobile && chatHistoryVisible" class="chat-history-overlay" @click="toggleChatHistory"></div>

        <!-- 右侧对话区域 -->
        <div class="chat-area" :class="{ 'chat-area-mobile': isMobile }">
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
                </div>
            </div>

            <!-- 聊天内容 -->
            <div class="chat-content">
                <div v-for="message in messages" :key="message.id" class="message-wrapper"
                    :class="{ 'user-wrapper': message.isUser }">
                    <div class="message" :class="{ 'user-message': message.isUser, 'ai-message': !message.isUser }">
                        {{ message.text }}
                    </div>

                <div v-if="!message.isUser && message.sources && message.sources.length" class="sources-box">
                    <!-- 显示引用的编号 -->
                    <el-collapse>
                        <el-collapse-item v-for="(src, i) in message.sources" :key="i"
                            :title="`来源 ${src.rank}: ${truncateText(src.snippet, 150)}`">
                            <div class="source-detail">
                                <p><b>排名:</b> {{ src.rank }}</p>
                                <p><b>知识库ID:</b> {{ src.kb_id }}</p>
                                <p><b>文档ID:</b> {{ src.document_id }}</p>
                                <p><b>分块ID:</b> {{ src.chunk_id }}</p>
                                <p><b>片段:</b> {{ src.snippet }}</p>
                            </div>
                        </el-collapse-item>
                    </el-collapse>
                    <!-- 提示缺失的引用 -->
                    <p v-if="missingCitations(message).length > 0" style="color: #e6a23c; font-size: 12px; margin-top: 8px;">
                        警告：未找到以下引用的来源信息：[{{ missingCitations(message).join(', ') }}]
                    </p>
                </div>

                    <!-- 无来源时的提示 -->
                    <div v-else-if="!message.isUser" class="sources-box">
                        <p style="color: #999; font-style: italic;">
                            暂无来源信息
                            <span v-if="message.text.includes('引用：')">
                                检测到引用：{{ extractCitations(message.text) }}
                            </span>
                        </p>
                    </div>

                    <!-- AI 消息反馈入口 -->
                    <div v-if="!message.isUser" class="feedback-box">
                        <el-button type="text" size="small" @click="openTicketDialog(message)">
                            反馈此回答
                        </el-button>
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
            <ChatSetting :chat-id="activeChat" @close="showSettingDialog = false" />
        </el-dialog>

        <!-- 提交工单对话框 -->
        <el-dialog v-model="showTicketDialog" title="提交工单" width="50%" :destroy-on-close="true">
            <el-form ref="ticketForm" :model="ticketData" :rules="ticketRules" label-width="120px">
                <el-form-item label="原始问题">
                    <el-input v-model="ticketData.question" type="textarea" :rows="2" disabled />
                </el-form-item>

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
import { ref, onMounted, onUnmounted,reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { debounce } from 'lodash';
import { getChatList, getChatDetail, createChat, sendChatMessage, updateChatMessages, deleteChat } from '@/api/chat';
import { createTicket } from '@/api/ticket';
import ChatSetting from '@/components/dialogs/ChatSetting.vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 响应式状态
const isMobile = ref(false);
const chatHistoryVisible = ref(false);
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
    customType: '',
    issueDetail: '',
    question: '',
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

// 临时存储 source 事件数据
const tempSources = ref([]);

// 截断文本函数，确保中文字符不被切分
const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text || '';
    let result = '';
    let charCount = 0;
    for (let char of text) {
        charCount += /[\u4e00-\u9fff]/.test(char) ? 2 : 1;
        if (charCount > maxLength) break;
        result += char;
    }
    return result + '...';
};

// 提取消息中的引用编号
const extractCitations = (text) => {
    const matches = text.match(/\[(\d+)\](?:\s*\[\d+\])*/g) || [];
    const citations = matches.map(m => m.match(/\d+/g)).flat().map(Number);
    return [...new Set(citations)].sort((a, b) => a - b).join(', ');
};

// 获取缺失的引用编号
const missingCitations = (message) => {
    const citations = extractCitations(message.text).split(', ').map(Number);
    const sourceRanks = message.sources.map(src => src.rank);
    return citations.filter(c => !sourceRanks.includes(c));
};

// 检测屏幕尺寸
const checkScreenSize = () => {
    isMobile.value = window.innerWidth <= 768;
    if (isMobile.value) {
        chatHistoryVisible.value = false;
    }
};

// 切换对话列表显示
const toggleChatHistory = () => {
    chatHistoryVisible.value = !chatHistoryVisible.value;
};

// 监听窗口大小变化
const handleResize = () => {
    checkScreenSize();
};

// 查找当前 AI 消息对应的最近用户提问
const findLastUserMessage = (aiMsg) => {
    const index = messages.value.findIndex(m => m.id === aiMsg.id);
    for (let i = index - 1; i >= 0; i--) {
        if (messages.value[i].isUser) return messages.value[i];
    }
    return null;
};

// 打开工单对话框
const openTicketDialog = (aiMsg) => {
    const userMsg = findLastUserMessage(aiMsg);
    ticketData.value = {
        issueType: '',
        customType: '',
        issueDetail: '',
        question: userMsg?.text || '',
    };
    showTicketDialog.value = true;
};

// 提交工单
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
                question: ticketData.value.question,
                issueType: ticketData.value.issueType === 'other'
                    ? ticketData.value.customType
                    : ticketData.value.issueType,
                issueDetail: ticketData.value.issueDetail
            });
            const ticketId = response.data?.ticket_id || '未知ID';
            ElMessage({
                type: 'success',
                message: `工单提交成功（ID: ${ticketId}）`,
                duration: 5000
            });
            showTicketDialog.value = false;
            ticketData.value = { issueType: '', customType: '', issueDetail: '', question: '' };
        } catch (error) {
            console.error('提交工单错误:', error);
            ElMessage.error('提交工单失败，请稍后重试');
        }
    });
};

// 打开设置弹窗
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

// 发送消息（带防抖，处理流式输出和 source 事件）
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
        const aiMsg = reactive({ id: Date.now().toString(), text: '', isUser: false, sources: [] });
        messages.value.push(aiMsg);
        tempSources.value = []; // 重置临时 sources
        let retryCount = 0;
        const maxRetries = 3;

        
const trySendMessage = async () => {
    try {
        const apiBase = import.meta.env.VITE_DEV_BASE_API;
        const backendOrigin = apiBase.replace(/\/api\/?$/, '');
        const response = await sendChatMessage(activeChat.value, userMsg.text);
        const sseUrl = (response.sseUrl.startsWith('http') ? response.sseUrl
            : backendOrigin + response.sseUrl);
        
        eventSource.value = new EventSource(sseUrl);
        console.debug('EventSource 初始化:', sseUrl, eventSource.value);

        eventSource.value.onmessage = (e) => {
            console.debug('原始 SSE 事件:', e);
            const d = JSON.parse(e.data || '{}');
            console.debug('解析后的 SSE 数据:', d);

            if (d.type === 'token') {
                aiMsg.text += d.content || ''; // 流式更新文本
            } else if (d.type === 'source') {
                console.log("source在这里", e);
                const sourceData = d.data;
                console.debug('SSE source 事件:', sourceData);
                if (sourceData?.rank && sourceData?.snippet) {
                    tempSources.value.push(sourceData); // 存储 source 事件数据
                }
            } else if (d.type === 'meta') {
                console.debug('SSE meta 事件:', d);
            } else if (d.type === 'result') {
                console.debug('SSE result 事件:', d);
                if (!aiMsg.text && d?.data?.answer) aiMsg.text = d.data.answer;
                if (d?.data?.sources) {
                    aiMsg.sources = d.data.sources.filter(src => src.rank && src.snippet);
                    tempSources.value = []; // 清空临时 sources
                    messages.value = [...messages.value]; // 显式触发更新
                    if (aiMsg.sources.length === 0) {
                        console.warn('Result 事件提供的 sources 为空或格式错误:', d.data.sources);
                        ElMessage.warning('来源信息为空或格式错误');
                    } else {
                        const citations = extractCitations(aiMsg.text).split(', ').map(Number);
                        const sourceRanks = aiMsg.sources.map(src => src.rank);
                        const missing = citations.filter(c => !sourceRanks.includes(c));
                        if (missing.length > 0) {
                            console.warn('缺少引用的来源:', missing);
                            ElMessage.warning(`未找到引用 [${missing.join(', ')}] 的来源信息`);
                        }
                    }
                } else {
                    console.warn('Result 事件未提供 sources:', d);
                    ElMessage.warning('未收到来源信息');
                }
            } else if (d.type === 'end') {
                // 延迟关闭连接以确保 source 事件被处理
                setTimeout(() => {
                    eventSource.value.close();
                    eventSource.value = null;
                    isSending.value = false;
                    if (!aiMsg.text) aiMsg.text = '[无响应内容]';
                    if (!aiMsg.sources.length && tempSources.value.length > 0) {
                        aiMsg.sources = [...tempSources.value.filter(src => src.rank && src.snippet)];
                        console.debug('使用 tempSources 作为后备:', aiMsg.sources);
                        messages.value = [...messages.value];
                    }
                    if (aiMsg.text.includes('引用：') && aiMsg.sources.length > 0) {
                        const citations = extractCitations(aiMsg.text).split(', ').map(Number);
                        const sourceRanks = aiMsg.sources.map(src => src.rank);
                        const missing = citations.filter(c => !sourceRanks.includes(c));
                        if (missing.length > 0) {
                            console.warn('缺少引用的来源:', missing);
                            ElMessage.warning(`未找到引用 [${missing.join(', ')}] 的来源信息`);
                        }
                    } else if (aiMsg.text.includes('引用：') && !aiMsg.sources.length) {
                        console.warn('检测到引用但无来源:', aiMsg.text);
                        ElMessage.warning('未收到任何来源信息，但检测到引用，请检查后端响应');
                    }
                    updateMessagesInHistory(activeChat.value, messages.value);
                }, 2000); // 延迟 2 秒关闭连接
            }
        };

        eventSource.value.onerror = () => {
            console.error('SSE 连接错误，重试次数:', retryCount);
            eventSource.value.close();
            eventSource.value = null;
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(trySendMessage, 1000 * retryCount);
            } else {
                ElMessage.error('连接失败，请稍后重试');
                isSending.value = false;
                if (!aiMsg.text) aiMsg.text = '[连接失败]';
                messages.value = [...messages.value]; // 显式触发更新
            }
        };
    } catch (error) {
        console.error('API错误:', error);
        ElMessage.error('请求失败，请检查网络');
        isSending.value = false;
        if (!aiMsg.text) aiMsg.text = '[请求失败]';
        messages.value = [...messages.value]; // 显式触发更新
    }
};


        await trySendMessage();
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
    checkScreenSize();
    window.addEventListener('resize', handleResize);
    try {
        const response = await getChatList();
        chatHistory.value = response.map(chat => ({
            ...chat,
            id: String(chat.id),
        }));
        let targetChatId = route.query.chatId ? String(route.query.chatId) : null;
        if (targetChatId && chatHistory.value.find(c => c.id === targetChatId)) {
            await handleSelect(targetChatId);
        } else if (chatHistory.value.length) {
            await handleSelect(chatHistory.value[0].id);
        }
    } catch (error) {
        console.error('获取对话列表错误:', error);
        ElMessage.error('加载对话列表失败');
    }
});

onUnmounted(() => {
    if (eventSource.value) {
        eventSource.value.close();
        eventSource.value = null;
    }
    window.removeEventListener('resize', handleResize);
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

/* 移动端对话列表图标 */
.mobile-chat-list-icon {
    position: fixed;
    /* top: calc(60px + 5px); */
    margin-top: 45px;
    left: 20px;
    z-index: 100;
    width: 32px;
    height: 32px;
    background: white;
    color: #333;
    border: 1px solid #e0e0e0;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.mobile-chat-list-icon:hover {
    background: #f5f5f5;
    border-color: #409eff;
    transform: scale(1.1);
}

.mobile-chat-list-icon .el-icon {
    font-size: 16px;
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
    transition: transform 0.3s ease;
}

/* 移动端对话列表样式 */
.chat-history-mobile {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 280px;
    z-index: 200;
    transform: translateX(-100%);
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.2);
}

.chat-history-mobile.chat-history-visible {
    transform: translateX(0);
}

/* 移动端遮罩层 */
.chat-history-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 150;
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

.feedback-box {
    margin-top: 4px;
    text-align: left;
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
    transition: all 0.3s ease;
}

/* 移动端聊天头部 */
.chat-area-mobile .chat-header {
    left: 0;
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

    /* 深度选择器严格限定作用范围 */
    :deep(.el-collapse-item) {

        /* 确保标题保持单行显示 */
        .el-collapse-item__title {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            font-size: 12px;
            line-height: 1.2;
            padding: 6px 12px;
            background-color: #f0f2f5;
            color: #333;
            border-radius: 4px;
        }

        .el-collapse-item__title:hover {
            background-color: #e6e8eb;
        }

        /* 确保内容区域正常显示 */
        .el-collapse-item__wrap {
            padding: 8px 12px;
            background-color: #f9fafb;
        }
    }
}

.source-detail p {
    margin: 2px 0;
    color: #555;
    line-height: 1.4;
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

/* 移动端输入框 */
.chat-area-mobile .chat-input {
    left: 0;
}


.chat-input .el-input {
    flex: 1;
}

.el-button--primary:disabled {
    background-color: #90caf9;
    cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .chat-header {
        padding: 11px 22px;
    }

    .assistant-avatar {
        width: 34px;
        height: 34px;
    }

    .assistant-name {
        font-size: 16px;
    }

    .header-actions .el-button {
        padding: 9px 18px;
        font-size: 14px;
    }
}

@media (max-width: 1024px) {
    .chat-header {
        padding: 10px 20px;
    }

    .assistant-avatar {
        width: 32px;
        height: 32px;
    }

    .assistant-name {
        font-size: 15px;
    }

    .header-actions .el-button {
        padding: 8px 16px;
        font-size: 13px;
    }
}

@media (max-width: 900px) {
    .chat-header {
        padding: 9px 18px;
    }

    .assistant-avatar {
        width: 30px;
        height: 30px;
    }

    .assistant-name {
        font-size: 14px;
    }

    .header-actions .el-button {
        padding: 7px 14px;
        font-size: 12px;
    }
}

@media (max-width: 768px) {
    .ai-chat-interface {
        height: 100vh;
    }

    .chat-area {
        width: 100%;
    }

    .chat-content {
        padding: 70px 20px;
    }

    .chat-header {
        padding: 8px 20px;
        left: 0 !important;
    }

    .chat-input {
        padding: 12px 20px;
        left: 0 !important;
    }

    .assistant-avatar {
        width: 28px;
        height: 28px;
    }

    .assistant-name {
        font-size: 14px;
    }

    .message {
        max-width: 85%;
        font-size: 13px;
    }

    .sources-box {
        max-width: 90%;
        font-size: 12px;
    }

    .header-actions {
        gap: 6px;
    }

    .header-actions .el-button {
        padding: 6px 12px;
        font-size: 12px;
    }

    .mobile-chat-list-icon {
        top: calc(60px + 5px);
    }
}

@media (max-width: 480px) {
    .mobile-chat-list-icon {
        /* top: calc(60px + 5px); */
        margin-top: 45px;
        left: 15px;
        width: 28px;
        height: 28px;
    }

    .mobile-chat-list-icon .el-icon {
        font-size: 14px;
    }

    .chat-history-mobile {
        width: 260px;
    }

    .chat-content {
        padding: 60px 15px;
    }

    .chat-header {
        padding: 6px 15px;
    }

    .chat-input {
        padding: 10px 15px;
    }

    .message {
        max-width: 90%;
        font-size: 12px;
        padding: 10px 14px;
    }

    .assistant-avatar {
        width: 24px;
        height: 24px;
    }

    .assistant-name {
        font-size: 13px;
    }

    .header-actions .el-button {
        padding: 4px 8px;
        font-size: 11px;
    }
}

:deep(.el-menu-item span) {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}
</style>