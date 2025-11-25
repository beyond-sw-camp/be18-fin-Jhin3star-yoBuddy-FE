<template>
  <transition name="fade">
    <div class="detail-overlay" v-if="visible">
      <div class="detail-modal layout-vertical">
        <header class="modal-top">
          <button class="back-btn" @click="$emit('close')">X</button>
          <div class="modal-title">교육 상세</div>
        </header>

        <section class="content section">
          <!-- 제목 -->
          <div class="title-section">
            <h2 class="training-title">{{ training?.title || '교육 상세' }}</h2>
            <span :class="['status-badge', statusClass(training?.status)]">{{ statusLabel(training?.status) }}</span>
          </div>

          <!-- 온라인 교육 -->
          <template v-if="training?.type === 'ONLINE'">
            

          <!-- 설명 -->
          <div class="desc-section">
            <div class="desc-box">{{ training?.description || training?.summary || training?.subtitle || training?.content || '—' }}</div>
          </div>

          <!-- URL 링크 -->
            <div class="url-row">
              <span class="date">💻 </span>
              <a v-if="training?.onlineUrl || training?.link" :href="training.onlineUrl || training.link" target="_blank" class="url-link">{{ training.onlineUrl || training.link }}</a>
              <span v-else class="url-empty">정보 없음</span>
            </div>

            <!-- 이수증 섹션 (상태 기반) -->
            <div v-if="isOnlineCompleted" class="certificate-section certificate-flat">
              <label class="file-input-label">
              <div class="file-label">이수증 제출 완료</div>
              </label>
              <div class="cert-meta-row">
                <div class="cert-meta">
                  <span class="meta-val">{{ submittedFileName }}</span>
                </div>
                <div class="cert-meta cert-meta-date">
                  <span class="meta-val">{{ formatDateTime(training?.completedAt) }}</span>
                </div>
                <input type="file" @change="onFileChange" accept=".pdf" class="file-input-hidden">
                <span class="file-button">다시 제출하기</span>
              </div>
            </div>
            <div v-else class="certificate-upload-section">
              <label class="file-input-label">
              <div class="file-label">이수증 제출하기</div>
                <input type="file" @change="onFileChange" accept=".pdf" class="file-input-hidden">
                <span class="file-button"> 제출하기</span>
              </label>
              <span v-if="!isOnlineCompleted" class="cert-warning">{{ certWarning }}</span>
            </div>
          </template>

          <!-- 오프라인 교육 -->
          <template v-if="training?.type === 'OFFLINE'">
            <!-- 교육 일시 -->
              <div class="label-text">교육 일시</div>
              <div class="datetime-value">{{ formatDateTime(training?.scheduledAt) }}</div>
       

            <!-- 퀴즈 응시 섹션 (상태 기반) -->
            <div v-if="isOfflineCompleted" class="quiz-completed-section">
              <span class="date">📝 </span>
                <span class="quiz-label">퀴즈 응시 완료: </span>
                <span class="quiz-date">{{ formatDateTime(training?.completedAt) }}</span>
                <span class="score-label">{{ training?.score }}점</span>
                <span :class="['passing-status', isPassingScore ? 'pass' : 'fail']">
                  {{ isPassingScore ? 'PASS' : 'FAIL' }}
                </span>
                <span v-if="!isPassingScore" class="passing-score-info">
                  (통과 점수: {{ training?.passingScore }}점)
                </span>
            </div>
            <div v-else class="quiz-button-section">
              <span class="date">📝 </span>
              <button @click="handleQuizClick" class="quiz-button">퀴즈 응시하기</button>
            </div>
          </template>
        </section>

        <!-- 하단 고정 첨부파일 -->
        <div class="attachments-fixed">
          <div class="attachment-label">첨부파일.zip</div>
          <a href="#" class="download-btn">⬇</a>
        </div>

        <footer class="modal-actions">
          <button class="btn-confirm" @click="$emit('close')">확인</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import userTrainingService from '@/services/userTrainingService';
import { useAuthStore } from '@/store/authStore';

