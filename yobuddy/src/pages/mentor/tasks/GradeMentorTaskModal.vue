<template>
  <div 
    class="modal-overlay"
    @mousedown="isDragging = false"
    @mousemove="isDragging = true"
    @mouseup.self="onOverlayClick"
  >
    <div class="modal">
      <div class="modal-header">
        <h2>{{ task?.title || '과제 채점' }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-top-info" v-if="task">
        <div class="top-item">
          <div class="top-label">마감일</div>
          <div class="top-value">
            {{ formatDateTime(task.dueDate) }}
          </div>
        </div>

        <div class="top-item">
          <div class="top-label">제출시간</div>
          <div class="top-value">
            <span v-if="task.submittedAt">
              {{ formatDateTime(task.submittedAt) }}
            </span>
            <span v-else>-</span>
          </div>
        </div>

        <div class="top-item">
          <div class="top-label">상태</div>
          <div class="top-value">
            <span class="chip" :class="statusChipClass">
              {{ statusLabel(task.status) }}
            </span>
          </div>
        </div>
      </div>

      <div class="modal-body" v-if="task">
        <label class="section-label">Comment</label>
        <div class="plain-box">
          {{ task.comment || '제출된 코멘트가 없습니다.' }}
        </div>

        <label class="section-label">첨부파일</label>
        <div v-if="task.submittedFiles && task.submittedFiles.length" class="files-wrapper">
          <div
            v-for="file in task.submittedFiles"
            :key="file.fileId"
            class="attached-file"
          >
            <input
              class="file-name-box"
              type="text"
              :value="file.fileName"
              disabled
            />
            <button
              class="download-btn"
              @click="downloadFile(file)"
            >
              다운로드
            </button>
          </div>
        </div>
        <div v-else class="plain-box">
          제출된 파일이 없습니다.
        </div>

        <div class="grade-feedback-row">
          <div class="grade-box">
            <label class="section-label">과제 채점</label>
            <div class="grade-input-wrapper">
              <input
                v-model.number="grade"
                type="number"
                class="grade-input"
                :min="0"
                :max="100"
                placeholder="점수 입력"
              />
              <span class="grade-total">
                / {{ task.points || 100 }}
              </span>
            </div>
          </div>

          <div class="feedback-box">
            <label class="section-label">피드백</label>
            <textarea
              v-model="feedback"
              class="feedback-textarea"
              placeholder="멘티에게 전달할 피드백을 작성하세요..."
            ></textarea>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button
          class="submit-btn"
          :disabled="saving || grade === null || grade === ''"
          @click="saveGrade"
        >
          {{ buttonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  defineProps,
  defineEmits,
  watch,
  onMounted,
  computed
} from 'vue'
import { useAuthStore } from '@/store/authStore'
import tasksService from '@/services/tasksService'
import fileService from '@/services/fileService'

const props = defineProps({
  show: { type: Boolean, required: true },
  userTaskId: { type: Number, required: true }
})

const emit = defineEmits(['close', 'graded'])

const auth = useAuthStore()

const task = ref(null)
const grade = ref(null)
const feedback = ref('')
const saving = ref(false)
const isDragging = ref(false)

const maxPoints = computed(() => task.value?.points ?? 100)

async function loadTaskDetail() {
  try {
    if (!auth.user) {
      await auth.loadUser()
    }
    const mentorId = auth.user?.userId
    if (!mentorId) return

    const resp = await tasksService.getMentorTaskDetail(
      mentorId,
      props.userTaskId
    )
    const data = resp.data?.data
    task.value = data

    grade.value = data?.grade ?? null
    feedback.value = data?.feedback ?? ''
  } catch (e) {
    console.error('멘토 과제 상세 조회 실패:', e)
  }
}

onMounted(() => {
  if (props.show) {
    loadTaskDetail()
  }
})

watch(
  () => props.show,
  (v) => {
    if (v) loadTaskDetail()
  }
)

watch(grade, (val) => {
  if (val === null || val === '' || isNaN(val)) return

  const max = maxPoints.value

  if (val < 0) {
    grade.value = 0
  } else if (val > max) {
    grade.value = max
  }
})

async function saveGrade() {
  if (!task.value) return
  if (grade.value === null || grade.value === '') return

  if (grade.value < 0) grade.value = 0
  if (grade.value > maxPoints.value) grade.value = maxPoints.value

  try {
    saving.value = true

    if (!auth.user) {
      await auth.loadUser()
    }

    const mentorId = auth.user?.userId
    if (!mentorId) return

    const body = {
      grade: grade.value,
      feedback: feedback.value
    }

    await tasksService.gradeUserTask(mentorId, props.userTaskId, body)

    emit('graded')
    close()
  } catch (e) {
    console.error('과제 채점 실패:', e)
  } finally {
    saving.value = false
  }
}

function statusLabel(s) {
  const map = {
    PENDING: '제출 전',
    SUBMITTED: '제출 완료',
    LATE: '지각 제출',
    MISSING: '미제출',
    GRADED: '완료'
  }
  return map[s] || s
}

const statusChipClass = computed(() => {
  if (!task.value) return ''
  const s = task.value.status
  return {
    PENDING: 'chip-pending',
    SUBMITTED: 'chip-submitted',
    LATE: 'chip-late',
    MISSING: 'chip-missing',
    GRADED: 'chip-graded'
  }[s] || ''
})

const buttonText = computed(() => {
  if (saving.value) return '저장 중...'
  if (task.value?.status === 'GRADED') return '다시 채점'
  return '채점'
})

function formatDateTime(v) {
  if (!v) return '-'
  const d = new Date(v)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

async function downloadFile(file) {
  if (!file || !file.fileId) return
  try {
    await fileService.downloadFiles(file.fileId, file.fileName)
  } catch (e) {
    console.error('파일 다운로드 실패:', e)
    alert('파일 다운로드 중 오류가 발생했습니다.')
  }
}

function onOverlayClick() {
  if (!isDragging.value) close()
}

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
  z-index: 101;
}

.modal {
  width: 600px;
  padding: 20px 26px 28px;
  border-radius: 10px;
  background: white;
  animation: fadeIn 0.25s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
}

.close-btn {
  font-size: 28px;
  border: none;
  background: none;
  cursor: pointer;
  color: #777;
}

.modal-top-info {
  margin-top: 14px;
  padding: 10px 16px;
  border-radius: 10px;
  background: #f4f7fd;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.top-item {
  flex: 1;
}

.top-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.top-value {
  font-size: 14px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.chip-pending {
  background: #e5e7eb;
  color: #4b5563;
}
.chip-submitted {
  background: #e9f0ff;
  color: #294594;
}
.chip-late,
.chip-missing {
  background: #fef3c7;
  color: #b45309;
}
.chip-graded {
  background: #dcfce7;
  color: #059669;
}

.chip-late {
  background: #fee2e2;
  color: #b91c1c;
}

.modal-body {
  margin-top: 18px;
}

.section-label {
  display: block;
  margin-top: 18px;
  margin-bottom: 4px;
  font-weight: 400;
  color: #979797;
  font-size: 13px;
}

.plain-box {
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: #162550;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.files-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.attached-file {
  display: flex;
  gap: 10px;
}

.file-name-box {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d0d7df;
  background: #edf0f4;
  color: #333;
  font-size: 14px;
}

.download-btn {
  background: #294594;
  color: #fff;
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
}

.grade-feedback-row {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.grade-box {
  flex: 0.8;
}

.feedback-box {
  flex: 1.2;
}

.grade-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  background: #f9fafb;
}

.grade-input {
  width: 70px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  font-weight: 600;
  text-align: right;
}

.grade-total {
  font-size: 14px;
  color: #6b7280;
}

.feedback-textarea {
  width: 100%;
  min-height: 96px;
  resize: vertical;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

.modal-actions {
  margin-top: 24px;
  text-align: center;
}

.submit-btn {
  background: #294594;
  color: #fff;
  padding: 12px 28px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.grade-input::-webkit-outer-spin-button,
.grade-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.grade-input {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>