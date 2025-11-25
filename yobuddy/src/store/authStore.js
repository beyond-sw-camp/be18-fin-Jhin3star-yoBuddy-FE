import { defineStore } from 'pinia'
import http from '@/services/http'
import { useNotificationStore } from '@/store/notificationStore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role?.trim().toUpperCase() === 'ADMIN',
    isMentor: (state) => state.user?.role?.trim().toUpperCase() === 'MENTOR',
    isUser: (state) => state.user?.role?.trim().toUpperCase() === 'USER'
  },

  actions: {
    async login(email, password) {
      await http.post('/api/v1/auth/login', { email, password })
      await new Promise(resolve => setTimeout(resolve, 50))
      await this.fetchMe()

      // 로그인 직후 SSE 시작
      this.initSSEAndNotifications()
    },

    async fetchMe() {
      try {
        const resp = await http.get('/api/v1/account/me')
        this.user = resp.data
      } catch (e) {
        console.error('fetchMe failed:', e)
        this.user = null
      }
    },

    async loadUser() {
      if (!this.user) {
        await this.fetchMe()
      }
    },

    async logout() {
      try {
        await http.post('/api/v1/auth/logout')
      } catch (e) {
        console.error('Logout failed', e)
      }

      this.user = null

      // SSE & 알림 정리
      this.closeSSEAndNotifications()

      window.location.href = '/login'
    },

    /** 알림 초기 로드 + SSE 연결 */
    initSSEAndNotifications() {
      if (!this.user) return

      const notificationStore = useNotificationStore()

      notificationStore.fetchNotifications()
      notificationStore.connectSSE()
    },

    /** SSE 닫고 store 비움 */
    closeSSEAndNotifications() {
      const notificationStore = useNotificationStore()
      notificationStore.disconnectSSE()
      notificationStore.$reset() // 더 깔끔한 초기화
    }
  }
})