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
                <el-button type="primary" link @click="openNewChatDialog" class="new-chat-button">+ 新建</el-button>
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
            <div class="chat-content" ref="chatContentRef">
                <div v-for="message in messages" :key="message.id" class="message-wrapper"
                    :class="{ 'user-wrapper': message.isUser }"
                    :data-message-id="message.id"
                >
                    
                    <!-- 用户消息：纯文本 -->
                    <div v-if="message.isUser" class="message user-message">
                        {{ message.text }}
                    </div>
                    
                    <!-- AI 消息：支持 Markdown 渲染 -->
                    <div 
                        v-else 
                        class="message ai-message markdown-body" 
                        v-html="renderMarkdown(message.text, message.id)"
                    ></div>

                <div v-if="!message.isUser && message.sources && message.sources.length" class="sources-box"
                    :data-message-id="message.id"
                >
                    <!-- 使用 v-model 控制展开状态 -->
                    <el-collapse v-model="activeCollapseItems[message.id]">
                        <el-collapse-item v-for="(src, i) in getSortedSources(message.sources)" :key="i"
                            :name="`${i}`"
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
                    <div v-else-if="!message.isUser" class="sources-box" :data-message-id="message.id">
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
        
        <!-- 在设置对话框和工单对话框之后添加 -->
        <!-- 新建会话对话框 -->
        <el-dialog v-model="showNewChatDialog" title="新建会话" width="400px">
        <el-form :model="newChatForm" label-width="80px">
            <el-form-item label="会话标题" prop="title">
            <el-input 
                v-model="newChatForm.title" 
                placeholder="请输入会话标题" 
                maxlength="50"
                show-word-limit
            />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
            <el-button @click="showNewChatDialog = false">取消</el-button>
            <el-button type="primary" @click="createNewChat">确定</el-button>
            </span>
        </template>
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
import { ref, onMounted, onUnmounted, reactive, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { debounce } from 'lodash';
import { getChatList, getChatDetail, createChat, sendChatMessage, updateChatMessages, deleteChat } from '@/api/chat';
import { createTicket } from '@/api/ticket';
import ChatSetting from '@/components/dialogs/ChatSetting.vue';
import { useRoute } from 'vue-router';
import { marked } from 'marked';
import mermaid from 'mermaid';

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
const chatContentRef = ref(null);

// 新增：用于控制每个消息的 collapse 展开状态
const activeCollapseItems = ref({});

const newChatForm = reactive({
  title: ''
});
const showNewChatDialog=ref(false);
const openNewChatDialog=()=>{
    showNewChatDialog.value=true;
}
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

// 添加一个 ref 来跟踪当前展开的来源
const activeSourceIndex = ref(null);

// 初始化 Mermaid
mermaid.initialize({ 
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    curve: 'basis',
    padding: 15
  }
});

// Markdown 渲染函数（修改版）
const renderMarkdown = (text, messageId) => {
  if (!text) return '';
  
  try {
    // 自定义渲染器：将 Mermaid 代码块转换为 .mermaid 元素
    const renderer = new marked.Renderer();
    const originalCode = renderer.code.bind(renderer);
    
    renderer.code = function(token) {
      // marked v16+ 使用 token 对象
      const code = token.text;
      const language = token.lang;
      
      if (language === 'mermaid') {
        // 创建一个带 .mermaid 类的 div，内容是原始 Mermaid 代码
        return `<div class="mermaid">${code}</div>`;
      }
      return originalCode(token);
    };
    
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false,
      renderer: renderer
    });
    
    let html = marked.parse(text);
    
    // 将 [n] 引用转换为可点击的链接（使用 data 属性，不使用 onclick）
    html = html.replace(/\[(\d+)\]/g, (match, num) => {
      return `<span class="citation-link" data-citation="${num}" data-message-id="${messageId}">${match}</span>`;
    });
    
    // Mermaid 渲染已移到流式输出结束后统一处理，避免渲染不完整的代码
    
    return html;
  } catch (error) {
    console.error('Markdown 渲染错误:', error);
    return text;
  }
};

