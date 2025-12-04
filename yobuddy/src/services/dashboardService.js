import http from './http';

const dashboardService = {
  /**
   * 사용자 멘토 정보 조회
   */
  getMentor(userId) {
    return http.get(`/api/v1/users/${userId}/mentor`);
  },

  /**
   * 월간 일정 조회
   * 백엔드: GET /api/v1/users/{userId}/schedule?month=YYYY-MM
   */
  getMonthlySchedule(userId, month) {
    return http.get(`/api/v1/users/${userId}/schedule`, {
      params: { month }
    });
  },

  /**
   * 주간 일정 조회
   * 백엔드: GET /api/v1/users/{userId}/weekly
   */
  getWeeklySchedule(userId) {
    return http.get(`/api/v1/users/${userId}/weekly`);
  },

  /**
   * 온보딩 성과 조회
   * 백엔드:
   * GET /api/v1/users/{userId}/mentors/{mentorId}/onboarding-performance?from=...&to=...
   */
  getOnboardingPerformance(userId, mentorId, from, to) {
    return http.get(
      `/api/v1/users/${userId}/mentors/${mentorId}/onboarding-performance`,
      {
        params: { from, to }
      }
    );
  },

  /**
   * 주간보고 목록 조회
   * 백엔드: GET /api/v1/users/{menteeId}/weekly-reports
   */
  getWeeklyReports(menteeId, params) {
    return http.get(`/api/v1/users/${menteeId}/weekly-reports`, {
      params
    });
  },

  /**
   * 주간보고 상세 조회
   * 백엔드: GET /api/v1/users/{menteeId}/weekly-reports/{weeklyReportId}
   */
  getWeeklyReportDetail(menteeId, weeklyReportId) {
    return http.get(
      `/api/v1/users/${menteeId}/weekly-reports/${weeklyReportId}`
    );
  },

  /**
   * 주간보고 수정
   * 백엔드: POST /api/v1/users/{menteeId}/weekly-reports/{weeklyReportId}
   */
  updateWeeklyReport(menteeId, weeklyReportId, reportData) {
    return http.post(
      `/api/v1/users/${menteeId}/weekly-reports/${weeklyReportId}`,
      reportData
    );
  }
};

export default dashboardService;
