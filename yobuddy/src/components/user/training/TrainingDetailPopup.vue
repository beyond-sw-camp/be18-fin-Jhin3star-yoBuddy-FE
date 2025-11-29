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
            <span :class="['status-badge', statusClass(displayStatus)]">{{ statusLabel(displayStatus) }}</span>
          </div>
          
          <!-- 설명 -->
          <div class="desc-section">
            <div class="desc-box">{{ training?.description || training?.summary || training?.subtitle || training?.content || '—' }}</div>
          </div>

          <!-- 온라인 교육 -->
          <template v-if="training?.type === 'ONLINE'">

          <!-- URL 링크 -->
            <div class="url-row">
              <span class="date">💻 </span>
              <a v-if="training?.onlineUrl || training?.link" :href="training.onlineUrl || training.link" target="_blank" class="url-link">{{ training.onlineUrl || training.link }}</a>
              <span v-else class="url-empty">정보 없음</span>
            </div>

            <!-- 교육 일시 -->
            <div class="datetime-row">
              <div class="label-text">수강 가능 기간:</div>
              <div class="datetime-value">{{ formatDateRange(training?.startDate, training?.endDate) }}</div>
            </div>
            <!-- 이수증 섹션 (상태 기반) -->
            <div v-if="isOnlineCompleted && hasSubmittedCertificate" class="certificate-section certificate-flat">
              <div class="cert-top-row">
                <div class="file-label">이수증 제출 완료</div>
                <span class="file-button" @click="openResubmitPicker">다시 제출하기</span>
              </div>
              <div class="cert-meta-row">
                <div class="cert-meta">
                  <span class="meta-val">{{ submittedFileName }}</span>
                </div>
                <div class="cert-meta cert-meta-date">
                  <span class="meta-val">{{ formatDateTime(certificateUploadedAt) }}</span>
                </div>
                <input ref="resubmitInput" type="file" @change="onFileChange" accept=".pdf" class="file-input-hidden">
              </div>
            </div>
            <div v-else class="certificate-upload-section">
              <label class="file-input-label">
              <div class="file-label">이수증 제출 전</div>
                <input type="file" @change="onFileChange" accept=".pdf" class="file-input-hidden">
                <span class="file-button"> 제출하기</span>
              </label>
              <span v-if="certWarning" class="cert-warning">{{ certWarning }}</span>
            </div>
          </template>

            <!-- 오프라인 교육 -->
          <template v-if="training?.type === 'OFFLINE'">
            <!-- 교육 일시 -->
              <div class="label-text">교육 일시</div>
              <div class="datetime-value">{{ formatDateTime(training?.scheduledAt) }}</div>
       

            <!-- 퀴즈 응시 섹션 (상태 기반) -->
            <div v-if="isOfflineCompleted && isQuizSubmitted" class="quiz-completed-section">
              <div class="quiz-left">
                <span class="quiz-label">퀴즈 응시 완료:</span>
                <span class="quiz-date">{{ formatDateTime(training?.submittedAt) }}</span>
              </div>
              <div class="quiz-right">
                <span class="score-label">{{ training?.score }}점</span>
                <span :class="['passing-status', isPassingScore ? 'pass' : 'fail']">
                  {{ isPassingScore ? 'PASS' : 'FAIL' }}
                </span>
              </div>
              <span v-if="isOfflineCompleted && !isPassingScore" class="passing-score-info">
                (통과 점수: {{ training?.passingScore }}점)
              </span>
            </div>
            <div v-else class="quiz-button-section">
              <label class="quiz-input-label">
                <div>
                  <div class="quiz-label">
                    퀴즈 응시 전
                    <span v-if="isOfflineUpcoming" class="quiz-sub-label">(교육 참석 후 퀴즈를 응시해 주세요.)</span>
                  </div>
                  <span v-if="shouldShowQuizSubLabel" class="quiz-sub-label">(이메일과 알림을 확인해 주세요)</span>
                </div>
              </label>
            </div>
          </template>
        </section>
        <!-- 하단 고정 첨부파일 -->
        <div v-if="attachments.length" class="attachments-fixed">
          <ul class="attachment-list">
            <li v-for="file in attachments" :key="file.fileId || file.id" class="attachment-item">
              <span class="attachment-name">{{ file.filename || file.originalName || file.name || '첨부파일' }}</span>
              <button type="button" class="download-btn" @click="downloadAttachment(file)">다운로드</button>
            </li>
          </ul>
        </div>
        <footer class="modal-actions">
          <button class="btn-confirm" @click="$emit('close')">확인</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import fileService from '@/services/fileService';
