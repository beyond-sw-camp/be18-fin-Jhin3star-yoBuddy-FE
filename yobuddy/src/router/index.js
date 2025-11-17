import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/common/Home.vue'),
    meta: { hideHeader: true, hideSidebar: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/common/Login.vue'),
    meta: { hideHeader: true, hideSidebar: true }
  },
  {
    path: '/kpi',
    name: 'KPI',
    component: () => import('../pages/admin/kpi/KPI.vue')
  },
  {
    path: '/organization',
    name: 'Organization',
    component: () => import('../pages/admin/organization/Organization.vue')
  },
  {
    path: '/organization/department',
    name: 'Department',
    component: () => import('../pages/admin/organization/department/DepartmentView.vue')
  },
  {
    path: '/organization/usermanagement',
    name: 'UserManagements',
    component: () => import('../pages/admin/organization/User/UserManagement.vue')
  },
  {
    path: '/organization/usermanagement/:id/edit',
    name: 'UserEdit',
    component: () => import('../pages/admin/organization/User/UserEdit.vue')
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('../pages/Onboarding.vue')
  },
  {
    path: '/mentoring',
    name: 'Mentoring',
    component: () => import('../pages/Mentoring.vue')
  },
  {
    path: '/education',
    name: 'Education',
    component: () => import('../pages/Education.vue')
  },
  {
    path: '/content',
    name: 'Content',
    component: () => import('../pages/Content.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
