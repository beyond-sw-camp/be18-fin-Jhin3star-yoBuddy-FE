import http from '@/services/http'

const kpiService = {
  getCategories() {
    return http.get('/api/v1/admin/kpi/category')
  },

  // placeholder for future endpoints
  getCategory(id) {
    return http.get(`/api/v1/admin/kpi/category/${id}`)
  },

  getGoals() {
    return http.get('/api/v1/admin/kpi/goals')
  },

  getGoal(id) {
    // fetch single goal detail (note: non-admin path as requested)
    return http.get(`/api/v1/admin/kpi/goals/${id}`)
  },
    updateGoal(id, payload) {
      return http.patch(`/api/v1/admin/kpi/goals/${id}`, payload)
    },
    deleteGoal(id) {
      return http.delete(`/api/v1/admin/kpi/goals/${id}`)
    },
    createGoal(payload) {
      return http.post(`/api/v1/kpi/goals`, payload)
    },
    // admin fallback for create
    createGoalAdmin(payload) {
      return http.post(`/api/v1/admin/kpi/goals`, payload)
    },
  createCategory(payload) {
    return http.post('/api/v1/admin/kpi/category', payload)
  },

  updateCategory(id, payload) {
    return http.patch(`/api/v1/admin/kpi/category/${id}`, payload)
  },

  deleteCategory(id) {
    return http.delete(`/api/v1/admin/kpi/category/${id}`)
  }
}

export default kpiService
