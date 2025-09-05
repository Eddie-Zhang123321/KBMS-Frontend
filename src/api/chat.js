import { get, post, put, del } from '@/utils/http';

// 获取对话列表
export const getChatList = (params = {}) => {
    return post('/chat/list', params);
};

// 创建新对话
export const createChat = (data) => {
    return post('/chat/session/create', data);
};

// 获取对话详情
export const getChatDetail = (id) => {
    return get(`/chat/${id}`);
};

// 发送消息并启动流式传输
export const sendChatMessage = (chatId, message) => {
    return post(`/chat/${chatId}/message/stream`, { message });
};

// 更新对话消息
export const updateChatMessages = (chatId, data) => {
    return put(`/chat/${chatId}/messages`, data);
};

// 删除对话
export const deleteChat = (chatId) => {
    return del(`/chat/session/${chatId}`);
};

// 获取对话设置
export const getChatSettings = (chatId) => {
    return get(`/chat/${chatId}/settings`);
};

// 更新对话设置
export const updateChatSettings = (chatId, settings) => {
    return put(`/chat/${chatId}/settings`, settings);
};
