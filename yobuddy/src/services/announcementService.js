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

  async createAnnouncement({ title, type, content, attachments }) {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', type);       // BACK: AnnouncementType enum 이름과 일치해야 함
      if (content) {
        formData.append('content', content);
      }

      // 첨부파일이 있다면 files로 함께 전송
      if (attachments && attachments.length > 0) {
        attachments.forEach(file => {
          formData.append('files', file);  // @RequestPart("files")와 이름 맞추기
        });
      }

      const resp = await http.post('/api/v1/admin/announcements', formData);
      return resp.data;
    } catch (e) {
      console.error('공지사항 생성 실패', e);
      throw e;
    }
  },

  async updateAnnouncement(announcementId, updatedto) {
    try {
      const url = `/api/v1/admin/announcements/${announcementId}`;
      const resp = await http.patch(url, updatedto);
      return resp.data;
    } catch (e) {
      console.error("공지사항 수정 실패", e);
      throw e;
    }
  },

  async deleteAnnouncement(announcementId) {
    try {
      const url = `/api/v1/admin/announcements/${announcementId}`;
      const resp = await http.delete(url);
      return resp.data;
    } catch (e) {
      console.error("공지사항 삭제 실패", e);
      throw e;
    }
  },
};

export default announcementService;