<!-- file: yobuddy/src/pages/admin/kpi/KPIView.vue -->
<template>
  <div class="kpi-view page-container">
    <header class="kpi-header">
      <h1>KPI 성과 지표</h1>
      <div class="controls">
        <div class="dept-dropdown" ref="dropdown">
          <button class="dd-toggle" @click="toggleDropdown" :aria-expanded="dropdownOpen">
            <span class="dd-label">{{ selectedLabel }}</span>
            <span class="dd-actions">
              <svg class="dd-caret" width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M7 10l5 5 5-5z" />
              </svg>
            </span>
          </button>

          <div v-show="dropdownOpen" class="dd-panel">
            <input
              class="dept-search"
              v-model="filterTerm"
              placeholder="부서명 검색..."
              @keydown.stop
            />
            <ul class="dd-list">
              <li
                v-for="d in filteredDepartments"
                :key="d.departmentId || d.id || d._id"
                :class="{ active: selectedDepartmentId === (d.departmentId || d.id || d._id) }"
                @click="selectDepartment(d)"
              >
                {{ d.name || d.departmentName || d.title }}
              </li>
            </ul>
          </div>
        </div>
        <button
          class="pdf-btn"
          @click="exportPdf"
          :disabled="exporting"
          :aria-busy="exporting"
          title="PDF로 내보내기"
        >
          {{ exporting ? '내보내는 중...' : 'PDF' }}
        </button>
      </div>
    </header>

    <!-- 상단 요약 카드 -->
    <section class="summary-cards">
      <div
        class="card"
        v-for="card in summaryCards"
        :key="card.title"
        @click="onSummaryClick(card)"
        :class="{ clickable: card.title === '부서 목표' }"
      >
        <div class="title">{{ card.title }}</div>
        <div class="value">{{ card.value }}</div>
        <div class="sub">{{ card.sub }}</div>
      </div>
    </section>

    <!-- KPI Goals Modal -->
    <div v-if="goalsModalVisible" class="modal-overlay" @click.self="closeGoalsModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">부서 목표 목록</h3>
          <button class="modal-close" @click="closeGoalsModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="!kpiGoals || kpiGoals.length === 0" class="empty">표시할 목표가 없습니다.</div>
          <div v-else class="goal-cards">
            <div
              v-for="g in kpiGoals"
              :key="g.kpiGoalId || g.kpiId || g.goalId || g.id"
              class="goal-card"
            >
              <div class="goal-card-header">
                <div class="goal-title">
                  {{ g.description || g.name || g.title || g.kpiName || '무제' }}
                </div>
                <div class="goal-badges">
                  <span class="badge muted">카테고리: {{ g.kpiCategoryId ?? '-' }}</span>
                </div>
              </div>
              <div class="goal-card-body">
                <div class="goal-field small">
                  <strong>부서 ID</strong><span>{{ g.departmentId ?? '-' }}</span>
                </div>
                <div class="goal-field highlight">
                  <strong>목표값</strong>
                  <span class="goal-value">{{ g.targetValue ?? g.target ?? g.goal ?? '-' }}</span>
                </div>
                <div class="goal-field highlight weight">
                  <strong>가중치</strong><span class="goal-weight">{{ g.weight ?? '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 영역 -->
    <div class="main-area">
      <!-- Left: charts -->
      <div class="main-left">
        <section class="charts">
          <div class="chart-panel">
            <div v-if="chartLoading" class="skeleton skeleton-chart large"></div>
            <VueApexCharts
              v-else
              type="bar"
              :options="computedChartOptions"
              :series="computedChartSeries"
              height="460"
            />
          </div>
        </section>

        <!-- KPI Pass/Fail donut -->
        <section class="kpi-passfail">
          <div class="card passfail-card">
            <div class="card-title">KPI 위험도</div>
            <div class="card-body">
              <div v-if="chartLoading" class="skeleton skeleton-donut"></div>
              <div v-else class="passfail-chart-wrap">
                <VueApexCharts
                  type="donut"
                  :options="kpiPassFailOptions"
                  :series="kpiPassFailSeries"
                  height="220"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Radar + Mentoring -->
        <section class="radar-section">
          <div class="card radar-card">
            <div class="card-title-row">
              <div class="card-title">KPI 목표별 분포 (레이더)</div>
            </div>
            <div class="card-body">
              <div v-if="chartLoading" class="skeleton skeleton-radar"></div>
              <VueApexCharts
                v-else
                type="radar"
                :options="radarOptions"
                :series="computedRadarSeries"
                height="520"
              />
            </div>
          </div>

          <div class="card mentoring-card">
            <div class="card-title">멘토링 세션 요약</div>
            <div class="card-body">
              <div v-if="chartLoading" class="skeleton skeleton-donut"></div>
              <template v-else>
                <div class="mentoring-chart-wrap">
                  <VueApexCharts
                    type="donut"
                    :options="mentoringDonutOptions"
                    :series="mentoringDonutSeries"
                    height="260"
                  />
                </div>
                <div class="mentoring-legend">
                  <div class="legend-item">
                    <span class="dot dot-completed"></span>완료
                    <strong>{{ mentoringSessions.completed ?? 0 }}</strong>
                  </div>
                  <div class="legend-item">
                    <span class="dot dot-scheduled"></span>예정
                    <strong>{{ mentoringSessions.scheduled ?? 0 }}</strong>
                  </div>
                  <div class="legend-item">
                    <span class="dot dot-cancelled"></span>취소
                    <strong>{{ mentoringSessions.cancelled ?? 0 }}</strong>
                  </div>
                  <div class="legend-item">
                    <span class="dot dot-noshow"></span>노쇼
                    <strong>{{ mentoringSessions.noShow ?? 0 }}</strong>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </section>
      </div>

      <!-- Right: user list -->
      <aside class="main-right">
        <div class="card users-card">
          <div class="card-title">{{ selectedLabel }} 유저 목록</div>
          <div class="card-body">
            <ul class="user-list">
              <li v-if="usersLoading" class="empty">로딩 중...</li>
              <li v-else-if="!users || users.length === 0" class="empty">사용자 없음</li>
              <li
                    v-for="u in users"
                    :key="u.userId || u.id || u._id"
                    class="user-item"
                    :class="{ disabled: isAdminOrMentor(u) }"
                    @click="goToUser(u)"
                  >
                <div class="avatar">
                  {{ (u.name || u.username || u.fullName || '유저').slice(0, 1) }}
                </div>
                <div class="meta">
                  <div class="name">
                    {{ u.name || u.username || u.fullName || '무명' }}
                  </div>
                  <div class="role">
                    {{ formatRole(u.role) }}
                  </div>
                </div>
              </li>
            </ul>
            <div class="user-count">총 {{ users ? users.length : 0 }}명</div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'
import { getDepartments } from '@/services/departmentService'
import kpiService from '@/services/kpiService'

const router = useRouter()

// 선택된 부서
const selectedDepartmentId = ref(4)
const filterTerm = ref('')
const departments = ref([])
const dropdownOpen = ref(false)
const dropdown = ref(null)

const exporting = ref(false)
const chartLoading = ref(true)
const usersLoading = ref(false)
const usersError = ref(null)

// 백엔드 대시보드 전체 응답
const dashboard = ref(null)

// ====== 공통 핸들러 ======
function onKeyDown(e) {
  if (e.key === 'Escape') closeGoalsModal()
}

function onDocClick(e) {
  if (!dropdown.value) return
  if (!dropdown.value.contains(e.target)) dropdownOpen.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('click', onDocClick)
})

// ====== Departments ======
async function loadDepartments() {
  try {
    const resp = await getDepartments()
    let arr = []
    if (resp && resp.data && Array.isArray(resp.data)) arr = resp.data
    else if (resp && resp.data && resp.data.data && Array.isArray(resp.data.data)) arr = resp.data.data
    departments.value = arr
  } catch (e) {
    console.error('Failed to load departments', e)
    departments.value = []
  }
}

const filteredDepartments = computed(() => {
  const q = (filterTerm.value || '').toString().toLowerCase().trim()
  if (!q) return departments.value
  return departments.value.filter(d =>
    (d.name || d.departmentName || '').toString().toLowerCase().includes(q)
  )
})

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    setTimeout(() => {
      const inp = dropdown.value && dropdown.value.querySelector('.dept-search')
      if (inp) inp.focus()
    }, 0)
  }
}

