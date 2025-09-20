import { get, post, put, del } from '@/utils/http';

// 获取工单通知列表（只返回未处理的消息，不包含低优先级和已读消息）
// 请求: GET /ticket/notifications
// Headers: Authorization: Bearer {token}
// 成功响应:
// {
//   "code": 200,
//   "message": "获取成功",
//   "data": [
//     {
//       "id": 1,
//       "userName": "张三",
//       "feedbackType": "文档更新",
//       "knowledgeBaseName": "技术文档库",
//       "createdAt": "2024-01-15 14:30:00"
//     }
//   ]
// }
export const getTicketNotifications = () => {
    return get('/ticket/notifications');
};

// 获取工单对应的知识库ID
// 请求: GET /ticket/{id}/knowledge-base
// Headers: Authorization: Bearer {token}
// 成功响应:
// {
//   "code": 200,
//   "message": "获取成功",
//   "data": {
//     "knowledgeBaseId": "kb_001",
//     "knowledgeBaseName": "技术文档库",
//     "ticketId": 1,
//     "feedbackType": "文档更新"
//   }
// }
export const getTicketKnowledgeBase = (ticketId) => {
    return get(`/ticket/${ticketId}/knowledge-base`);
};

// 创建工单
export const createTicket = (params = {}) => {
    return post('/ticket/create', params);
};