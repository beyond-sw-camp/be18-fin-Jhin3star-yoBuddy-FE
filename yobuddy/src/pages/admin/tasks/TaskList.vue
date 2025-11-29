<template>
  <div class="task-list-page">
    <div class="task-list-header">
      <div class="task-controls">
        
        <!-- 부서 필터 -->
        <select v-model="deptFilter" class="dept-select">
          <option value="">전체</option>
          <option 
            v-for="d in departments" 
            :key="d.departmentId" 
            :value="d.departmentId"
          >
            {{ d.name }}
          </option>
        </select>

        <!-- 검색 -->
        <input
          v-model="q"
          type="search"
          placeholder="검색"
          :style="{ backgroundImage: `url(${logoSearch})` }"
          class="search-input"
        />

        <!-- 새 과제 등록 -->
        <button class="btn new-btn" @click="createTask">
          + 새 과제 등록
        </button>
      </div>
    </div>

    <!-- 테이블 -->
    <div class="task-table">
      <div class="table-head">
        <div class="col name-col">과제명</div>
        <div class="col dept-col">담당부서</div>
        <div class="col date-col">생성일</div>
      </div>

      <div class="table-body">
        <div
          v-for="task in paginatedTasks"
          :key="task.id"
          class="table-row"
          @click="openTask(task)"
        >
          <div class="col name-col">{{ task.title }}</div>
          <div class="col dept-col">{{ formatDepartments(task.departmentIds) }}</div>
          <div class="col date-col">{{ formatDate(task.createdAt) }}</div>
        </div>

        <div v-if="!paginatedTasks.length" class="empty">과제가 없습니다.</div>
      </div>
    </div>

    <!-- 📌 숫자 페이지네이션 -->
    <div v-if="totalPages > 1" class="pagination">

      <!-- 이전 버튼 -->
      <button
        class="nav-btn"
        :disabled="currentPage <= 1"
        @click="currentPage--"
      >
        ‹
      </button>

      <!-- 페이지 번호 반복 -->
      <button
        v-for="page in visiblePages"
        :key="page.key"
        class="page-btn"
        :class="{ active: page.number === currentPage }"
        :disabled="page.isEllipsis"
        @click="!page.isEllipsis && (currentPage = page.number)"
      >
        {{ page.label }}
      </button>

      <!-- 다음 버튼 -->
      <button
        class="nav-btn"
        :disabled="currentPage >= totalPages"
        @click="currentPage++"
      >
        ›
      </button>

    </div>

    <CreateTaskModal
      v-if="showCreateModal"
      :departments="departments"
      @close="showCreateModal = false"
      @created="onCreated"
    />

    <CreateTaskModal
      v-if="showEditModal"
      :editMode="true"
      :task="selectedTaskForEdit"
      :departments="departments"
      @close="showEditModal = false"
      @updated="onUpdated"
    />

    <TaskDetailModal
      v-if="showDetailModal"
      :taskId="selectedTaskId"
      :departments="departments"
      @close="showDetailModal = false"
      @updated="onUpdated"
      @edited="onEdited"
      @deleted="onDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import tasksService from '@/services/tasksService'
import CreateTaskModal from '@/pages/admin/tasks/CreateTaskModal.vue'
import TaskDetailModal from '@/pages/admin/tasks/TaskDetailModal.vue'
import { getDepartments } from '@/services/departmentService'
import logoSearch from '@/assets/icon_search.svg'


// State
const tasks = ref([])
const departments = ref([])
const deptMap = ref({})
const loading = ref(false)
const error = ref(null)

const q = ref('')
const deptFilter = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedTaskForEdit = ref(null)
const showDetailModal = ref(false)
const selectedTaskId = ref(null)

const currentPage = ref(1)
const pageSize = ref(10)

// =============================
// 부서 로드
// =============================
async function fetchDepartments() {
  const resp = await getDepartments()
  departments.value = resp.data
  deptMap.value = Object.fromEntries(
    resp.data.map(d => [d.departmentId, d.name])
  )
}

// =============================
// 과제 로드
// =============================
async function fetchTasks() {
  loading.value = true
  error.value = null
  try {
    const params = {
      search: q.value || undefined,
      departmentId: deptFilter.value || undefined
    }

    const resp = await tasksService.list(params)
    const payload = resp?.data

    if (Array.isArray(payload?.data?.tasks)) {
      tasks.value = payload.data.tasks.map(t => ({
        id: t.taskId,
        title: t.title,
        departmentIds: t.departmentIds,
        createdAt: t.createdAt
      }))
    } else {
      tasks.value = []
    }
  } catch (e) {
    error.value = e
    tasks.value = []
  } finally {
    loading.value = false
  }
}

