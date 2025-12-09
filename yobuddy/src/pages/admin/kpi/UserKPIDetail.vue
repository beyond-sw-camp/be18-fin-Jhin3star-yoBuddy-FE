<template>
  <div class="user-kpi-page page-container">
    <div class="header-row">
      <h2>개인 성과 조회</h2>
      <button class="pdf-btn" @click="exportPdf" :disabled="exporting" :aria-busy="exporting">{{ exporting ? '내보내는 중...' : 'PDF' }}</button>
    </div>
    <div>
      <!-- user header card -->
      <section class="section-block">
        <div class="user-card card">
        <div class="left">
          <div class="avatar">{{ userInitial }}</div>
        </div>
        <div class="center">
          <div class="name">{{ userDisplay }}</div>
          <div class="subtitle">{{ department ? (department.name || department.departmentName || '') : '' }}</div>
        </div>
        <div class="right stats">
          <div class="stat"><div class="label">평균 과제 점수</div><div class="value">{{ teskgrade }}</div></div>
          <div class="stat"><div class="label">KPI 점수</div><div class="value">{{ totalScoreUser[userId] }}</div>
          </div>
        </div>
      </div>
      </section>

      <!-- radar charts row -->
      <section class="section-block">
      <div class="charts-row">
        <div class="card radar-wrap">
          <div class="card-title">KPI 점수 상세</div>
          <div class="card-body">
            <VueApexCharts type="radar" :options="userRadarOptions" :series="userRadarSeries" height="260" />
          </div>
        </div>
        <div class="card radar-wrap">
          <div class="card-title">부서 KPI 평균 점수</div>
          <div class="card-body">
            <VueApexCharts type="radar" :options="userRadarOptions" :series="deptRadarSeries" height="260" />
          </div>
        </div>
      </div>
      </section>

      <!-- lower summary: two small cards -->
      <section class="section-block">
      <div class="summary-row">
        <div class="card small-card">
          <div class="card-title">과제 제출 현황</div>
          <div class="card-body small-body">
            <div class="progress-labels">
              <div>제출 완료 <strong>{{ tesksdetail.completedcount }}</strong></div>
              <div>남은 과제 <strong>{{ tesksdetail.penddingcount }}</strong></div>
            </div>
            <div class="small-chart">
              <VueApexCharts type="donut" :options="tasksmallDonutOptions" :series="smallDonutSeries" height="140" />
            </div>
          </div>
        </div>

        <div class="card small-card">
          <div class="card-title">교육 이수 현황</div>
          <div class="card-body small-body">
            <div class="progress-labels">
              <div>이수 완료 <strong>{{ trainingsDetail.COMPLETED.length }}</strong></div>
              <div>진행 중 <strong>{{ trainingsDetail.IN_PROGRESS.length }}</strong></div>
              <div>미이수 <strong>{{ trainingsDetail.MISSED.length }}</strong></div>
              <div>남은 교육 <strong>{{ trainingsDetail.PENDING.length }}</strong></div>
            </div>
            <div class="small-chart">
              <VueApexCharts type="donut" :options="trainingsmallDonutOptions" :series=[trainingsDetail.COMPLETED.length,trainingsDetail.IN_PROGRESS.length,trainingsDetail.MISSED.length,trainingsDetail.PENDING.length] height="140" />
            </div>
          </div>
        </div>
      </div>
      </section>

      <!-- weekly reports -->
      <section class="section-block">
        <div class="card reports-card">
          <div class="card-title">주간 리포트 평가</div>
          <div class="card-body reports-list">
                <div class="report-item" v-for="(r, idx) in weeklyreport" :key="r.weeklyReportId || idx" @click="openReport(r)" role="button" tabindex="0">
                  <div class="week">{{ r.weekNumber ? (r.weekNumber + '주차') : '' }} · {{ formatDate(r.startDate) }} ~ {{ formatDate(r.endDate) }}</div>
                  <div class="meta">제출일자: {{ formatDate(r.updatedAt || r.createdAt) }} · 멘티: {{ r.menteeName }}</div>
                </div>
              </div>
        </div>
      </section>

      <!-- Weekly Report Modal (click a report to open) -->
      <div v-if="reportModalVisible" class="modal-overlay" @click.self="closeReport">
        <div class="modal">
            <div class="modal-header">
            <div class="modal-title">{{ selectedReport.weekNumber ? (selectedReport.weekNumber + '주차 주간 리포트') : '주간 리포트' }}</div>
            <span :class="['modal-status', 'status-' + ((selectedReport.status || '').toString().toUpperCase())]">{{ selectedReport.status }}</span>
            <div class="modal-dates">({{ formatDate(selectedReport.startDate) }} ~ {{ formatDate(selectedReport.endDate) }})</div>
            <div class="modal-createdate">제출일자 : {{ formatDate(selectedReport.createdAt||selectedReport.updatedAt ) }}</div>
            <button class="modal-close" @click="closeReport">✕</button>
          </div>
          <div class="modal-body">
            <h4>성과</h4>
            <p class="modal-text">{{ selectedReport.accomplishments }}</p>

            <h4>어려웠던 점</h4>
            <p class="modal-text">{{ selectedReport.challenges }}</p>

            <h4>배운 점</h4>
            <p class="modal-text">{{ selectedReport.learnings }}</p>

            <div class="mentor-box">
              <div class="mentor-title">멘토 피드백</div>
              <div class="mentor-meta">{{ formatDate(selectedReport.updatedAt) }}</div>
              <div class="mentor-body">{{ selectedReport.mentorFeedback }}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeReport">취소</button>
            <button class="btn btn-primary" @click="closeReport">확인</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useRoute } from 'vue-router'
