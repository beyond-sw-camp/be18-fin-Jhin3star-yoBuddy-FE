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
    meta: { hideHeader: true, hideSidebar: true }
  },

  // --- 사용자 ---
  {
    path: '/dashboard',
    component: () => import('@/pages/user/UserDashboard.vue'),
    meta: { requiresAuth: true, userOnly: true }
  },

  // --- 관리자 ---
  {
    path: '/kpi',
    component: () => import('@/pages/admin/kpi/KPI.vue'),
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
  {
    path: '/admin/mentoring/sessions',
    component: () => import('@/pages/admin/mentoring/AdminMentoringSessionList.vue'),
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/mentoring/sessions/:sessionId',
    component: () => import('@/pages/admin/mentoring/AdminMentoringSessionDetail.vue'),
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/onboarding/programs',
    component: () => import('@/pages/admin/onboarding/OnboardingProgramList.vue'),
    meta: { requiresAuth: true, adminOnly: true }
  },

  // --- 멘토 ---
  {
    path: '/mentor/dashboard',
    component: () => import('@/pages/mentor/MentorDashboard.vue'),
    meta: { requiresAuth: true, mentorOnly: true }
  },
  {
    path: '/mentor/sessions/create',
    name: 'MentoringSessionCreate',
    component: () => import('@/pages/mentor/MentoringSessionCreatePage.vue'),
    meta: { requiresAuth: true, mentorOnly: true }
  },
  {
    path: '/mentor/sessions',
    component: () => import('@/pages/mentor/MentoringSessionListPage.vue'),
    meta: { requiresAuth: true, mentorOnly: true }
  },
  {
    path: '/mentor/sessions/:sessionId',
    name: 'MentorSessionDetail',
    component: () => import('@/pages/mentor/MentorSessionDetailPage.vue'),
    meta: { requiresAuth: true, mentorOnly: true }
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // 1) 새로고침 후 user가 없으면 loadUser()로 복구
  if (!auth.user) {
    await auth.loadUser()

    // 2) user 복구 성공하면 SSE & 알림 불러오기
    if (auth.user) {
      auth.initSSEAndNotifications()
    }
  }

  // 3) 인증 필요한 라우트 접근
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  // 4) 권한별 접근 체크
  if (to.meta.adminOnly && !auth.isAdmin) return '/login'
  if (to.meta.mentorOnly && !auth.isMentor) return '/login'
  if (to.meta.userOnly && !auth.isUser) return '/login'
})

export default router
