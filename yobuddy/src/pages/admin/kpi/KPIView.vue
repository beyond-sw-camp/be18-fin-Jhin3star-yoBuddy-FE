<template>
  <div class="kpi-view page-container">
    <header class="kpi-header">
      <h1>KPI 성과 지표</h1>
      <div class="controls">
        <div class="dept-dropdown" ref="dropdown">
          <button class="dd-toggle" @click="toggleDropdown" :aria-expanded="dropdownOpen">
            <span class="dd-label">{{ selectedLabel }}</span>
            <span class="dd-actions">
              <svg class="dd-caret" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
            </span>
          </button>

          <div v-show="dropdownOpen" class="dd-panel">
            <input class="dept-search" v-model="filterTerm" placeholder="부서명 검색..." @keydown.stop />
            <ul class="dd-list">
              <li v-for="d in filteredDepartments" :key="d.departmentId || d.id || d._id" :class="{ active: selectedDepartmentId === (d.departmentId || d.id || d._id) }" @click="selectDepartment(d)">
                {{ d.name || d.departmentName || d.title }}
              </li>
            </ul>
          </div>
        </div>
        <button class="pdf-btn" @click="exportPdf" title="PDF로 내보내기">PDF</button>
      </div>
    </header>

    <section class="summary-cards">
      <div class="card" v-for="card in summaryCards" :key="card.title" @click="onSummaryClick(card)" :class="{ clickable: card.title === '부서 목표' }">
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
          <div v-if="!kpiGoals || kpiGoals.length===0" class="empty">표시할 목표가 없습니다.</div>
          <div v-else class="goal-cards">
            <div v-for="g in kpiGoals" :key="g.kpiGoalId || g.kpiId || g.goalId || g.id" class="goal-card">
              <div class="goal-card-header">
                <div class="goal-title">{{ g.description || g.name || g.title || g.kpiName || '무제' }}</div>
                <div class="goal-badges">
                  <span class="badge muted">카테고리: {{ g.kpiCategoryId ?? '-' }}</span>
                </div>
              </div>
              <div class="goal-card-body">
                <div class="goal-field small"><strong>부서 ID</strong><span>{{ g.departmentId ?? '-' }}</span></div>
                <div class="goal-field highlight"><strong>목표값</strong><span class="goal-value">{{ g.targetValue ?? g.target ?? g.goal ?? '-' }}</span></div>
                <div class="goal-field highlight weight"><strong>가중치</strong><span class="goal-weight">{{ g.weight ?? '-' }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="main-area">
      <!-- Left: charts (larger) -->
      <div class="main-left">
        <section class="charts">
          <div class="chart-panel">
            <!-- enlarge bar chart height -->
            <VueApexCharts type="bar" :options="computedChartOptions" :series="computedChartSeries" height="460" />
          </div>
        </section>
        <section class="kpi-passfail">
          <div class="card passfail-card">
            <div class="card-title">KPI 위험도</div>
            <div class="card-body">
              <div class="passfail-chart-wrap">
                <VueApexCharts type="donut" :options="kpiPassFailOptions" :series="kpiPassFailSeries" height="220" />
              </div>
            </div>
          </div>
        </section>
        <section class="radar-section">
            <div class="card radar-card">
              <div class="card-title-row">
                <div class="card-title">KPI 목표별 분포 (레이더)</div>
                <div>
                  <select class="year-select" v-model="selectedRadarYear">
                    <option :value="null">전체 연도</option>
                    <option v-for="y in yearsList" :key="y" :value="y">{{ y }}</option>
                  </select>
                </div>
              </div>
              <div class="card-body">
                <VueApexCharts type="radar" :options="radarOptions" :series="computedRadarSeries" height="520" />
              </div>
            </div>
            <div class="card mentoring-card">
          <div class="card-title">멘토링 세션 요약</div>
          <div class="card-body">
            <div class="mentoring-chart-wrap">
              <VueApexCharts type="donut" :options="mentoringDonutOptions" :series="mentoringDonutSeries" height="260" />
            </div>
            <div class="mentoring-legend">
              <div class="legend-item"><span class="dot dot-completed"></span>완료 <strong>{{ mentoringSessions && mentoringSessions.completed != null ? mentoringSessions.completed : 0 }}</strong></div>
              <div class="legend-item"><span class="dot dot-scheduled"></span>예정 <strong>{{ mentoringSessions && mentoringSessions.scheduled != null ? mentoringSessions.scheduled : 0 }}</strong></div>
              <div class="legend-item"><span class="dot dot-cancelled"></span>취소 <strong>{{ mentoringSessions && mentoringSessions.cancelled != null ? mentoringSessions.cancelled : 0 }}</strong></div>
              <div class="legend-item"><span class="dot dot-noshow"></span>노쇼 <strong>{{ mentoringSessions && mentoringSessions.noShow != null ? mentoringSessions.noShow : 0 }}</strong></div>
            </div>
          </div>
        </div>
      </section>
      </div>

      <!-- Right: user list (sidebar-like but in-page) -->
      <aside class="main-right">
        <div class="card users-card">
          <div class="card-title">{{selectedLabel}} 유저 목록</div>
          <div class="card-body">
            <ul class="user-list">
              <li v-if="usersLoading" class="empty">로딩 중...</li>
              <li v-else-if="!users || users.length===0" class="empty">사용자 없음</li>
              <li v-else v-for="u in users" :key="u.userId || u.id || u._id" class="user-item" @click="goToUser(u)">
                <div class="avatar">{{ (u.name||u.username||u.fullName||'유저').slice(0,1) }}</div>
                <div class="meta">
                  <div class="name">{{ u.name || u.username || u.fullName || '무명' }}</div>
                  <div class="role">{{ u.role || u.position || (u.authorities && u.authorities[0]) || '' }}</div>
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'
import { getDepartments } from '@/services/departmentService'
import kpiService from '@/services/kpiService'
import userService from '@/services/user'
import { useDepartmentStore } from '@/store/modules/department';

const selectedDepartmentId = ref(4)
const filterTerm = ref('')
const departments = ref([])
const dropdownOpen = ref(false)
const dropdown = ref(null)
const users = ref([])
const usersLoading = ref(false)
const usersError = ref(null)
const deptStore = useDepartmentStore()
const kpiGoals = ref([])
const goalsModalVisible = ref(false)
const userKpiResults = ref({})
const totalScoreUser = ref({})
const mentoringSessions = ref([])
const router = useRouter()

function onKeyDown(e) {
  if (e.key === 'Escape') closeGoalsModal()
}

async function openGoalsModal() {
  // ensure latest goals are loaded for current department
  await loadkpiGoals(selectedDepartmentId.value)
  goalsModalVisible.value = true
}

function onSummaryClick(card) {
  if (card && card.title === '부서 목표') {
    openGoalsModal()
  }
}

function closeGoalsModal() {
  goalsModalVisible.value = false
}

function exportPdf() {
  try {
    // Basic behavior: open print dialog for user to save as PDF
    window.print()
  } catch (e) {
    console.error('Export PDF failed', e)
    alert('PDF로 내보내기를 지원하지 않습니다.')
  }
}


const filteredDepartments = computed(() => {
  const q = (filterTerm.value || '').toString().toLowerCase().trim()
  if (!q) return departments.value
  return departments.value.filter(d => (d.name || d.departmentName || '').toString().toLowerCase().includes(q))
})
// 연도 목록(데이터에서 추출)
const yearsList = computed(() => {
  const years = new Set()
  for (const arr of Object.values(userKpiResults.value || {})) {
    if (!Array.isArray(arr)) continue
    for (const e of arr) {
      if (e && Number.isFinite(e.year)) years.add(e.year)
    }
  }
  const ys = Array.from(years).sort((a, b) => a - b)
  return ys
})

// 차트 시리즈: 연도별 달성률(사용자별 가중치 합의 평균)과 목표(상수)
const computedChartSeries = computed(() => {
  const goalAvg = 100

  // build weightMap from kpiGoals (string id -> weight)
  const weightMap = {}
  const kpiGoalKeys = []
  if (Array.isArray(kpiGoals.value)) {
    for (const g of kpiGoals.value) {
      const id = String(g.kpiGoalId ?? g.goalId ?? g.GoalId ?? g.kpiId ?? g.id ?? '')
      if (!id) continue
      const w = parseNumeric(g.weight ?? g.weightValue ?? g.score)
      weightMap[id] = Number.isFinite(w) ? w : 0
      const n = Number(g.kpiGoalId ?? g.goalId ?? g.GoalId ?? g.kpiId ?? g.id)
      if (!Number.isNaN(n)) kpiGoalKeys.push(n)
    }
  }

  const years = yearsList.value
  if (!years || years.length === 0) {
    // fallback: previous behavior using totalScoreUser average
    const totals = Object.values(totalScoreUser.value || {}).map(v => Number(v)).filter(v => Number.isFinite(v))
    const achieved = totals.length ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100) / 100 : 0
    return [ { name: '달성률', data: [achieved] }, { name: '목표값', data: [goalAvg] } ]
  }

  const achievedPerYear = []
  for (const y of years) {
    const userTotals = []
    for (const arr of Object.values(userKpiResults.value || {})) {
      if (!Array.isArray(arr)) continue
      // sum contributions for entries in year y
      const total = arr.reduce((sum, e) => {
        if (!e || e.year !== y) return sum
        const s = parseNumeric(e.score)
        const rawGoal = e && (e.goalId ?? e.GoalId ?? e.kpiGoalId)
        const goalId = rawGoal !== undefined && rawGoal !== null ? String(rawGoal) : null

        let weight = 0
        if (goalId && weightMap[goalId] !== undefined) {
          weight = weightMap[goalId]
        } else if (goalId) {
          const numericGoal = Number(goalId)
          if (!Number.isNaN(numericGoal) && kpiGoalKeys.length) {
            const direct = kpiGoalKeys.find(k => k === numericGoal)
            if (direct !== undefined) weight = weightMap[String(direct)] ?? 0
            else {
              const entryNums = arr.map(x => Number(x.goalId)).filter(n => !Number.isNaN(n))
              const minEntry = entryNums.length ? Math.min(...entryNums) : numericGoal
              const minKpi = kpiGoalKeys.length ? Math.min(...kpiGoalKeys) : null
              if (minKpi !== null && Number.isFinite(minEntry)) {
                const offset = minKpi - minEntry
                const mapped = String(numericGoal + offset)
                if (weightMap[mapped] !== undefined) weight = weightMap[mapped]
              }
            }
          }
        }
        const contrib = Number.isFinite(s) ? s * weight : 0
        return sum + contrib
      }, 0)
      userTotals.push(total)
    }
    const nums = userTotals.filter(v => Number.isFinite(v))
    const avg = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : 0
    achievedPerYear.push(avg)
  }

  return [ { name: '달성률', data: achievedPerYear }, { name: '목표값', data: years.map(() => goalAvg) } ]
})

