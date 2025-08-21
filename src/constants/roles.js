// 系统内置角色常量
export const ROLES = {
  USER: 'user', // 普通用户
  KB_ADMIN: 'kb_admin', // 知识库管理员
  KB_OWNER: 'kb_owner', // 知识库所有人
  SUPER_ADMIN: 'super_admin', // 超级管理员（租户级/平台内高权限）
  PLATFORM_ADMIN: 'platform_admin' // 平台管理员（无租户）
}

export const ROLE_LABELS = {
  [ROLES.USER]: '普通用户',
  [ROLES.KB_ADMIN]: '知识库管理员',
  [ROLES.KB_OWNER]: '知识库所有人',
  [ROLES.SUPER_ADMIN]: '超级管理员',
  [ROLES.PLATFORM_ADMIN]: '平台管理员'
}


