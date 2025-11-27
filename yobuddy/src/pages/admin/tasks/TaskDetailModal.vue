<template>
  <div 
  class="modal-overlay"
  @mousedown="isDragging = false"
  @mousemove="isDragging = true"
  @mouseup.self="onOverlayClick"
  >
    <div class="modal" :class="{ 'edit-mode': isEditMode }" @click.stop>

      <!-- HEADER -->
      <div class="modal-header" v-if="task">

        <!-- 조회 모드 제목 -->
        <h2 class="task-title" v-if="!isEditMode">{{ task.title }}</h2>

        <!-- 수정 모드 제목 -->
        <div v-if="isEditMode" style="width:100%;">
          <label>과제명:</label>
          <input
            v-model="editForm.title"
            class="edit-input"
            type="text"
            placeholder="과제명을 입력하세요."
          />
        </div>

        <button class="close-btn" v-if="!isEditMode" @click="close">×</button>
      </div>

      <!-- BODY -->
      <div class="modal-body" v-if="task">

        <!-- 과제 설명 -->
        <label>과제 설명:</label>

        <!-- 조회 모드 -->
        <p class="plain-description" v-if="!isEditMode">
          {{ task.description }}
        </p>

        <!-- 수정 모드 -->
        <textarea
          v-if="isEditMode"
          v-model="editForm.description"
          class="edit-textarea"
          rows="3"
          placeholder="과제 설명을 입력하세요."
        ></textarea>

        <!-- 생성일 & 부서 -->
        <div class="two-col">
          <div class="col-item">
            <label>생성일</label>
            <p class="col-text">{{ formatDate(task.createdAt) }}</p>
          </div>

          <div class="col-item">
            <label>배정된 부서</label>

            <!-- 조회 모드 -->
            <div class="dept-inline" v-if="!isEditMode">
              <img :src="iconDept" class="dept-icon" />
              <span>{{ formatDepartments(task.departmentIds) }}</span>
            </div>

            <!-- 수정 모드 -->
            <div v-if="isEditMode" class="dropdown-wrapper">

              <div class="selected-tags" @click="toggleDropdown">
                <span
                  v-for="d in selectedDepartments"
                  :key="d.departmentId"
                  class="tag"
                >
                  {{ d.name }}
                  <button
                    class="remove-btn"
                    @click.stop="removeDept(d.departmentId)"
                  >×</button>
                </span>

                <span v-if="selectedDepartments.length === 0" class="placeholder">
                  부서를 선택하세요
                </span>

                <div class="arrow">▾</div>
              </div>

              <div v-if="dropdownOpen" class="dropdown-list">
                <div
                  v-for="d in departments"
                  :key="d.departmentId"
                  class="dropdown-item"
                  :class="{ selected: editForm.departmentIds.includes(d.departmentId) }"
                  @click="toggleDept(d.departmentId)"
                >
                  {{ d.name }}
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- 첨부파일 -->
        <label>첨부파일:</label>
        <div class="file-box">
          <div class="file-name">
            {{ task.fileName ?? "첨부파일 없음" }}
          </div>

          <button
            v-if="task.fileUrl"
            class="download-btn"
            @click="openFile(task.fileUrl)"
          >
            다운로드
          </button>
        </div>

        <div v-if="error" class="modal-error">{{ errorMessage }}</div>
      </div>

      <!-- FOOTER -->
      <div class="modal-actions" v-if="task">

        <!-- 조회 모드 -->
        <template v-if="!isEditMode">
          <button class="btn edit-btn" @click="enterEditMode">수정</button>
          <button class="btn delete-btn" @click="deleteTask">삭제</button>
        </template>

        <!-- 수정 모드 -->
        <template v-else>
          <button class="btn edit-btn" @click="saveTask">저장</button>
          <button class="btn delete-btn" @click="cancelEdit">취소</button>
        </template>

      </div>

    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  defineProps,
  defineEmits
} from "vue";
import tasksService from "@/services/tasksService";
import iconDept from "@/assets/icon_department.svg";

const props = defineProps({
  taskId: { type: [String, Number], required: true },
  departments: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "edited", "deleted"]);

const task = ref(null);
const loading = ref(true);
const error = ref(null);

/* 수정 모드 */
const isEditMode = ref(false);

const editForm = ref({
  title: "",
  description: "",
  departmentIds: [],
});

