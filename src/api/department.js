import { get } from '@/utils/http';

// 获取部门列表
export const getDepartments = () => {
  return get('/departments');  // 假设这里返回一个包含部门信息的数组
};
