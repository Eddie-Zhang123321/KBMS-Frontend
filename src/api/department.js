import { get } from '@/utils/http';

// 获取部门列表
export const getDepartments = () => {
  return get('/departments');
};
