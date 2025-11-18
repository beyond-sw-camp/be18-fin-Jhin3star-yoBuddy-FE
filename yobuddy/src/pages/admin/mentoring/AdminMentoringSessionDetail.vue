<template>
  <div class="detail-page">
    <div class="detail-card">
      <header class="detail-header">
        <h2>멘토링 세션 상세 (관리자)</h2>
        <button class="back-btn" @click="$router.back()">← 뒤로가기</button>
      </header>

      <section class="info-section">
        <h3>멘토 정보</h3>
        <div class="info-row"><span class="label">이름</span><span class="value">{{ session.mentorName }}</span></div>
        
        <h3 style="margin-top: 30px;">멘티 정보</h3>
        <div class="info-row"><span class="label">이름</span><span class="value">{{ session.menteeName }}</span></div>
        <div class="info-row"><span class="label">이메일</span><span class="value">{{ session.menteeEmail }}</span></div>

        <h3 style="margin-top: 30px;">세션 정보</h3>
        <div class="info-row"><span class="label">예약 날짜</span><span class="value">{{ formatDisplayDateTime(session.scheduledAt) }}</span></div>
        <div class="info-row">
          <span class="label">상태</span>
          <span class="value">
            <span :class="['status-tag', getStatusClass(session.status)]">
              {{ getStatusText(session.status) }}
            </span>
          </span>
        </div>
        <div class="info-row"><span class="label">멘토 피드백</span><span class="value memo">{{ session.feedback || "피드백 없음" }}</span></div>
      </section>
    </div>
  </div>
</template>

<script>
import mentoringService from "@/services/mentoringService";

export default {
  name: "AdminMentoringSessionDetail",
  data() {
    return {
      session: {},
      sessionId: null,
    };
  },
  async mounted() {
    this.sessionId = this.$route.params.sessionId;
    await this.fetchSessionDetails();
  },
  methods: {
    async fetchSessionDetails() {
      if (!this.sessionId) return;
      try {
        const resp = await mentoringService.getAdminSessionDetails(this.sessionId);
        this.session = resp.data;
      } catch (e) {
        console.error("세션 상세 정보 조회 실패 (관리자)", e);
        alert("세션 정보를 불러오는 데 실패했습니다.");
      }
    },
    formatDisplayDateTime(dateTime) {
      if (!dateTime) return "N/A";
      return new Date(dateTime).toLocaleString('ko-KR');
    },
    getStatusText(status) {
      const statusMap = {
        SCHEDULED: '예정',
        COMPLETED: '완료',
        NO_SHOW: '불참',
        CANCELLED: '취소'
      };
      return statusMap[status] || status;
    },
    getStatusClass(status) {
      const classMap = {
        SCHEDULED: 'scheduled',
        COMPLETED: 'completed',
        NO_SHOW: 'noshow',
        CANCELLED: 'cancelled'
      };
      return classMap[status] || 'default';
    }
  },
};
</script>

<style scoped>
/* 멘토 상세 페이지와 유사한 스타일 사용 */
.detail-page { display: flex; justify-content: center; padding: 40px; }
.detail-card { width: 800px; background: white; border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.05); }
.detail-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid #f1f1f1; }
.detail-header h2 { margin: 0; font-size: 20px; }
.info-section { padding: 24px; }
.info-section h3 { font-size: 18px; margin-top: 0; margin-bottom: 14px; }
.info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f1f1; }
.label { color: #6b7280; font-weight: 700; }
.value { font-weight: 500; }
.memo { white-space: pre-wrap; text-align: right; }
.back-btn { background: transparent; border: 1px solid #d0d7e2; padding: 8px 14px; border-radius: 8px; cursor: pointer; }

.status-tag { padding: 5px 12px; border-radius: 14px; font-size: 12px; font-weight: 700; text-align: center; }
.status-tag.completed { background: #d1fae5; color: #059669; }
.status-tag.scheduled { background: #fef3c7; color: #92400e; }
.status-tag.noshow { background: #fee2e2; color: #b91c1c; }
.status-tag.cancelled { background: #e5e7eb; color: #4b5563; }
.status-tag.default { background: #e5e7eb; color: #4b5563; }
</style>
