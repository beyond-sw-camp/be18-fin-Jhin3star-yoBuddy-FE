<template>
  <transition name="fade">
    <div v-if="visible" class="overlay" @click.self="close">
      <div class="modal">
        <!-- Header -->
        <header class="header">
          <div class="header-left">
            <h3 class="title" v-if="report">
              {{ report.weekNumber }}주차 주간 리포트
            </h3>
            <p class="subtitle" v-if="report">
              ({{ report.startDate }} ~ {{ report.endDate }})
            </p>
          </div>

          <div class="header-right">
            <span :class="['status-pill', feedbackStatus.class]">
              {{ feedbackStatus.text }}
            </span>
          </div>

          <button class="close-btn" @click="close">×</button>
        </header>

        <!-- Body -->
        <section class="body" v-if="!loading && report">
          <!-- 성과 -->
          <div class="content-section">
            <h4 class="section-title">성과</h4>
            <p class="section-content">{{ report.accomplishments }}</p>
          </div>

          <!-- 어려웠던 점 -->
          <div class="content-section">
            <h4 class="section-title">어려웠던 점</h4>
            <p class="section-content">{{ report.challenges }}</p>
          </div>

          <!-- 배운 점 -->
          <div class="content-section">
            <h4 class="section-title">배운 점</h4>
            <p class="section-content">{{ report.learnings }}</p>
          </div>

          <!-- Feedback section -->
          <div v-if="hasFeedback" class="feedback-box">
            <div class="feedback-header">
              <span class="feedback-author">{{ mentorName }} 멘토 피드백</span>
              <span class="feedback-date">
                ({{ formatTimestamp(report.updatedAt) }})
              </span>
            </div>
            <p class="feedback-text">{{ report.mentorFeedback }}</p>
          </div>

          <!-- If no feedback yet -->
          <div v-else class="feedback-input-section">
            <textarea
              v-model="form.feedback"
              rows="5"
              placeholder="멘티를 위한 피드백을 작성해주세요."
            ></textarea>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>
        </section>

        <div v-if="loading" class="loading-indicator">불러오는 중...</div>

        <!-- Footer -->
        <footer class="footer">
          <button class="btn btn-secondary" @click="close">취소</button>
          <button
            v-if="hasFeedback"
            class="btn btn-primary"
            @click="close"
          >
            확인
          </button>

          <button
            v-else
            class="btn btn-primary"
            @click="saveFeedback"
            :disabled="loading"
          >
            피드백 제출
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import mentoringService from '@/services/mentoringService';
import { useAuthStore } from '@/store/authStore';

export default {
  name: 'WeeklyReportDetailPopup',
  props: {
    visible: Boolean,
    mentorId: Number,
    menteeId: Number,
    reportId: Number,
  },
  data() {
    return {
      report: null,
      form: {
        feedback: '',
      },
      loading: false,
      error: null,
    };
  },
  computed: {
    hasFeedback() {
      return !!(this.report && this.report.mentorFeedback);
    },
    feedbackStatus() {
      if (this.report?.status === 'REVIEWED') {
        return { text: '피드백 완료', class: 'pill-green' };
      }
      return { text: '피드백 대기', class: 'pill-gray' };
    },
    mentorName() {
      const auth = useAuthStore();
      return auth.user?.name || '멘토';
    },
  },
  watch: {
    visible(v) {
      if (v && this.reportId) this.fetchReportDetails();
      else this.resetState();
    },
  },
  methods: {
    resetState() {
      this.report = null;
      this.form.feedback = '';
      this.error = null;
      this.loading = false;
    },
    close() {
      this.$emit('close');
    },
    formatTimestamp(ts) {
      if (!ts) return '';
      return new Date(ts).toLocaleString('ko-KR');
    },
    async fetchReportDetails() {
      this.loading = true;
      try {
        const response = await mentoringService.getWeeklyReportDetail(
          this.mentorId,
          this.menteeId,
          this.reportId
        );
        this.report = response.data;
        this.form.feedback = this.report.mentorFeedback || '';
      } catch (e) {
        console.error(e);
        this.error = '리포트를 불러오지 못했습니다.';
      } finally {
        this.loading = false;
      }
    },
    async saveFeedback() {
      if (!this.form.feedback.trim()) {
        this.error = '피드백은 비어 있을 수 없습니다.';
        return;
      }
      this.loading = true;
      try {
        await mentoringService.submitWeeklyReportFeedback(
          this.mentorId,
          this.menteeId,
          this.reportId,
          { mentorFeedback: this.form.feedback }
        );
        this.$emit('saved');
        this.close();
      } catch (e) {
        this.error = '피드백 저장에 실패했습니다.';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* Modal */
.modal {
  width: 650px;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  position: relative;
  padding: 22px 26px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #edf0f4;
}

.title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #1f2937;
}

.subtitle {
  font-size: 13px;
  margin-top: 4px;
  color: #6b7280;
}

.status-pill {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.pill-green {
  background: #e3fcef;
  color: #0a8a54;
}

.pill-gray {
  background: #f1f3f5;
  color: #6b7280;
}

/* Close button */
.close-btn {
  position: absolute;
  right: 16px;
  top: 16px;
  border: none;
  background: none;
  font-size: 26px;
  color: #999;
  cursor: pointer;
}

/* Body */
.body {
  padding: 24px 26px;
  overflow-y: auto;
}

.content-section {
  margin-bottom: 26px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 8px;
}

.section-content {
  font-size: 14px;
  color: #374151;
  white-space: pre-wrap;
  line-height: 1.6;
}

/* Feedback box (blue style like screenshot) */
.feedback-box {
  margin-top: 8px;
  border-radius: 10px;
  background: #f5f8ff;
  border: 1.5px solid #dbe5ff;
  padding: 16px 18px;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  border-bottom: 1px solid #dbe5ff;
  padding-bottom: 6px;
}

.feedback-author {
  font-weight: 700;
  font-size: 14px;
  color: #294594;
}

.feedback-date {
  font-size: 12px;
  color: #64748b;
}

.feedback-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin-top: 10px;
}

.feedback-input-section textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
}

.error-message {
  color: #dc2626;
  margin-top: 10px;
}

/* Footer */
.footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 18px;
  border-top: 1px solid #edf0f4;
}

.btn {
  padding: 10px 26px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary {
  background: #294594;
  color: white;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}
</style>
