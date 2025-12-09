import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const http = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  withCredentials: true,
})

http.interceptors.response.use(
  res => res,
  async err => {
    const auth = useAuthStore()

    // AccessToken 만료 → 백엔드가 401을 보내면 refresh 자동 요청 가능
    if (err.response?.status === 401) {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true })
        return http(err.config)
      } catch (refreshErr) {
        auth.logout()
      }
    }

    return Promise.reject(err)
  }
)

export default http