/* Fetch task */
async function fetchTask() {
  try {
    loading.value = true;
    const resp = await tasksService.get(props.taskId);
    task.value = resp.data.data;

    editForm.value = {
      title: task.value.title,
      description: task.value.description,
      departmentIds: [...task.value.departmentIds],
    };

  } catch (e) {
    error.value = e;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchTask);

/* Dropdown */
const dropdownOpen = ref(false);

function toggleDropdown() { dropdownOpen.value = !dropdownOpen.value; }

function closeDropdown(e) {
  if (!e.target.closest(".dropdown-wrapper")) dropdownOpen.value = false;
}
onMounted(() => window.addEventListener("click", closeDropdown));
onBeforeUnmount(() => window.removeEventListener("click", closeDropdown));

const selectedDepartments = computed(() =>
  props.departments.filter(d => editForm.value.departmentIds.includes(d.departmentId))
);

function toggleDept(id) {
  const arr = editForm.value.departmentIds;
  if (arr.includes(id)) {
    editForm.value.departmentIds = arr.filter(x => x !== id);
  } else {
    editForm.value.departmentIds.push(id);
  }
}

function removeDept(id) {
  editForm.value.departmentIds = editForm.value.departmentIds.filter(x => x !== id);
}

/* Buttons */
function close() { emit("close"); }

function enterEditMode() {
  isEditMode.value = true;
}

function cancelEdit() {
  isEditMode.value = false;
  editForm.value = {
    title: task.value.title,
    description: task.value.description,
    departmentIds: [...task.value.departmentIds],
  };
}

/* PATCH 저장 */
async function saveTask() {
  try {
    const resp = await tasksService.update(props.taskId, {
      title: editForm.value.title,
      description: editForm.value.description,
      departmentIds: editForm.value.departmentIds,
      points: 100,   
      fileIds: [12],   
    });

    task.value = resp.data.data;
    isEditMode.value = false;
    emit("updated", task.value);
    
    // 수정 성공 시 팝업 닫기
    close();

  } catch (e) {
    console.error(e);
    alert("수정 중 오류 발생!");
  }
}

function openFile(url) { window.open(url, "_blank"); }

/* DELETE 삭제 */
async function deleteTask() {
  if (!confirm("정말 삭제할까요?")) return;
  await tasksService.delete(props.taskId);

  alert("삭제되었습니다.");

  emit("deleted", props.taskId);
  close();
}

/* Helpers */
const errorMessage = computed(() => error.value?.response?.data?.message || error.value?.message);
function formatDate(date) { return new Date(date).toISOString().split("T")[0]; }
function formatDepartments(ids) {
  return ids
    .map(id => {
      const d = props.departments.find(x => x.departmentId === id);
      return d ? d.name : `부서#${id}`;
    })
    .join(", ");
}

const isDragging = ref(false);

function onOverlayClick() {
  if (!isDragging.value) {
    close();
  }
}
</script>

<style scoped>
/* ===== 조회 모드 스타일: 절대 수정 금지 ===== */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: 550px;
  min-height: 480px;
  background: white;
  border-radius: 10px;
  padding: 26px 32px;
  animation: fadeIn .25s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.task-title {
  font-size: 22px;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
}

label {
  font-size: 14px;
  font-weight: 600;
  display: block;
  margin-top: 16px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.plain-description {
  margin-top: 0px;
  white-space: pre-line;
}

.two-col {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  gap: 40px;
}

.col-item { flex: 1; }
.col-text { margin-top: 6px; }

.dept-inline {
  display: flex;
  align-items: center;
  margin-top: 6px;
  gap: 6px;
}

.dept-icon { width: 18px; height: 18px; }

.file-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-name {
  flex: 1;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #f8fbff;
}

.download-btn {
  padding: 8px 14px;
  background: #294594;
  color: white;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}

.modal-actions {
  margin-top: 40px;
  display: flex;
  justify-content: center;
  gap: 14px;
}

.btn {
  border-radius: 10px;
  padding: 10px 24px;
  cursor: pointer;
  font-size: 15px;
  border: none;
}

.edit-btn {
  background: white;
  border: 1px solid #294594;
  color: #294594;
}

.delete-btn {
  background: #294594;
  color: white;
}

/* ========================================= */
/* ===== 수정 모드 전용 스타일 추가분 ===== */
/* ========================================= */

.modal.edit-mode {
  margin-top: 50px;
  min-height: 500px;
}

.modal.edit-mode .modal-body {
  gap: 5px;
}

.modal.edit-mode .two-col {
  gap: 20px;
}

.edit-input {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
}

.edit-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  resize: none;
}

/* ===== Dropdown (CreateModal 복붙) ===== */

.dropdown-wrapper { position: relative; }

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

.placeholder { color: #94a3b8; }

.tag {
  background: #294594;
  color: white;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 13px;
  display: flex;
  align-items: center;
}

.remove-btn {
  margin-left: 6px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}

.dropdown-list {
  position: absolute;
  top: 52px;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 10px;
  padding: 4px 0;
  z-index: 100;
}

.dropdown-item {
  padding: 10px 14px;
  cursor: pointer;
}

.dropdown-item:hover { background: #eef2f7; }
.dropdown-item.selected { background: #294594; color: white; }

.arrow {
  position: absolute;
  right: 12px;
  font-size: 16px;
  color: #475569;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>