const selectedLabel = computed(() => {
  if (!selectedDepartmentId.value) return '전체 부서'
  const id = selectedDepartmentId.value
  const found = departments.value.find(
    d => String(d.departmentId || d.id || d._id) === String(id)
  )
  if (found) return found.name || found.departmentName || found.title
  // 대시보드에 부서명이 있다면 사용
  if (dashboard.value && dashboard.value.departmentName) return dashboard.value.departmentName
  return '선택된 부서'
})

// ====== Dashboard Load ======
async function loadDashboard(departmentId) {
  chartLoading.value = true
  usersLoading.value = true
  usersError.value = null

  try {
    const resp = await kpiService.getDashboard(departmentId)
    const data = resp && resp.data ? resp.data : resp

    dashboard.value = {
      departmentId: data.departmentId ?? departmentId ?? null,
      departmentName: data.departmentName ?? '',
      goals: Array.isArray(data.goals) ? data.goals : [],
      users: Array.isArray(data.users) ? data.users : [],
      summary: data.summary || { pass: 0, fail: 0, totalUsers: 0 },
      mentoring:
        data.mentoring || { total: 0, completed: 0, scheduled: 0, cancelled: 0, noShow: 0 },
      chart:
        data.chart || {
          years: [],
          achievementPerYear: [],
          radar: []
        }
    }
  } catch (e) {
    console.error('Failed to load KPI dashboard', e)
    usersError.value = e?.message ?? String(e)
    dashboard.value = {
      departmentId: departmentId ?? null,
      departmentName: '',
      goals: [],
      users: [],
      summary: { pass: 0, fail: 0, totalUsers: 0 },
      mentoring: { total: 0, completed: 0, scheduled: 0, cancelled: 0, noShow: 0 },
      chart: { years: [], achievementPerYear: [], radar: [] }
    }
  } finally {
    chartLoading.value = false
    usersLoading.value = false
  }
}