const chartOptions = ref({
  chart: { toolbar: { show: false }, type: 'bar' },
  // columnWidth을 줄여 각 바 너비를 좁히면 막대들 사이의 간격이 넓어집니다.
  // 막대 너비를 줄이고 각 막대에 다른 색을 적용하기 위해 distributed 모드를 사용합니다.
  plotOptions: { bar: { borderRadius: 6, horizontal: false, columnWidth: '25%', distributed: false } },
  // 막대 위에 값 표시: 활성화, 포맷, 오프셋 및 스타일 적용
  dataLabels: { enabled: true, formatter: (val) => `${val}%`, offsetY: -6, style: { fontSize: '12px', colors: ['#fff'] } },
  // 두 개의 카테고리로 설정: '달성률'과 '목표값'
  xaxis: { categories: ['달성률', '목표값'] },
  yaxis: { labels: { formatter: (val) => `${val}` } },
  tooltip: { y: { formatter: (val) => `${val}` } },
  // 세련된 팔레트 (단색) — 그라데이션 제거
  colors: ['#4f46e5', '#294594'],
  fill: { type: 'solid', opacity: 1 },
  stroke: { show: false },
  // 범례 표시: 상단 가운데
  legend: { show: true, position: 'top', horizontalAlign: 'center', markers: { radius: 6 } },
  grid: { padding: { left: 20, right: 20 } }
})

