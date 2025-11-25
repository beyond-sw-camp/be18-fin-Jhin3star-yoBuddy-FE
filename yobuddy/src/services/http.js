// src/services/http.js
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'

// default to localhost:8080 if VUE_APP_API_BASE is not provided
const API_BASE = process.env.VUE_APP_API_BASE || 'http://192.168.0.63:8080'


const http = axios.create({
  baseURL: API_BASE
})

const API_BASE = process.env.VUE_APP_API_BASE

const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true
})

http.interceptors.response.use(
  res => res,
  async (error) => {
    const { response } = error
    const auth = useAuthStore()

    if (response && [401, 403].includes(response.status)) {
      if (auth.isAuthenticated) auth.logout()
    }

    return Promise.reject(error)
  }
)

export default http