import userService from '@/services/user'
import { useDepartmentStore } from '@/store/modules/department';
import kpiService from '@/services/kpiService'
import tasksService from '@/services/tasksService'
import userTrainingService from '@/services/userTrainingService'

const storeDepartment = useDepartmentStore()

const route = useRoute()
const userId = route.params.userId

const user = ref({})
const users = ref([]) // for userKpiResults loading
const department = ref(null)
const tasks = ref([])
const tesksdetail = ref({penddingcount:0,completedcount:0})
const teskgrade = ref(null)
const training = ref([])
const trainingsDetail = ref({ PENDING: [], IN_PROGRESS: [], COMPLETED: [], MISSED: [] })
const entries = ref([])
const kpiGoals = ref([])
const totalScoreUser = ref({}) // weighted total scores per user
const userKpiResults = ref({}) // all users' KPI results by department
const weeklyreport = ref([])
const exporting = ref(false)

// modal state for showing a single weekly report
const reportModalVisible = ref(false)
const selectedReport = ref({})

function openReport(r) {
  selectedReport.value = r || {}
  reportModalVisible.value = true
}

function closeReport() {
  reportModalVisible.value = false
  selectedReport.value = {}
}

// helper removed (not used in this view)
onMounted(async () => {
  await loaduserinfo(userId)
  await loadDepartment()
  await loadUsers(user.value.departmentId)
  await getuserkpiresults()
  await loadKPIEntries()
  await loadkpiGoals(user.value.departmentId)
  // load tasks for current user (if available)
  const uidForTasks = user.value && (user.value.userId || user.value.id || user.value._id) ? (user.value.userId || user.value.id || user.value._id) : userId
  await loadTasks(uidForTasks)
  await getUserTotal(userId)
  await loadtraining(userId)
  await getweeklyreport(userId)
})