import userTrainingService from '@/services/userTrainingService';
import { useAuthStore } from '@/store/authStore';

export default {
  name: 'TrainingDetailPopup',
  emits: ['close', 'certificateSubmitted'],
  props: { training: { type: Object, default: null }, visible: { type: Boolean, default: false } },
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  },
  data() {
    return { 
      certFile: null,
      certWarning: '',
      localCertificates: [],
      localStatus: null
    }
  },
  computed: {
    displayStatus() {
      const baseStatus = this.currentStatus
      return baseStatus || '값 없음'
    },
    currentStatus() {
      return String(this.localStatus || this.training?.status || '').toUpperCase()
    },
    isOnlineCompleted() {
      const status = this.currentStatus
      return (status === 'COMPLETED' || status === 'TARDY') && this.training?.type === 'ONLINE'
    },
    isOfflineCompleted() {
      return String(this.training?.status || '').toUpperCase() === 'COMPLETED' && this.training?.type === 'OFFLINE'
    },
    isOfflinePending() {
      return String(this.training?.status || '').toUpperCase() !== 'COMPLETED' && this.training?.type === 'OFFLINE'
    },
    isOfflineUpcoming() {
      const status = String(this.training?.status || '').toUpperCase()
      return this.training?.type === 'OFFLINE' && (status === 'UPCOMING' || status === 'PENDING')
    },
    isPassingScore() {
      return this.training?.score >= this.training?.passingScore
    },
    isQuizSubmitted() {
      return Boolean(this.training?.submittedAt)
    },
    shouldShowQuizSubLabel() {
      return this.isOfflineCompleted && !this.isQuizSubmitted
    },
    hasSubmittedCertificate() {
      return Boolean(
        this.certificateFiles[0]?.filename
        || this.training?.certificateFileName
        || this.training?.certificateName
        || this.training?.fileName
        || this.training?.filename
        || this.training?.certificateUrl
      )
    },
    submittedFileName() {
      return this.certificateFiles[0]?.filename
        || this.training?.certificateFileName
        || this.training?.certificateName
        || this.training?.fileName
        || this.training?.filename
        || '제출된 파일 없음'
    },
    certificateUploadedAt() {
      return this.certificateFiles[0]?.uploadedAt || this.training?.completedAt
    },
    attachments() {
      if (Array.isArray(this.training?.trainingFiles)) return this.training.trainingFiles
      if (Array.isArray(this.training?.attachedFiles)) return this.training.attachedFiles
      return []
    },
    certificateFiles() {
      if (this.localCertificates.length) return this.localCertificates
      return Array.isArray(this.training?.certificateFiles)
        ? this.training.certificateFiles
        : []
    }
  },
  watch: {
    training: {
      immediate: true,
      handler(val) {
        this.localCertificates = Array.isArray(val?.certificateFiles) ? [...val.certificateFiles] : []
        this.localStatus = val?.status || null
      }
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
    formatDateYMD(d) {
      if (!d) return '—'
      try {
        const dt = new Date(d)
        if (Number.isNaN(dt.getTime())) return '—'
        const y = dt.getFullYear()
        const m = String(dt.getMonth() + 1).padStart(2, '0')
        const day = String(dt.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      } catch (e) {
        return '—'
      }
    },
    formatDateRange(start, end) {
      if (!start && !end) return '—'
      const startStr = start ? this.formatDateYMD(start) : '—'
      const endStr = end ? this.formatDateYMD(end) : '—'
      return `${startStr} ~ ${endStr}`
    },
    statusLabel(s) {
      if (!s) return '할당 전'
      const up = String(s).toUpperCase()
      if (up === 'ACTIVE' || up === 'IN_PROGRESS') return '진행 중'
      if (up === 'COMPLETED') return '완료'
      if (up === 'UPCOMING' || up === 'PENDING') return '예정'
      if (up === 'MISSED') return '미이수'
      return s
    },
    statusClass(s) {
      const up = String(s || '').toUpperCase()
      if (up === 'MISSED' || up === 'TARDY') return 'late'
      if (up === 'COMPLETED') return 'completed'
      if (up === 'ACTIVE' || up === 'IN_PROGRESS') return 'in_progress'
      if (up === 'UPCOMING' || up === 'PENDING') return 'pending'
      return 'pending'
    },
    onFileChange(e) {
      const f = e.target.files && e.target.files[0]
      if (!f) return
      
      this.certFile = f
      this.certWarning = ''
      this.uploadCertificate()
    },
    openResubmitPicker() {
      const input = this.$refs && this.$refs.resubmitInput
      if (!input) return
      input.value = ''
      input.click()
    },
    async uploadCertificate() {
      if (!this.certFile) return
      try {
        const form = new FormData()
        form.append('files', this.certFile)
        const uploadedName = this.certFile.name
        
        const userId = this.training?.userId || this.authStore.user?.userId || this.authStore.user?.id
        const trainingId = this.training?.trainingId || this.training?.id
        
        if (!userId || !trainingId) {
          alert('필수 정보가 없습니다.')
          return
        }
        
        // 이수증 업로드 API 호출
        await userTrainingService.submitCertificate(userId, trainingId, form)
        this.certWarning = '이수증이 제출되었습니다.'
        const nextCertificates = Array.isArray(this.certificateFiles) ? [...this.certificateFiles] : []
        nextCertificates.unshift({
          filename: uploadedName,
          uploadedAt: new Date().toISOString()
        })
        this.localCertificates = nextCertificates

        let nextStatus = this.currentStatus
        if (this.training?.type === 'ONLINE') {
          const endDate = this.training?.endDate ? new Date(this.training.endDate) : null
          const now = new Date()
          const pastEnd = endDate ? now > endDate : false
          nextStatus = pastEnd ? 'TARDY' : 'COMPLETED'
          this.localStatus = nextStatus
        }

        this.certFile = null
        this.$emit('certificateSubmitted', {
          ...this.training,
          certificateFiles: nextCertificates,
          status: nextStatus
        })
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
    },
    async downloadAttachment(file) {
      const fileId = file?.fileId || file?.id
      const fileName = file?.filename || file?.originalName || file?.name || '첨부파일'
      if (!fileId) {
        alert('파일 정보가 없습니다.')
        return
      }
      try {
        await fileService.downloadFiles(fileId, fileName)
      } catch (e) {
        console.error('첨부파일 다운로드 실패', e)
        alert('첨부파일 다운로드 중 오류가 발생했습니다.')
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
  max-width: calc(100% - 60px);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 12px;
  padding: 28px 36px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 40px rgba(3, 10, 18, 0.12);
  position: relative;
}

/* 헤더 */
.modal-top {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  height: 52px;
  margin-bottom: 16px;
}

.back-btn {
  position: absolute;
  right: 0;
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

.status-badge.in_progress {
  background: #e9f0ff;
  color: #294594;
}

.status-badge.pending {
  background: #f6f8d1;
  color: #b0b900;
}

.status-badge.late {
  background: #F8E3E2;
  color: #AE5E62;
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
  margin: 8px 0;
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
  padding: 8px 10px;
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
  display: flex;
  justify-content: flex-end;
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
  margin: 8px 0;
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
.quiz-input-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 4px;
  margin: 12px 0 4px;
}

.quiz-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.quiz-icon {
  width: 18px;
  height: 18px;
  display: inline-block;
  background: center / contain no-repeat url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%239aa0af' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M6 2h8l4 4v16H6z'/><path d='M14 2v6h6'/></svg>");
}

.quiz-label {
  font-weight: 600;
  color: #294594;
  font-size: 14px;
}

.quiz-label::before {
  content: '📝 ';
  font-size: 16px;
  line-height: 1;
}

.quiz-sub-label {
  font-weight: 500;
  color: #294594;
  font-size: 11px;
}

.quiz-date {
  color: #10243b;
  font-size: 13px;
}

.quiz-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 0 0 auto;
}

.score-label {
  font-weight: 600;
  font-size: 16px;
  color: #10243b;
}

.passing-status {
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.passing-status.pass {
  background: #e5f4e7;
  color: #2c5933;
}

.passing-status.fail {
  background: #fdebec;
  color: #9a1f2e;
}

.passing-score-info {
  font-size: 12px;
  color: #721c24;
  font-weight: 500;
  display: block;
  text-align: right;
  margin-top: 4px;
  width: 100%;
}

/* 하단 첨부파일 */
.attachments-fixed {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #eef3fb;
  border-radius: 6px;
}

.attachment-title {
  color: #10243b;
  font-weight: 500;
  font-size: 15px;
}

.attachment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-top: 1px solid #eef3fb;
}

.attachment-item:first-child {
  border-top: none;
}

.attachment-name {
  font-size: 14px;
  color: #10243b;
  margin-right: 12px;
  word-break: break-all;
}

.download-btn {
  background: #294594;
  border: none;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
}

.download-btn:hover {
  background: #1f3f73;
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
