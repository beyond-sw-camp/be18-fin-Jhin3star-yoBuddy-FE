import http from '@/services/http'

const onboardingService = {
  async getAdminOnboardingPrograms() {
    try {
      const resp = await http.get('/api/v1/admin/programs')
      return resp.data || []
    } catch (e) {
      console.error('온보딩 프로그램 목록 조회 실패', e)
      throw e
    }
  },


  async getAdminOnboardingProgram(programId) {
    try {
      const resp = await http.get(`/api/v1/admin/programs/${programId}`)
      return resp.data || null
    } catch (e) {
      console.error(`온보딩 프로그램 상세 조회 실패 (id=${programId})`, e)
      throw e
    }
  },

  async createAdminOnboardingProgram(data) {
    try {
      const resp = await http.post('/api/v1/admin/programs', data)
      return resp
    } catch (e) {
      console.error('온보딩 프로그램 생성 실패', e)
      throw e
    }
  },


  async enrollMentees(programId, userIds) {
    try {
      const body = { userIds }
      const resp = await http.post(
        `/api/v1/admin/programs/${programId}/enrollments`,
        body
      )
      return resp.data || []
    } catch (e) {
      console.error('멘티 등록(enroll) 실패', e)
      throw e
    }
  },
}

export default onboardingService
