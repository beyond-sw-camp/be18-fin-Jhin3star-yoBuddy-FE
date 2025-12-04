<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">과제 관리</h2>
          <p class="card-sub">과제 목록 조회 및 관리</p>
        </div>
        <div class="task-controls">
          <select v-model="statusFilter" class="dept-select">
            <option value="">전체</option>
            <option value="PENDING">제출 대기</option>
            <option value="SUBMITTED">제출 완료</option>
            <option value="LATE">지각제출</option>
            <option value="MISSING">미제출</option>
            <option value="GRADED">채점 완료</option>
          </select>

          <input
            v-model="q"
            type="search"
            placeholder="검색"
            :style="{ backgroundImage: `url(${logoSearch})` }"
            class="search-input"
          />
        </div>
      </div>

      <div class="card-body">
        <div v-if="loading" class="empty-state">불러오는 중...</div>
        <div v-else class="task-table">
          <div class="table-head">
            <div class="col mentee-col">이름</div>
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
              <div class="col mentee-col">{{ task.menteeName }}</div>
              <div class="col name-col">{{ task.title }}</div>
              <div class="col date-col">{{ formatDate(task.dueDate) }}</div>
              <div class="col status-col">
                <span :class="['status', task.status.toLowerCase()]">
                  {{ statusLabel(task.status) }}
                </span>
              </div>
            </div>

            <div v-if="!paginatedTasks.length" class="empty">해당 과제가 없습니다.</div>
          </div>
        </div>
      </div>

      <div class="card-footer" v-if="totalPages > 1">
        <div class="pagination numeric">
          <button
            class="page-nav"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            &lt;
          </button>

          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-num"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>

          <button
            class="page-nav"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>

    <GradeMentorTaskModal
    v-if="showGradeModal"
    :show="showGradeModal"
    :userTaskId="selectedTask.userTaskId"
    @close="showGradeModal = false"
    @graded="fetchMentorTasks"  
    />


    <MentorTaskDetailModal
      v-if="showDetailModal"
      :show="showDetailModal"
      :userTaskId="selectedTask.userTaskId"
      @close="showDetailModal = false"
      @submitted="fetchMentorTasks"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useAuthStore } from "@/store/authStore"
import tasksService from "@/services/tasksService"
import logoSearch from "@/assets/icon_search.svg"
import GradeMentorTaskModal from '@/pages/mentor/tasks/GradeMentorTaskModal.vue'
import MentorTaskDetailModal from "@/pages/mentor/tasks/MentorTaskDetailModal.vue"

const auth = useAuthStore()

const tasks = ref([])
const q = ref("")
const statusFilter = ref("")
const loading = ref(true)

const showGradeModal = ref(false)
const selectedTask = ref(null)
const showDetailModal = ref(false)

const currentPage = ref(1)
const pageSize = ref(10)
const MAX_VISIBLE_PAGES = 5

async function fetchMentorTasks() {
  loading.value = true

  if (!auth.user) {
    await auth.loadUser()
  }

  const mentorId = auth.user?.userId

  if (!mentorId) {
    console.warn("멘토 정보가 없습니다.", auth.user)
    loading.value = false
    return
  }

  try {
    const resp = await tasksService.getMentorTasks(mentorId)
    const list = resp.data?.data?.tasks || []

    tasks.value = list.map(t => ({
      userTaskId: t.userTaskId,
      menteeId: t.menteeId,
      menteeName: t.menteeName,
      taskId: t.onboardingTaskId,
      title: t.taskTitle,
      dueDate: t.dueDate,
      status: t.status,
    }))
  } catch (e) {
    console.error("멘토 과제 목록 불러오기 실패:", e)
  }

  loading.value = false
}

onMounted(fetchMentorTasks)

