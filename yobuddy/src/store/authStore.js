import { defineStore } from 'pinia'
import http from '@/services/http'
import { useNotificationStore } from '@/store/notificationStore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loadingUser: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isMentor: (state) => state.user?.role === 'MENTOR',
    isUser: (state) => state.user?.role === 'USER',
  },

  actions: {
    async login(email, password) {
      await http.post('/api/v1/auth/login', { email, password })

      // 사용자 로드
      await this.fetchMe()

      // SSE & 알림 로드
      this.initSSEAndNotifications()
    },

    async fetchMe() {
      try {
        this.loadingUser = true
        const resp = await http.get('/api/v1/account/me')
        this.user = resp.data
      } catch (err) {
        this.user = null
        throw err
      } finally {
        this.loadingUser = false
      }
    },

      initSSEAndNotifications() {
  const noti = useNotificationStore()

  noti.fetchNotifications()

  if (!this.user) return

  if (!noti.es) {
    noti.connectSSE()
  }
},

    async logout() {
      try {
        await http.post('/api/v1/auth/logout')
      } catch (err) {
        console.warn("Logout failed but ignored:", err)
      }

      const ns = useNotificationStore()
      ns.disconnectSSE()
      ns.$reset()

      this.user = null
      window.location.href = '/login'
    },
async loadUser() {
  if (this.user || this.loadingUser) return

  try {
    this.loadingUser = true
    await this.fetchMe()
    this.initSSEAndNotifications()
  } catch (e) {
    console.warn('loadUser failed:', e)
  } finally {
    this.loadingUser = false
  }
},
  },
})
