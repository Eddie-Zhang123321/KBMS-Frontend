
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ROLES } from '@/constants/roles'

const ALL_ROLES = [ROLES.USER, ROLES.KB_ADMIN, ROLES.KB_OWNER, ROLES.SUPER_ADMIN, ROLES.PLATFORM_ADMIN]

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: '/', // 添加默认重定向
        redirect: '/login' // 重定向至 /login
      },
      {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue')
      },
      /* {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/Register.vue')
      } */
    ]
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: '/knowledgelist',
        name: 'KnowledgeList',
        component: () => import('@/views/KnowledgeList.vue'),
        meta: { title: '所有知识库', roles: ALL_ROLES }
      },
      {
        path: '/knowledgebase/:id',
        name: 'KnowledgeBase',
        component: () => import('@/views/KnowledgeBase.vue'),
        meta: { title: '知识库详情', roles: ALL_ROLES }
      },
      {
        path: '/system/users',
        name: 'UsersList',
        component: () => import('@/views/UserList.vue'),
        meta: { title: '用户管理', roles: ALL_ROLES }
      },
      {
        path: '/system/roles',
        name: 'RoleManagement',
        component: () => import('@/views/RoleManagement.vue'),
        meta: { title: '角色权限管理', roles: ALL_ROLES }
      },
      {
        path: '/system/logs',
        name: 'SystemLogs',
        component: () => import('@/views/SystemLogs.vue'),
        meta: { title: '系统日志', roles: ALL_ROLES }
      },
      {
        path: '/system/settings',
        name: 'SystemSettings',
        component: () => import('@/views/SystemSettings.vue'),
        meta: { title: '系统参数', roles: ALL_ROLES }
      },
      {
        path: '/tenant',
        name: 'Tenant',
        component: () => import('@/views/Tenant.vue'),
        meta: { title: '租户管理', roles: ALL_ROLES }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' }
      },
      {
        path:'/system/profile',
        name:'Profile',
        component:()=>import('@/views/Profile.vue'),
        meta:{title:'个人中心'}
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 已登录访问登录页，跳转到首页
  if ((to.path === '/login') && userStore.token) {
    return next('/dashboard')
  }

  // 需要鉴权但未登录
  if (to.meta.requiresAuth && !userStore.token) {
    return next('/login')
  }

  // 登录但用户信息未就绪，拉取
  if (userStore.token && !userStore.user) {
    try {
      await userStore.fetchMe()
    } catch (e) {
      userStore.logout()
      return next('/login')
    }
  }

  // 基于角色的访问控制
  const routeRoles = to.meta?.roles
  if (routeRoles && routeRoles.length > 0) {
    const hasAny = userStore.roles?.some(r => routeRoles.includes(r))
    if (!hasAny) {
      return next('/dashboard')
    }
  }

  // 开发阶段：暂时不做租户强校验（后续恢复可开启 requiresTenant 逻辑）

  next()
})


/* router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token')

  // 需要登录但未登录
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next('/login')
  }
  // 已登录但访问登录页
  else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/dashboard')
  }
  else {
    next()
  }
}) */

export default router