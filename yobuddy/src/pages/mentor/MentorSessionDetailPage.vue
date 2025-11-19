<template>
  <div class="detail-page">
    <div class="detail-card">
      <header class="detail-header">
        <h2>멘토링 세션 상세</h2>
        <button class="back-btn" @click="$router.back()">← 뒤로가기</button>
      </header>

      <!-- 세션 정보 표시 -->
      <section v-if="!editMode" class="info-section">
        <h3>멘티 정보</h3>
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
        <div class="info-row"><span class="label">멘토 피드백</span><span class="value memo">{{ session.feedback || "아직 피드백이 작성되지 않았습니다." }}</span></div>
      </section>

      <!-- 피드백 수정 폼 -->
      <section v-else class="form-section">
        <div class="form-row">
          <label for="session-status">세션 상태</label>
          <select id="session-status" v-model="form.status">
            <option value="SCHEDULED">예정</option>
            <option value="COMPLETED">완료</option>
            <option value="NO_SHOW">불참</option>
            <option value="CANCELLED">취소</option>
          </select>
        </div>
        <div class="form-row">
          <label for="session-datetime">멘토링 일정</label>
          <input id="session-datetime" type="datetime-local" v-model="form.scheduledAt" />
        </div>
        <div class="form-row">
          <label for="session-feedback">피드백</label>
          <textarea id="session-feedback" v-model="form.feedback" rows="5" placeholder="피드백을 입력하세요."></textarea>
        </div>
      </section>

      <!-- 버튼 영역 -->
      <footer class="detail-footer">
        <button v-if="!editMode" class="btn-primary" @click="enterEditMode">피드백 작성/수정</button>
        <template v-if="editMode">
          <button class="btn-outline" @click="cancelEdit">취소</button>
          <button class="btn-primary" @click="saveFeedback">피드백 저장</button>
        </template>
      </footer>
    </div>
  </div>
</template>

<script>
import mentoringService from "@/services/mentoringService";
import { useAuthStore } from "@/store/authStore";

export default {
  name: "MentorSessionDetailPage",
  data() {
    return {
      session: {},
      mentorId: null,
      sessionId: null,
      editMode: false,
      form: {
        status: "SCHEDULED",
        feedback: "",
        scheduledAt: "",
      },
      statuses: {
        SCHEDULED: '예정',
        COMPLETED: '완료',
        NO_SHOW: '불참',
        CANCELLED: '취소'
      }
    };
  },
  async mounted() {
    const auth = useAuthStore();
    this.mentorId = auth.user?.userId;
    this.sessionId = this.$route.params.sessionId;
    await this.fetchSessionDetails();
  },
  methods: {
    async fetchSessionDetails() {
      if (!this.mentorId || !this.sessionId) return;
      try {
        const resp = await mentoringService.getSessionDetails(this.mentorId, this.sessionId);
        this.session = resp.data;
        this.resetForm();
      } catch (e) {
        console.error("세션 상세 정보 조회 실패", e);
        alert("세션 정보를 불러오는 데 실패했습니다.");
      }
    },
    enterEditMode() {
      this.editMode = true;
    },
    cancelEdit() {
      this.resetForm();
      this.editMode = false;
    },
    resetForm() {
      this.form.status = this.session.status || "SCHEDULED";
      this.form.feedback = this.session.feedback || "";
      this.form.scheduledAt = this.session.scheduledAt ? this.session.scheduledAt.slice(0, 16) : "";
    },
    async saveFeedback() {
      try {
        // attended 필드 대신 status 필드를 전송
        const feedbackData = {
          status: this.form.status,
          feedback: this.form.feedback,
          scheduledAt: this.form.scheduledAt,
        };
        await mentoringService.submitSessionFeedback(this.mentorId, this.sessionId, feedbackData);
        alert("피드백이 저장되었습니다.");
        this.editMode = false;
        await this.fetchSessionDetails(); // 정보 새로고침
      } catch (e) {
        console.error("피드백 저장 실패", e);
        alert("피드백 저장에 실패했습니다.");
      }
    },
    formatDisplayDateTime(dateTime) {
      if (!dateTime) return "N/A";
      return new Date(dateTime).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    },
    getStatusText(status) {
      return this.statuses[status] || status;
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
.detail-page { display: flex; justify-content: center; padding: 40px; }
.detail-card { width: 800px; background: white; border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.05); }
.detail-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid #f1f1f1; }
.detail-header h2 { margin: 0; font-size: 20px; }
.info-section, .form-section { padding: 24px; }
.info-section h3 { font-size: 18px; margin-top: 0; margin-bottom: 14px; }
.info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f1f1; }
.label { color: #6b7280; font-weight: 700; }
.value { font-weight: 500; }
.memo { white-space: pre-wrap; text-align: right; }

.form-row { margin-bottom: 20px; }
.form-section label { display: block; font-size: 14px; color: #6d859a; margin-bottom: 8px; font-weight: 600; }
.form-section input[type="datetime-local"], .form-section textarea, .form-section select {
  width: 100%; padding: 12px 14px; border: 1px solid #dde4ee; border-radius: 8px; font-size: 15px;
}

.detail-footer { padding: 24px; border-top: 1px solid #f1f1f1; display: flex; justify-content: flex-end; gap: 12px; }
.btn-primary { background: #294594; color: white; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; }
.btn-outline { background: transparent; border: 1px solid #d0d7e2; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.back-btn { background: transparent; border: 1px solid #d0d7e2; padding: 8px 14px; border-radius: 8px; cursor: pointer; }

.status-tag { padding: 5px 12px; border-radius: 14px; font-size: 12px; font-weight: 700; text-align: center; }
.status-tag.completed { background: #d1fae5; color: #059669; }
.status-tag.scheduled { background: #fef3c7; color: #92400e; }
.status-tag.noshow { background: #fee2e2; color: #b91c1c; }
.status-tag.cancelled { background: #e5e7eb; color: #4b5563; }
.status-tag.default { background: #e5e7eb; color: #4b5563; }
</style>
