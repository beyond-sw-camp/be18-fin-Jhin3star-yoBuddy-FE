import http from './http'

export default {
  list(params) {
    return http.get('/api/v1/admin/trainings', { params })
  },
  detail(id) {
    return http.get(`/api/v1/admin/trainings/${id}`)
  },
  create(payload) {
    return http.post('/api/v1/admin/trainings', payload)
  },
  update(id, payload) {
    return http.patch(`/api/v1/admin/trainings/${id}`, payload)
  }
  ,
  delete(id) {
    return http.delete(`/api/v1/admin/trainings/${id}`)
  }
}
