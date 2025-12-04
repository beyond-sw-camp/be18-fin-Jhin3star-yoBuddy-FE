<template>
  <div class="announcement-detail-page">
    <!-- 뒤로가기 영역 -->
    <div class="ad-back-row">
      <button class="ad-back-button" @click="goBack">
        <span class="ad-back-icon">←</span>
        <span>뒤로 가기</span>
      </button>
    </div>

    <!-- 내용 카드 -->
    <div class="ad-card">
      <!-- 카드 헤더 -->
      <header class="ad-card-header">
        <div class="ad-title-row">
          <span class="badge">{{ categoryLabel(announcement?.type) }}</span>
          <h1 class="ad-title">{{ announcement?.title }}</h1>
        </div>

        <div class="ad-meta">
          <div class="meta-author">
            작성자: <span class="ad-meta-author">{{ announcement?.author }}</span>
          </div>
          <div class="meta-date">
            작성일: 
            <span class="ad-meta-date">
              {{ announcement?.createdAt?.slice(2, 10) }}
              {{ announcement?.createdAt?.slice(11, 16) }}
            </span>
          </div>
        </div>
      </header>

      <hr class="ad-divider" />

      <!-- 카드 본문 -->
      <section class="ad-body ad-single-body">
        <div v-html="convertedContent"></div>
      </section>
    </div>

    <section
        v-if="announcement && announcement.files && announcement.files.length > 0"
        class="ad-attachments"
      >
        <div class="ad-attachments-title">첨부파일</div>
        <ul class="ad-attachments-list">
          <li
            v-for="file in announcement.files"
            :key="file.fileId || file.id"
            class="ad-attachments-item"
          >
            <span class="file-name">
              {{ file.filename || file.originalName || '첨부파일' }}
            </span>
            <button
              type="button"
              class="ad-btn ad-btn-download"
              @click="downloadFiles(
                file.fileId || file.id,
                file.filename || file.originalName || '첨부파일')"
            >
              다운로드
            </button>
          </li>
        </ul>
      </section>

    <div v-if="auth.isAdmin" class="ad-action-row">
        <button type="button" class="ad-btn ad-btn-outline" @click="goEdit">
          수정
        </button>
        <button type="button" class="ad-btn ad-btn-danger" @click="confirmDelete">
          삭제
        </button>
    </div>
  </div>
</template>

<script>
import announcementService from '@/services/announcementService';
import { useAuthStore } from '@/store/authStore';
import fileService from '@/services/fileService';

export default {
  name: 'AnnouncementDetail',
  data() {
    return {
      announcement: null,
      loading: true,
      error: false,
    };
  },
  async created() {
    await this.fetchAnnouncementDetail();
  },
  computed: {
    convertedContent() {
      return this.announcement?.content
        ?.replace(/\n/g, "<br>") || "";
    },
    auth() {
      return useAuthStore();
    },
  },
  
  methods: {
    goBack() {
      // 라우터를 쓰고 있으면 이렇게:
      if (this.$router) {
        this.$router.push('/content/announcement');
      } else {
        this.$router.push('/content/announcement');
      }
    },
    categoryLabel(type) {
      switch (type) {
        case 'TRAINING':
          return '교육';
        case 'EVENT':
          return '이벤트';
        case 'TASK':
          return '과제';
        case 'MENTORING':
          return '멘토링';
        case 'NORMAL':
          return '공지';
        default:
          return type;
      }
    },
    async fetchAnnouncementDetail() {
      try {
        const id = this.$route.params.id;
        const resp = await announcementService.getAnnouncementDetail(id);
        this.announcement = resp;
        this.loading = false;
      } catch (e) {
        console.error("공지사항 상세 조회 실패", e);
        this.error = true;
        this.loading = false;
        alert('공지사항 조회를 실패했습니다.');
      }
    },

    async downloadFiles(fileId, fileNameFromList) {
      try {
        await fileService.downloadFiles(fileId, fileNameFromList);
      } catch (e) {
        console.error('첨부파일 다운로드 실패', e);
        alert('첨부파일 다운로드 중 오류가 발생했습니다.');
      }
    },

    goEdit() {
      const id = this.$route.params.id;
      this.$router.push(`/content/announcement/edit/${id}`);
    },

    async confirmDelete() {
      if (!confirm('정말 삭제하시겠습니까?')) return;

      try {
        const id = this.$route.params.id;
        await announcementService.deleteAnnouncement(id);
        alert('삭제되었습니다.');
        this.$router.push('/content/announcement');
      } catch (e) {
        console.error('공지 삭제 실패', e);
        alert('삭제 중 오류가 발생했습니다.');
      }
    },

  },
};
</script>

