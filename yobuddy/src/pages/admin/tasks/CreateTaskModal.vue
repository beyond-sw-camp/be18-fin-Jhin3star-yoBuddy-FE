<template>
  <div 
  class="modal-overlay"
  @mousedown="isDragging = false"
  @mousemove="isDragging = true"
  @mouseup.self="onOverlayClick"
  >
    <div class="modal">
      <div class="modal-header">
        <h2>새 과제 등록</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">

        <!-- 과제명 -->
        <label>과제명:</label>
        <input
          v-model="form.title"
          type="text"
          placeholder="예: React 컴포넌트 만들기"
        />

        <!-- 설명 -->
        <label>설명:</label>
        <textarea
          v-model="form.description"
          placeholder="과제에 대한 설명을 입력하세요."
          rows="3"
        />

        <!-- 부서 -->
        <label>부서:</label>
        
        <div class="dropdown-wrapper">
          <!-- 선택된 부서 태그 표시 -->
          <div class="selected-tags" @click="toggleDropdown">
            <span
              v-for="d in selectedDepartments"
              :key="d.departmentId"
              class="tag"
            >
              {{ d.name }}
              <button class="remove-btn" @click.stop="removeDept(d.departmentId)">×</button>
            </span>

            <span v-if="selectedDepartments.length === 0" class="placeholder">
              부서를 선택하세요
            </span>

            <div class="arrow">▾</div>
          </div>

          <!-- 드롭다운 목록 -->
          <div v-if="dropdownOpen" class="dropdown-list">
            <div
              v-for="d in departments"
              :key="d.departmentId"
              class="dropdown-item"
              :class="{ selected: form.departmentIds.includes(d.departmentId) }"
              @click="toggleDept(d.departmentId)"
            >
              {{ d.name }}
            </div>
          </div>
        </div>


        <!-- 파일 업로드 -->
        <label>첨부파일:</label>
        <div
          class="file-drop-wrapper"
          @click="triggerFileInput"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop"
          :class="{ 'drag-active': dragging }"
        >
          <input ref="fileInput" type="file" @change="onFileChange" hidden />

          <div class="file-drop-inner">
            <div class="upload-icon">⬆</div>

            <p>업로드를 위해 클릭하거나 파일을 끌어다 놓으세요.</p>
            <span class="sub-text">*.zip, *.pdf 파일만 가능합니다.</span>

            <div v-if="file" class="selected-file">
              선택됨: {{ file.name }}
            </div>
          </div>
        </div>

        <div v-if="error" class="modal-error">{{ errorMessage }}</div>
      </div>

      <div class="modal-actions">
        <button class="submit-btn" @click="submit" :disabled="loading">
          {{ loading ? "등록중..." : "등록" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import tasksService from "@/services/tasksService";
import fileService from "@/services/fileService";

// eslint-disable-next-line no-undef
const props = defineProps({
  show: { type: Boolean, default: true },
  departments: { type: Array, default: () => [] },
});

// eslint-disable-next-line no-undef
const emit = defineEmits(["close", "created"]);

const form = ref({
  title: "",
  departmentIds: [],
  description: "",
});

/* 드롭다운 */
const dropdownOpen = ref(false);

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function closeDropdown(e) {
  if (!e.target.closest(".dropdown-wrapper")) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener("click", closeDropdown);
});
onBeforeUnmount(() => {
  window.removeEventListener("click", closeDropdown);
});

/* 선택된 부서 정보 */
const selectedDepartments = computed(() =>
  props.departments.filter(d => form.value.departmentIds.includes(d.departmentId))
);

/* 부서 선택 toggle */
function toggleDept(id) {
  if (form.value.departmentIds.includes(id)) {
    form.value.departmentIds = form.value.departmentIds.filter(x => x !== id);
  } else {
    form.value.departmentIds.push(id);
  }
}

function removeDept(id) {
  form.value.departmentIds = form.value.departmentIds.filter(x => x !== id);
}

/* 파일 업로드 */
const file = ref(null);
const fileInput = ref(null);
const dragging = ref(false);

function triggerFileInput() {
  fileInput.value?.click();
}
function onDragEnter() { dragging.value = true; }
function onDragOver() { dragging.value = true; }
function onDragLeave() { dragging.value = false; }
function onDrop(e) {
  dragging.value = false;
  const dropped = e.dataTransfer.files?.[0];
  if (dropped) file.value = dropped;
}
function onFileChange(e) {
  file.value = e.target.files?.[0] || null;
}

/* 에러 메시지 */
const loading = ref(false);
const error = ref(null);

const errorMessage = computed(() => {
  if (!error.value) return "";
  return (
    error.value.response?.data?.message ||
    error.value.message ||
    String(error.value)
  );
});

/* 모달 닫기 */
function close() {
  emit("close");
}

/* 제출 */
async function submit() {
  if (!form.value.title) {
    error.value = new Error("과제명을 입력하세요.");
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    let fileIds = [];

    if (file.value) {
      const uploaded = await fileService.uploadFiles(
        [file.value],
        'TASK', 
        null,  
        null    
      );

      if (Array.isArray(uploaded)) {
        fileIds = uploaded.map(f => f.fileId);
      } else if (Array.isArray(uploaded.data)) {
        fileIds = uploaded.data.map(f => f.fileId);
      } else if (uploaded.fileId) {
        fileIds = [uploaded.fileId];
      }
    }

    const body = {
      title: form.value.title,
      description: form.value.description,
      departmentIds: form.value.departmentIds,
      points: 100,  
      fileIds,     
    };

    const resp = await tasksService.create(body);

    emit("created", resp.data);

    form.value = { title: "", departmentIds: [], description: "" };
    file.value = null;

    close(); 

  } catch (e) {
    console.error("과제 생성 실패:", e);
    error.value = e;
  } finally {
    loading.value = false;
  }
}


const isDragging = ref(false);

function onOverlayClick() {
  if (!isDragging.value) {
    close();
  }
}
</script>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* Modal */
.modal {
  width: 540px;
  background: #ffffff;
  border-radius: 12px;
  padding: 24px 28px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.25s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 26px;
  cursor: pointer;
  color: #475569;
}

/* Body */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input, textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #294594;
  box-shadow: 0 0 0 3px rgba(41, 69, 148, 0.1);
}