// 引用点击处理函数（带重试机制）
const handleCitationClick = (citationNum, messageId, retryCount = 0) => {
  const maxRetries = 5; // 最多重试5次
  
  // 使用 nextTick 确保获取最新的响应式数据
  nextTick(() => {
    // 找到对应的消息（同时尝试字符串和数字匹配）
    let message = messages.value.find(m => m.id == messageId || m.id === String(messageId) || String(m.id) === String(messageId));
    
    if (!message) {
      if (retryCount < maxRetries) {
        // 可能消息还没有添加到列表，继续重试
        setTimeout(() => handleCitationClick(citationNum, messageId, retryCount + 1), 800);
      } else {
        ElMessage.warning('未找到对应的消息，请刷新页面重试');
      }
      return;
    }
    
    // 如果找到的是用户消息，尝试查找紧跟其后的AI消息
    if (message.isUser) {
      const messageIndex = messages.value.findIndex(m => m.id === message.id);
      // 查找下一个AI消息
      if (messageIndex >= 0 && messageIndex < messages.value.length - 1) {
        const nextMessage = messages.value[messageIndex + 1];
        if (!nextMessage.isUser) {
          message = nextMessage;
        }
      }
    }
    
    // 如果来源为空，检查是否还在加载中或需要重试
    if (!message.sources || message.sources.length === 0) {
      // 如果还在重试次数内，继续重试（不管 isSending 状态）
      if (retryCount < maxRetries) {
        if (retryCount === 0) {
          ElMessage.info('来源信息正在加载中，请稍候...');
        }
        const retryDelay = 800 + retryCount * 400;
        setTimeout(() => {
          handleCitationClick(citationNum, messageId, retryCount + 1);
        }, retryDelay);
        return;
      }
      
      // 重试次数用完，显示错误
      ElMessage.warning('来源信息加载超时，请稍后手动刷新页面重试');
      return;
    }
    
    // 获取排序后的 sources，并找到对应的来源索引（rank 匹配 citationNum）
    const sortedSources = getSortedSources(message.sources);
    const sourceIndex = sortedSources.findIndex(src => src.rank == citationNum);
    if (sourceIndex === -1) {
      ElMessage.warning(`未找到引用 [${citationNum}] 对应的来源`);
      return;
    }
    
    // 执行实际的引用跳转逻辑
    performCitationScroll(sourceIndex, messageId);
  });
};

