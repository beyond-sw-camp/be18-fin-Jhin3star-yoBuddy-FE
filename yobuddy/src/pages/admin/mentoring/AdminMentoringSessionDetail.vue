<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">멘토링 세션 상세 (관리자)</h2>
          <p class="card-sub">세션의 상세 정보를 조회합니다.</p>
        </div>
        <div class="controls">
          <button class="btn-ghost" @click="$router.back()">← 목록으로</button>
        </div>
      </div>

      <div class="card-body">
        <div class="info-grid">
          <div class="info-group">
            <h3 class="group-title">멘토 정보</h3>
            <dl class="info-list">
              <dt>이름</dt>
              <dd>{{ session.mentorName || '-' }}</dd>
            </dl>
          </div>
          <div class="info-group">
            <h3 class="group-title">멘티 정보</h3>
            <dl class="info-list">
              <dt>이름</dt>
              <dd>{{ session.menteeName || '-' }}</dd>
              <dt>이메일</dt>
              <dd>{{ session.menteeEmail || '-' }}</dd>
            </dl>
          </div>
        </div>

        <div class="info-group">
          <h3 class="group-title">세션 정보</h3>
          <dl class="info-list-horizontal">
            <dt>예약 날짜</dt>
            <dd>{{ formatDisplayDateTime(session.scheduledAt) }}</dd>
            <dt>상태</dt>
            <dd>
              <span :class="['tag', getStatusClass(session.status)]">
                {{ getStatusText(session.status) }}
              </span>
            </dd>
          </dl>
        </div>

        <div class="info-group feedback-group">
          <h3 class="group-title">멘토 피드백</h3>
          <p class="feedback-content">{{ session.feedback || "아직 피드백이 작성되지 않았습니다." }}</p>
        </div>
      </div>
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
      return new Date(dateTime).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
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
        SCHEDULED: 'tag-newbie',
        COMPLETED: 'tag-admin',
        NO_SHOW: 'tag-mentor',
        CANCELLED: 'tag-default'
      };
      return classMap[status] || 'default';
    }
  },
};
</script>

<style scoped>
/* Common styles from other pages */
.org-page { padding: 28px 40px; display:flex; justify-content:center; }
.content-card { width: 1100px; max-width: 100%; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(9,30,66,0.08); overflow: hidden; }
.card-header { display:flex; flex-direction:row; align-items:center; justify-content:space-between; gap:16px; padding: 20px 28px; border-bottom: 1px solid #eef2f7; flex-wrap:wrap; }
.title-wrap { display:flex; flex-direction:column; gap:4px; }
.card-title { margin:0; font-size:20px; color:#10243b }
.card-sub { margin: 4px 0 0; color:#7d93ad; font-size:13px }
.controls { display:flex; gap:12px; align-items:center; }
.btn-ghost { background: transparent; border: 1px solid #e6eef8; color: #294594; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight: 600; }
.card-body { padding: 28px 32px; }

/* Detail page specific styles */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 24px;
  margin-bottom: 24px;
}
.info-group {
  margin-bottom: 24px;
}
.info-group:last-child {
  margin-bottom: 0;
}
.group-title {
  font-size: 16px;
  color: #10243b;
  margin-bottom: 16px;
  font-weight: 700;
}
.info-list dt {
  color: #7d93ad;
  font-size: 14px;
  margin-bottom: 6px;
}
.info-list dd {
  color: #10243b;
  font-size: 15px;
  font-weight: 500;
  margin-left: 0;
  margin-bottom: 16px;
}
.info-list dd:last-of-type {
  margin-bottom: 0;
}

.info-list-horizontal {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px 24px;
}
.info-list-horizontal dt {
  color: #7d93ad;
  font-size: 14px;
  font-weight: 700;
}
.info-list-horizontal dd {
  color: #10243b;
  font-size: 15px;
  font-weight: 500;
}

.feedback-content {
  white-space: pre-wrap;
  color: #334155;
  font-size: 15px;
  line-height: 1.6;
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  min-height: 100px;
}

/* Tag styles */
.tag { padding:6px 10px; border-radius:14px; font-size:12px; font-weight:700; display: inline-block; }
.tag-admin { background:#ffe9e9; color:#c94242 }
.tag-mentor { background:#f6f8d1; color:#b0b900 }
.tag-newbie { background:#f0fff6; color:#0a9a52 }
.tag-default { background: #e5e7eb; color: #4b5563; }
</style>