async function loadUsers(departmentId) {
  try {
    if (departmentId) {
      // Use department store to fetch department detail which includes members
      await storeDepartment.fetchDepartmentById(departmentId)
      const members = Array.isArray(storeDepartment.members) ? storeDepartment.members : (storeDepartment.selectedDepartment && storeDepartment.selectedDepartment.users) || []
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
  } finally {
    console.log('Users loaded:', users.value.length)
  }
}


async function loaduserinfo(userId) {
    try {
        const u = await userService.getUserById(userId)
        user.value = u && u.data ? u.data : (u || null)
        console.log('User fetched:', user.value.departmentId)
    } catch (e) {
        console.error('Failed to load user info', e)
    }
}
async function loadDepartment() {
    try {
        if (user.value && user.value.departmentId) {
      storeDepartment.resetState()
      // fetchDepartmentById is async and sets storeDepartment.selectedDepartment
      await storeDepartment.fetchDepartmentById(user.value.departmentId)
      // copy the selectedDepartment from the store into local ref
      department.value = storeDepartment.selectedDepartment || null
            
        } else {
            department.value = null
        }
        console.log('Department fetched:', department.value)
    } catch (e) {
        console.error('Failed to load department info', e)
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
async function loadKPIEntries() {
    try {
        const resp = await kpiService.getKPIResults({ userId })
        entries.value = resp && resp.data ? resp.data : (resp || [])
        console.log('KPI Entries fetched:', entries.value)
    } catch (e) {
        console.error('Failed to load KPI entries', e)
    }
}
async function loadTasks(userIdForTasks) {
  try {
    if (!userIdForTasks) {
      tasks.value = []
      return
    }
    const resp = await tasksService.getuser(userIdForTasks)
    // normalize response to array from multiple possible shapes
    console.log('Raw tasks response:', resp)
    const body = resp && resp.data ? resp.data : (resp || {})
    console.log('Normalized tasks body:', body.data.tasks)
    let arr = []
    arr = body.data.tasks
    tasks.value = arr
    console.log('tasks fetched:', tasks.value)
    const gradetasks =tasks.value.filter(t => t.status==='GRADED')
    console.log('Graded tasks:', gradetasks)
    teskgrade.value = (gradetasks.reduce((sum, t) => sum + (parseFloat(t.grade) || 0), 0) / gradetasks.length) .toFixed(2)
    console.log('Average graded task score:', teskgrade.value)
    const penddingcount = tasks.value.filter(t => t.status === 'PENDING'|| t.status === 'MISSING').length
    const completedcount = tasks.value.filter(t => t.status !== 'PENDING'&& t.status !== 'MISSING').length
    tesksdetail.value = {penddingcount,completedcount}
  

  } catch (e) {
    console.error('Failed to load tasks', e)
    tasks.value = []
  }
}

async function getUserTotal(userId) {
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
    const uidRaw = userId
    const uid = uidRaw !== undefined && uidRaw !== null ? String(uidRaw) : null

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

async function loadtraining(userId) {
  try {
    if (!userId) {
      training.value = []
      trainingsDetail.value = { PENDING: [], IN_PROGRESS: [], COMPLETED: [], MISSED: [] }
      return
    }
    const resp = await userTrainingService.getTraingingbyuser(userId)
    const body = resp && resp.data ? resp.data : (resp || {})
    // normalize to array from common response shapes
    let arr = []
    if (Array.isArray(body)) arr = body
    else if (Array.isArray(body.data)) arr = body.data
    else if (Array.isArray(body.items)) arr = body.items
    else if (Array.isArray(body.trainings)) arr = body.trainings
    else if (Array.isArray(body.payload)) arr = body.payload
    else arr = []

    training.value = arr
    console.log('training fetched (normalized):', training.value)

    // classify into 4 buckets
    const groups = { PENDING: [], IN_PROGRESS: [], COMPLETED: [], MISSED: [] }
    for (const t of arr) {
      const rawStatus = t && (t.status || t.state || t.progress || '')
      const s = String(rawStatus).toUpperCase()
      if (s === 'PENDING') groups.PENDING.push(t)
      else if (s === 'IN_PROGRESS' || s === 'INPROGRESS' || s === 'RUNNING') groups.IN_PROGRESS.push(t)
      else if (s === 'COMPLETED' || s === 'DONE' || s === 'FINISHED' || s === 'PASS' || s === 'SUBMITTED') groups.COMPLETED.push(t)
      else if (s === 'MISSED' || s === 'SKIPPED' || s === 'ABSENT') groups.MISSED.push(t)
      else {
        // unknown -> treat as pending by default
        groups.PENDING.push(t)
      }
    }

    trainingsDetail.value = groups
    console.log('Training groups:', trainingsDetail.value)
  } catch (e) {
    console.error('Failed to load trainings', e)
    training.value = []
    trainingsDetail.value = { PENDING: [], IN_PROGRESS: [], COMPLETED: [], MISSED: [] }
  }
}

const userDisplay = computed(() => {
  if (!user.value) return '알 수 없는 사용자'
  return user.value.name || user.value.username || user.value.fullName || '무명'
})

const userInitial = computed(() => (userDisplay.value || '유').slice(0,1))

// labelForGoal removed (not used in this layout)

// charts
const userRadarSeries = computed(() => {
//   const goals = Array.isArray(kpiGoals.value) ? kpiGoals.value : []

  // determine uid key used in userKpiResults (prefer store entries but fall back to single-user entries)
  const uid = (user.value && (user.value.userId || user.value.id || user.value._id)) ? String(user.value.userId || user.value.id || user.value._id) : String(userId || '')

  const userEntries = Array.isArray(userKpiResults.value?.[uid]) ? userKpiResults.value[uid] : (Array.isArray(entries.value) ? entries.value : [])

  const data = userEntries.map(e => {
    const s = parseNumeric(e.score)
    return Number.isFinite(s) ? s : 0
  })

  return [{ name: '목표별 개인 점수', data }]
})

const deptRadarSeries = computed(() => {
  const goals = Array.isArray(kpiGoals.value) ? kpiGoals.value : []
  const seriesData = goals.map(g => {
    const gid = String(g.kpiGoalId ?? g.goalId ?? g.kpiId ?? g.id ?? '')
    if (!gid) return 0
    const scores = []
    for (const arr of Object.values(userKpiResults.value || {})) {
      if (!Array.isArray(arr)) continue
      for (const e of arr) {
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
async function getweeklyreport(userId){
    try{
    const resp = await kpiService.getweeklyreports(userId)
    const body = resp && resp.data ? resp.data : (resp || {})
    // normalize to array from common response shapes
    let arr = []
    if (Array.isArray(body)) arr = body
    else if (Array.isArray(body.data)) arr = body.data
    else if (Array.isArray(body.items)) arr = body.items
    else if (Array.isArray(body.results)) arr = body.results
    else if (body && typeof body === 'object' && Object.keys(body).length) {
      // some APIs return a single object
      arr = [body]
    } else arr = []

    // map each item to expected shape
    const mapped = arr.map(it => ({
      accomplishments: it.accomplishments ?? it.accomplishment ?? it.summary ?? '',
      challenges: it.challenges ?? it.challenge ?? '',
      createdAt: it.createdAt ?? it.created_at ?? it.timestamp ?? it.updatedAt ?? it.updated_at ?? null,
      endDate: it.endDate ?? it.end_date ?? it.end ?? null,
      learnings: it.learnings ?? it.learning ?? it.lessons ?? '',
      menteeId: it.menteeId ?? it.mentee_id ?? it.userId ?? it.user_id ?? null,
      menteeName: it.menteeName ?? it.mentee_name ?? it.name ?? it.userName ?? it.user_name ?? '',
      mentorFeedback: it.mentorFeedback ?? it.mentor_feedback ?? it.feedback ?? '',
      startDate: it.startDate ?? it.start_date ?? it.start ?? null,
      status: it.status ?? it.state ?? it.progress ?? '',
      updatedAt: it.updatedAt ?? it.updated_at ?? null,
      weekNumber: it.weekNumber ?? it.week_number ?? it.week ?? null,
      weeklyReportId: it.weeklyReportId ?? it.weekly_report_id ?? it.id ?? null
    }))

    // sort by weekNumber desc if present, otherwise by createdAt
    mapped.sort((a,b) => {
      const aw = Number(a.weekNumber)
      const bw = Number(b.weekNumber)
      if (!Number.isNaN(aw) && !Number.isNaN(bw)) return bw - aw
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bt - at
    })

    weeklyreport.value = mapped
    console.log('weekly report fetched (normalized):', weeklyreport.value)
    } catch (e) {
    console.error('Failed to load weekly report', e)
    weeklyreport.value = []

    }
}

function formatDate(v) {
  if (!v) return ''
  try {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return String(v)
    return d.toLocaleDateString()
  } catch (e) {
    return String(v)
  }
}

function parseNumeric(v) {
  if (v === null || v === undefined) return NaN
  if (typeof v === 'number') return v
  const s = String(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/)
  return s ? Number(s[0]) : NaN
}

const userRadarOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'radar' },
  xaxis: { categories: Array.isArray(kpiGoals.value) ? kpiGoals.value.map(g => (g.description || g.name || g.title || g.kpiName || '무제')) : [] },
  stroke: { show: true, width: 1 },
  fill: { opacity: 0.4 },
  markers: { size: 4 },
  colors: ['#294594'],
  legend: { show: false }
}))

const smallDonutSeries = computed(() => {
    return [tesksdetail.value.completedcount, tesksdetail.value.penddingcount]
})

const tasksmallDonutOptions = computed(() => ({ chart: { toolbar: { show: false }, type: 'donut' }, labels: ['제출', '미제출'], colors: ['#2563eb', '#e5e7eb'], legend: { show: false }, dataLabels: { enabled: true } }))
const trainingsmallDonutOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'donut', animations: { enabled: true } },
  labels: ['이수완료', '진행중', '미이수', '남은교육'],
  // Harmonious, accessible palette: 완료(그린), 진행(오렌지), 미이수(레드), 남은(블루)
  colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
  legend: { show: false, position: 'bottom', horizontalAlign: 'center', markers: { width: 12, height: 12, radius: 6 } },
  stroke: { colors: ['#ffffff'], width: 2 },
  dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(2)} %` },
  tooltip: { y: { formatter: (val) => `${val} 개` } },
  responsive: [{ breakpoint: 480, options: { legend: { show: false } } }]
}))

async function exportPdf() {
  const el = document.querySelector('.user-kpi-page')
  if (!el) {
    alert('PDF로 내보낼 영역을 찾을 수 없습니다.')
    return
  }
  exporting.value = true
  try {
    const mod = await import('html2pdf.js')
    const html2pdf = (mod && (mod.default || mod))
    const filename = `yobuddy-user-${userId || 'unknown'}-${new Date().toISOString().slice(0,10)}.pdf`
    const opt = {
      margin: 8,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    await html2pdf().set(opt).from(el).save()
  } catch (e) {
    console.error('UserKPIDetail export failed', e)
    alert('PDF 내보내기 실패: ' + (e && e.message ? e.message : String(e)))
  } finally {
    exporting.value = false
  }
}

</script>

<style scoped>
.user-kpi-page { padding:18px; max-width:1100px; margin:0 auto }
.header-row { display:flex; align-items:center; gap:12px; margin-bottom:12px }
.back-btn { padding:6px 10px; border-radius:8px; border:1px solid #e6eef9; background:#fff }
.user-info { display:flex; gap:12px; padding:12px; align-items:center; margin-bottom:12px }
.avatar { width:48px; height:48px; border-radius:50%; background:#eef2ff; display:flex; align-items:center; justify-content:center; font-weight:800 }
.meta .name { font-weight:800 }
.kpi-summary { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap }
.total-card, .results-card { flex:1 1 360px; }
.total-value { font-size:28px; font-weight:800; margin-bottom:8px }
.progress { background:#f2f6fb; height:10px; border-radius:6px; width:100% }
.progress .bar { height:10px; background:#2563eb; border-radius:6px }
.kpi-table { width:100%; border-collapse:collapse }
.kpi-table th, .kpi-table td { padding:8px; border-bottom:1px solid #f3f6fb; text-align:left }

/* New dashboard styles */
.section-block { background:#fff; border:1px solid #eef4ff; border-radius:12px; padding:14px; margin-bottom:16px; box-shadow:0 6px 18px rgba(2,6,23,0.04) }
.user-card { display:flex; align-items:center; gap:16px; padding:12px; margin-bottom:16px }
.user-card .left { flex:0 0 auto }
.user-card .center { flex:1; }
.user-card .center .name { font-size:18px; font-weight:800 }
.user-card .center .subtitle { color:#64748b; font-size:13px; margin-top:4px }
.user-card .right { flex:0 0 220px; display:flex; gap:12px; align-items:center; justify-content:flex-end }
.user-card .stat { text-align:right }
.user-card .stat .label { font-size:12px; color:#64748b }
.user-card .stat .value { font-size:16px; font-weight:800 }
.progress.small { height:8px; border-radius:6px; margin-top:8px }
.charts-row { display:flex; gap:16px; margin-bottom:16px }
.radar-wrap { flex:1 1 50%; min-width:320px }
.radar-wrap .card-body { height:100%; display:flex; align-items:center; justify-content:center }
.summary-row { display:flex; gap:16px; margin-bottom:16px }
.small-card { flex:1 1 320px; }
.small-body { display:flex; gap:12px; align-items:center; justify-content:space-between }
.small-chart { width:160px }
.reports-card { margin-top:12px }
.reports-list { display:flex; flex-direction:column; gap:12px }
.report-item { padding:12px; border:1px solid #eef4ff; border-radius:8px }
.report-item .week { font-weight:800; margin-bottom:6px }
.report-item .text { color:#334155 }
.report-item .meta { color:#94a3b8; font-size:13px; margin-top:8px }
.report-item { cursor: pointer; transition: background .12s ease, transform .06s ease }
.report-item:hover { background:#fbfdff; transform: translateY(-2px) }
.report-item .small-preview { color:#475569; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70% }

.modal-overlay { position:fixed; inset:0; background:rgba(2,6,23,0.45); display:flex; align-items:center; justify-content:center; z-index:1200 }
.modal { width:860px; max-width:96%; background:#fff; border-radius:14px; padding:20px; box-shadow:0 18px 48px rgba(2,6,23,0.22); position:relative }
.modal-header { display:flex; align-items:center; gap:16px; border-bottom:1px solid #eef4ff; padding-bottom:14px }
.modal-title { font-size:20px; font-weight:800 }
.modal-dates { color:#94a3b8; margin-left:auto; font-size:13px }
.modal-createdate { color:#94a3b8; font-size:13px }
.modal-close { border:0; background:transparent; font-size:18px; cursor:pointer }
.modal-status { display:inline-block; padding:6px 10px; border-radius:999px; font-weight:700; font-size:12px; color:#fff; text-transform:uppercase; margin-left:8px; box-shadow:0 2px 6px rgba(2,6,23,0.08) }
.status-REVIEWED { background: linear-gradient(90deg,#06b6d4 0%, #06b6d4 100%) }
.status-COMPLETED { background: linear-gradient(90deg,#10B981 0%, #059669 100%) }
.status-PENDING { background: linear-gradient(90deg,#F59E0B 0%, #F97316 100%) }
.status-IN_PROGRESS { background: linear-gradient(90deg,#3B82F6 0%, #2563EB 100%) }
.status-INPROGRESS, .status-RUNNING { background: linear-gradient(90deg,#3B82F6 0%, #2563EB 100%) }
.status-MISSED { background: linear-gradient(90deg,#EF4444 0%, #DC2626 100%) }
.status-REJECTED { background: linear-gradient(90deg,#EF4444 0%, #B91C1C 100%) }
.status-DEFAULT { background:#64748b }
.modal-body { padding:18px 0; color:#0f172a }
.modal-body h4 { margin:16px 0 8px; font-size:15px; color:#0f172a }
.modal-text { color:#334155; line-height:1.7; margin-bottom:12px }
.mentor-box { min-height:140px ;background:#dbedff; border:1px solid #e6eef9; border-radius:10px; padding:14px; margin-top:26px }
.mentor-title { font-weight:700; color:#274060 }
.mentor-meta { color:#94a3b8; font-size:12px; margin-top:6px }
.mentor-body { margin-top:10px; color:#334155 }
.modal-footer { display:flex; gap:10px; justify-content:flex-end; padding-top:14px }
.btn { padding:9px 14px; border-radius:10px; border:1px solid transparent; cursor:pointer }
.btn-primary { background:#294594; color:#fff }
.btn-secondary { background:#fff; border-color:#cbd5e1; color:#0f172a }

@media (max-width: 900px) {
  .charts-row, .summary-row { flex-direction:column }
  .user-card .right { flex:1 1 auto; justify-content:flex-start }
}
</style>
