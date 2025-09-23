import { get, post, put, del } from '@/utils/http';
// 获取工单通知列表（HTTP接口用于初始加载全部通知）
// 请求: GET /ticket/notifications
// Headers: Authorization: Bearer {token}
// 成功响应:
// {
//   "code": 0,
//   "message": "string",
//   "data": [
//     {
//       "id": 0, // 工单id
//       "knowledgeBaseName": "string", // 知识库名称
//       "userName": "string", // 用户名
//       "feedbackType": "string", // 工单类型：accuracy, relevance, completeness, clarity
//       "createdAt": "string", // 创建时间
//       "type": "string" // 消息类型：NEW, PROCESSED
//     }
//   ]
// }
export const getTicketNotifications = () => {
    return get('/ticket/notifications');
};


// 创建工单
export const createTicket = (params = {}) => {
    return post('/ticket/create', params);
};