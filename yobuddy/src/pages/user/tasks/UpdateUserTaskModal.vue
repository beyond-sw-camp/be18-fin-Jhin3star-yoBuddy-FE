<template>
  <div 
    class="modal-overlay"
    @mousedown="isDragging = false"
    @mousemove="isDragging = true"
    @mouseup.self="onOverlayClick"
  >
    <div class="modal">

      <!-- HEADER -->
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
            @click="() => window.open(task.taskFiles[0].filePath, '_blank')"
          >
            다운로드
          </button>
        </div>

        <label class="section-label">코멘트:</label>
        <input
          v-model="form.comment"
          type="text"
          class="comment-input"
          placeholder="예: 과제에 대한 코멘트나 추가 설명을 입력하세요."
        />

        <label class="section-label">제출파일:</label>

        <div
          class="file-drop-wrapper"
          @click="triggerFileInput"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
          :class="{ 'drag-active': dragging }"
        >
          <input ref="fileInput" type="file" @change="onFileChange" hidden />

          <div class="file-drop-inner">
            <div class="upload-icon">⬆</div>
            <p>업로드를 위해 클릭하거나 파일을 끌어다 놓으세요.</p>
            <span class="sub-text">모든 파일 형식이 가능합니다.</span>

            <div v-if="form.file" class="selected-file">
              선택됨: {{ form.file.name }}
            </div>
          </div>
        </div>

        <div
          class="submitted-list"
          v-if="task?.submittedFiles?.length"
        >
          <div
            v-for="file in task.submittedFiles"
            :key="file.fileId"
            class="submitted-item"
          >
            {{ file.fileName }}
            <button
              class="download-btn-inline"
              @click.stop="openFile(file.filePath)"
            >
              다운로드
            </button>
          </div>
        </div>
        <div v-else class="no-file">
          기존 제출된 파일이 없습니다.
        </div>

        <div v-if="error" class="modal-error">{{ error }}</div>
      </div>

      <div class="modal-actions">
        <button class="submit-btn" @click="submit" :disabled="loading">
          {{ loading ? "제출중..." : submitButtonLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, onMounted, computed } from "vue";
import { useAuthStore } from "@/store/authStore";
import tasksService from "@/services/tasksService";

const props = defineProps({
  show: { type: Boolean, required: true },
  userTaskId: { type: Number, required: true }
});

const emit = defineEmits(["close", "submitted"]);
const auth = useAuthStore();

const task = ref(null);

const form = ref({ comment: "", file: null });
const loading = ref(false);
const error = ref("");

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

async function loadTaskDetail() {
  try {
    if (!auth.user) {
      await auth.loadUser();
    }

    const userId = auth.user.userId;

    const resp = await tasksService.getUserTaskDetail(
      userId, 
      props.userTaskId
    );

    const data = resp.data.data;

    if (data?.dueDate && data?.status === "PENDING") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = new Date(data.dueDate);
      due.setHours(0, 0, 0, 0);

      if (due < today) {
        data.status = "MISSING";
      }
    }

    task.value = data;

    form.value.comment = data.comment || "";
    form.value.file = null;

  } catch (e) {
    console.error("상세조회 실패:", e);
  }
}

onMounted(() => {
  loadTaskDetail();
});

watch(
  () => props.show,
  (val) => {
    if (val) {
      loadTaskDetail();
    }
  }
);

const isDragging = ref(false);
function onOverlayClick() { if (!isDragging.value) close(); }
function close() { emit("close"); }

const fileInput = ref(null);
const dragging = ref(false);

function triggerFileInput() {
  fileInput.value?.click();
}

function onDrop(e) {
  dragging.value = false;
  const dropped = e.dataTransfer.files?.[0];
  if (dropped) form.value.file = dropped;
}

function onFileChange(e) {
  form.value.file = e.target.files?.[0] || null;
}

function openFile(url) {
  window.open(url, "_blank");
}

const submitButtonLabel = computed(() =>
  task.value?.status === "SUBMITTED" ? "다시 제출" : "제출"
);

async function submit() {
  loading.value = true;
  error.value = "";

  try {
    const fd = new FormData();
    fd.append("comment", form.value.comment || "");

    if (form.value.file) {
      fd.append("files", form.value.file);
    }

    await tasksService.submitUserTask(
      auth.user.userId,
      props.userTaskId,
      fd
    );

    emit("submitted");
    close();

  } catch (e) {
    console.error("제출 실패:", e);
    error.value = "제출 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
}

function statusLabel(s) {
  const map = {
    PENDING: "제출 전",
    SUBMITTED: "제출 완료",
    LATE: "지각 제출",
    MISSING: "미제출",
    GRADED: "채점 완료"
  }
  return map[s] || s
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

.due-wrapper {
  display: flex;
  flex-direction: column;
  text-align: center;
  margin-right: 80px;
}
.due-title {
  font-size: 12px;
  color: #999;
}
.due-date {
  font-size: 15px;
  font-weight: 400;
  color: #162550;
  margin-top: 2px;
}

.section-label {
  display: block;
  margin-top: 18px;
  margin-bottom: 4px;
  font-weight: 400;
  color: #979797;
}

.info-box {
  background: #f1f5f9;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.description {
  white-space: pre-line;
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
.download-btn:hover {
  background: #1e346c;
}

.submitted-list {
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  padding: 12px;
  border-radius: 10px;
}
.submitted-item {
  margin-bottom: 6px;
}
.no-file {
  color: #94a3b8;
}

.comment-input {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
}

.file-drop-wrapper {
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  padding: 24px;
  text-align: center;
  background: #f8fafc;
  transition: 0.2s;
  cursor: pointer;
}

.file-drop-wrapper.drag-active {
  background: #edf2ff;
  border-color: #294594;
}
.upload-icon {
  font-size: 32px;
  color: #294594;
}

.sub-text {
  font-size: 12px;
  color: #999;
}

.selected-file {
  margin-top: 10px;
  font-size: 14px;
  color: #555;
}

.modal-actions {
  margin-top: 24px;
  text-align: center;
}

.submit-btn {
  background: #294594;
  color: white;
  padding: 12px 28px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
}
.submit-btn:hover {
  background: #203a78;
}

.modal-error {
  background: #ffe2e2;
  color: #b00020;
  padding: 10px;
  border-radius: 10px;
  margin-top: 10px;
}

.plain-text {
  font-size: 15px;
  color: #162550;
  line-height: 1.45;
  margin-bottom: 6px;
}

.download-btn-inline {
  margin-left: 8px;
  background: #294594;
  color: #fff;
  padding: 6px 12px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  cursor: pointer;
}
.download-btn-inline:hover {
  background: #1e346c;
}

.submitted-inline {
  margin-bottom: 4px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