<style scoped>
/* 전체 페이지 영역 (본문 배경) */
.announcement-detail-page {
  padding: 24px 32px;
  background-color: #f5f7fb; /* 연한 회색/블루 톤 */
  min-height: calc(100vh - 64px); /* 헤더 높이만큼 뺀 느낌으로 조절 */
  box-sizing: border-box;
}

/* 뒤로가기 영역 */
.ad-back-row {
  max-width: 1100px;
  margin: 0 auto 12px auto;
}

.ad-back-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
}

.ad-back-button:hover {
  color: #374151;
}

.ad-back-icon {
  font-size: 16px;
}

/* 카드 레이아웃 */
.ad-card {
  width: 1100px;
  height: 620px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  border: 1px solid #e5e7eb;
  padding: 24px 28px 28px 28px;
  box-sizing: border-box;
}

/* 카드 헤더 */
.ad-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.ad-title-row {
  display: flex;
  align-items: center;
  gap: 30px; /* 배지와 제목 사이 간격 */
  margin-bottom: 6px;
}

.badge {
  display: inline-block;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 10px;
  background: #e8edf7;
  color: #294594;
  font-weight: 400;
  min-width: 50px;
  text-align: center;
}

.ad-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

/* 작성자/날짜 메타 정보 */
.ad-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #6b7280;
}

.meta-author,
.meta-date {
  display: flex;
  gap: 4px;
}

/* 구분선 */
.ad-divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 16px 0 20px 0;
}

/* 본문 */
.ad-body {
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
}

.ad-body.ad-single-body {
  max-height: 600px;   
  overflow-y: auto;
  flex-grow: 1;
  padding-right: 8px;  
  box-sizing: border-box;
}

.ad-greeting {
  margin: 0 0 8px 0;
  font-weight: 600;
}

.ad-intro {
  margin: 0 0 18px 0;
}

.ad-attachments {
  width: 1100px;
  margin: 40px auto 0;
  border: 1px solid #ffffff; /* 검은 선 */
  border-radius: 10px;
  padding: 12px 16px;
  background-color: #fafafa;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.ad-attachments-title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.ad-attachments-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ad-attachments-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-top: 1px solid #e0e0e0;
}

.ad-attachments-item:first-child {
  border-top: none;
}

.file-name {
  font-size: 14px;
  color: #000000;
  margin-right: 12px;
}

/* 다운로드 버튼은 기존 버튼 스타일 재활용 + 살짝만 변경하고 싶으면 */
.ad-btn-download {
  padding: 4px 10px;
  font-size: 12px;
  background-color: #294594;
  color: #ffffff;
}

/* 섹션 공통 */
.ad-section {
  margin-bottom: 16px;
}

.ad-section:last-of-type {
  margin-bottom: 0;
}

.ad-section-title {
  font-weight: 600;
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.ad-bullet {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background-color: #f97316; /* 포인트 컬러 (주황) */
  margin-right: 8px;
}

.ad-action-row {
  max-width: 1100px;       /* .ad-card의 max-width와 동일 */
  margin: 16px auto 0 auto; /* 가운데 정렬 */
  padding: 0 8px;          /* 카드의 padding과 동일하게 */
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  box-sizing: border-box;
}

.ad-btn {
  min-width: 90px;
  height: 45px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.ad-btn-outline {
  background: #294594;
  color: #ffffff;
  border-color: #d0d5e5;
}

.ad-btn-outline:hover {
  opacity: 0.9;
}

.ad-btn-danger {
  background: #ff5b5b;
  color: #ffffff;
}

.ad-btn-danger:hover {
  opacity: 0.9;
}

/* 리스트 */
.ad-list {
  margin: 0;
  padding-left: 18px;
  list-style: disc;
}

.ad-list li + li {
  margin-top: 2px;
}

/* 반응형 처리 */
@media (max-width: 768px) {
  .announcement-detail-page {
    padding: 16px;
  }

  .ad-card {
    padding: 20px 16px 22px 16px;
  }

  .ad-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .ad-title {
    font-size: 20px;
  }

  .ad-meta {
    font-size: 12px;
  }
}
</style>