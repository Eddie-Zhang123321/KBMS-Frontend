import component from 'element-plus/es/components/tree-select/src/tree-select-option.mjs'
import { createRouter, createWebHistory } from 'vue-router'

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
        meta: { title: '知识库' }
      },
      {
        path:'/system/users',
        name:'UsersList',
        component:()=>import('@/views/UserList.vue'),
      },
      {
        path:'/tenant',
        name:'Tenant',
        component:()=>import('@/views/Tenant.vue'),
        meta:{title:'租户管理'}
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
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