export default {
  name: 'TrainingDetailPopup',
  props: { training: { type: Object, default: null }, visible: { type: Boolean, default: false } },
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  data() {
    return { 
      certFile: null,
      certWarning: ''
    }
  },
  computed: {
    isOnlineCompleted() {
      return String(this.training?.status || '').toUpperCase() === 'COMPLETED' && this.training?.type === 'ONLINE'
    },
    isOfflineCompleted() {
      return String(this.training?.status || '').toUpperCase() === 'COMPLETED' && this.training?.type === 'OFFLINE'
    },
    isOfflinePending() {
      return String(this.training?.status || '').toUpperCase() !== 'COMPLETED' && this.training?.type === 'OFFLINE'
    },
    isPassingScore() {
      return this.training?.score >= this.training?.passingScore
    },
    submittedFileName() {
      return this.training?.certificateFileName
        || this.training?.certificateName
        || this.training?.fileName
        || this.training?.filename
        || '제출된 파일 없음'
    }
  },
  methods: {
    formatDate(d) {
      if (!d) return '—'
      try {
        return new Date(d).toLocaleDateString('ko-KR')
      } catch (e) {
        return d
      }
    },
    formatDateTime(d) {
      if (!d) return '—'
      try {
        return new Date(d).toLocaleString('ko-KR')
      } catch (e) {
        return d
      }
    },
    statusLabel(s) {
      if (!s) return '할당 전'
      const up = String(s).toUpperCase()
      if (up === 'ACTIVE' || up === 'IN_PROGRESS') return '진행 중'
      if (up === 'COMPLETED') return '완료'
      if (up === 'UPCOMING') return '예정'
      return s
    },
    statusClass(s) {
      const up = String(s || '').toUpperCase()
      if (up === 'COMPLETED') return 'completed'
      if (up === 'ACTIVE' || up === 'ONGOING') return 'active'
      if (up === 'UPCOMING') return 'upcoming'
      return 'pending'
    },
    onFileChange(e) {
      const f = e.target.files && e.target.files[0]
      if (!f) return
      
      if (f.type === 'application/pdf') {
        this.certFile = f
        this.certWarning = ''
        this.uploadCertificate()
      } else {
        this.certFile = null
        this.certWarning = 'PDF 파일만 업로드 가능합니다.'
      }
    },
    async uploadCertificate() {
      if (!this.certFile) return
      try {
        const form = new FormData()
        form.append('file', this.certFile)
        
        const userId = this.authStore.user?.id
        const trainingId = this.training?.id
        
        if (!userId || !trainingId) {
          alert('필수 정보가 없습니다.')
          return
        }
        
        // 이수증 업로드 API 호출
        await userTrainingService.submitCertificate(userId, trainingId, form)
        this.certFile = null
        this.certWarning = '이수증이 제출되었습니다.'
        this.$emit('certificateSubmitted', this.training)
      } catch (e) {
        console.error('Certificate upload failed:', e)
        this.certWarning = '이수증 제출에 실패했습니다.'
      }
    },
    handleQuizClick() {
      if (this.isOfflinePending) {
        alert('교육 일시 전입니다.')
        return
      }
      
      // 퀴즈 링크로 이동
      if (this.training?.quizLink) {
        window.open(this.training.quizLink, '_blank')
      }
    }
  }
}
</script>

<style scoped>
/* 레이아웃 */
.detail-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 10, 18, 0.48);
  padding: 20px;
  z-index: 1400;
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
}

.detail-modal {
  width: 720px;
  max-width: calc(100% - 40px);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(3, 10, 18, 0.12);
  position: relative;
}

/* 헤더 */
.modal-top {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 52px;
  margin-bottom: 16px;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #4b5563;
  padding: 6px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #294594;
}

/* 콘텐츠 */
.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  padding-bottom: 100px;
}

/* 제목 섹션 */
.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.training-title {
  font-size: 18px;
  font-weight: 800;
  color: #10243b;
  margin: 0;
  flex: 1;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.completed {
  background: #e3f7e9;
  color: #0a9a52;
}

.status-badge.active {
  background: #e9f0ff;
  color: #294594;
}

.status-badge.upcoming {
  background: #f6f8d1;
  color: #294594;
}

.status-badge.pending {
  background: #e9f0ff;
  color: #294594;
}

/* 설명 섹션 */
.desc-section {
  margin-top: 4px;
  margin-bottom: 4px;
}

.desc-box {
  background: #f8fbff;
  border: 1px solid #eef3fb;
  border-radius: 8px;
  padding: 12px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
  min-height: 30px;
  max-height: 120px;
  overflow-y: auto;
}

.desc-box::-webkit-scrollbar {
  width: 6px;
}

.desc-box::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 6px;
}

