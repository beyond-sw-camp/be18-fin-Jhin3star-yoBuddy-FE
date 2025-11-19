import http from '@/services/http';

/**
 * 온보딩 프로그램 관련 API 서비스
 */
const onboardingService = {
  /**
   * (관리자용) 모든 온보딩 프로그램 목록을 조회합니다.
   * @returns {Promise<Array>} 온보딩 프로그램 목록
   */
  async getAdminOnboardingPrograms() {
    try {
      const resp = await http.get('/api/v1/admin/programs');
      return resp.data || [];
    } catch (e) {
      console.error("온보딩 프로그램 목록 조회 실패", e);
      throw e;
    }
  },
  /**
   * (관리자용) 특정 온보딩 프로그램 상세 조회
   * @param {string|number} programId
   * @returns {Promise<Object>} 프로그램 상세 정보
   */
  async getAdminOnboardingProgram(programId) {
    try {
      const resp = await http.get(`/api/v1/admin/programs/${programId}`);
      return resp.data || null;
    } catch (e) {
      console.error(`온보딩 프로그램 상세 조회 실패 (id=${programId})`, e);
      throw e;
    }
  },
};

export default onboardingService;
