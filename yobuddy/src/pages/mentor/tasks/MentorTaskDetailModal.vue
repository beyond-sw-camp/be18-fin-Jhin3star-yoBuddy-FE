<template>
  <div 
    class="modal-overlay"
    @mousedown="isDragging = false"
    @mousemove="isDragging = true"
    @mouseup.self="onOverlayClick"
  >
    <div class="modal">
      <div class="modal-header">
        <h2>{{ task?.title || '과제 상세' }}</h2>
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
          <div class="top-label">상태</div>
          <div class="top-value">
            <span class="chip" :class="chipClass">
              {{ statusLabel(task.status) }}
            </span>
          </div>
        </div>
      </div>

      <div class="modal-body" v-if="task">
        <label class="section-label">과제 설명:</label>
        <div class="plain-text">{{ task.description || '설명 없음' }}</div>

        <label class="section-label">과제 첨부파일:</label>
        <div
          v-if="task.taskFiles && task.taskFiles.length"
          class="attached-file"
        >
          <input
            class="file-name-box"
            type="text"
            :value="task.taskFiles[0].fileName"
            disabled
          />
          <button
            class="download-btn"
            @click="downloadFile(task.taskFiles[0])"
          >
            다운로드
          </button>
        </div>
        <div v-else class="plain-text">첨부된 파일이 없습니다.</div>

        <label class="section-label">제출파일:</label>
        <div
          v-if="task.submittedFiles && task.submittedFiles.length"
          class="attached-file"
        >
          <input
            class="file-name-box"
            type="text"
            :value="task.submittedFiles[0].fileName"
            disabled
          />
          <button
            class="download-btn"
            @click="downloadFile(task.submittedFiles[0])"
          >
            다운로드
          </button>
        </div>
        <div v-else class="plain-text">제출된 파일이 없습니다.</div>

        <template v-if="task.status === 'GRADED'">
          <label class="section-label">과제 점수:</label>
          <div class="plain-text">
            <strong>{{ task.grade }}</strong> / {{ task.points || 100 }}
          </div>

          <label class="section-label">피드백:</label>
          <div class="plain-text">
            {{ task.feedback || '피드백 없음' }}
          </div>
        </template>
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

const emit = defineEmits(['close'])

const auth = useAuthStore()

const task = ref(null)
const isDragging = ref(false)

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

    if (data?.dueDate && data?.status === 'PENDING') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(data.dueDate)
      due.setHours(0, 0, 0, 0)
      if (due < today) {
        data.status = 'MISSING'
      }
    }

    task.value = data
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

function statusLabel(s) {
  const map = {
    PENDING: '제출 전',
    SUBMITTED: '제출 완료',
    LATE: '지각 제출',
    MISSING: '미제출',
    GRADED: '채점 완료'
  }
  return map[s] || s
}

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

const chipClass = computed(() => {
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
  width: 520px;
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
}

.chip {
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 12px;
  color: white;
}

.chip-pending  { background: #d8d8d8; color: #6f6f6f; }
.chip-submitted { background: #e9f0ff;  color: #294594; }
.chip-late,
.chip-missing  { background: #f8e3e2; color: #ae5e62; }
.chip-graded   { background: #e3f7e9; color: #0a9a52; }

.section-label {
  display: block;
  margin-top: 18px;
  margin-bottom: 4px;
  font-weight: 400;
  color: #979797;
}

.plain-text {
  font-size: 15px;
  color: #162550;
  line-height: 1.45;
  margin-bottom: 6px;
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

.modal-actions {
  margin-top: 26px;
  text-align: center;
}
</style>