async function selectDepartment(d) {
  // 드롭다운에서 부서 선택
  try {
    if (!d) {
      selectedDepartmentId.value = null
    } else if (typeof d === 'object') {
      selectedDepartmentId.value = d.departmentId || d.id || d._id || null
    } else {
      selectedDepartmentId.value = d
    }
    dropdownOpen.value = false
    await loadDashboard(selectedDepartmentId.value)
  } catch (e) {
    console.error('Failed to change department', e)
  }
}

function goToUser(u) {
  const role = typeof u.role === 'object' ? u.role?.name : u.role

  if (role === 'ADMIN' || role === 'MENTOR') {
    return // 상세보기 이동 차단
  }

  const uid = u && (u.userId || u.id || u._id)
  if (!uid) return

  router.push(`/kpi/user/${uid}`)
}

function isAdminOrMentor(u) {
  const role = typeof u.role === 'object' ? u.role?.name : u.role
  return role === 'ADMIN' || role === 'MENTOR'
}

// ====== Goals / Modal ======
const goalsModalVisible = ref(false)

const kpiGoals = computed(() =>
  dashboard.value && Array.isArray(dashboard.value.goals) ? dashboard.value.goals : []
)

async function openGoalsModal() {
  goalsModalVisible.value = true
}

function closeGoalsModal() {
  goalsModalVisible.value = false
}

function onSummaryClick(card) {
  if (card && card.title === '부서 목표') {
    openGoalsModal()
  }
}