// 将滚动逻辑提取为单独的函数
const performCitationScroll = (sourceIndex, messageId) => {
  // 初始化该消息的 collapse 状态（如果不存在）
  if (!activeCollapseItems.value[messageId]) {
    activeCollapseItems.value[messageId] = [];
  }
  
  // 确保目标项被展开
  const collapseKey = `${sourceIndex}`;
  if (!activeCollapseItems.value[messageId].includes(collapseKey)) {
    activeCollapseItems.value[messageId].push(collapseKey);
  }
  
  // 等待 DOM 更新后滚动
  nextTick(() => {
    setTimeout(() => {
      // 找到来源容器
      const sourcesBox = document.querySelector(`[data-message-id="${messageId}"].sources-box`);
      if (sourcesBox) {
        // 先滚动到来源区域
        sourcesBox.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
        
        // 再等待一下，找到具体的 collapse item
        setTimeout(() => {
          const collapseItems = sourcesBox.querySelectorAll('.el-collapse-item');
          if (collapseItems[sourceIndex]) {
            const targetItem = collapseItems[sourceIndex];
            
            // 添加高亮效果
            targetItem.classList.add('citation-highlight');
            setTimeout(() => {
              targetItem.classList.remove('citation-highlight');
            }, 2000);
            
            // 滚动到该项
            targetItem.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 400);
      }
    }, 100);
  });
};

// 使用事件委托处理引用点击
const handleContentClick = (event) => {
  const target = event.target;
  
  // 检查是否点击了引用链接
  if (target.classList.contains('citation-link')) {
    const citationNum = target.getAttribute('data-citation');
    const messageId = target.getAttribute('data-message-id');
    
    if (citationNum && messageId) {
      handleCitationClick(citationNum, messageId);
    }
  }
};

// 对来源按 rank 排序
const getSortedSources = (sources) => {
    if (!sources || !Array.isArray(sources)) return [];
    // 按 rank 升序排序
    return [...sources].sort((a, b) => (a.rank || 0) - (b.rank || 0));
};

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
const scrollToBottom = () => {
  setTimeout(() => {
    const chatContent = chatContentRef.value;
    if (chatContent) {
      chatContent.scrollTop = chatContent.scrollHeight;
    }
  }, 100);
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
    
    // 确保每条消息都有 sources 字段（初始化为空数组）
    messages.value = (detail.messages || []).map(m => ({
      ...m,
      sources: Array.isArray(m.sources) ? m.sources : []
    }));
    
    updateMessagesInHistory(chatId, messages.value);
    
    // 等待 DOM 更新后渲染所有历史消息中的 Mermaid 图表
    setTimeout(async () => {
      await nextTick();
      const mermaidBlocks = document.querySelectorAll('.mermaid:not([data-processed="true"])');
      
      if (mermaidBlocks.length > 0) {
        try {
          await mermaid.run({ nodes: Array.from(mermaidBlocks) });
          // 标记已处理
          mermaidBlocks.forEach(block => {
            block.setAttribute('data-processed', 'true');
          });
        } catch (error) {
          console.error('Mermaid 渲染错误:', error);
        }
      }
    }, 500);
    
    // 滚动到底部
    scrollToBottom();
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
        
        // 创建 AI 消息对象
        const aiMsg = reactive({ 
            id: Date.now().toString(), 
            text: '', 
            isUser: false, 
            sources: [] 
        });
        
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

        eventSource.value.onmessage = (e) => {
            const d = JSON.parse(e.data || '{}');

            if (d.type === 'token') {
                aiMsg.text += d.content || ''; // 流式更新文本
                scrollToBottom(); // 自动滚动
            } else if (d.type === 'source') {
                const sourceData = d.data;
                if (sourceData?.rank && sourceData?.snippet) {
                    tempSources.value.push(sourceData);
                }
            } else if (d.type === 'meta') {
                // Meta 事件处理
            } else if (d.type === 'result') {
                // ✅ 使用后端重新映射后的文本（修正引用编号）
                if (d?.data?.answer) {
                    // 只在文本真正改变时才替换，并添加平滑过渡
                    if (d.data.answer !== aiMsg.text) {
                        // 添加淡出效果和优化提示
                        const messageElement = document.querySelector(`[data-message-id="${aiMsg.id}"] .markdown-body`);
                        if (messageElement) {
                            // 淡出当前内容
                            messageElement.style.opacity = '0.4';
                            messageElement.style.transition = 'opacity 0.15s ease-in-out';
                            
                            // 添加"优化中"提示
                            const originalPosition = messageElement.style.position;
                            messageElement.style.position = 'relative';
                            const optimizingTip = document.createElement('div');
                            optimizingTip.textContent = '✨ 正在优化引用格式...';
                            optimizingTip.style.cssText = `
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                background: rgba(33, 150, 243, 0.9);
                                color: white;
                                padding: 6px 12px;
                                border-radius: 6px;
                                font-size: 12px;
                                white-space: nowrap;
                                z-index: 10;
                                opacity: 0;
                                transition: opacity 0.15s ease-in-out;
                            `;
                            messageElement.appendChild(optimizingTip);
                            
                            // 显示提示
                            setTimeout(() => {
                                optimizingTip.style.opacity = '1';
                            }, 50);
                            
                            // 等待150ms后更新内容并淡入
                            setTimeout(() => {
                                aiMsg.text = d.data.answer;
                                nextTick(() => {
                                    // 淡入新内容
                                    messageElement.style.opacity = '1';
                                    // 移除提示
                                    setTimeout(() => {
                                        optimizingTip.style.opacity = '0';
                                        setTimeout(() => {
                                            // 检查元素是否还在 DOM 中
                                            if (optimizingTip.parentNode === messageElement) {
                                                messageElement.removeChild(optimizingTip);
                                            }
                                            messageElement.style.position = originalPosition;
                                        }, 150);
                                    }, 100);
                                });
                            }, 250);
                        } else {
                            // 如果找不到元素，直接更新
                            aiMsg.text = d.data.answer;
                        }
                    }
                }
                
                if (d?.data?.sources) {
                    // 只过滤掉没有 rank 的项，保留所有有 rank 的来源（即使 snippet 为空）
                    const filteredSources = d.data.sources.filter(src => src.rank);
                    
                    // 为缺失 snippet 的来源添加占位符
                    filteredSources.forEach(src => {
                        if (!src.snippet) {
                            src.snippet = '[来源片段缺失]';
                        }
                    });
                    
                    aiMsg.sources = filteredSources;
                    tempSources.value = [];
                }
            } else if (d.type === 'end') {
                // 延迟关闭连接以确保 source 事件被处理
                setTimeout(() => {
                    eventSource.value.close();
                    eventSource.value = null;
                    isSending.value = false;
                    
                    if (!aiMsg.text) aiMsg.text = '[无响应内容]';
                    
                    // 确保 sources 属性存在
                    if (!aiMsg.sources) {
                        aiMsg.sources = [];
                    }
                    
                    if (!aiMsg.sources.length && tempSources.value.length > 0) {
                        aiMsg.sources = [...tempSources.value.filter(src => src.rank && src.snippet)];
                    }
                    
                    updateMessagesInHistory(activeChat.value, messages.value);
                    
                    // 在流式输出结束后渲染 Mermaid 图表
                    setTimeout(async () => {
                        await nextTick();
                        const mermaidBlocks = chatContentRef.value?.querySelectorAll('.mermaid:not([data-processed="true"])') || [];
                        
                        if (mermaidBlocks.length > 0) {
                            try {
                                await mermaid.run({ nodes: Array.from(mermaidBlocks) });
                                mermaidBlocks.forEach(block => {
                                    block.setAttribute('data-processed', 'true');
                                });
                            } catch (error) {
                                console.error('Mermaid 渲染错误:', error);
                            }
                        }
                    }, 500);
                    
                    // 再次滚动到底部
                    scrollToBottom();
                }, 2000); // 延迟 2 秒关闭连接
            }
        };

        eventSource.value.onerror = () => {
            eventSource.value.close();
            eventSource.value = null;
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(trySendMessage, 1000 * retryCount);
            } else {
                ElMessage.error('连接失败，请稍后重试');
                isSending.value = false;
                if (!aiMsg.text) aiMsg.text = '[连接失败]';
                if (!aiMsg.sources) aiMsg.sources = [];
            }
        };
    } catch (error) {
        console.error('API错误:', error);
        ElMessage.error('请求失败，请检查网络');
        isSending.value = false;
        if (!aiMsg.text) aiMsg.text = '[请求失败]';
        if (!aiMsg.sources) aiMsg.sources = [];
    }
};


        await trySendMessage();
    }
}, 500);

