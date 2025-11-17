import axios from 'axios'
import auth from './auth'

// Create an axios instance.
// In development prefer a relative base so the dev-server proxy (vue.config.js) can forward /api requests
const devBase = ''
const prodBase = process.env.VUE_APP_API_BASE || ''
const baseURL = process.env.NODE_ENV === 'development' ? devBase : prodBase

const http = axios.create({ baseURL })

// Attach token automatically if present
http.interceptors.request.use((config) => {
  const token = auth.getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  // Debug: log outgoing request info to help diagnose network issues
  try {
    // don't log bodies to avoid sensitive leaks in production
    if (process.env.NODE_ENV === 'development') {
      console.debug('[http] request]', config.method, config.baseURL + config.url)
      // show whether a token is present (do NOT print token value)
      console.debug('[http] auth token present:', token ? 'yes' : 'no', token ? ('len=' + String(token.length)) : '')
    }
  } catch (e) {
    /* ignore */
  }
  return config
}, (error) => Promise.reject(error))

// Response interceptor: handle 401 by attempting to refresh the access token
let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
  const { response, config } = error
    if (!response) return Promise.reject(error)

    // If not 401 or 403, propagate
    if (response.status !== 401 && response.status !== 403) {
      // Log network-level info for easier debugging
      console.error('[http] response error', {
        url: config && (config.baseURL + config.url),
        status: response.status,
        statusText: response.statusText,
        data: response.data
      })
      return Promise.reject(error)
    }

    // Avoid retrying the same request endlessly
    if (config && config._retry) return Promise.reject(error)
    config._retry = true

    // Avoid attempting refresh for the refresh endpoint itself
    const refreshUrl = process.env.VUE_APP_AUTH_REFRESH || '/api/v1/auth/refresh'
    const requestUrl = config && (config.url || '')
    if (requestUrl && requestUrl.indexOf(refreshUrl) !== -1) {
      // refresh endpoint failed with 401/403 -> force logout
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
      if (!isRefreshing) {
        isRefreshing = true
        const base = process.env.VUE_APP_API_BASE || ''

        // Use plain axios here to avoid invoking this interceptor again
        const refreshResp = await axios.post(base + refreshUrl, { refreshToken })
        const data = refreshResp && refreshResp.data ? refreshResp.data : {}
        const newAccess = data.accessToken || data.token || data.access_token
        const newRefresh = data.refreshToken || data.refresh_token
        const expiresIn = data.expiresIn || data.expires_in

        if (newAccess) {
          auth.setToken({ accessToken: newAccess, refreshToken: newRefresh, expiresIn })
          onRefreshed(auth.getToken())
          } else {
          // refresh did not return a token -> force logout
          auth.logout()
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }

      // Queue the original request until refresh finishes
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) return reject(error)
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
          resolve(http(config))
        })
      })
    } catch (errRefresh) {
      // Refresh failed
      isRefreshing = false
      auth.logout()
      window.location.href = '/login'
      return Promise.reject(errRefresh)
    } finally {
      isRefreshing = false
    }
  }
)

export default http
