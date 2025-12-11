<template>
  <div class="user-kpi-page page-container">
    <div class="header-row">
      <h2>개인 성과 조회</h2>
      <button
        class="pdf-btn"
        @click="exportPdf"
        :disabled="exporting"
        :aria-busy="exporting"
      >
        {{ exporting ? '내보내는 중...' : 'PDF' }}
      </button>
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
            <div class="subtitle">{{ departmentName }}</div>
          </div>
          <div class="right stats">
            <div class="stat">
              <div class="label">평균 과제 점수</div>
              <div class="value">{{ teskgrade }}</div>
            </div>
            <div class="stat">
              <div class="label">KPI 점수</div>
              <div class="value">{{ totalKpiScore }}</div>
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
              <VueApexCharts
                type="radar"
                :options="userRadarOptions"
                :series="userRadarSeries"
                height="260"
              />
            </div>
          </div>
          <div class="card radar-wrap">
            <div class="card-title">부서 KPI 평균 점수</div>
            <div class="card-body">
              <VueApexCharts
                type="radar"
                :options="userRadarOptions"
                :series="deptRadarSeries"
                height="260"
              />
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
                <VueApexCharts
                  type="donut"
                  :options="tasksmallDonutOptions"
                  :series="smallDonutSeries"
                  height="140"
                />
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
                <VueApexCharts
                  type="donut"
                  :options="trainingsmallDonutOptions"
                  :series="[trainingsDetail.COMPLETED.length, trainingsDetail.IN_PROGRESS.length, trainingsDetail.MISSED.length, trainingsDetail.PENDING.length]"
                  height="140"
                />
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
            <div
              class="report-item"
              v-for="(r, idx) in weeklyreport"
              :key="r.weeklyReportId || idx"
              @click="openReport(r)"
              role="button"
              tabindex="0"
            >
              <div class="week">
                {{ r.weekNumber ? (r.weekNumber + '주차') : '' }}
                ·
                {{ formatDate(r.startDate) }} ~ {{ formatDate(r.endDate) }}
              </div>
              <div class="meta">
                제출일자: {{ formatDate(r.updatedAt || r.createdAt) }} · 멘티: {{ r.menteeName }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Weekly Report Modal (click a report to open) -->
      <div
        v-if="reportModalVisible"
        class="modal-overlay"
        @click.self="closeReport"
      >
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              {{ selectedReport.weekNumber ? (selectedReport.weekNumber + '주차 주간 리포트') : '주간 리포트' }}
            </div>
            <span
              :class="['modal-status', 'status-' + ((selectedReport.status || '').toString().toUpperCase())]"
            >
              {{ selectedReport.status }}
            </span>
            <div class="modal-dates">
              ({{ formatDate(selectedReport.startDate) }} ~ {{ formatDate(selectedReport.endDate) }})
            </div>
            <div class="modal-createdate">
              제출일자 : {{ formatDate(selectedReport.createdAt || selectedReport.updatedAt) }}
            </div>
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
import kpiService from '@/services/kpiService'
import tasksService from '@/services/tasksService'
import userTrainingService from '@/services/userTrainingService'

const route = useRoute()
const userId = route.params.userId

const user = ref({})
const dashboard = ref(null)

const tasks = ref([])
const tesksdetail = ref({ penddingcount: 0, completedcount: 0 })
const teskgrade = ref(null)

const training = ref([])
const trainingsDetail = ref({
  PENDING: [],
  IN_PROGRESS: [],
  COMPLETED: [],
  MISSED: []
})

const weeklyreport = ref([])

const exporting = ref(false)

// modal state for weekly report
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

onMounted(async () => {
  // 1) 사용자 정보
  await loaduserinfo(userId)

  // 2) 해당 사용자의 부서 KPI 대시보드 호출
  if (user.value && user.value.departmentId) {
    await loadDashboard(user.value.departmentId)
  }

  // 3) 과제 / 교육 / 주간리포트 로딩
  const uidForTasks =
    (user.value && (user.value.userId || user.value.id || user.value._id)) || userId
  await loadTasks(uidForTasks)
  await loadtraining(userId)
  await getweeklyreport(userId)
})

async function loaduserinfo(userId) {
  try {
    const u = await userService.getUserById(userId)
    user.value = u && u.data ? u.data : u || null
    console.log('User fetched:', user.value)
  } catch (e) {
    console.error('Failed to load user info', e)
  }
}

async function loadDashboard(departmentId) {
  try {
    const resp = await kpiService.getDashboard(departmentId)
    const body = resp && resp.data ? resp.data : resp
    dashboard.value = body || null
    console.log('Dashboard loaded:', dashboard.value)
  } catch (e) {
    console.error('Failed to load KPI dashboard', e)
    dashboard.value = null
  }
}

async function loadTasks(userIdForTasks) {
  try {
    if (!userIdForTasks) {
      tasks.value = []
      return
    }
    const resp = await tasksService.getuser(userIdForTasks)
    const body = resp && resp.data ? resp.data : resp || {}
    let arr = body && body.data && Array.isArray(body.data.tasks) ? body.data.tasks : []
    tasks.value = arr

    const gradetasks = tasks.value.filter(t => t.status === 'GRADED')
    teskgrade.value = gradetasks.length
      ? (gradetasks.reduce((sum, t) => sum + (parseFloat(t.grade) || 0), 0) / gradetasks.length).toFixed(2)
      : '0.00'

    const penddingcount = tasks.value.filter(
      t => t.status === 'PENDING' || t.status === 'MISSING'
    ).length
    const completedcount = tasks.value.filter(
      t => t.status !== 'PENDING' && t.status !== 'MISSING'
    ).length
    tesksdetail.value = { penddingcount, completedcount }
  } catch (e) {
    console.error('Failed to load tasks', e)
    tasks.value = []
  }
}

async function loadtraining(userId) {
  try {
    if (!userId) {
      training.value = []
      trainingsDetail.value = {
        PENDING: [],
        IN_PROGRESS: [],
        COMPLETED: [],
        MISSED: []
      }
      return
    }
    const resp = await userTrainingService.getTraingingbyuser(userId)
    const body = resp && resp.data ? resp.data : resp || {}
    let arr = []
    if (Array.isArray(body)) arr = body
    else if (Array.isArray(body.data)) arr = body.data
    else if (Array.isArray(body.items)) arr = body.items
    else if (Array.isArray(body.trainings)) arr = body.trainings
    else if (Array.isArray(body.payload)) arr = body.payload
    training.value = arr

    const groups = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      MISSED: []
    }
    for (const t of arr) {
      const rawStatus = t && (t.status || t.state || t.progress || '')
      const s = String(rawStatus).toUpperCase()
      if (s === 'PENDING') groups.PENDING.push(t)
      else if (s === 'IN_PROGRESS' || s === 'INPROGRESS' || s === 'RUNNING')
        groups.IN_PROGRESS.push(t)
      else if (
        s === 'COMPLETED' ||
        s === 'DONE' ||
        s === 'FINISHED' ||
        s === 'PASS' ||
        s === 'SUBMITTED'
      )
        groups.COMPLETED.push(t)
      else if (s === 'MISSED' || s === 'SKIPPED' || s === 'ABSENT')
        groups.MISSED.push(t)
      else groups.PENDING.push(t)
    }
    trainingsDetail.value = groups
  } catch (e) {
    console.error('Failed to load trainings', e)
    training.value = []
    trainingsDetail.value = {
      PENDING: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      MISSED: []
    }
  }
}

