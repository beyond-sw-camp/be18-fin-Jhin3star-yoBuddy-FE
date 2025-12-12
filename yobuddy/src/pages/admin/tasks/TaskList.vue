<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">과제 관리</h2>
          <p class="card-sub">과제 목록 조회 및 관리</p>
        </div>
        <div class="task-controls">
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

          <input
            v-model="q"
            type="search"
            placeholder="검색"
            :style="{ backgroundImage: `url(${logoSearch})` }"
            class="search-input"
          />

          <button class="btn new-btn" @click="createTask">
            + 신규과제 등록
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="task-table" v-if="paginatedTasks.length">
          <div class="table-head">
            <div class="col name-col">과제명</div>
            <div class="col dept-col">해당부서</div>
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
          </div>
        </div>
        <div v-else class="empty-state">과제가 없습니다.</div>
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
const MAX_VISIBLE_PAGES = 5

async function fetchDepartments() {
  const resp = await getDepartments()
  departments.value = resp.data
  deptMap.value = Object.fromEntries(
    resp.data.map(d => [d.departmentId, d.name])
  )
}

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

const totalPages = computed(() =>
  Math.ceil(filteredTasks.value.length / pageSize.value)
)

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTasks.value.slice(start, end)
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

function formatDepartments(ids) {
  return ids.map(id => deptMap.value[id] || `부서#${id}`).join(', ')
}

function goToPage(page) {
  const total = totalPages.value
  if (total < 1) return
  const next = Math.min(Math.max(page, 1), total)
  if (next !== currentPage.value) currentPage.value = next
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
  fetchTasks();
  alert("수정되었습니다.");
}

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
.org-page { padding: 28px 40px; display:flex; justify-content:center; }
.content-card { width: 1100px; max-width: 100%; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(9,30,66,0.08); overflow: hidden; }
.card-header { display:flex; flex-direction:row; align-items:center; justify-content:space-between; gap:16px; padding: 20px 28px; border-bottom: 1px solid #eef2f7; flex-wrap:wrap; }
.title-wrap { display:flex; flex-direction:column; gap:4px; }
.card-title { margin:0; font-size:20px; color:#10243b }
.card-sub { margin: 4px 0 0; color:#7d93ad; font-size:13px }
.task-controls { display:flex; gap:10px; align-items:center; justify-content:flex-end; flex-wrap:wrap; }
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
.search-input { width:320px; height:40px; padding:8px 12px 8px 48px; border-radius:10px; border:1px solid #d1d5db; background-repeat:no-repeat; background-position:left 14px center; background-size:18px; box-sizing:border-box }
.btn { border-radius:10px; cursor:pointer; border:none; height:40px; display:inline-flex; align-items:center; justify-content:center }
.new-btn { min-width:170px; padding:8px 12px; background:#294594; color:white; font-weight:600; border-radius:10px; box-sizing:border-box }

.card-body { padding: 22px 28px; }
.task-table { width:100%; border-collapse: collapse; }
.table-head { display:flex; padding:12px 0; border-bottom:1px solid #eef2f7; font-size:14px; font-weight:700; color:#7c96b3 }
.table-body { display:flex; flex-direction:column; }
.table-row { display:flex; padding:12px 0; cursor:pointer; align-items:center; border-bottom:1px solid #f0f4fb }
.table-row:hover { background: #f8fbff }
.col { flex:1; text-align:center }
.empty-state { padding:32px 0; text-align:center; color:#7d93ad; font-weight:600; }

.pagination.numeric { display:flex; gap:10px; align-items:center; justify-content:center }
.page-nav { background:transparent; border:none; color:#4b5563; font-size:18px; padding:8px; cursor:pointer; transition: color 0.15s ease, opacity 0.15s ease }
.page-nav:disabled { color: #c5c9d6; opacity: 0.7; cursor: default }
.page-num { width:36px; height:36px; border-radius:50%; border:none; background:transparent; color:#4b5563; font-weight:700; cursor:pointer }
.page-num.active { background:#3b4aa0; color:#fff; box-shadow: 0 6px 18px rgba(59,74,160,0.18) }
.card-footer { padding: 16px 28px; border-top: 1px solid #eef2f7; display:flex; justify-content:center }

@media (max-width: 980px) {
  .content-card { width: 100%; margin: 0 16px }
  .task-controls { width:100%; justify-content:flex-start }
  .search-input { width: 100%; max-width: 260px }
}
</style>