// ====== Derived data from dashboard ======
const users = computed(
  () => (dashboard.value && Array.isArray(dashboard.value.users) ? dashboard.value.users : [])
)

const summary = computed(
  () => dashboard.value?.summary || { pass: 0, fail: 0, totalUsers: 0 }
)

const mentoringSessions = computed(
  () =>
    dashboard.value?.mentoring || {
      total: 0,
      completed: 0,
      scheduled: 0,
      cancelled: 0,
      noShow: 0
    }
)

const chart = computed(
  () =>
    dashboard.value?.chart || {
      years: [],
      achievementPerYear: [],
      radar: []
    }
)

// ====== Summary cards ======
const summaryCards = computed(() => {
  const totalGoals = Array.isArray(kpiGoals.value) ? kpiGoals.value.length : 0
  const s = summary.value
  return [
    { title: '부서 목표', value: totalGoals, sub: '부서별 KPI 목표 수' },
    { title: '합격 인원', value: s.pass ?? 0, sub: '총 60점 이상' },
    { title: '미달 인원', value: s.fail ?? 0, sub: '총 60점 미만' },
    { title: '전체 인원', value: s.totalUsers ?? 0, sub: '부서 전체 구성원' }
  ]
})

// ====== Charts ======

// 연도 목록
const yearsList = computed(() => {
  const ys = chart.value.years || []
  return Array.isArray(ys) ? ys : []
})

// 막대 차트 시리즈
const computedChartSeries = computed(() => {
  const goalAvg = 100
  const years = yearsList.value
  const achievement = Array.isArray(chart.value.achievementPerYear)
    ? chart.value.achievementPerYear
    : []

  if (!years.length || !achievement.length) {
    return [
      { name: '달성률', data: [0] },
      { name: '목표값', data: [goalAvg] }
    ]
  }

  return [
    { name: '달성률', data: achievement },
    { name: '목표값', data: years.map(() => goalAvg) }
  ]
})

// 기본 chart options
const chartOptions = ref({
  chart: { toolbar: { show: false }, type: 'bar' },
  plotOptions: { bar: { borderRadius: 6, horizontal: false, columnWidth: '25%', distributed: false } },
  dataLabels: {
    enabled: true,
    formatter: val => `${val}`,
    offsetY: -6,
    style: { fontSize: '12px', colors: ['#fff'] }
  },
  xaxis: { categories: ['부서 평균'] },
  yaxis: { labels: { formatter: val => `${val}` } },
  tooltip: { y: { formatter: val => `${val}` } },
  colors: ['#4f46e5', '#294594'],
  fill: { type: 'solid', opacity: 1 },
  stroke: { show: false },
  legend: { show: true, position: 'top', horizontalAlign: 'center', markers: { radius: 6 } },
  grid: { padding: { left: 20, right: 20 } }
})

const computedChartOptions = computed(() => {
  const years = yearsList.value
  let categories
  if (years && years.length) {
    categories = years.map(String)
  } else {
    categories = ['부서 평균']
  }
  const achievedColor = '#4f46e5'
  const targetColor = '#294594'
  return {
    ...chartOptions.value,
    xaxis: { ...(chartOptions.value.xaxis || {}), categories },
    colors: [achievedColor, targetColor]
  }
})

// Radar chart
const radarCategories = computed(() => {
  const r = chart.value.radar || []
  return Array.isArray(r) ? r.map(x => x.label || '') : []
})

const computedRadarSeries = computed(() => {
  const r = chart.value.radar || []
  const data = Array.isArray(r) ? r.map(x => Number(x.avgScore ?? 0)) : []
  return [{ name: '목표별 평균 점수', data }]
})

const radarOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'radar' },
  xaxis: { categories: radarCategories.value },
  yaxis: { labels: { formatter: v => `${v}` } },
  stroke: { show: true, width: 1 },
  fill: { opacity: 0.4 },
  markers: { size: 4 },
  colors: ['#294594'],
  tooltip: { y: { formatter: val => `${val}` } },
  legend: { show: false }
}))