const computedChartOptions = computed(() => {
  const years = yearsList.value
  const categories = (years && years.length) ? years.map(String) : (chartOptions.value.xaxis && chartOptions.value.xaxis.categories) || []
  const achievedColor = '#4f46e5' // purple
  const targetColor = '#294594' // orange
  return { ...chartOptions.value, xaxis: { ...(chartOptions.value.xaxis || {}), categories }, colors: [achievedColor, targetColor] }
})
// 이전 코드 일부가 chartSeriesRates를 사용하므로 기본 빈 배열 ref를 유지합니다.
// const chartSeriesRates = ref([])

const selectedLabel = computed(() => {
  if (!selectedDepartmentId.value) return '전체 부서'
  const id = selectedDepartmentId.value
  const found = departments.value.find(d => String(d.departmentId || d.id || d._id) === String(id))
  return found ? (found.name || found.departmentName || found.title) : '선택된 부서'
})

// 레이더(각형) 차트: `kpiGoals` 항목을 축으로 사용하고, 각 축의 값은
// 모든 사용자 KPI 결과(`userKpiResults`)에서 해당 goalId에 매칭되는 score들의 평균입니다.
const computedRadarSeries = computed(() => {
  const goals = Array.isArray(kpiGoals.value) ? kpiGoals.value : []
  const seriesData = goals.map(g => {
    const gid = String(g.kpiGoalId ?? g.goalId ?? g.kpiId ?? g.id ?? '')
    if (!gid) return 0
    const scores = []
    for (const arr of Object.values(userKpiResults.value || {})) {
      if (!Array.isArray(arr)) continue
      for (const e of arr) {
        // if a year is selected, only include entries for that year
        if (selectedRadarYear.value != null && e && e.year !== selectedRadarYear.value) continue
        const egid = e && (e.goalId ?? e.kpiGoalId ?? e.GoalId) ? String(e.goalId ?? e.kpiGoalId ?? e.GoalId) : null
        if (!egid) continue
        if (egid === gid) {
          const s = parseNumeric(e.score)
          if (Number.isFinite(s)) scores.push(s)
        }
      }
    }
    return scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0
  })
  return [{ name: '목표별 평균 점수', data: seriesData }]
})

const radarOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'radar' },
  xaxis: { categories: Array.isArray(kpiGoals.value) ? kpiGoals.value.map(g => (g.description || g.name || g.title || g.kpiName || '무제')) : [] },
  yaxis: { labels: { formatter: v => `${v}` } },
  stroke: { show: true, width: 1 },
  fill: { opacity: 0.4 },
  markers: { size: 4 },
  colors: ['#294594'],
  tooltip: { y: { formatter: (val) => `${val}` } },
  legend: { show: false }
}))

// selected year for radar filtering (null = all years)
const selectedRadarYear = ref(null)

// when yearsList changes, default to the latest year if not selected
watch(yearsList, (ys) => {
  if ((!selectedRadarYear.value || selectedRadarYear.value === null) && ys && ys.length) {
    selectedRadarYear.value = ys[ys.length - 1]
  }
})

