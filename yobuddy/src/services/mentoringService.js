import http from './http';
import { useAuthStore } from '@/store/authStore';

/**
 * 멘토링 관련 API 서비스
 */
const mentoringService = {
  /**
   * 특정 멘토에게 배정된 멘티 목록을 가져옵니다.
   * @param {string|number} mentorId - 멘토의 사용자 ID
   * @returns {Promise<Array>} 멘티 목록
   */
  async getMenteesForMentor(mentorId) {
    if (!mentorId) {
      console.error('getMenteesForMentor: mentorId is required');
      return [];
    }
    try {
      const resp = await http.get(`/api/v1/mentors/${mentorId}/mentees`);
      return resp.data.mentees || []; // Extract the 'mentees' array
    } catch (e) {
      console.error(`멘티 목록 조회 실패 (멘토 ID: ${mentorId})`, e);
      throw e;
    }
  },

  async getMentorSummary(mentorId) {
    if (!mentorId) {
      console.error('getMentorSummary: mentorId is required');
      return {};
    }
    try {
      const resp = await http.get(`/api/v1/mentors/${mentorId}/summary`);
      return resp.data;
    } catch (e) {
      console.error(`멘토 요약 정보 조회 실패 (멘토 ID: ${mentorId})`, e);
      throw e;
    }
  },

  /**
   * 사용자의 역할에 따라 멘토링 세션 목록을 조회합니다.
   * @param {object} [options] - 페이징 옵션
   * @param {number} [options.page=0] - 페이지 번호
   * @param {number} [options.size=10] - 페이지 크기
   * @returns {Promise<object>} 멘토링 세션 목록 (페이지네이션 포함)
   */
  async getMentoringSessions(options = {}) {
    const auth = useAuthStore();
    const user = auth.user;
    if (!user || !user.userId || !user.role) {
      return Promise.reject(new Error('User role and ID are required for fetching sessions.'));
    }

    const { role, userId } = user;
    let url = '';

    const params = {
      page: options.page || 0,
      size: options.size || 10,
    };

    if (options.status) {
      params.status = options.status;
    }

    switch (role.toUpperCase()) {
      case 'ADMIN':
        url = '/api/v1/admin/mentoring/sessions';
        if (options.query) {
          params.query = options.query;
        }
        break;
      case 'MENTOR':
        url = `/api/v1/mentors/${userId}/sessions`;
        if (options.query) {
          params.query = options.query;
        }
        break;
      case 'NEWBIE':
      case 'USER':
        url = `/api/v1/users/${userId}/mentoring/sessions`;
        // Assuming search by mentorName for users
        if (options.mentorName) {
          params.mentorName = options.mentorName;
        }
        break;
      default:
        return Promise.reject(new Error(`Unsupported role for fetching sessions: ${role}`));
    }

    try {
      const resp = await http.get(url, { params });
      return resp.data; // 페이지네이션 객체 전체 반환
    } catch (e) {
      console.error(`멘토링 세션 조회 실패 (역할: ${role}, ID: ${userId})`, e);
      throw e;
    }
  },

  /**
   * 새로운 멘토링 세션을 생성합니다.
   * @param {object} sessionData - 세션 데이터 (mentorId, menteeId, description, scheduledAt)
   * @returns {Promise<any>}
   */
  async createMentoringSession(sessionData) {
    if (!sessionData.mentorId || !sessionData.menteeId) {
      return Promise.reject(new Error('Mentor ID and Mentee ID are required for creating a session.'));
    }
    // sessionData 객체 전체를 요청 본문으로 사용합니다.
    return http.post(`/api/v1/mentors/${sessionData.mentorId}/sessions`, sessionData);
  },

  /**
   * 특정 멘토링 세션의 상세 정보를 조회합니다.
   * @param {string|number} mentorId
   * @param {string|number} sessionId
   * @returns {Promise<any>}
   */
  async getSessionDetails(mentorId, sessionId) {
    return http.get(`/api/v1/mentors/${mentorId}/sessions/${sessionId}`);
  },

  /**
   * 특정 사용자의 멘토링 세션 상세 정보를 조회합니다.
   * @param {string|number} userId
   * @param {string|number} sessionId
   * @returns {Promise<any>}
   */
  async getUserSessionDetails(userId, sessionId) {
    return http.get(`/api/v1/users/${userId}/mentoring/sessions/${sessionId}`);
  },

  /**
   * 멘토링 세션에 대한 피드백을 제출(수정)합니다.
   * @param {string|number} mentorId
   * @param {string|number} sessionId
   * @param {object} feedbackData - { attended, feedback, scheduledAt }
   * @returns {Promise<any>}
   */
  async submitSessionFeedback(mentorId, sessionId, feedbackData) {
    return http.patch(`/api/v1/mentors/${mentorId}/sessions/${sessionId}/feedback`, feedbackData);
  },

  /**
   * (관리자용) 특정 멘토링 세션의 상세 정보를 조회합니다.
   * @param {string|number} sessionId
   * @returns {Promise<any>}
   */
  async getAdminSessionDetails(sessionId) {
    return http.get(`/api/v1/admin/mentoring/sessions/${sessionId}`);
  },

  async getMentorSchedule(mentorId, month) {
    if (!mentorId || !month) {
      console.error('getMentorSchedule: mentorId and month are required');
      return { schedules: [] };
    }
    try {
      const resp = await http.get(`/api/v1/mentors/${mentorId}/schedule`, {
        params: { month },
      });
      return resp.data; // Expects { schedules: [...] }
    } catch (e) {
      console.error(`멘토 스케줄 조회 실패 (멘토 ID: ${mentorId}, 월: ${month})`, e);
      throw e;
    }
  },
    async getMenteeOnboardingPerformance(mentorId, menteeId, from, to) {
    // Fetch performance data
    const performancePromise = http.get(
      `/api/v1/mentors/${mentorId}/mentees/${menteeId}/onboarding-performance`,
      {
        params: { from, to },
      }
    );

    // Fetch weekly reports
    const weeklyReportsPromise = http.get(
      `/api/v1/mentors/${mentorId}/mentees/${menteeId}/weekly-reports`,
      {
        params: { page: 0, size: 50 }, // As per instructions
      }
    );

    // Fetch mentee list to get the name
    const menteesPromise = this.getMenteesForMentor(mentorId);

    const [performanceResp, weeklyReportsResp, mentees] = await Promise.all([
      performancePromise,
      weeklyReportsPromise,
      menteesPromise,
    ]);

    const mentee = mentees.find(m => m.menteeId === menteeId);
    const menteeName = mentee ? mentee.name : 'Mentee';

    const mappedReports = weeklyReportsResp.data.content.map(r => ({
      reportId: r.weeklyReportId,
      authorName: menteeName,
      label: `Week ${r.weekNumber} (${r.startDate} ~ ${r.endDate})`,
      writtenDate: r.updatedAt ? r.updatedAt.substring(0, 10) : '-',
      submitStatus: ['SUBMITTED', 'REVIEWED', 'FEEDBACK_OVERDUE'].includes(r.status) ? 'SUBMITTED' : 'MISSING',
      feedbackStatus: r.status === 'REVIEWED' ? 'WRITTEN' : 'PENDING',
    }));

    return {
      ...performanceResp.data,
      weeklyReports: mappedReports,
    };
  },

  /**
   * 주간 리포트 상세 정보를 가져옵니다.
   * @param {number} mentorId
   * @param {number} menteeId
   * @param {number} reportId
   * @returns {Promise<any>}
   */
  async getWeeklyReportDetail(mentorId, menteeId, reportId) {
    return http.get(`/api/v1/mentors/${mentorId}/mentees/${menteeId}/weekly-reports/${reportId}`);
  },

  /**
   * 주간 리포트에 대한 멘토의 피드백을 제출(수정)합니다.
   * @param {number} mentorId
   * @param {number} menteeId
   * @param {number} reportId
   * @param {object} feedbackData - { feedback: "..." }
   * @returns {Promise<any>}
   */
  async submitWeeklyReportFeedback(mentorId, menteeId, reportId, feedbackData) {
    return http.patch(`/api/v1/mentors/${mentorId}/mentees/${menteeId}/weekly-reports/${reportId}/feedback`, feedbackData);
  },
};

export default mentoringService;