// =============================
// 검색 + 필터 + 정렬
// =============================
const filteredTasks = computed(() => {
  let list = tasks.value

  if (deptFilter.value) {
    list = list.filter(task =>
      task.departmentIds.includes(Number(deptFilter.value))
    )
  }

  if (q.value) {
    const query = q.value.toLowerCase()
    list = list.filter(task =>
      task.title.toLowerCase().includes(query)
    )
  }

  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

// =============================
// 페이징 계산
// =============================
const totalPages = computed(() =>
  Math.ceil(filteredTasks.value.length / pageSize.value)
)

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTasks.value.slice(start, end)
})

// =============================
// ✨ 숫자 페이지네이션 계산
// =============================
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push({ key: i, number: i, label: i, isEllipsis: false })
    }
    return pages
  }

  const first = 1
  const last = total

  let start = Math.max(current - 2, 2)
  let end = Math.min(current + 2, total - 1)

  pages.push({ key: 'first', number: first, label: first, isEllipsis: false })

  if (start > 2) {
    pages.push({ key: 'ellipsis1', label: '...', isEllipsis: true })
  }

  for (let i = start; i <= end; i++) {
    pages.push({ key: i, number: i, label: i, isEllipsis: false })
  }

  if (end < total - 1) {
    pages.push({ key: 'ellipsis2', label: '...', isEllipsis: true })
  }

  pages.push({ key: 'last', number: last, label: last, isEllipsis: false })

  return pages
})

// =============================
// Helpers
// =============================
function formatDepartments(ids) {
  return ids.map(id => deptMap.value[id] || `부서#${id}`).join(', ')
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

function createTask() {
  showCreateModal.value = true
}

function openTask(task) {
  selectedTaskId.value = task.id
  showDetailModal.value = true
}

function onCreated() {
  fetchTasks()
  currentPage.value = 1
}

function onDeleted(taskId) {
  // 삭제된 과제를 목록에서 제거
  const index = tasks.value.findIndex(t => t.id === taskId)
  if (index > -1) {
    tasks.value.splice(index, 1)
  }
  currentPage.value = 1
}

function onEdited(task) {
  selectedTaskForEdit.value = task
  showEditModal.value = true
  showDetailModal.value = false
}

function onUpdated() {
  // 수정 완료 시 목록 새로고침
  fetchTasks();
  alert("수정되었습니다.");
}

// 검색/필터 변경 시 자동 로드
let timer = null
watch([q, deptFilter], () => {
  clearTimeout(timer)
  currentPage.value = 1
  timer = setTimeout(fetchTasks, 300)
})

onMounted(async () => {
  await fetchDepartments()
  await fetchTasks()
})
</script>

<style scoped>
.task-list-page {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}
.task-controls { display:flex; gap:10px; align-items:center; width:100%;  margin-bottom: 15px; justify-content: space-between;}
.dept-select {
  width: 170px;
  height: 40px;
  padding: 8px 12px;
  padding-right: 30px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background-color: white;
  box-sizing: border-box;
  text-align: center;
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  cursor: pointer;
}

.search-input { width:700px; height:40px; padding:8px 12px 8px 48px; border-radius:10px; border:1px solid #d1d5db; background-repeat:no-repeat; background-position:left 14px center; background-size:18px; box-sizing:border-box }
.btn { border-radius:10px; cursor:pointer; border:none; height:40px; display:inline-flex; align-items:center; justify-content:center }
.new-btn { width:170px; height:40px; padding:8px 12px; background:#294594; color:white; font-weight:400; border-radius:10px; box-sizing:border-box }

.task-table { background:white; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.06); overflow:hidden; margin-top: 10px; }
.table-head { display:flex; padding:12px 0; border-bottom:1px solid #6f6f6f; font-size:14px }
.table-body { display:flex; flex-direction:column; padding-top:18px; }
.table-row { display:flex; padding:12px 0; cursor:pointer; align-items:center }
.table-row:hover { background: #f8fbff }
.col { flex:1; text-align:center }
.empty { padding:18px; color:#64748b; text-align:center }

/* 📌 숫자 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 28px;
}

.page-btn,
.nav-btn {
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.page-btn:hover:not(.active):not(:disabled),
.nav-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.page-btn.active {
  background: #294594;
  color: white;
  font-weight: bold;
}

.page-btn:disabled {
  cursor: default;
  opacity: 0.6;
}

.nav-btn {
  font-size: 18px;
}
</style>