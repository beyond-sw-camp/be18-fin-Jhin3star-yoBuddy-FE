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
  },
  submitCertificate(userId, trainingId, formData) {
    if (!userId) throw new Error('userId is required')
    if (!trainingId) throw new Error('trainingId is required')
    return http.post(`/api/v1/users/${userId}/trainings/${trainingId}/certificate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  submitQuiz(userId, trainingId, payload) {
    if (!userId) throw new Error('userId is required')
    if (!trainingId) throw new Error('trainingId is required')
    return http.post(`/api/v1/users/${userId}/trainings/${trainingId}/quiz`, payload)
  }
}