// Mentoring donut: series derived from `mentoringSessions` counts
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
  tooltip: { y: { formatter: (v) => `${v}` } },
}))
// KPI pass/fail based on totalScoreUser: >60 pass, else fail
const kpiPassFailSeries = computed(() => {
  const totals = Object.values(totalScoreUser.value || {})
  if (!totals || totals.length === 0) return [0, 0]
  let pass = 0
  let fail = 0
  for (const v of totals) {
    const n = Number(v)
    if (!Number.isFinite(n)) { fail += 1; continue }
    if (n > 60) pass += 1
    else fail += 1
  }
  return [pass, fail]
})

const kpiPassFailOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'donut' },
  labels: ['60 이상', '미달'],
  colors: ['#10b981', '#ef4444'],
  legend: { position: 'bottom' },
  tooltip: { y: { formatter: v => `${v}` } }}))

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    // focus the search input next tick
    setTimeout(() => {
      const inp = dropdown.value && dropdown.value.querySelector('.dept-search')
      if (inp) inp.focus()
    }, 0)
  }
}

async function selectDepartment(d) {
  // accept object or primitive id
  if (!d) {
    selectedDepartmentId.value = null
  } else if (typeof d === 'object') {
    selectedDepartmentId.value = d.departmentId || d.id || d._id || null
  } else {
    selectedDepartmentId.value = d
  }
  dropdownOpen.value = false
  // reload KPI results and user list for selected department
  // await loadResults(selectedDepartmentId.value)
  await loadUsers(selectedDepartmentId.value)
  await loadkpiGoals(selectedDepartmentId.value)
  // 먼저 사용자별 KPI 데이터를 가져와서 `userKpiResults`를 채운 뒤 총합을 계산합니다.
  await getuserkpiresults()
  await getUserTotal()
  await getmentoring(selectedDepartmentId.value)
}

function goToUser(u) {
  const uid = u && (u.userId || u.id || u._id)
  if (!uid) return
  router.push(`/kpi/user/${uid}`)
}

function onDocClick(e) {
  if (!dropdown.value) return
  if (!dropdown.value.contains(e.target)) dropdownOpen.value = false
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))

onMounted(async () => {
  await loadDepartments()
  // 기본 부서 ID 4로 초기 선택 (selectDepartment은 id 또는 객체 모두 허용)
  await selectDepartment(4)
  await getuserkpiresults()
  await getUserTotal()
  await getmentoring(4)
  await console.log(totalScoreUser.value)
  console.log('KPI goals loaded for default dept:', selectedDepartmentId.value, kpiGoals.value.length)
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})


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
async function loadkpiGoals(deptOrId) {
  try {
    const resp = await kpiService.getGoals()
    const all = resp && resp.data ? resp.data : []
    // determine department id whether caller passed object or primitive
    if (!deptOrId) {
      kpiGoals.value = all
    } else {
      let deptId = null
      if (typeof deptOrId === 'object') {
        deptId = deptOrId.departmentId || deptOrId.id || deptOrId._id
      } else {
        deptId = deptOrId
      }
      kpiGoals.value = all.filter(g => String(g.departmentId ?? g.deptId ?? g.department) === String(deptId))
    }
    console.log('KPI goals loaded:', kpiGoals.value.length)
    return kpiGoals.value
  } catch (e) {
    console.error('Failed to load KPI goals', e)
    kpiGoals.value = []
    return kpiGoals.value
  }
}

function parseNumeric(v) {
  if (v === null || v === undefined) return NaN
  if (typeof v === 'number') return v
  const s = String(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/)
  return s ? Number(s[0]) : NaN
}

async function loadUsers(departmentId) {
  usersLoading.value = true
  usersError.value = null
  try {
    if (departmentId) {
      // Use department store to fetch department detail which includes members
      await deptStore.fetchDepartmentById(departmentId)
      const members = Array.isArray(deptStore.members) ? deptStore.members : (deptStore.selectedDepartment && deptStore.selectedDepartment.users) || []
      users.value = members.map(u => ({ ...u }))
    } else {
      // no department selected -> load all users (page size large)
      const params = { size: 1000 }
      console.debug('loadUsers params (all):', params)
      const resp = await userService.searchUsers(params)
      console.debug('loadUsers resp:', resp)
      // normalize to array
      let arr = []
      if (resp && Array.isArray(resp)) arr = resp
      else if (resp && resp.data && Array.isArray(resp.data)) arr = resp.data
      else if (resp && resp.data && Array.isArray(resp.data.content)) arr = resp.data.content
      else if (resp && resp.data && Array.isArray(resp.data.items)) arr = resp.data.items
      else if (resp && resp.payload && Array.isArray(resp.payload.items)) arr = resp.payload.items
      else if (resp && resp.payload && Array.isArray(resp.payload.content)) arr = resp.payload.content
      users.value = arr.map(u => ({ ...u }))
    }
  } catch (e) {
    console.error('Failed to load users', e)
    users.value = []
    usersError.value = e && e.message ? e.message : String(e)
  } finally {
    usersLoading.value = false
  }
}


