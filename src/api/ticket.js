import { get, post, put, del } from '@/utils/http';

export const createTicket = (params = {}) => {
    return post('/ticket/create', params);
};