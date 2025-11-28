import http from '@/services/http'

const tasksService = {
  // **********************
  // Admin APIs
  // **********************
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
  },

  // **********************
  // User APIs
  // **********************
  getUserTasks(userId) {
    return http.get(`/api/v1/users/${userId}/tasks`)
  },

   getUserTaskDetail(userId, userTaskId) {
    return http.get(`/api/v1/users/${userId}/tasks/${userTaskId}`)
  },
  
  submitUserTask(userId, userTaskId, formData) {
    return http.post(`/api/v1/users/${userId}/tasks/${userTaskId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default tasksService