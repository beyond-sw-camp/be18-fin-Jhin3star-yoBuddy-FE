// src/services/http.js
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_BASE = process.env.VUE_APP_API_BASE

const http = axios.create({
  baseURL: API_BASE
})


// ===========================================================
// Request: Authorization 자동 주입
// ===========================================================
http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})


// ===========================================================
// Response: Refresh Token 재발급 처리
// ===========================================================

let isRefreshing = false
let subscribers = []

function subscribe(cb) {
  subscribers.push(cb)
}
function notify(newToken) {
  subscribers.forEach(cb => cb(newToken))
  subscribers = []
}

const REFRESH_PATH = '/api/v1/auth/refresh'

http.interceptors.response.use(
  res => res,
  async (error) => {
    const { response, config } = error
    const auth = useAuthStore()

    if (!response) return Promise.reject(error)

    if (![401, 403].includes(response.status)) {
      return Promise.reject(error)
    }

    if (config._retry) return Promise.reject(error)
    config._retry = true

    if (config.url.includes(REFRESH_PATH)) {
      auth.logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    const refresh = auth.refreshToken
    if (!refresh) {
      auth.logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      if (!isRefreshing) {
        isRefreshing = true

        const refreshResp = await axios.post(API_BASE + REFRESH_PATH, {
          refreshToken: refresh
        })

        const newAccess = refreshResp.data.accessToken
        const newRefresh = refreshResp.data.refreshToken

        auth.setTokens(newAccess, newRefresh)
        notify(newAccess)
      }

      return new Promise((resolve) => {
        subscribe((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`
          resolve(http(config))
        })
      })

    } catch (e) {
      auth.logout()
      window.location.href = '/login'
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export default http
