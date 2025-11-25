import http from '@/services/http'

const tasksService = {
  list(params) {
    return http.get('/api/v1/admin/tasks', { params })
  },

  get(id) {
    return http.get(`/api/v1/admin/tasks/${id}`)
  },

  create(body) {
    return http.post('/api/v1/admin/tasks', body, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },

  update(id, body) {
    return http.patch(`/api/v1/admin/tasks/${id}`, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },

  delete(id) {
    return http.delete(`/api/v1/admin/tasks/${id}`)
  }
}

export default tasksService