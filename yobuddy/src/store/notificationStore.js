import { defineStore } from 'pinia'
import http from '@/services/http'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    es: null,
    connecting: false
  }),

  getters: {
    latest: (state) => state.notifications[0] || null,
    hasUnread: (state) => state.unreadCount > 0,
  },

  actions: {
    /* =========================
     * REST: 기존 알림 조회
     * ========================= */
    async fetchNotifications() {
      const res = await http.get('/api/v1/notifications')

      this.notifications = res.data.map(n => ({
        ...n,
        type: n.type?.toLowerCase(), // 🔑 enum → 소문자
        read: n.isRead,
      }))

      this.unreadCount = this.notifications.filter(n => !n.read).length
    },

    /* =========================
     * SSE 연결
     * ========================= */
    connectSSE() {
  if (this.es || this.connecting) return
  this.connecting = true

  const base = process.env.VUE_APP_API_BASE || ''
  const normalizedBase = base.replace(/\/$/, '')
  const url = `${normalizedBase}/api/v1/notifications/stream`

  const es = new EventSource(url, { withCredentials: true })
  this.es = es

  es.onopen = () => {
    console.log('SSE connected')
    this.connecting = false
  }

  es.addEventListener('notification', (e) => {
    const raw = JSON.parse(e.data)

    this.notifications.unshift({
      ...raw,
      type: raw.type?.toLowerCase(),
      read: false,
    })
    this.unreadCount++
  })

  es.onerror = (e) => {
    console.warn('⚠️ SSE error', e)
    this.es?.close()
    this.es = null
    this.connecting = false
  }
},

    /* =========================
     * SSE 종료
     * ========================= */
    disconnectSSE() {
      if (this.es) {
        this.es.close()
        this.es = null
        this.connecting = false
        console.log('🔌 SSE disconnected')
      }
    },

    /* =========================
     * 알림 읽음 처리
     * ========================= */
    async markNotificationAsRead(id) {
      await http.patch(`/api/v1/notifications/${id}/read`)
      const n = this.notifications.find(n => n.id === id)
      if (n && !n.read) {
        n.read = true
        this.unreadCount--
      }
    },

    /* =========================
     * 알림 삭제
     * ========================= */
    async deleteNotification(id) {
      await http.delete(`/api/v1/notifications/${id}`)
      const idx = this.notifications.findIndex(n => n.id === id)
      if (idx !== -1) {
        if (!this.notifications[idx].read) this.unreadCount--
        this.notifications.splice(idx, 1)
      }
    }
  }
})