async function getweeklyreport(userId) {
  try {
    const resp = await kpiService.getweeklyreports(userId)
    const body = resp && resp.data ? resp.data : resp || {}
    let arr = []
    if (Array.isArray(body)) arr = body
    else if (Array.isArray(body.data)) arr = body.data
    else if (Array.isArray(body.items)) arr = body.items
    else if (Array.isArray(body.results)) arr = body.results
    else if (body && typeof body === 'object' && Object.keys(body).length) arr = [body]
    else arr = []

    const mapped = arr.map(it => ({
      accomplishments: it.accomplishments ?? it.accomplishment ?? it.summary ?? '',
      challenges: it.challenges ?? it.challenge ?? '',
      createdAt:
        it.createdAt ?? it.created_at ?? it.timestamp ?? it.updatedAt ?? it.updated_at ?? null,
      endDate: it.endDate ?? it.end_date ?? it.end ?? null,
      learnings: it.learnings ?? it.learning ?? it.lessons ?? '',
      menteeId: it.menteeId ?? it.mentee_id ?? it.userId ?? it.user_id ?? null,
      menteeName:
        it.menteeName ?? it.mentee_name ?? it.name ?? it.userName ?? it.user_name ?? '',
      mentorFeedback: it.mentorFeedback ?? it.mentor_feedback ?? it.feedback ?? '',
      startDate: it.startDate ?? it.start_date ?? it.start ?? null,
      status: it.status ?? it.state ?? it.progress ?? '',
      updatedAt: it.updatedAt ?? it.updated_at ?? null,
      weekNumber: it.weekNumber ?? it.week_number ?? it.week ?? null,
      weeklyReportId: it.weeklyReportId ?? it.weekly_report_id ?? it.id ?? null
    }))

    mapped.sort((a, b) => {
      const aw = Number(a.weekNumber)
      const bw = Number(b.weekNumber)
      if (!Number.isNaN(aw) && !Number.isNaN(bw)) return bw - aw
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bt - at
    })

    weeklyreport.value = mapped
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
  const s = String(v).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  return s ? Number(s[0]) : NaN
}

/* ---------- computed들 ---------- */

const userDisplay = computed(() => {
  if (!user.value) return '알 수 없는 사용자'
  return user.value.name || user.value.username || user.value.fullName || '무명'
})

const userInitial = computed(() => (userDisplay.value || '유').slice(0, 1))

const departmentName = computed(() => {
  return (dashboard.value && (dashboard.value.departmentName || '')) || ''
})

const routeUserIdNum = computed(() => Number(userId))

const dashboardUser = computed(() => {
  const d = dashboard.value
  if (!d || !Array.isArray(d.users)) return null
  return d.users.find(u => Number(u.userId ?? u.id ?? u._id) === routeUserIdNum.value) || null
})

const totalKpiScore = computed(() => {
  const u = dashboardUser.value
  if (!u) return 0
  const raw = u.totalScore ?? u.total ?? 0
  const num = parseNumeric(raw)
  return Number.isFinite(num) ? num.toFixed(2) : raw
})

const goalLabels = computed(() => {
  const goals = (dashboard.value && dashboard.value.goals) || []
  return goals.map(g => g.description || g.name || g.title || g.kpiName || '무제')
})

const userRadarSeries = computed(() => {
  const goals = (dashboard.value && dashboard.value.goals) || []
  const u = dashboardUser.value
  const userResults = (u && Array.isArray(u.results) ? u.results : []) || []

  const data = goals.map(g => {
    const gid = g.kpiGoalId ?? g.goalId ?? g.id
    if (gid == null) return 0
    const scores = userResults
      .filter(r => {
        const rgid = r.kpiGoalId ?? r.goalId ?? r.GoalId ?? r.kpiId ?? r.goal_id
        return Number(rgid) === Number(gid)
      })
      .map(r => parseNumeric(r.score ?? r.scoreValue ?? r.value ?? r.result))
      .filter(s => Number.isFinite(s))

    if (!scores.length) return 0
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return Math.round(avg * 100) / 100
  })

  return [{ name: '목표별 개인 점수', data }]
})

const deptRadarSeries = computed(() => {
  const goals = (dashboard.value && dashboard.value.goals) || []
  const radar = (dashboard.value && dashboard.value.chart && dashboard.value.chart.radar) || []

  const data = goals.map(g => {
    const gid = g.kpiGoalId ?? g.goalId ?? g.id
    if (gid == null) return 0
    const found = radar.find(r => Number(r.kpiGoalId ?? r.goalId ?? r.id) === Number(gid))
    const raw = found ? found.avgScore ?? found.score ?? 0 : 0
    const num = parseNumeric(raw)
    return Number.isFinite(num) ? Math.round(num * 100) / 100 : 0
  })

  return [{ name: '목표별 부서 평균', data }]
})

const userRadarOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'radar' },
  xaxis: { categories: goalLabels.value },
  stroke: { show: true, width: 1 },
  fill: { opacity: 0.4 },
  markers: { size: 4 },
  colors: ['#294594'],
  legend: { show: false }
}))

