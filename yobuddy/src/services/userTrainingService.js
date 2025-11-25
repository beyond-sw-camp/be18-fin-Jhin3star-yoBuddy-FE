import http from '@/services/http'

export default {
  list(userId, params) {
    if (!userId) throw new Error('userId is required')
    return http.get(`/api/v1/users/${userId}/trainings`, { params })
  },
  detail(userId, trainingId) {
    if (!userId) throw new Error('userId is required')
    if (!trainingId) throw new Error('trainingId is required')
    return http.get(`/api/v1/users/${userId}/trainings/${trainingId}`)
  }
}
