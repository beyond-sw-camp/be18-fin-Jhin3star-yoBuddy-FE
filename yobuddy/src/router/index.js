import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/authStore'

const routes = [
  {
    path: '/login',
    component: () => import('@/pages/common/LoginPage.vue'),
    meta: { hideHeader: true, hideSidebar: true }
  },
  {
    path: '/',
    component: () => import('@/pages/common/Home.vue'),
    meta: { requiresAuth: true }
  },

  // --- 관리자 기능 ---
    {
    path: '/kpi',
    component: () => import('@/pages/admin/kpi/KPI.vue'),
    meta: { requiresAuth: true, adminOnly: true }
  },
    {
      path: '/kpi/kpisetting',
      component: () => import('@/pages/admin/kpi/KpiEdit.vue'),
      meta: { requiresAuth: true, adminOnly: true }
    },
  {
    path: '/organization/usermanagement',
    component: () => import('@/pages/admin/organization/User/UserManagement.vue'),
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/organization/department',
    component: () => import('@/pages/admin/organization/department/DepartmentView.vue'),
    meta: { requiresAuth: true, adminOnly: true }
  },

  // --- 멘토 기능 ---
  {
    path: '/mentor/dashboard',
    component: () => import('@/pages/mentor/MentorDashboard.vue'),
    meta: { requiresAuth: true, mentorOnly: true }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.user && auth.accessToken) {
    await auth.loadUser()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.adminOnly && !auth.isAdmin) return '/login'
  if (to.meta.mentorOnly && !auth.isMentor) return '/login'
})

export default router
