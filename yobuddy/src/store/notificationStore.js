import { defineStore } from 'pinia'
import http from '@/services/http'
import { EventSourcePolyfill } from 'event-source-polyfill';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    es: null,
  }),

  getters: {
    latest: (state) => state.notifications[0] || null,
    hasUnread: (state) => state.unreadCount > 0,
  },

  actions: {
    async fetchNotifications() {
      try {
        const res = await http.get('/api/v1/notifications')
        this.notifications = res.data.map(n => ({ ...n, read: n.isRead }))
        this.unreadCount = this.notifications.filter(n => !n.read).length
      } catch (err) {
        console.error('❌ 초기 알림 로드 실패:', err)
      }
    },

    connectSSE() {
      if (this.es) return

      // baseURL may be undefined (e.g., during tests or unusual http wrapper configs)
      let base = null
      try {
        if (http && http.defaults && http.defaults.baseURL) {
          base = String(http.defaults.baseURL)
        }
      } catch (e) {
        base = null
      }

      if (!base) {
        // fallback to current origin
        base = window && window.location && window.location.origin ? window.location.origin : ''
      }

      base = base.replace(/\/$/, "")
      const url = base ? `${base}/api/v1/notifications/stream` : `/api/v1/notifications/stream`

      console.log("🔗 SSE 연결 URL:", url)

      try {
        this.es = new EventSourcePolyfill(url, { withCredentials: true })
      } catch (e) {
        console.error("❌ SSE 생성 실패:", e)
        return
      }

      const eventTypes = ["task", "mentoring", "kpi", "system", "form"]

      eventTypes.forEach((type) => {
        this.es.addEventListener(type, (e) => {
          try {
            const data = JSON.parse(e.data)

            this.notifications.unshift({ ...data, read: false })
            this.unreadCount++
          } catch (err) {
            console.error(`❌ SSE(${type}) JSON 파싱 오류:`, err)
          }
        })
      })

      this.es.onerror = (err) => {
        console.error("❌ SSE 오류 발생:", err)
      }

      console.log("🌐 SSE 연결 완료")
    },

    disconnectSSE() {
      if (this.es) {
        this.es.close()
        this.es = null
        console.log("🔌 SSE 연결 해제됨")
      }
    },

    async markNotificationAsRead(notificationId) {
      try {
        await http.patch(`/api/v1/notifications/${notificationId}/read`)
        const idx = this.notifications.findIndex(n => n.id === notificationId)

        if (idx !== -1 && !this.notifications[idx].read) {
          this.notifications[idx].read = true
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch (err) {
        console.error(`❌ 알림 읽음 처리 실패:`, err)
      }
    },

    async deleteNotification(notificationId) {
      try {
        await http.delete(`/api/v1/notifications/${notificationId}`)

        const idx = this.notifications.findIndex(n => n.id === notificationId)
        if (idx !== -1) {
          const wasUnread = !this.notifications[idx].read
          this.notifications.splice(idx, 1)
          if (wasUnread) this.unreadCount--
        }
      } catch (err) {
        console.error("❌ 알림 삭제 실패:", err)
      }
    },
  },
})