// 创建新对话
const createNewChat = async () => {
  if (!newChatForm.title.trim()) {
    ElMessage.warning('请输入会话标题');
    return;
  }
  
  try {
    const res = await createChat({ title: newChatForm.title.trim() });
    const newChat = {
      id: String(res.chat_id),
      title: res.title || newChatForm.title.trim(),
      messages: []
    };
    chatHistory.value.push(newChat);
    activeChat.value = newChat.id;
    messages.value = [];
    showNewChatDialog.value = false;
    
    ElMessage.success('会话创建成功');
  } catch (error) {
    console.error('创建对话错误:', error);
    ElMessage.error('创建新对话失败');
  }
};

// 初始化加载对话列表
onMounted(async () => {
   
  checkScreenSize();
  window.addEventListener('resize', handleResize);
  
  // 添加事件委托监听器
  if (chatContentRef.value) {
    chatContentRef.value.addEventListener('click', handleContentClick);
  }
  
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
    
    // 滚动到底部
    scrollToBottom();
  } catch (error) {
    console.error('获取对话列表错误:', error);
    ElMessage.error('加载对话列表失败');
  }
});

onUnmounted(() => {
    // 移除事件监听器
    if (chatContentRef.value) {
      chatContentRef.value.removeEventListener('click', handleContentClick);
    }
    
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
    /* "对话列表"和"新建"按钮两端对齐 */
    align-items: center;
}

.new-chat-button {
    margin-left: auto;
    /* 确保"新建"按钮靠右 */
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

/* Markdown 内容样式 */
.markdown-body {
    max-width: 80%;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    padding: 16px 20px;
    border-radius: 12px;
    line-height: 1.8;
    font-size: 14px;
    box-sizing: border-box;
    transition: opacity 0.2s ease-in-out;
}

.markdown-body :deep(h2) {
    font-size: 18px;
    font-weight: 600;
    color: #2196f3;
    margin: 24px 0 14px 0;
    padding: 0 0 10px 12px;
    border-left: 4px solid #2196f3;
    border-bottom: 1px solid #e3f2fd;
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(to right, #e3f2fd 0%, transparent 100%);
}

.markdown-body :deep(h2)::before {
    content: '📋';
    font-size: 16px;
}

.markdown-body :deep(h3) {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 18px 0 10px 0;
    padding-left: 8px;
    border-left: 3px solid #64b5f6;
}

.markdown-body :deep(h3)::before {
    content: '▸';
    color: #64b5f6;
    margin-right: 6px;
    font-weight: bold;
}

.markdown-body :deep(h4) {
    font-size: 14px;
    font-weight: 600;
    color: #555;
    margin: 14px 0 8px 0;
    padding-left: 6px;
}

.markdown-body :deep(h4)::before {
    content: '•';
    color: #90caf9;
    margin-right: 6px;
}

.markdown-body :deep(p) {
    margin: 8px 0;
    line-height: 1.7;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
    margin: 12px 0;
    padding-left: 28px;
}

.markdown-body :deep(li) {
    margin: 8px 0;
    line-height: 1.7;
    position: relative;
}

/* 无序列表项前的图标 */
.markdown-body :deep(ul > li)::marker {
    color: #2196f3;
    font-weight: bold;
}

/* 有序列表项前的数字 */
.markdown-body :deep(ol > li)::marker {
    color: #2196f3;
    font-weight: 600;
}

/* 嵌套列表 */
.markdown-body :deep(li > ul),
.markdown-body :deep(li > ol) {
    margin-top: 6px;
}

.markdown-body :deep(strong) {
    color: #1976d2;
    font-weight: 600;
}

.markdown-body :deep(code) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 13px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.markdown-body :deep(pre) {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: #fff;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    position: relative;
}

.markdown-body :deep(pre)::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 30px;
    background: rgba(255,255,255,0.05);
    border-radius: 8px 8px 0 0;
}

.markdown-body :deep(pre code) {
    background: transparent;
    padding: 0;
    color: #aed581;
    box-shadow: none;
}

.markdown-body :deep(hr) {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 16px 0;
}

.markdown-body :deep(blockquote) {
    border-left: 4px solid #2196f3;
    background: linear-gradient(to right, #e3f2fd 0%, #f5f5f5 100%);
    padding: 16px 20px;
    margin: 16px 0;
    color: #555;
    font-style: italic;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
    position: relative;
}

.markdown-body :deep(blockquote)::before {
    content: '"';
    position: absolute;
    left: 8px;
    top: 4px;
    font-size: 36px;
    color: #90caf9;
    opacity: 0.3;
    line-height: 1;
}

/* 表格样式 */
.markdown-body :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.markdown-body :deep(thead) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.markdown-body :deep(th) {
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
}

.markdown-body :deep(td) {
    padding: 10px 16px;
    border-bottom: 1px solid #e0e0e0;
}

.markdown-body :deep(tbody tr) {
    background: white;
    transition: background-color 0.2s ease;
}

.markdown-body :deep(tbody tr:hover) {
    background: #f5f5f5;
}

.markdown-body :deep(tbody tr:nth-child(even)) {
    background: #fafafa;
}

.markdown-body :deep(tbody tr:nth-child(even):hover) {
    background: #f0f0f0;
}

/* 链接样式 */
.markdown-body :deep(a) {
    color: #2196f3;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
}

.markdown-body :deep(a:hover) {
    color: #1976d2;
    border-bottom-color: #1976d2;
}

/* 强调文本的背景高亮 */
.markdown-body :deep(em) {
    font-style: italic;
    color: #d32f2f;
    font-weight: 500;
}

/* Mermaid 流程图样式 */
.markdown-body :deep(.mermaid) {
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin: 16px 0;
    overflow-x: auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.markdown-body :deep(.mermaid svg) {
    max-width: 100%;
    height: auto;
}

.markdown-body :deep(.mermaid-diagram) {
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    margin: 16px 0;
    overflow-x: auto;
    display: flex;
    justify-content: center;
}

.markdown-body :deep(.mermaid-diagram svg) {
    max-width: 100%;
    height: auto;
}

.markdown-body :deep(.mermaid-error) {
    background: #ffebee;
    color: #c62828;
    border: 1px solid #ef5350;
    padding: 12px;
    border-radius: 4px;
}

.markdown-body :deep(.mermaid-error p) {
    margin: 0 0 8px 0;
    font-weight: 600;
}

.markdown-body :deep(.mermaid-error pre) {
    background: #fff;
    color: #333;
    font-size: 12px;
    margin: 0;
}

/* 来源追溯卡片 - 修复溢出问题 */
.sources-box {
    margin-top: 4px;
    max-width: 80%;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 13px;
    word-break: break-word;
    overflow: hidden; /* 新增：防止内容溢出 */
    box-sizing: border-box; /* 新增：确保边框计入宽度 */

    /* 深度选择器严格限定作用范围 */
    :deep(.el-collapse) {
        /* 新增：确保 collapse 不溢出 */
        width: 100%;
        overflow: hidden;
    }

    :deep(.el-collapse-item) {
        /* 新增：限制每个 item 的宽度 */
        max-width: 100%;
        overflow: hidden;

        /* 确保标题保持单行显示 */
        .el-collapse-item__header {
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%; /* 确保标题不溢出 */
            font-size: 12px;
            line-height: 1.2;
            padding: 6px 12px;
            background-color: #f0f2f5;
            color: #333;
            border-radius: 4px;
            box-sizing: border-box; /* 新增 */
        }

        .el-collapse-item__header:hover {
            background-color: #e6e8eb;
        }

        /* 确保内容区域正常显示且不溢出 */
        .el-collapse-item__wrap {
            padding: 8px 12px;
            background-color: #f9fafb;
            max-width: 100%; /* 新增：限制宽度 */
            overflow: hidden; /* 新增：防止溢出 */
            box-sizing: border-box; /* 新增 */
        }

        .el-collapse-item__content {
            /* 新增：限制内容宽度 */
            max-width: 100%;
            overflow-x: auto; /* 如果内容太长，允许水平滚动 */
            box-sizing: border-box;
        }
    }
}

.source-detail {
    /* 新增：限制详细信息区域 */
    max-width: 100%;
    overflow: hidden;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

.source-detail p {
    margin: 2px 0;
    color: #555;
    line-height: 1.4;
    word-break: break-word; /* 新增：允许长文本换行 */
    overflow-wrap: break-word; /* 新增：强制长单词换行 */
    max-width: 100%; /* 新增：限制宽度 */
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
        max-width: 95%;  /* 移动端使用更大宽度 */
        font-size: 12px;  /* 稍微减小字体 */
    }

    .source-detail p {
        font-size: 11px;
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

/* 引用链接样式 */
.markdown-body :deep(.citation-link) {
    color: #2196f3;
    font-weight: 600;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s ease;
    display: inline-block;
    cursor: pointer;
    user-select: none;
}

.markdown-body :deep(.citation-link:hover) {
    background-color: #e3f2fd;
    color: #1976d2;
    transform: scale(1.05);
}

.markdown-body :deep(.citation-link:active) {
    background-color: #bbdefb;
    transform: scale(0.98);
}

/* 来源高亮动画 */
.sources-box :deep(.citation-highlight) {
    animation: highlightPulse 0.6s ease-in-out 3;
    border: 2px solid #2196f3 !important;
    border-radius: 8px;
    background-color: #e3f2fd !important;
}

@keyframes highlightPulse {
    0%, 100% {
        box-shadow: 0 0 0 rgba(33, 150, 243, 0);
    }
    50% {
        box-shadow: 0 0 20px rgba(33, 150, 243, 0.5);
    }
}

/* 来源容器添加数据属性标识 */
.message-wrapper[data-message-id] {
    position: relative;
}

/* 优化来源框的 collapse 项样式 */
.sources-box :deep(.el-collapse-item) {
    transition: all 0.3s ease;
}

.sources-box :deep(.el-collapse-item.is-active) {
    background-color: #f5f5f5;
}
</style>