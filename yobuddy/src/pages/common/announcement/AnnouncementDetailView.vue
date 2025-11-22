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
  </div>
</template>

<script>
import announcementService from '@/services/announcementService';

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
    }
  },
  methods: {
    goBack() {
      // 라우터를 쓰고 있으면 이렇게:
      if (this.$router) {
        this.$router.back();
      } else {
        window.history.back();
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
  max-width: 1100px;
  max-height: 620px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 16px;
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