// Mentoring donut
const mentoringDonutSeries = computed(() => {
  const s = mentoringSessions.value || {}
  const completed = Number.isFinite(Number(s.completed)) ? Number(s.completed) : 0
  const scheduled = Number.isFinite(Number(s.scheduled)) ? Number(s.scheduled) : 0
  const cancelled = Number.isFinite(Number(s.cancelled)) ? Number(s.cancelled) : 0
  const noShow = Number.isFinite(Number(s.noShow)) ? Number(s.noShow) : 0
  return [completed, scheduled, cancelled, noShow]
})

const mentoringDonutOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'donut' },
  labels: ['완료', '예정', '취소', '노쇼'],
  colors: ['#10b981', '#2563eb', '#f97316', '#ef4444'],
  legend: { position: 'bottom' },
  tooltip: { y: { formatter: v => `${v}` } }
}))

// KPI pass/fail donut
const kpiPassFailSeries = computed(() => {
  const s = summary.value
  const pass = Number.isFinite(Number(s.pass)) ? Number(s.pass) : 0
  const fail = Number.isFinite(Number(s.fail)) ? Number(s.fail) : 0
  return [pass, fail]
})

const kpiPassFailOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'donut' },
  labels: ['60 이상', '미달'],
  colors: ['#10b981', '#ef4444'],
  legend: { position: 'bottom' },
  tooltip: { y: { formatter: v => `${v}` } }
}))

function formatRole(role) {
  const value = typeof role === 'object' ? role?.name : role
  if (!value) return ''

  const map = {
    ADMIN: '관리자',
    MENTOR: '멘토',
    USER: '멘티'
  }

  return map[value] || value
}

// ====== PDF Export ======
async function exportPdf() {
  const el = document.querySelector('.kpi-view')
  if (!el) {
    alert('PDF로 내보낼 영역을 찾을 수 없습니다.')
    return
  }
  exporting.value = true
  try {
    const mod = await import('html2pdf.js')
    const html2pdf = mod && (mod.default || mod)
    const filename = `yobuddy-kpi-${selectedDepartmentId.value || 'all'}-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`
    const opt = {
      margin: 8,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    await html2pdf().set(opt).from(el).save()
  } catch (e) {
    console.error('Export PDF failed', e)
    alert('PDF 내보내기 실패: ' + (e && e.message ? e.message : String(e)))
  } finally {
    exporting.value = false
  }
}

// ====== 초기 로드 ======
onMounted(async () => {
  await loadDepartments()
  await selectDepartment(selectedDepartmentId.value || 4)
})
</script>

<style scoped>
/* Layout base */
.kpi-view {
  padding: 18px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  max-width: 1200px;
  margin: 0 auto;
}
.kpi-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.kpi-header h1 {
  margin: 0;
  font-size: 20px;
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dept-dropdown {
  position: relative;
}
.dd-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #e6eef9;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  box-shadow: 0 2px 6px rgba(16, 24, 40, 0.04);
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.06s;
}
.dd-toggle:active {
  transform: translateY(1px);
}
.dd-label {
  font-weight: 600;
  color: #0f172a;
}
.dd-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.clear-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
}
.clear-btn:hover {
  color: #0f172a;
  background: #f8fafc;
}
.dd-caret {
  color: #6b7280;
}

.pdf-btn {
  margin-left: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #e6eef9;
  background: linear-gradient(180deg, #ffffff, #f6f9ff);
  cursor: pointer;
  font-weight: 700;
  color: #0b5fff;
}
.pdf-btn:hover {
  box-shadow: 0 6px 18px rgba(11, 95, 255, 0.08);
  transform: translateY(-2px);
}

.dd-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 320px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border: 1px solid #eef2ff;
  border-radius: 10px;
  box-shadow: 0 12px 36px rgba(2, 6, 23, 0.08);
  padding: 10px;
  z-index: 40;
  transition: opacity 0.12s ease;
}
.dd-panel .dept-search {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #eef2ff;
  border-radius: 8px;
  outline: none;
  font-size: 13px;
}
.dd-list {
  margin: 8px 0 0 0;
  padding: 0;
  list-style: none;
  max-height: 260px;
  overflow: auto;
}
.dd-list li {
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 6px;
  color: #0f172a;
  font-size: 14px;
}
.dd-list li:hover {
  background: #f8fafc;
}
.dd-list li.active {
  background: #eef2ff;
  color: #0f172a;
  font-weight: 600;
}

