import axios from 'axios'
import { useAuthStore } from '@/store/authStore'


axios.defaults.withCredentials = true;

const API_BASE = process.env.VUE_APP_API_BASE || 'http://192.168.0.10:8080'

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