import { useAuthStore } from '@/store/authStore'
import { createRouter, createWebHistory } from 'vue-router'

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
  // --- 교육 관리 ---
  {
    path: '/admin/trainings',
    component: () => import('@/pages/admin/training/TrainingList.vue'),
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/trainings/create',
    component: () => import('@/pages/admin/training/TrainingCreate.vue'),
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/trainings/:id',
    component: () => import('@/pages/admin/training/TrainingDetail.vue'),
    meta: { requiresAuth: true, adminOnly: true }
  },

    // --- 사용자(뉴비) 기능 ---
    {
      path: '/user/trainings',
      component: () => import('@/pages/user/training/UserTrainingList.vue'),
      meta: { requiresAuth: true, userOnly: true }
    },
    {
      path: '/user/trainings/:id',
      component: () => import('@/pages/user/training/UserTrainingDetail.vue'),
      meta: { requiresAuth: true, userOnly: true }
    },
    {
      path: '/admin/trainings/:id/edit',
      component: () => import('@/pages/admin/training/TrainingEdit.vue'),
      meta: { requiresAuth: true, userOnly: true }
    },

  // --- 멘토 기능 ---
  {
    path: '/mentor/dashboard',
    component: () => import('@/pages/mentor/MentorDashboard.vue'),
    meta: { requiresAuth: true, mentorOnly: true }
  },
  {
  path: '/mentor/sessions/create',
  name: 'MentoringSessionCreate',
  component: () => import('@/pages/mentor/MentoringSessionCreatePage.vue')
  },
    {
    path: '/mentor/sessions',
    component: () => import('@/pages/mentor/MentoringSessionListPage.vue'),
    meta: { requiresAuth: true, mentorOnly: true }
  },
  {
  path: "/mentor/sessions/:sessionId",
  name: "MentorSessionDetail",
  component: () =>
    import("@/pages/mentor/MentorSessionDetailPage.vue")
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

  const redirectForRole = () => {
    if (auth.isAdmin) return '/admin/trainings'
    if (auth.isMentor) return '/mentor/dashboard'
    if (auth.isUser) return '/user/trainings'
    return null
  }

  // if already logged in and user info is available, keep them off public home/login and send to role home
  if ((to.path === '/' || to.path === '/login') && auth.isAuthenticated && auth.user) {
    const dest = redirectForRole()
    if (dest && dest !== to.path) return dest
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.adminOnly && !auth.isAdmin) return '/login'
  if (to.meta.mentorOnly && !auth.isMentor) return '/login'
})

export default router
