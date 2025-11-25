import { defineStore } from 'pinia'
import http from '@/services/http'

const TOKEN_KEY = 'yb_auth_token'
const REFRESH_KEY = 'yb_refresh_token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: sessionStorage.getItem(TOKEN_KEY) || null,
    refreshToken: sessionStorage.getItem(REFRESH_KEY) || null,
    user: null,
  }),

  getters: {
    isAuthenticated: s => !!s.accessToken,
    isMentor: s => s.user?.role === 'MENTOR',
    isAdmin: s => s.user?.role === 'ADMIN',
    isUser: s => s.user?.role === 'USER',
  },

  actions: {
    //-------------------------------------------
    // 로그인
    //-------------------------------------------
    async login(email, password) {
      const resp = await http.post('/api/v1/auth/login', { email, password })
      const headers = resp.headers || {}
      const data = resp.data || {}

      let access = headers['authorization'] || data.accessToken || data.token
      if (access?.startsWith('Bearer ')) access = access.substring(7)

      const refresh = headers['refresh-token'] || data.refreshToken

      if (!access) throw new Error('No access token in response')

      this.setTokens(access, refresh)
      await this.fetchMe()
    },

    //-------------------------------------------
    // 토큰 설정 (refresh 로직 포함)
    //-------------------------------------------
    setTokens(access, refresh) {
      this.accessToken = access
      this.refreshToken = refresh

      sessionStorage.setItem(TOKEN_KEY, access)
      if (refresh) sessionStorage.setItem(REFRESH_KEY, refresh)
    },

    //-------------------------------------------
    // /account/me 조회
    //-------------------------------------------
    async fetchMe() {
      try {
        const resp = await http.get('/api/v1/account/me')
        this.user = resp.data
      } catch (e) {
        // 백엔드 오류나 일시적 실패일 때 즉시 로그아웃하지 않고 사용자만 비웁니다.
        console.error('fetchMe failed', e?.response || e)
        this.user = null
      }
    },

    //-------------------------------------------
    // 새로고침 시 자동 로그인 유지
    //-------------------------------------------
    async loadUser() {
      if (this.accessToken && !this.user) {
        await this.fetchMe()
      }
    },

    //-------------------------------------------
    logout() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null

      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
    },
  }
})