const summaryCards = computed(() => {
  const totalGoals = Array.isArray(kpiGoals.value) ? kpiGoals.value.length : 0
  return [
    { title: '부서 목표', value: totalGoals, sub: '부서별 목표 갯수' }
  ]
})

async function getuserkpiresults() {
  // 초기화: 새로고침 시 이전 값 삭제 (원하면 누적 모드로 변경 가능)
  userKpiResults.value = {}

  for (const user of users.value || []) {
    const uidRaw = user.userId || user.id || user._id
    const uid = uidRaw !== undefined && uidRaw !== null ? String(uidRaw) : null
    try {
      const resp = await kpiService.getResults({ userId: uidRaw })
      const payload = resp && resp.data ? resp.data : (resp || {})

      // 다양한 응답 형태에 대해 배열로 정규화
      let items = []
      if (Array.isArray(payload)) items = payload
      else if (payload && Array.isArray(payload.items)) items = payload.items
      else if (payload && Array.isArray(payload.data)) items = payload.data
      else if (payload && payload.results && Array.isArray(payload.results)) items = payload.results
      else if (payload && (payload.score !== undefined || payload.goalId !== undefined || payload.kpiGoalId !== undefined || payload.GoalId !== undefined)) items = [payload]
      else items = []

      // map to { score:number|null, goalId:string|null, departmentId, createdAt, year }
      const entries = items.map(i => {
        const rawGoal = i.GoalId ?? i.goalId ?? i.kpiGoalId ?? i.goal_id ?? null
        const rawScore = i.score ?? i.scoreValue ?? i.value ?? i.result ?? null
        // createdAt field may come in many names
        const rawDate = i.createdAt ?? i.created_at ?? i.date ?? i.timestamp ?? i.ts ?? null
        let createdAt = null
        let year = null
        if (rawDate) {
          try {
            const d = new Date(rawDate)
            if (!Number.isNaN(d.getTime())) {
              createdAt = d.toISOString()
              year = d.getFullYear()
            }
          } catch (e) {
            // ignore
          }
        }
        return {
          score: parseNumeric(rawScore),
          goalId: rawGoal !== null && rawGoal !== undefined ? String(rawGoal) : null,
          departmentId: i.departmentId ?? i.department ?? null,
          createdAt,
          year
        }
      })

      // 누적: 기존이 있으면 합치고, 없으면 새 배열 설정 (키는 항상 문자열)
      const existing = Array.isArray(userKpiResults.value[uid]) ? userKpiResults.value[uid] : []
      userKpiResults.value = { ...userKpiResults.value, [uid]: existing.concat(entries) }

      console.log(`Saved KPI for ${uid}:`, userKpiResults.value[uid])
    } catch (e) {
      console.error(`Failed to load KPI for user ${uid}:`, e)
      // 실패한 경우 빈 배열로 표시
      if (!userKpiResults.value[uid]) {
        userKpiResults.value = { ...userKpiResults.value, [uid]: [] }
      }
    }
  }
}
async function getUserTotal() {
  // 사용자가 요청한 명세대로 구현:
  // 각 user entry의 goalId로 kpiGoals에서 weight를 조회하고 score * weight를 더합니다.
  const totals = {}

  // kpiGoals로부터 빠른 weight 조회용 맵 생성 (goalId 문자열 -> weight)
  const weightMap = {}
  if (Array.isArray(kpiGoals.value)) {
    for (const g of kpiGoals.value) {
      const id = String(g.kpiGoalId ?? g.goalId ?? g.GoalId ?? g.kpiId ?? g.id ?? '')
      if (!id) continue
      const w = parseNumeric(g.weight ?? g.weightValue ?? g.score)
      weightMap[id] = Number.isFinite(w) ? w : 0
    }
  }
  
  // prepare numeric list of kpiGoal ids to support numeric/offset fallbacks
  const kpiGoalKeys = []
  if (Array.isArray(kpiGoals.value)) {
    for (const g of kpiGoals.value) {
      const raw = g.kpiGoalId ?? g.goalId ?? g.GoalId ?? g.kpiId ?? g.id
      const n = Number(raw)
      if (!Number.isNaN(n)) kpiGoalKeys.push(n)
    }
  }
  for (const user of users.value || []) {
    const uidRaw = user.userId ?? user.id ?? user._id
    const uid = uidRaw !== undefined && uidRaw !== null ? String(uidRaw) : null
    if (!uid) continue

    const entries = Array.isArray(userKpiResults.value[uid]) ? userKpiResults.value[uid] : []

    const total = entries.reduce((sum, e) => {
      const s = parseNumeric(e && e.score)
      const rawGoal = e && (e.goalId ?? e.GoalId ?? e.kpiGoalId)
      const goalId = rawGoal !== undefined && rawGoal !== null ? String(rawGoal) : null

      // primary lookup: exact match
      let weight = 0
      if (goalId && weightMap[goalId] !== undefined) {
        weight = weightMap[goalId]
      } else if (goalId) {
        // fallback A: numeric direct match against kpiGoal keys
        const numericGoal = Number(goalId)
        if (!Number.isNaN(numericGoal) && kpiGoalKeys.length) {
          const direct = kpiGoalKeys.find(k => k === numericGoal)
          if (direct !== undefined) {
            weight = weightMap[String(direct)] ?? 0
          } else {
            // fallback B: offset mapping between min entry goalId and min kpiGoal id
            const entryNums = entries.map(x => Number(x.goalId)).filter(n => !Number.isNaN(n))
            const minEntry = entryNums.length ? Math.min(...entryNums) : numericGoal
            const minKpi = kpiGoalKeys.length ? Math.min(...kpiGoalKeys) : null 
            if (minKpi !== null && Number.isFinite(minEntry)) {
              const offset = minKpi - minEntry
              const mapped = String(numericGoal + offset)
              if (weightMap[mapped] !== undefined) weight = weightMap[mapped]
            }
          }
        }
      }

      const contrib = Number.isFinite(s) ? s * weight : 0
      console.debug('getUserTotal entry', { uid, score: s, goalId, weight, contrib })
      return sum + contrib
    }, 0)

    totals[uid] = total
  }

  totalScoreUser.value = totals
  console.log('Computed weighted totals per user (using kpiGoals weights):', totalScoreUser.value)
  // Diagnostic: if any total equals 10 (unexpected), print detailed breakdown for that user
  for (const [uid, val] of Object.entries(totals)) {
    if (val === 10) {
      const userEntries = Array.isArray(userKpiResults.value[uid]) ? userKpiResults.value[uid] : []
      const details = userEntries.map(e => {
        const s = parseNumeric(e && e.score)
        const gid = e && (e.goalId ?? e.GoalId ?? e.kpiGoalId) ? String(e.goalId ?? e.GoalId ?? e.kpiGoalId) : null
        const w = gid && weightMap[gid] !== undefined ? weightMap[gid] : 0
        const contrib = Number.isFinite(s) ? s * w : 0
        return { scoreRaw: e && e.score, score: s, goalId: gid, weight: w, contrib }
      })
      console.warn('DIAGNOSTIC total==10 for uid', uid, { total: val, weightMapSnapshot: weightMap, entries: details })
    }
  }
  return totals
}
async function getmentoring(departmentId) {
    try {
      // Some backends / older services may expose this endpoint with different naming.
      const svc = kpiService.getMentoringByDepartment || kpiService.getmentoringbydepartment || kpiService.getMentoringByDept || kpiService.getmentoringByDepartment
      if (!svc || typeof svc !== 'function') {
        console.warn('kpiService: mentoring endpoint not found. Skipping mentoring load.')
        mentoringSessions.value = { total: 0, completed: 0, noShow: 0, scheduled: 0, cancelled: 0 }
        return
      }
      const resp = await svc.call(kpiService, departmentId)
      const mentoring = resp && resp.data ? resp.data : (resp || [])
      const arr = Array.isArray(mentoring) ? mentoring : []
      const mentoringcount = arr.length
      const mentoringcompleted = arr.filter(m => (m && (m.status || '').toString().toUpperCase()) === 'COMPLETED').length
      const mentoringnoshow = arr.filter(m => (m && (m.status || '').toString().toUpperCase()) === 'NO_SHOW').length
      const mentoringscheduled = arr.filter(m => (m && (m.status || '').toString().toUpperCase()) === 'SCHEDULED').length
      const mentoringcancelled = arr.filter(m => (m && (m.status || '').toString().toUpperCase()) === 'CANCELLED').length

      mentoringSessions.value = {
        total: mentoringcount,
        completed: mentoringcompleted,
        noShow: mentoringnoshow,
        scheduled: mentoringscheduled,
        cancelled: mentoringcancelled
      }
      console.log('Mentoring data loaded:', mentoringSessions.value)
    } catch (e) {
      console.error('Failed to load mentoring data', e)
      mentoringSessions.value = { total: 0, completed: 0, noShow: 0, scheduled: 0, cancelled: 0 }
    }
}