textarea {
  resize: vertical;
  min-height: 80px;
}

input::placeholder, textarea::placeholder {
  color: #999;
  font-size: 14px;
  font-weight: 400;
  font-family: 'Pretendard', sans-serif;
}

label {
  font-weight: 600;
  font-size: 14px;
}

/* ===== Dropdown UI ===== */
.dropdown-wrapper {
  position: relative;
}

.selected-tags {
  min-height: 46px;
  padding: 8px 40px 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  background: #fff;
  cursor: pointer;
  position: relative;
}

.selected-tags:hover {
  border-color: #cbd5e1;
}

.placeholder {
  color: #94a3b8;
  font-size: 14px;
}

.tag {
  background: #294594;
  color: #fff;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.arrow {
  position: absolute;
  right: 12px;
  color: #475569;
  font-size: 18px;
}

/* Dropdown list */
.dropdown-list {
  position: absolute;
  top: 54px;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 10px;
  z-index: 50;
  padding: 4px 0;
}

.dropdown-item {
  padding: 10px 14px;
  cursor: pointer;
  transition: 0.15s ease;
}

.dropdown-item:hover {
  background: #f1f5f9;
}

.dropdown-item.selected {
  background: #294594;
  color: white;
}

/* File upload */
.file-drop-wrapper {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: 0.2s ease;
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
  color: #94a3b8;
}

.selected-file {
  margin-top: 10px;
  font-size: 13px;
  color: #334155;
}

/* Error */
.modal-error {
  background: #ffe2e2;
  color: #b00020;
  padding: 10px;
  border-radius: 6px;
  font-size: 13px;
}

/* Footer */
.modal-actions {
  margin-top: 24px;
  text-align: center;
}

.submit-btn {
  background: #294594;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: 0.15s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #1d2f6f;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>