/* 온라인 교육 - URL */
.url-row {
  margin: 6px 0;
  padding: 3px 0;
}

.url-link {
  color: #2b57a0;
  text-decoration: none;
  word-break: break-all;
  font-size: 14px;
}

.url-link:hover {
  text-decoration: underline;
}

.url-empty {
  color: #94a3b8;
  font-size: 14px;
}

/* 온라인 교육 - 이수증 섹션 */
.certificate-section {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 12px 0;
}

.certificate-flat {
  background: transparent;
  border: none;
}

.cert-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cert-meta-row {
  display: flex;
  align-items: center;
  gap: 25px;
  flex-wrap: wrap;
  padding-top: 6px;
}

.cert-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4b5563;
  flex: 1 1 200px;
}

.cert-meta-date {
  flex: 0 0 auto;
  margin-left: auto;
  text-align: right;
}

.cert-meta-date .meta-val {
  text-align: right;
}

.meta-label {
  min-width: 70px;
  font-weight: 700;
  color: #294594;
}

.meta-val {
  margin-left: 32px;
  color: #10243b;
  flex: 1;
  word-break: break-all;
}

/* 이수증 업로드 */
.certificate-upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
  align-items: flex-start;
}

.file-input-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.file-input-hidden {
  display: none;
}

.file-label {
  font-weight: 600;
  color: #294594;
  font-size: 14px;
  margin-right: 12px;
}

.file-label::before{
  content: '📄 ';
  font-size: 19px;
  line-height: 1;
}

.file-button {
  background: #294594;
  color: #fff;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: background 0.2s;
}

.file-button:hover {
  background: #1f3f73;
}

.cert-warning {
  font-size: 13px;
  color: #d32f2f;
}

/* 오프라인 교육 - 일시 */
.datetime-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  margin: 12px 0;
}

.label-text {
  font-weight: 600;
  color: #294594;
  font-size: 14px;
  min-width: 80px;
}

.label-text::before {
  content: '🗓️ ';
  display: inline-block;
  margin-right: 6px;
}

.datetime-value {
  color: #10243b;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}


/* 오프라인 교육 - 퀴즈 섹션 */
.quiz-button-section {
  display: flex;
  margin: 16px 0;
}

.quiz-button {
  background: #2b57a0;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
}

.quiz-button:hover {
  background: #1f3f73;
}

/* 퀴즈 완료 */
.quiz-completed-section {
  background: #f0f9ff;
  border: 1px solid #294594;
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
}

.quiz-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.quiz-label {
  font-weight: 600;
  color: #294594;
  font-size: 14px;
}

.quiz-date {
  color: #10243b;
  font-size: 13px;
}

.quiz-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}

.score-label {
  font-weight: 700;
  font-size: 18px;
  color: #10243b;
}

.passing-status {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.passing-status.pass {
  background: #d4edda;
  color: #155724;
}

.passing-status.fail {
  background: #f8d7da;
  color: #721c24;
}

.passing-score-info {
  font-size: 12px;
  color: #721c24;
  font-weight: 500;
}

/* 하단 첨부파일 */
.attachments-fixed {
  bottom: 68px;
  left: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 3%;
  background: #f8f9fa;
  border-top: 1px solid #eef3fb;
  border-bottom: 1px solid #eef3fb;
  border-radius: 4px;
}

.attachment-label {
  color: #10243b;
  font-weight: 500;
  font-size: 14px;
}

.download-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #2b57a0;
  padding: 4px 8px;
  padding-right: 3%;
}

.download-btn:hover {
  background: rgba(41, 69, 148, 0.1);
  border-radius: 4px;
}

/* 버튼 영역 */
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 16px;
  margin-top: 12px;
}

.btn-confirm {
  background: transparent;
  border: 1px solid #294594;
  color: #294594;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.btn-confirm:hover {
  background: rgba(41, 69, 148, 0.1);
}

/* 반응형 */
@media (max-width: 640px) {
  .detail-modal {
    width: 100%;
    padding: 16px;
  }

  .title-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-badge {
    width: 100%;
    text-align: center;
  }
}

/* 스크롤바 숨김 */
.detail-modal::-webkit-scrollbar {
  width: 6px;
}

.detail-modal::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 6px;
}
</style>