</script>

<style scoped>
/* Layout base */
.kpi-view { padding:18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; max-width:1200px; margin:0 auto }
.kpi-header { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; margin-bottom:18px }
.kpi-header h1 { margin:0; font-size:20px }

/* Controls */
.controls { display:flex; align-items:center; gap:12px }
.dept-dropdown { position:relative }
.dd-toggle { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; border:1px solid #e6eef9; background:linear-gradient(180deg,#ffffff,#fbfdff); box-shadow:0 2px 6px rgba(16,24,40,0.04); cursor:pointer; transition:box-shadow .15s, transform .06s }
.dd-toggle:active { transform:translateY(1px) }
.dd-label { font-weight:600; color:#0f172a }
.dd-actions { display:inline-flex; align-items:center; gap:6px }
.clear-btn { background:transparent; border:none; color:#6b7280; font-weight:700; cursor:pointer; padding:4px 6px; border-radius:6px }
.clear-btn:hover { color:#0f172a; background:#f8fafc }
.dd-caret { color:#6b7280 }

.pdf-btn { margin-left:12px; padding:8px 12px; border-radius:10px; border:1px solid #e6eef9; background:linear-gradient(180deg,#ffffff,#f6f9ff); cursor:pointer; font-weight:700; color:#0b5fff }
.pdf-btn:hover { box-shadow:0 6px 18px rgba(11,95,255,0.08); transform:translateY(-2px) }

.dd-panel { position:absolute; right:0; top:calc(100% + 8px); width:320px; max-width:calc(100vw - 32px); background:#fff; border:1px solid #eef2ff; border-radius:10px; box-shadow:0 12px 36px rgba(2,6,23,0.08); padding:10px; z-index:40; transition:opacity .12s ease }
.dd-panel .dept-search { width:100%; padding:8px 10px; border:1px solid #eef2ff; border-radius:8px; outline:none; font-size:13px }
.dd-list { margin:8px 0 0 0; padding:0; list-style:none; max-height:260px; overflow:auto }
.dd-list li { padding:8px 10px; cursor:pointer; border-radius:6px; color:#0f172a; font-size:14px }
.dd-list li:hover { background:#f8fafc }
.dd-list li.active { background:#eef2ff; color:#0f172a; font-weight:600 }

/* Summary cards */
.summary-cards { display:flex; flex-wrap:wrap; gap:16px; margin-bottom:20px }
.summary-cards .card { flex:1 1 180px; min-width:160px }
.card { background:#fff; border:1px solid #f0f4ff; padding:14px 16px; border-radius:12px; width:auto; box-shadow:0 4px 12px rgba(2,6,23,0.04); transition:transform .12s ease, box-shadow .12s ease }
.card:hover { transform:translateY(-4px); box-shadow:0 18px 40px rgba(2,6,23,0.08) }

/* Disable global card hover for the users list card so individual items handle hover */
.users-card.card:hover { transform: none; box-shadow: 0 1px 6px rgba(2,6,23,0.04) }
.card .title { color:#475569; font-size:13px; font-weight:700 }
.card .value { font-size:20px; font-weight:800; color:#071031; margin-top:6px }
.card .sub { font-size:12px; color:#64748b; margin-top:8px }

/* Main panels */
.charts { display:flex; gap:16px }
.main-left { display:flex; flex-direction:column; gap:16px }
.chart-panel { flex:1 1 auto; background:#fff; padding:12px; border-radius:10px; min-height:460px; height:auto }
.table-panel { flex:1 1 320px; background:#fff; padding:12px; border-radius:10px; max-height:520px; overflow:auto }
.kpi-table { width:100%; border-collapse:collapse }
.kpi-table th, .kpi-table td { padding:10px 8px; text-align:left; border-bottom:1px solid #f3f6fb; font-size:13px }

.progress { background:#f2f6fb; height:8px; border-radius:4px; width:100%; margin-bottom:6px }
.progress .bar { height:8px; background:#2563eb; border-radius:4px }

/* User card */
.user-list-card { min-height: 200px;max-height: 200px; }
.users-card { width:360px; max-width:100%; box-shadow:0 1px 6px rgba(2,6,23,0.04) }
.card-title { font-weight:700; margin-bottom:8px }
.card-body { padding:0 }
.user-list { list-style:none; padding:0; margin:0 }
.user-item { display:flex; gap:12px; padding:10px; align-items:center; border-bottom:1px solid #f1f5f9; transition: background .12s ease, transform .08s ease }
.user-item:hover { background:#fbfdff; transform: translateX(4px); box-shadow: inset 0 0 0 1px rgba(37,99,235,0.04) }
.avatar { width:40px; height:40px; border-radius:50%; background:#eef2ff; display:flex; align-items:center; justify-content:center; font-weight:700; color:#0f172a }
.meta .name { font-weight:700; font-size:14px }
.meta .role { font-size:12px; color:#64748b }
.user-list .empty { color:#9aa6b2; padding:12px }
.user-count { padding:10px; font-size:13px; color:#556 ; text-align:right }

.results-section { margin-top:12px; border-top:1px dashed #eef3ff; padding-top:12px }
.results-header { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px }
.small-btn { padding:6px 8px; border-radius:8px; border:1px solid #e6eef9; background:#fff; cursor:pointer; font-size:12px }
.results-table { width:100%; border-collapse:collapse; font-size:13px }
.results-table th, .results-table td { padding:6px 8px; border-bottom:1px solid #f3f6fb; text-align:left }

/* Main area layout: left content + right sidebar */
.main-area { display:flex; gap:24px; align-items:flex-start; flex-direction:row }
.main-left { flex:2; display:flex; flex-direction:column; gap:20px }
.main-right { flex:0 0 360px; max-width:360px }
.chart-panel { min-height:460px }

.clickable { cursor:pointer }

/* Modal */
.modal-overlay { position:fixed; inset:0; background:rgba(2,6,23,0.45); display:flex; align-items:center; justify-content:center; z-index:60;margin-top: 5%; }
.modal { background:#fff; border-radius:10px; width:min(720px, 95vw); max-height:80vh; overflow:auto; box-shadow:0 18px 48px rgba(2,6,23,0.16) }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #f1f5f9 }
.modal-title { color: #294594; font-size:20px; font-weight:800; letter-spacing: -0.2px; margin:0 }
.modal-body { padding:12px 16px }
.modal-close { background:transparent; border:none; font-size:18px; cursor:pointer }
.goal-list { list-style:none; padding:0; margin:0 }
.goal-cards { display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:16px }
.goal-card { background:#fff; border:1px solid #eef2ff; border-radius:14px; padding:18px; box-shadow:0 10px 28px rgba(2,6,23,0.06); min-height:160px }
.goal-card:hover { box-shadow:0 18px 48px rgba(2,6,23,0.12); transform:translateY(-4px); transition:all .18s ease }
.goal-card-header { display:flex; justify-content:space-between; gap:12px; align-items:flex-start }
.goal-title { font-weight:800; font-size:18px; color:#071031 }
.goal-badges { display:flex; gap:8px; align-items:center }
.badge { background:linear-gradient(180deg,#f8fbff,#fff); border:1px solid #e6efff; padding:6px 10px; border-radius:999px; font-size:12px; color:#374151 }
.badge.muted { background:#fafbff; color:#6b7280 }
.goal-card-body { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px; margin-top:12px }
.goal-field { display:flex; justify-content:space-between; gap:12px; padding:10px 12px; background:#fbfdff; border-radius:10px; border:1px solid #f1f6ff; align-items:center }
.goal-field.small { padding:8px 10px; background:#fcfdff; font-size:13px }
.goal-field strong { font-weight:700; font-size:13px; color:#334155 }
.goal-field span { font-size:14px; color:#0b1220 }
.goal-field.highlight { background:linear-gradient(180deg,#ffffff,#fbfdff); border:1px solid #e6f0ff }

/* Radar + Mentoring side-by-side */
.radar-section { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap }
.radar-section .radar-card,
.radar-section .mentoring-card { flex:1 1 50%; min-width:280px; box-sizing:border-box }
.radar-section .radar-card .card-body { padding:12px }
.radar-section .mentoring-card .card-body { display:flex; flex-direction:column; gap:12px }
.mentoring-chart-wrap { display:flex; align-items:center; justify-content:center; width:100% }
.mentoring-legend { display:flex; flex-direction:row; flex-wrap:wrap; gap:12px; margin-top:8px; align-items:center }
.mentoring-legend .legend-item { display:flex; align-items:center; gap:8px; font-size:13px }
.mentoring-legend .dot { width:12px; height:12px; border-radius:50%; display:inline-block }
.dot-completed { background:#10b981 }
.dot-scheduled { background:#2563eb }
.dot-cancelled { background:#f97316 }
.dot-noshow { background:#ef4444 }
.radar-section { flex-wrap:nowrap }
.radar-section > .radar-card,
.radar-section > .mentoring-card { flex: none; width: calc(50% - 8px); max-width: calc(50% - 8px); }
.goal-value { font-size:18px; font-weight:800; color:#0b1220 }
.goal-weight { font-size:16px; font-weight:700; color:#2563eb }

@media (max-width: 900px) {
  .goal-cards { grid-template-columns: 1fr }
}

/* Responsive tweaks */
@media (max-width: 900px) {
  .charts { flex-direction:column }
  .chart-panel, .table-panel { flex:1 1 100% }
  .main-area { flex-direction:column }
  .summary-cards { gap:10px }
  .radar-section { flex-wrap:wrap }
  .radar-section > .radar-card,
  .radar-section > .mentoring-card { width:100%; max-width:100% }
}

@media (max-width: 480px) {
  .dd-panel { right:8px; left:8px; width:auto }
  .card { min-width:120px }
  .users-card { width:100% }
}


/* Sidebar/leaderboard removed: keep users-card and radar sizing */
.users-card { margin-bottom: 16px; box-sizing: border-box; max-height: 520px; width:100%; background: #fff; border-radius:12px; border:1px solid #eef6ff }
.users-card .card-body { max-height: 360px; overflow-y: auto; box-sizing: border-box; padding: 12px }
.radar-card { height:420px }
.radar-card .card-body { height: calc(100% - 36px); display:flex; align-items:center; justify-content:center }

/* Mentoring donut card styles */
.mentoring-card { box-sizing:border-box; margin-bottom:16px; background:#fff; border-radius:12px; border:1px solid #eef6ff }
.mentoring-card .card-body { padding:12px; display:flex; flex-direction:column; gap:10px; align-items:center }
.mentoring-chart-wrap { width:100%; max-width:320px }
.mentoring-legend { display:flex; flex-direction:row; flex-wrap:wrap; gap:12px; justify-content:flex-start; width:100%; padding-top:6px; align-items:center }
.legend-item { display:flex; align-items:center; gap:8px; font-size:13px; color:#0f172a }
.passfail-card { box-sizing:border-box; margin:8px 0; background:#fff; border-radius:12px; border:1px solid #eef6ff }
.passfail-card .card-body { padding:12px; display:flex; align-items:center; justify-content:center }
.passfail-chart-wrap { width:100%; max-width:320px }
.dot { width:10px; height:10px; border-radius:50%; display:inline-block }
.dot-completed { background:#10b981 }
.dot-scheduled { background:#2563eb }
.dot-cancelled { background:#f97316 }
.dot-noshow { background:#ef4444 }

/* Radar header: title + year select */
.card-title-row { display:flex; justify-content:space-between; align-items:center; gap:12px }
.year-select { padding:6px 8px; border-radius:8px; border:1px solid #e6eef9; background:#fff; font-size:13px }


</style>