const smallDonutSeries = computed(() => [
  tesksdetail.value.completedcount,
  tesksdetail.value.penddingcount
])

const tasksmallDonutOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'donut' },
  labels: ['제출', '미제출'],
  colors: ['#2563eb', '#e5e7eb'],
  legend: { show: false },
  dataLabels: { enabled: true }
}))

const trainingsmallDonutOptions = computed(() => ({
  chart: { toolbar: { show: false }, type: 'donut', animations: { enabled: true } },
  labels: ['이수완료', '진행중', '미이수', '남은교육'],
  colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
  legend: {
    show: false,
    position: 'bottom',
    horizontalAlign: 'center',
    markers: { width: 12, height: 12, radius: 6 }
  },
  stroke: { colors: ['#ffffff'], width: 2 },
  dataLabels: { enabled: true, formatter: val => `${val.toFixed(2)} %` },
  tooltip: { y: { formatter: val => `${val} 개` } },
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
    const filename = `yobuddy-user-${userId || 'unknown'}-${new Date()
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
    console.error('UserKPIDetail export failed', e)
    alert('PDF 내보내기 실패: ' + (e && e.message ? e.message : String(e)))
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
/* Align styles with KPIView for consistent dashboard look */
.user-kpi-page {
  padding: 18px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial;
  max-width: 1100px;
  margin: 0 auto;
}
.header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.header-row h2 {
  margin: 0;
  font-size: 20px;
}

/* PDF button (same look as KPIView) */
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
.pdf-btn[disabled],
.pdf-btn[aria-busy='true'] {
  opacity: 0.6;
  cursor: default;
  transform: none;
}

/* Card base (match KPIView) */
.section-block {
  background: #fff;
  border: 1px solid #f0f4ff;
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.04);
}
.card-title {
  font-weight: 700;
  margin-bottom: 8px;
}
.card {
  background: #fff;
  border: 1px solid #f0f4ff;
  padding: 12px;
  border-radius: 12px;
  width: auto;
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.04);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.08);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  margin-bottom: 16px;
}
.user-card .left {
  flex: 0 0 auto;
}
.user-card .center {
  flex: 1;
}
.user-card .center .name {
  font-size: 18px;
  font-weight: 800;
}
.user-card .center .subtitle {
  color: #64748b;
  font-size: 13px;
  margin-top: 4px;
}
.user-card .right {
  flex: 0 0 220px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
}
.user-card .stat {
  text-align: right;
}
.user-card .stat .label {
  font-size: 12px;
  color: #64748b;
}
.user-card .stat .value {
  font-size: 16px;
  font-weight: 800;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.charts-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.radar-wrap {
  flex: 1 1 50%;
  min-width: 320px;
}
.radar-wrap .card-body {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.small-card {
  flex: 1 1 320px;
}
.small-body {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.small-chart {
  width: 160px;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.report-item {
  padding: 12px;
  border: 1px solid #eef2ff;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.06s ease;
}
.report-item:hover {
  background: #fbfdff;
  transform: translateY(-2px);
}
.report-item .week {
  font-weight: 800;
  margin-bottom: 6px;
}
.report-item .meta {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 8px;
}

/* Modal styles aligned with KPIView */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}
.modal {
  width: 860px;
  max-width: 96%;
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 18px 48px rgba(2, 6, 23, 0.22);
  position: relative;
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #eef4ff;
  padding-bottom: 14px;
}
.modal-title {
  font-size: 20px;
  font-weight: 800;
}
.modal-dates {
  color: #94a3b8;
  margin-left: auto;
  font-size: 13px;
}
.modal-createdate {
  color: #94a3b8;
  font-size: 13px;
}
.modal-close {
  border: 0;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}
.modal-status {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 12px;
  color: #fff;
  text-transform: uppercase;
  margin-left: 8px;
  box-shadow: 0 2px 6px rgba(2, 6, 23, 0.08);
}
.status-REVIEWED {
  background: linear-gradient(90deg, #06b6d4 0%, #06b6d4 100%);
}
.status-COMPLETED {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}
.status-PENDING {
  background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%);
}
.status-IN_PROGRESS {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}
.status-INPROGRESS,
.status-RUNNING {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}
.status-MISSED {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}
.status-REJECTED {
  background: linear-gradient(90deg, #ef4444 0%, #b91c1c 100%);
}
.status-DEFAULT {
  background: #64748b;
}
.modal-body {
  padding: 18px 0;
  color: #0f172a;
}
.modal-body h4 {
  margin: 16px 0 8px;
  font-size: 15px;
  color: #0f172a;
}
.modal-text {
  color: #334155;
  line-height: 1.7;
  margin-bottom: 12px;
}
.mentor-box {
  min-height: 140px;
  background: #dbedff;
  border: 1px solid #e6eef9;
  border-radius: 10px;
  padding: 14px;
  margin-top: 26px;
}
.mentor-title {
  font-weight: 700;
  color: #274060;
}
.mentor-meta {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 6px;
}
.mentor-body {
  margin-top: 10px;
  color: #334155;
}
.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 14px;
}
.btn {
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
}
.btn-primary {
  background: #294594;
  color: #fff;
}
.btn-secondary {
  background: #fff;
  border-color: #cbd5e1;
  color: #0f172a;
}

@media (max-width: 900px) {
  .charts-row,
  .summary-row {
    flex-direction: column;
  }
  .user-card .right {
    flex: 1 1 auto;
    justify-content: flex-start;
  }
}
</style>
