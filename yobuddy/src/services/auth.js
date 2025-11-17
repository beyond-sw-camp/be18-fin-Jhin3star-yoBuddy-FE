// Auth service: performs real API calls (falls back to mock during development if desired)
import http from './http'

const TOKEN_KEY = 'yb_auth_token'
const REFRESH_KEY = 'yb_refresh_token'
const EXPIRES_KEY = 'yb_token_expires_at' // timestamp (ms since epoch)
const USERID_KEY = 'yb_user_id'
const USERROLE_KEY = 'yb_user_role'
const USERNAME_KEY = 'yb_user_name'

// Set default to the API path used in your curl example. Override with VUE_APP_AUTH_URL if needed.
const DEFAULT_AUTH_PATH = '/api/v1/auth/login'

export default {
  /**
   * Login by posting credentials to the auth endpoint.
   * Uses env VUE_APP_AUTH_URL if provided, otherwise posts to DEFAULT_AUTH_PATH.
   * Returns a promise that resolves to { token }
   */
  async login(email, password) {
    const authUrl = process.env.VUE_APP_AUTH_URL || DEFAULT_AUTH_PATH || '/api/v1/auth/login'

    // Basic client-side validation
    if (!email || !password) {
      return Promise.reject(new Error('Email and password required'))
    }

    try {
      const payload = { email, password }
      // Use the http axios instance so interceptors (auth header, baseURL) are applied
      const resp = await http.post(authUrl, payload)

      // Server responses vary; try common locations for tokens
      const data = resp && resp.data ? resp.data : {}
      const headers = resp && resp.headers ? resp.headers : {}

      // 1. Check Headers (e.g., Authorization: 'Bearer ...')
      let headerToken = headers.authorization || headers.Authorization
      if (headerToken && headerToken.startsWith('Bearer ')) {
        headerToken = headerToken.substring(7)
      }

      // 2. Check Body
      const accessToken = headerToken || data.token || data.accessToken || data.access_token || (data.data && (data.data.token || data.data.accessToken))
      const refreshToken = data.refreshToken || data.refresh_token || (data.data && data.data.refreshToken)
      const expiresIn = data.expiresIn || data.expires_in || data.accessExpiresIn || data.access_expires_in || (data.data && data.data.expiresIn)

      // Try to extract user id / role from common response shapes
      const userId = data.userId || data.user_id || data.id || (data.user && (data.user.id || data.user.userId)) || (data.data && (data.data.userId || data.data.id))
      const role = data.role || (data.user && data.user.role) || (data.data && data.data.role)
      const name = data.name || data.fullName || data.displayName || (data.user && (data.user.name || data.user.fullName || data.user.displayName)) || (data.data && (data.data.name || data.data.fullName || data.data.displayName))

      if (accessToken || refreshToken) {
        const result = { accessToken, refreshToken }
        if (expiresIn) result.expiresIn = expiresIn
        if (userId) result.userId = userId
        if (role) result.role = role
        if (name) result.userName = name
        return result
      }

      // If no token found, return the whole data so caller can inspect message / status
      return data
    } catch (err) {
      // Normalize error to make it easier for callers to show messages
      const serverMsg = err && err.response && err.response.data && err.response.data.message
      const message = serverMsg || err.message || 'Login request failed'
      return Promise.reject(new Error(message))
    }
  },

  setToken(token, options = {}) {
    const persistLocal = options && typeof options.persistLocal !== 'undefined' ? Boolean(options.persistLocal) : true
    // Backwards-compatible: accept string token or object { accessToken, refreshToken, expiresIn }
    if (!token) {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(EXPIRES_KEY)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(EXPIRES_KEY)
      return
    }

    if (typeof token === 'string') {
      // store token in both session and local so both storages have it
      sessionStorage.setItem(TOKEN_KEY, token)
      if (persistLocal) localStorage.setItem(TOKEN_KEY, token)
      return
    }

    const access = token.accessToken || token.token || token.access_token
    const refresh = token.refreshToken || token.refresh_token
    const expiresIn = token.expiresIn || token.expires_in || token.accessExpiresIn || token.access_expires_in

    // Write to sessionStorage always; write to localStorage only when persistLocal is true
    if (access) {
      sessionStorage.setItem(TOKEN_KEY, access)
      if (persistLocal) localStorage.setItem(TOKEN_KEY, access)
    }
    if (refresh) {
      sessionStorage.setItem(REFRESH_KEY, refresh)
      if (persistLocal) localStorage.setItem(REFRESH_KEY, refresh)
    }
    if (expiresIn) {
      const expiryAt = Date.now() + Number(expiresIn)
      sessionStorage.setItem(EXPIRES_KEY, String(expiryAt))
      if (persistLocal) localStorage.setItem(EXPIRES_KEY, String(expiryAt))
    }
    // If the token object contains user info, persist that to both storages as well
    const userId = token.userId || token.user_id || (token.user && (token.user.id || token.user.userId))
    const role = token.role || (token.user && token.user.role)
    const userName = token.userName || token.name || token.fullName || token.displayName || (token.user && (token.user.name || token.user.fullName || token.user.displayName))
    if (userId) {
      sessionStorage.setItem(USERID_KEY, String(userId))
      if (persistLocal) localStorage.setItem(USERID_KEY, String(userId))
    }
    if (role) {
      sessionStorage.setItem(USERROLE_KEY, String(role))
      if (persistLocal) localStorage.setItem(USERROLE_KEY, String(role))
    }
    if (userName) {
      sessionStorage.setItem(USERNAME_KEY, String(userName))
      if (persistLocal) localStorage.setItem(USERNAME_KEY, String(userName))
    }
  },

  getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
  },

  isAuthenticated() {
    return !!(sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY))
  },

  logout() {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(EXPIRES_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    sessionStorage.removeItem(USERID_KEY)
    sessionStorage.removeItem(USERROLE_KEY)
    localStorage.removeItem(USERID_KEY)
    localStorage.removeItem(USERROLE_KEY)
    sessionStorage.removeItem(USERNAME_KEY)
    localStorage.removeItem(USERNAME_KEY)
  },

  getRefreshToken() {
    return sessionStorage.getItem(REFRESH_KEY) || localStorage.getItem(REFRESH_KEY)
  },

  getTokenExpiry() {
    const v = sessionStorage.getItem(EXPIRES_KEY) || localStorage.getItem(EXPIRES_KEY)
    return v ? Number(v) : null
  },

  isAccessTokenExpired() {
    const at = this.getTokenExpiry()
    if (!at) return false
    return Date.now() >= at
  }

,

  getUserId() {
    return sessionStorage.getItem(USERID_KEY) || localStorage.getItem(USERID_KEY)
  },

  getUserName() {
    return sessionStorage.getItem(USERNAME_KEY) || localStorage.getItem(USERNAME_KEY)
  },

  getUserRole() {
    return sessionStorage.getItem(USERROLE_KEY) || localStorage.getItem(USERROLE_KEY)
  },

  getUser() {
    const id = this.getUserId()
    const role = this.getUserRole()
    const name = this.getUserName()
    if (!id && !role) return null
    return { id, role, name }
  }
}
