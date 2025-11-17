import axios from 'axios'
import auth from './auth'

// BASE URL은 포트까지만
const API_BASE = process.env.VUE_APP_API_BASE

console.log("[HTTP BASE URL] =", API_BASE)

const http = axios.create({
  baseURL: API_BASE
})

// ==================== Request Interceptor ====================
http.interceptors.request.use((config) => {
  const token = auth.getToken()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}, (error) => Promise.reject(error))

// ==================== Refresh Token Logic ====================
let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

// Refresh path (하드코딩)
const REFRESH_PATH = "/api/v1/auth/refresh"

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error

    if (!response) return Promise.reject(error)

    // 401 / 403 이외 에러면 그냥 reject
    if (![401, 403].includes(response.status)) {
      return Promise.reject(error)
    }

    if (config._retry) return Promise.reject(error)
    config._retry = true

    // refresh 요청 자체에서 401 나오면 강제 로그아웃
    if (config.url.includes(REFRESH_PATH)) {
      auth.logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    const refreshToken = auth.getRefreshToken()
    if (!refreshToken) {
      auth.logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      // 최초 1번만 refresh 요청
      if (!isRefreshing) {
        isRefreshing = true

        const refreshResp = await axios.post(API_BASE + REFRESH_PATH, { refreshToken })
        const data = refreshResp.data

        const newAccess = data.accessToken
        const newRefresh = data.refreshToken
        const expiresIn = data.expiresIn

        if (!newAccess) {
          auth.logout()
          window.location.href = '/login'
          return Promise.reject(error)
        }

        auth.setToken({ accessToken: newAccess, refreshToken: newRefresh, expiresIn })
        onRefreshed(newAccess)
      }

      // refresh 끝날 때까지 기다림
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) return reject(error)

          config.headers.Authorization = `Bearer ${token}`
          resolve(http(config))
        })
      })
    } catch (e) {
      auth.logout()
      window.location.href = '/auth/login'
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export default http
