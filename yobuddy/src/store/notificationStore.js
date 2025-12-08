import { defineStore } from 'pinia'
import http from '@/services/http'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    es: null
  }),

  getters: {
    latest: (state) => state.notifications[0] || null,
    hasUnread: (state) => state.unreadCount > 0
  },

  actions: {
    /** 1) 기존 알림 목록 GET */
    async fetchNotifications() {
      try {
        const res = await http.get('/api/v1/notifications')

        this.notifications = res.data.map(n => ({
          ...n,
          read: n.isRead
        }))

        this.unreadCount = this.notifications.filter(n => !n.read).length

        console.log(`🔔 초기 알림 ${this.notifications.length}개 로드`)
      } catch (err) {
        console.error('❌ 초기 알림 로드 실패:', err)
      }
    },

    /** 2) SSE 연결 */
    connectSSE() {
      if (this.es) {
        console.log('⚠ SSE 이미 연결됨 — 중복 연결 방지')
        return
      }

      const base = http.defaults.baseURL.replace(/\/$/, '')
      const url = `${base}/api/v1/notifications/stream`

      this.es = new EventSource(url, { withCredentials: true })

      const eventTypes = ['task', 'mentoring', 'kpi', 'system', 'form']

      eventTypes.forEach(type => {
        this.es.addEventListener(type, e => {
          try {
            const data = JSON.parse(e.data)
            console.log(`🔔 SSE(${type}) 수신:`, data)

            this.notifications.unshift({
              ...data,
              read: false
            })
            this.unreadCount++
          } catch (err) {
            console.error(`❌ SSE(${type}) 파싱 오류:`, err)
          }
        })
      })

      this.es.onerror = (err) => {
        console.error('❌ SSE 오류 발생:', err)
      }

      console.log('🌐 SSE 연결 완료')
    },

    /** 3) SSE 종료 */
    disconnectSSE() {
      if (this.es) {
        this.es.close()
        this.es = null
        console.log('🔌 SSE 연결 해제됨')
      }
    },

    /** 4) 알림 읽음 처리 */
    async markNotificationAsRead(notificationId) {
      try {
        await http.patch(`/api/v1/notifications/${notificationId}/read`)

        const idx = this.notifications.findIndex(n => n.id === notificationId)
        if (idx !== -1 && !this.notifications[idx].read) {
          this.notifications[idx].read = true
          this.unreadCount = Math.max(this.unreadCount - 1, 0)
        }

        console.log(`✔ 알림 ${notificationId} 읽음 처리됨`)
      } catch (err) {
        console.error(`❌ 알림 읽음 처리 실패 (${notificationId}):`, err)
      }
    },

    /** 5) 알림 삭제 */
    async deleteNotification(notificationId) {
      try {
        await http.delete(`/api/v1/notifications/${notificationId}`)

        const idx = this.notifications.findIndex(n => n.id === notificationId)
        if (idx !== -1) {
          const wasUnread = !this.notifications[idx].read
          this.notifications.splice(idx, 1)

          if (wasUnread) this.unreadCount = Math.max(this.unreadCount - 1, 0)
        }

        console.log(`🗑 알림 ${notificationId} 삭제됨`)
      } catch (err) {
        console.error(`❌ 알림 삭제 실패 (${notificationId}):`, err)
      }
    }
  }
})
