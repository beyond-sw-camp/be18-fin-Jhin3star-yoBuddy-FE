<template>
  <div 
    class="modal-overlay"
    @mousedown="isDragging = false"
    @mousemove="isDragging = true"
    @mouseup.self="onOverlayClick"
  >
    <div class="modal">
      <div class="modal-header">
        <h2>{{ task?.title }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-top-info" v-if="task">
        <div class="status-wrapper">
          <label class="section-label">과제 상태: </label>
          <div class="status-badge" :class="'status ' + task.status.toLowerCase()">
            {{ statusLabel(task.status) }}
          </div>
        </div>

        <div class="due-wrapper">
          <label class="section-label">마감일</label>
          <span class="due-date">{{ formatDate(task.dueDate) }}</span>
        </div>
      </div>

      <div class="modal-body" v-if="task">
        <label class="section-label">과제 설명:</label>
        <div class="plain-text">{{ task.description }}</div>

        <label class="section-label">첨부파일:</label>
        <div class="attached-file">
          <input
            class="file-name-box"
            type="text"
            :value="task.taskFiles?.[0]?.fileName || '첨부파일 없음'"
            disabled
          />
          <button
            v-if="task.taskFiles?.length"
            class="download-btn"
            @click="openFile(task.taskFiles[0])"
          >
            다운로드
          </button>
        </div>

        <label class="section-label">제출파일:</label>
        <div class="attached-file">
          <input
            class="file-name-box"
            type="text"
            :value="task.submittedFiles?.[0]?.fileName || '제출된 파일 없음'"
            disabled
          />
          <button
            v-if="task.submittedFiles?.length"
            class="download-btn"
            @click="openFile(task.submittedFiles[0])"
          >
            다운로드
          </button>
        </div>

        <template v-if="task.status === 'SUBMITTED' || task.status === 'LATE'">
          <label class="section-label" style="margin-top: 22px;">작성한 코멘트:</label>
          <div class="plain-text">{{ task.comment || '코멘트가 없습니다.' }}</div>
        </template>

        <template v-if="task.status === 'GRADED'">
          <label class="section-label" style="margin-top: 22px;">작성한 코멘트:</label>
          <div class="plain-text">{{ task.comment || '코멘트가 없습니다.' }}</div>

          <label class="section-label">과제 점수:</label>
          <div class="plain-text">
            <strong>{{ task.grade }}</strong> / 100
          </div>

          <label class="section-label">피드백:</label>
          <div class="plain-text">
            {{ task.feedback || '피드백 없음' }}
          </div>
        </template>
      </div>

      <div class="modal-actions">
        <button
          v-if="canEdit"
          class="submit-btn"
          @click="openEdit"
        >
          수정
        </button>
      </div>
    </div>

    <UpdateUserTaskModal
     v-if="showEditModal"
     :show="showEditModal"
     :userTaskId="userTaskId"
     :initialComment="task?.comment || ''"
     :initialSubmittedFiles="task?.submittedFiles || []"
     @updated="handleUpdated"
     @submitted="handleSubmitted"
     @close="showEditModal = false"
    />
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, onMounted, computed } from "vue"
import { useAuthStore } from "@/store/authStore"
import tasksService from "@/services/tasksService"
import UpdateUserTaskModal from "@/pages/user/tasks/UpdateUserTaskModal.vue"
import fileService from "@/services/fileService"

const props = defineProps({
  show: { type: Boolean, required: true },
  userTaskId: { type: Number, required: true }
})
const emit = defineEmits(["close", "submitted"])

const auth = useAuthStore()
const task = ref(null)
const showEditModal = ref(false)

async function loadTaskDetail() {
  try {
    if (!auth.user) await auth.loadUser()
    const resp = await tasksService.getUserTaskDetail(auth.user.userId, props.userTaskId)
    const data = resp.data.data

    if (data?.dueDate && data?.status === "PENDING") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const due = new Date(data.dueDate)
      due.setHours(0, 0, 0, 0)

      if (due < today) {
        data.status = "MISSING"
      }
    }

    task.value = data
  } catch (e) {
    console.error("상세조회 실패:", e)
  }
}

onMounted(() => {
  if (props.show) loadTaskDetail()
})
watch(() => props.show, v => v && loadTaskDetail())

const canEdit = computed(() => {
  if (!task.value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(task.value.dueDate)
  due.setHours(0, 0, 0, 0)

  if (task.value.status === "SUBMITTED") {
    return due >= today
  }

  if (task.value.status === "MISSING") {
    return true
  }

  return false
})

function openEdit() {
  showEditModal.value = true
}

function handleUpdated() {
  loadTaskDetail()
}

function handleSubmitted() {
  emit("submitted")
  showEditModal.value = false
  close()
}

function statusLabel(s) {
  return {
    PENDING: "제출 전",
    SUBMITTED: "제출 완료",
    LATE: "지각 제출",
    MISSING: "미제출",
    GRADED: "채점 완료"
  }[s] || s
}

function formatDate(d) {
  return new Date(d).toISOString().split("T")[0]
}

async function openFile(file) {
  if (!file) return
  try {
    await fileService.downloadFiles(file.fileId, file.fileName)
  } catch (e) {
    console.error("파일 다운로드 실패:", e)
    alert("파일 다운로드 중 오류가 발생했습니다.")
  }
}

const isDragging = ref(false)
function onOverlayClick() { if (!isDragging.value) close() }
function close() { emit("close") }
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
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-badge {
  padding: 6px 14px;
  margin-top: 15px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

.status.pending   { background: #d8d8d8; color: #6f6f6f; }
.status.submitted { background: #e9f0ff; color: #294594; }
.status.late      { background: #f8e3e2; color: #ae5e62; }
.status.missing   { background: #f8e3e2; color: #ae5e62; }
.status.graded    { background: #e3f7e9; color: #0a9a52; }

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

.due-wrapper {
  display: flex;
  flex-direction: column;
  text-align: center;
  margin-right: 80px;
}

.due-date {
  font-size: 15px;
  font-weight: 400;
  color: #162550;
  margin-top: 2px;
}

.modal-actions {
  margin-top: 26px;
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
</style>
