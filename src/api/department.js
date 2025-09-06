import { get } from '@/utils/http';

// 获取部门列表
export const getDepartments = (tenantId) => {
  const params = {};
  if (tenantId) {
    params.tenantId = tenantId;
  }
  return get('/departments', params);
};