/* Summary cards */
.summary-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}
.summary-cards .card {
  flex: 1 1 180px;
  min-width: 160px;
}
.card {
  background: #fff;
  border: 1px solid #f0f4ff;
  padding: 14px 16px;
  border-radius: 12px;
  width: auto;
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.04);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.08);
}

/* Disable global card hover for the users list card so individual items handle hover */
.users-card.card:hover {
  transform: none;
  box-shadow: 0 1px 6px rgba(2, 6, 23, 0.04);
}
.card .title {
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}
.card .value {
  font-size: 20px;
  font-weight: 800;
  color: #071031;
  margin-top: 6px;
}
.card .sub {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}

/* Main panels */
.charts {
  display: flex;
  gap: 16px;
}
.main-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chart-panel {
  flex: 1 1 auto;
  background: #fff;
  padding: 12px;
  border-radius: 10px;
  min-height: 460px;
  height: auto;
}
.table-panel {
  flex: 1 1 320px;
  background: #fff;
  padding: 12px;
  border-radius: 10px;
  max-height: 520px;
  overflow: auto;
}

.progress {
  background: #f2f6fb;
  height: 8px;
  border-radius: 4px;
  width: 100%;
  margin-bottom: 6px;
}
.progress .bar {
  height: 8px;
  background: #2563eb;
  border-radius: 4px;
}

/* User card */
.user-list-card {
  min-height: 200px;
  max-height: 200px;
}
.users-card {
  width: 360px;
  max-width: 100%;
  box-shadow: 0 1px 6px rgba(2, 6, 23, 0.04);
}
.card-title {
  font-weight: 700;
  margin-bottom: 8px;
}
.card-body {
  padding: 0;
}
.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.user-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.12s ease, transform 0.08s ease;
}
.user-item:hover {
  background: #fbfdff;
  transform: translateX(4px);
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.04);
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #0f172a;
}
.meta .name {
  font-weight: 700;
  font-size: 14px;
}
.meta .role {
  font-size: 12px;
  color: #64748b;
}
.user-list .empty {
  color: #9aa6b2;
  padding: 12px;
}
.user-count {
  padding: 10px;
  font-size: 13px;
  color: #555;
  text-align: right;
}

.results-section {
  margin-top: 12px;
  border-top: 1px dashed #eef3ff;
  padding-top: 12px;
}
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.small-btn {
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #e6eef9;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
}

