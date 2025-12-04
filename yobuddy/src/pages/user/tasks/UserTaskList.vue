<template>
  <div class="task-list-page">
    <div class="task-list-header">
      <div class="task-controls">

        <!-- 상태 필터 -->
        <select v-model="statusFilter" class="dept-select">
          <option value="">전체</option>
          <option value="PENDING">제출 전</option>
          <option value="SUBMITTED">제출 완료</option>
          <option value="LATE">지각 제출</option>
          <option value="MISSING">미제출</option>
          <option value="GRADED">채점 완료</option>
        </select>

        <!-- 검색 -->
        <input
          v-model="q"
          type="search"
          placeholder="검색"
          :style="{ backgroundImage: `url(${logoSearch})` }"
          class="search-input"
        />
      </div>
    </div>

    <!-- 로딩 표시 -->
    <div v-if="loading" class="empty">불러오는 중...</div>

    <!-- 테이블 -->
    <div v-else class="task-table">
      <div class="table-head">
        <div class="col name-col">과제명</div>
        <div class="col date-col">마감일</div>
        <div class="col status-col">상태</div>
      </div>

      <div class="table-body">
        <div
          v-for="task in paginatedTasks"
          :key="task.userTaskId"
          class="table-row"
          @click="openTask(task)"
        >
          <div class="col name-col">{{ task.title }}</div>
          <div class="col date-col">{{ formatDate(task.dueDate) }}</div>
          <div class="col status-col">
            <span :class="['status', task.status.toLowerCase()]">
              {{ statusLabel(task.status) }}
            </span>
          </div>
        </div>

        <div v-if="!paginatedTasks.length" class="empty">
          할당된 과제가 없습니다.
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        class="nav-btn"
        :disabled="currentPage <= 1"
        @click="currentPage--"
      >
        ‹
      </button>

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

      <button
        class="nav-btn"
        :disabled="currentPage >= totalPages"
        @click="currentPage++"
      >
        ›
      </button>
    </div>

    <UpdateUserTaskModal
        v-if="showUpdateModal"
        :show="showUpdateModal"
        :userTaskId="selectedTask.userTaskId" 
        @close="showUpdateModal = false"
        @submitted="fetchUserTasks"
    />

    <UserTaskDetailModal
        v-if="showDetailModal"
        :show="showDetailModal"
        :userTaskId="selectedTask.userTaskId" 
        @close="showDetailModal = false"
        @submitted="fetchUserTasks"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useAuthStore } from "@/store/authStore"
import tasksService from "@/services/tasksService"
import logoSearch from "@/assets/icon_search.svg"
import UpdateUserTaskModal from "@/pages/user/tasks/UpdateUserTaskModal.vue"
import UserTaskDetailModal from "@/pages/user/tasks/UserTaskDetailModal.vue"
const auth = useAuthStore()

const tasks = ref([])
const q = ref("")
const statusFilter = ref("")   
const loading = ref(true)

const selectedTask = ref(null)
const showUpdateModal = ref(false)
const showDetailModal = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)

async function fetchUserTasks() {
  loading.value = true

  if (!auth.user) {
    await auth.loadUser()
  }

  const userId = auth.user?.userId  

  if (!userId) {
    console.warn("유저 정보가 없습니다.", auth.user)
    loading.value = false
    return
  }

  try {
    const resp = await tasksService.getUserTasks(userId)
    const list = resp.data?.data?.tasks || []

    tasks.value = list.map(t => ({
      userTaskId: t.userTaskId,
      taskId: t.taskId,
      title: t.title,
      dueDate: t.dueDate,
      status: t.status
    }))
  } catch (e) {
    console.error("과제 불러오기 실패:", e)
  }

  loading.value = false
}

onMounted(fetchUserTasks)

const filteredTasks = computed(() => {
  let list = tasks.value

  if (statusFilter.value) {
    list = list.filter(t => t.status === statusFilter.value)
  }

  if (q.value) {
    const query = q.value.toLowerCase()
    list = list.filter(t => t.title.toLowerCase().includes(query))
  }

  return list.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
})

const totalPages = computed(() =>
  Math.ceil(filteredTasks.value.length / pageSize.value)
)

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTasks.value.slice(start, start + pageSize.value)
})

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

watch([q, statusFilter], () => {
  currentPage.value = 1
})

function formatDate(iso) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString()
}

function openTask(task) {
  selectedTask.value = task

  if (task.status === "PENDING" || task.status === 'MISSING') {
    showUpdateModal.value = true
  } else {
    showDetailModal.value = true
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
.task-list-page {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}
.task-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  margin-bottom: 15px;
  justify-content: space-between;
}

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

.search-input {
  width: 900px;
  height: 40px;
  padding: 8px 12px 8px 48px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background-repeat: no-repeat;
  background-position: left 14px center;
  background-size: 18px;
  box-sizing: border-box;
}

.task-table {
  background: white;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
  overflow: hidden;
  margin-top: 10px;
}

.table-head {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #6f6f6f;
  font-size: 14px;
  font-weight: bold;
}

.table-body {
  display: flex;
  flex-direction: column;
  padding-top: 18px;
}

.table-row {
  display: flex;
  padding: 12px 0;
  cursor: pointer;
  align-items: center;
}
.table-row:hover {
  background: #f8fbff;
}

.col {
  flex: 1;
  text-align: center;
}
.empty {
  padding: 18px;
  color: #64748b;
  text-align: center;
}

/* 상태 Badge */
.status {
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 12px;
  color: white;
}

.status.pending { background: #D8D8D8; color: #6F6F6F; }
.status.submitted { background: #E9F0FF; color: #294594; }
.status.late { background: #F8E3E2; color: #AE5E62; }
.status.missing { background: #F8E3E2; color: #AE5E62; }
.status.graded { background: #E3F7E9; color: #0A9A52; }

/* 숫자 페이지네이션 */
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

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 28px;
}

.page-btn,
.nav-btn {
  min-width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn.active {
  background: #294594;
  color: white;
  font-weight: bold;
}

.page-btn:hover:not(.active):not(:disabled),
.nav-btn:hover:not(:disabled) {
  background: #e5e7eb;
}
</style>
