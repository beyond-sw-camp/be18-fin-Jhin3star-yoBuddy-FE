<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">멘토링 세션 상세</h2>
          <p class="card-sub">세션의 상세 정보 및 피드백을 관리합니다.</p>
        </div>
        <div class="controls">
          <button class="btn-ghost" @click="$router.back()">← 목록으로</button>
        </div>
      </div>

      <div v-if="!editMode" class="card-body">
        <div class="info-grid">
          <div class="info-group">
            <h3 class="group-title">멘티 정보</h3>
            <div class="mentee-info-display">
              <div class="avatar">
                <img v-if="session.menteeProfileImageUrl" :src="getFullImageUrl(session.menteeProfileImageUrl)" alt="Mentee Profile" class="profile-image" />
                <span v-else>{{ initials(session.menteeName) }}</span>
              </div>
              <div>
                <dl class="info-list">
                  <dt>이름</dt>
                  <dd>{{ session.menteeName }}</dd>
                  <dt>이메일</dt>
                  <dd>{{ session.menteeEmail }}</dd>
                </dl>
                <div class="training-stats" v-if="session.menteeCompletedTrainings !== undefined || session.menteePendingTrainings !== undefined">
                  <span class="stat-item completed">완료: {{ session.menteeCompletedTrainings || 0 }}</span>
                  <span class="stat-item pending">예정: {{ session.menteePendingTrainings || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="info-group">
            <h3 class="group-title">세션 정보</h3>
            <dl class="info-list">
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
        </div>
        <div class="info-group feedback-group">
          <h3 class="group-title">멘토 피드백</h3>
          <p class="feedback-content">{{ session.feedback || "아직 피드백이 작성되지 않았습니다." }}</p>
        </div>
      </div>

      <div v-else class="card-body">
        <div class="form-grid">
          <div class="form-row">
            <label for="session-status">세션 상태</label>
            <select id="session-status" v-model="form.status" class="form-input">
              <option value="SCHEDULED">예정</option>
              <option value="COMPLETED">완료</option>
              <option value="NO_SHOW">불참</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          <div class="form-row">
            <label for="session-datetime">멘토링 일정</label>
            <input id="session-datetime" type="datetime-local" v-model="form.scheduledAt" class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <label for="session-feedback">피드백</label>
          <textarea id="session-feedback" v-model="form.feedback" rows="6" placeholder="피드백을 입력하세요." class="form-textarea"></textarea>
        </div>
      </div>

      <div class="card-footer">
        <button  
        v-if="!editMode && !['COMPLETED', 'CANCELLED'].includes(session.status)"
        class="btn-primary"
        @click="enterEditMode"
        >  
        피드백 작성/수정
      </button>

        <template v-if="editMode">
          <button class="btn-ghost" @click="cancelEdit">취소</button>
          <button class="btn-primary" @click="saveFeedback">피드백 저장</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/services/http';
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
        const feedbackData = {
          status: this.form.status,
          feedback: this.form.feedback,
          scheduledAt: this.form.scheduledAt,
        };
        await mentoringService.submitSessionFeedback(this.mentorId, this.sessionId, feedbackData);
        alert("피드백이 저장되었습니다.");
        this.editMode = false;
        await this.fetchSessionDetails();
      } catch (e) {
        console.error("피드백 저장 실패", e);
        alert("피드백 저장에 실패했습니다.");
      }
    },
    getFullImageUrl(relativePath) {
  if (!relativePath || typeof relativePath !== "string") return null;

  const base = (http.defaults.baseURL || "").replace(/\/$/, "");

  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }

  return `${base}${relativePath.startsWith("/") ? relativePath : "/" + relativePath}`;
},
    initials(name) {
      if (!name) return ''
      return String(name).trim().charAt(0).toUpperCase();
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
.org-page { padding: 28px 40px; display:flex; justify-content:center; }
.content-card { width: 1100px; max-width: 100%; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(9,30,66,0.08); overflow: hidden; }
.card-header { display:flex; flex-direction:row; align-items:center; justify-content:space-between; gap:16px; padding: 20px 28px; border-bottom: 1px solid #eef2f7; flex-wrap:wrap; }
.title-wrap { display:flex; flex-direction:column; gap:4px; }
.card-title { margin:0; font-size:20px; color:#10243b }
.card-sub { margin: 4px 0 0; color:#7d93ad; font-size:13px }
.controls { display:flex; gap:12px; align-items:center; }
.btn-primary { background:#294594; color:#fff; padding:10px 16px; border-radius:10px; border:none; cursor:pointer; font-weight: 600; }
.btn-ghost { background: transparent; border: 1px solid #e6eef8; color: #294594; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight: 600; }
.card-body { padding: 28px 32px; }
.card-footer { padding: 20px 28px; border-top: 1px solid #eef2f7; display:flex; justify-content:center; gap: 12px; }

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 24px;
  margin-bottom: 24px;
}
.group-title {
  font-size: 16px;
  color: #10243b;
  margin-bottom: 16px;
  font-weight: 700;
}
.mentee-info-display {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.avatar {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  background: #294594;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  font-size: 24px;
  overflow: hidden;
}
.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.info-list {
  flex-grow: 1; 
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
.training-stats {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
}
.stat-item {
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.stat-item.completed {
  background-color: #d1fae5;
  color: #059669;
}
.stat-item.pending {
  background-color: #fef3c7;
  color: #92400e; 
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}
.form-row {
  display: flex;
  flex-direction: column;
}
.form-row label {
  font-size: 14px;
  color: #334155;
  margin-bottom: 8px;
  font-weight: 600;
}
.form-input, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e6eef8;
  background: #f8fbff;
  font-size: 15px;
}
.form-textarea {
  resize: vertical;
}

.tag { padding:6px 10px; border-radius:14px; font-size:12px; font-weight:700; display: inline-block; }
.tag.noshow { background:#ffe9e9; color:#c94242 }
.tag.scheduled { background:#f6f8d1; color:#b0b900 }
.tag.completed { background:#f0fff6; color:#0a9a52 }
.tag.cancelled { background: #e5e7eb; color: #4b5563; }
</style>