/* Main area layout */
.main-area {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-direction: row;
}
.main-left {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.main-right {
  flex: 0 0 360px;
  max-width: 360px;
}
.chart-panel {
  min-height: 460px;
}

.clickable {
  cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}
.modal {
  background: #fff;
  border-radius: 10px;
  width: min(720px, 95vw);
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 18px 48px rgba(2, 6, 23, 0.16);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.modal-title {
  color: #294594;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.2px;
  margin: 0;
}
.modal-body {
  padding: 12px 16px;
}
.modal-close {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
}
.goal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.goal-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}
.goal-card {
  background: #fff;
  border: 1px solid #eef2ff;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 10px 28px rgba(2, 6, 23, 0.06);
  min-height: 160px;
}
.goal-card:hover {
  box-shadow: 0 18px 48px rgba(2, 6, 23, 0.12);
  transform: translateY(-4px);
  transition: all 0.18s ease;
}
.goal-card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.goal-title {
  font-weight: 800;
  font-size: 18px;
  color: #071031;
}
.goal-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}
.badge {
  background: linear-gradient(180deg, #f8fbff, #fff);
  border: 1px solid #e6efff;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #374151;
}
.badge.muted {
  background: #fafbff;
  color: #6b7280;
}
.goal-card-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.goal-field {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #fbfdff;
  border-radius: 10px;
  border: 1px solid #f1f6ff;
  align-items: center;
}
.goal-field.small {
  padding: 8px 10px;
  background: #fcfdff;
  font-size: 13px;
}
.goal-field strong {
  font-weight: 700;
  font-size: 13px;
  color: #334155;
}
.goal-field span {
  font-size: 14px;
  color: #0b1220;
}
.goal-field.highlight {
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  border: 1px solid #e6f0ff;
}
.goal-value {
  font-size: 18px;
  font-weight: 800;
  color: #0b1220;
}
.goal-weight {
  font-size: 16px;
  font-weight: 700;
  color: #2563eb;
}

/* Radar + Mentoring side-by-side */
.radar-section {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.radar-section .radar-card,
.radar-section .mentoring-card {
  flex: 1 1 50%;
  min-width: 280px;
  box-sizing: border-box;
}
.radar-section .radar-card .card-body {
  padding: 12px;
}
.radar-section .mentoring-card .card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mentoring-chart-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.mentoring-legend {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  align-items: center;
}
.mentoring-legend .legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.mentoring-legend .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
.dot-completed {
  background: #10b981;
}
.dot-scheduled {
  background: #2563eb;
}
.dot-cancelled {
  background: #f97316;
}
.dot-noshow {
  background: #ef4444;
}

.radar-section {
  flex-wrap: nowrap;
}
.radar-section > .radar-card,
.radar-section > .mentoring-card {
  flex: none;
  width: calc(50% - 8px);
  max-width: calc(50% - 8px);
}

/* Responsive tweaks */
@media (max-width: 900px) {
  .goal-cards {
    grid-template-columns: 1fr;
  }
  .charts {
    flex-direction: column;
  }
  .chart-panel,
  .table-panel {
    flex: 1 1 100%;
  }
  .main-area {
    flex-direction: column;
  }
  .summary-cards {
    gap: 10px;
  }
  .radar-section {
    flex-wrap: wrap;
  }
  .radar-section > .radar-card,
  .radar-section > .mentoring-card {
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .dd-panel {
    right: 8px;
    left: 8px;
    width: auto;
  }
  .card {
    min-width: 120px;
  }
  .users-card {
    width: 100%;
  }
}

/* Sidebar/leaderboard tweaks */
.users-card {
  margin-bottom: 16px;
  box-sizing: border-box;
  max-height: 520px;
  width: 100%;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef6ff;
}
.users-card .card-body {
  max-height: 360px;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 12px;
}
.radar-card {
  height: 420px;
}
.radar-card .card-body {
  height: calc(100% - 36px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mentoring donut card */
.mentoring-card {
  box-sizing: border-box;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef6ff;
}
.mentoring-card .card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.mentoring-chart-wrap {
  width: 100%;
  max-width: 320px;
}
.mentoring-legend {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-start;
  width: 100%;
  padding-top: 6px;
  align-items: center;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #0f172a;
}

/* Pass/fail donut card */
.passfail-card {
  box-sizing: border-box;
  margin: 8px 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef6ff;
}
.passfail-card .card-body {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.passfail-chart-wrap {
  width: 100%;
  max-width: 320px;
}

/* Skeleton loading */
.skeleton {
  position: relative;
  background: #eef2ff;
  border-radius: 12px;
  overflow: hidden;
}
.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.6),
    rgba(255, 255, 255, 0)
  );
  animation: shimmer 1.4s ease-in-out infinite;
}
.skeleton-chart.large {
  height: 460px;
}
.skeleton-donut {
  height: 220px;
  max-width: 320px;
  margin: 0 auto;
}
.skeleton-radar {
  height: 520px;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* Radar header */
.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.user-item.disabled:hover {
  background: #ffffff; /* 기존 hover 무효 */
  transform: none;
}
</style>