const filteredTasks = computed(() => {
  let list = tasks.value

  if (statusFilter.value) {
    list = list.filter(t => t.status === statusFilter.value)
  }

  if (q.value) {
    const query = q.value.toLowerCase()
    list = list.filter(
      t =>
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.menteeName && t.menteeName.toLowerCase().includes(query))
    )
  }

  return list.slice().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
})

const totalPages = computed(() =>
  Math.ceil(filteredTasks.value.length / pageSize.value)
)

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTasks.value.slice(start, start + pageSize.value)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (!total) return []
  const start = Math.max(1, Math.min(current, total - MAX_VISIBLE_PAGES + 1))
  const end = Math.min(total, start + MAX_VISIBLE_PAGES - 1)
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
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

  if (task.status === "SUBMITTED" || task.status === "LATE" || task.status === "GRADED") {
    showGradeModal.value = true
  } else {
    showDetailModal.value = true
  }
}

function statusLabel(s) {
  const map = {
    PENDING: "제출 대기",
    SUBMITTED: "제출 완료",
    LATE: "지각제출",
    MISSING: "미제출",
    GRADED: "채점 완료",
  }
  return map[s] || s
}

function goToPage(page) {
  const total = totalPages.value
  if (total < 1) return
  const next = Math.min(Math.max(page, 1), total)
  if (next !== currentPage.value) currentPage.value = next
}
</script>

<style scoped>
.org-page { padding: 28px 40px; display:flex; justify-content:center; }
.content-card { width: 1100px; max-width: 100%; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(9,30,66,0.08); overflow: hidden; }
.card-header { display:flex; flex-direction:row; align-items:center; justify-content:space-between; gap:16px; padding: 20px 28px; border-bottom: 1px solid #eef2f7; flex-wrap:wrap; }
.title-wrap { display:flex; flex-direction:column; gap:4px; }
.card-title { margin:0; font-size:20px; color:#10243b }
.card-sub { margin: 4px 0 0; color:#7d93ad; font-size:13px }
.task-controls { display: flex; gap: 10px; align-items: center; width: auto; flex-wrap: wrap; justify-content: flex-end; }
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
  width: 320px;
  height: 40px;
  padding: 8px 12px 8px 48px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background-repeat: no-repeat;
  background-position: left 14px center;
  background-size: 18px;
  box-sizing: border-box;
}

.card-body { padding: 22px 28px; }
.task-table {
  background: white;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
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
  padding-top: 8px;
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
.mentee-col {
  flex: 0.8;
}
.name-col {
  flex: 1.6;
}
.date-col {
  flex: 1;
}
.status-col {
  flex: 1;
}
.empty {
  padding: 18px;
  color: #64748b;
  text-align: center;
}
.empty-state { padding: 32px 0; text-align: center; color: #7d93ad; font-weight: 600; }

.status {
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 12px;
  color: white;
}
.status.pending { background: #d8d8d8; color: #6f6f6f;}
.status.submitted { background: #e9f0ff;  color: #294594;}
.status.late,.status.missing { background: #f8e3e2; color: #ae5e62;}
.status.graded { background: #e3f7e9; color: #0a9a52;}

.pagination.numeric {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.page-nav {
  background: transparent;
  border: none;
  color: #4b5563;
  font-size: 18px;
  padding: 8px;
  cursor: pointer;
  transition: color 0.15s ease, opacity 0.15s ease;
}
.page-nav:disabled {
  color: #c5c9d6;
  opacity: 0.7;
  cursor: default;
}
.page-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #4b5563;
  font-weight: 700;
  cursor: pointer;
}
.page-num.active {
  background: #3b4aa0;
  color: #fff;
  box-shadow: 0 6px 18px rgba(59,74,160,0.18);
}
.card-footer { padding: 16px 28px; border-top: 1px solid #eef2f7; display:flex; justify-content:center }

@media (max-width: 980px) {
  .content-card { width: 100%; margin: 0 16px }
  .task-controls { width:100%; justify-content:flex-start }
  .search-input { width: 100%; max-width: 260px }
}
</style>
