import http from '@/services/http'

const _taskCache = new Map()

const tasksService = {
  // **********************
  // Admin APIs
  // **********************
  list(params) {
    return http.get('/api/v1/admin/tasks', { params })
  },

  get(id, opts = {}) {
    const force = opts && opts.forceRefresh
    if (!id) return Promise.reject(new Error('missing id'))
    try {
      const key = String(id)
      if (!force && _taskCache.has(key)) {
        return _taskCache.get(key)
      }
      const p = http.get(`/api/v1/admin/tasks/${id}`).then(res => res).catch(err => { _taskCache.delete(key); throw err })
      _taskCache.set(key, p)
      return p
    } catch (e) {
      return Promise.reject(e)
    }
  },
  getuser(userId) {
    return http.get(`/api/v1/admin/tasks/user/${userId}`)
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
  },

  // **********************
  // Mentor APIs
  // **********************
  getMentorTasks(mentorId) {
    return http.get(`/api/v1/mentors/${mentorId}/tasks`)
  },

  getMentorTaskDetail(mentorId, userTaskId) {
    return http.get(`/api/v1/mentors/${mentorId}/tasks/${userTaskId}`)
  },

  gradeUserTask(mentorId, userTaskId, body) {
    return http.patch(
      `/api/v1/mentors/${mentorId}/tasks/${userTaskId}/grade`,
      body,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export default tasksService