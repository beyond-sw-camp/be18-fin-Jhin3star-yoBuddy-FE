import { defineStore } from 'pinia'
import http from '@/services/http'
import { useNotificationStore } from '@/store/notificationStore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loadingUser: false,
  }),

  getters: {
    isLoggedIn: state => !!state.user,
    isAdmin: state => state.user?.role === 'ADMIN',
    isMentor: state => state.user?.role === 'MENTOR',
    isUser: state => state.user?.role === 'USER',
  },

  actions: {
    async login(email, password) {
      await http.post('/api/v1/auth/login', { email, password })
      await this.fetchMe()
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

    async logout() {
      try {
        await http.post('/api/v1/auth/logout')
      } catch (err) {
        console.warn('Logout failed:', err)
      }

      this.user = null
      this.closeSSEAndNotifications()
      window.location.href = '/login'
    },

    initSSEAndNotifications() {
      if (!this.user) return
      const ns = useNotificationStore()
      ns.fetchNotifications()
      ns.connectSSE()
    },

    closeSSEAndNotifications() {
      const ns = useNotificationStore()
      ns.disconnectSSE()
      ns.$reset()
    }
  }
})
