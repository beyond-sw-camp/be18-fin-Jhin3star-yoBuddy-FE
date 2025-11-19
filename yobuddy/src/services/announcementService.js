import http from './http';

const announcementService = {
  async getAnnouncementLists({ page = 0, size = 10, title, type } = {}) {
    try {
      const resp = await http.get('/api/v1/announcements', {
          params: {
          page,
          size,
          type: type || undefined,
          title: title || undefined,
        }
      });
      return resp.data || [];
    } catch (e) {
      console.error("공지사항 목록 조회 실패", e);
      throw e;
    }
  },

  async getAnnouncementDetail(announcementId) {
    try {
      const url = `/api/v1/announcements/${announcementId}`;
      const resp = await http.get(url);
      return resp.data;
    } catch (e) {
      console.error("공지사항 상세 조회 실패", e);
      throw e;
    }
  },
};

export default announcementService;