<template>
  <div class="user-kpi-page page-container">
    <!-- ================= KPI 탭 ================= -->
    <div class="kpi-tabs">
      <button
        class="kpi-tab"
        :class="{ active: isOverview }"
        @click="goToOverview"
      >
        통합조회
      </button>

      <button
        class="kpi-tab"
        :class="{ active: !isOverview }"
        @click="goToUser"
      >
        개별조회
      </button>
    </div>

    <!-- ================= 검색 ================= -->
    <template v-if="!userId">
      <h2>개인 성과 조회</h2>

      <div class="search-box card">
        <div class="search-input-wrap">
          <svg class="search-icon" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM10 16a6 6 0 110-12 6 6 0 010 12z"
            />
          </svg>

          <input
            v-model="searchKeyword"
            placeholder="이름 또는 이메일로 검색"
            @keyup.enter="searchUsers"
          />
        </div>

        <button class="search-btn" @click="searchUsers" :disabled="searching">
          {{ searching ? '검색중…' : '검색' }}
        </button>
      </div>

      <div class="search-result">
        <div
          v-for="u in searchResult"
          :key="u.userId"
          class="search-item"
          @click="selectUser(u)"
        >
          <div class="name">{{ u.name }}</div>
          <div class="meta">{{ u.email }} · {{ u.departmentName }}</div>
        </div>

        <div v-if="!searching && searchResult.length === 0" class="empty">
          검색 결과가 없습니다.
        </div>
      </div>
    </template>

    <!-- ================= 개인 KPI ================= -->
    <template v-else>
      <div class="header-row">
        <h2>개인 성과 조회</h2>
        <button class="pdf-btn" @click="exportPdf" :disabled="exporting">
          {{ exporting ? '내보내는 중…' : 'PDF' }}
        </button>
      </div>

      <!-- 사용자 카드 -->
      <section class="section-block">
        <div class="user-card card">
          <div class="avatar">{{ userInitial }}</div>
          <div class="center">
            <div class="name">{{ userDisplay }}</div>
            <div class="subtitle">{{ departmentName }}</div>
          </div>
          <div class="stats">
            <div>
              <div class="label">평균 과제 점수</div>
              <div class="value">{{ taskAvg }}</div>
            </div>
            <div>
              <div class="label">KPI 점수</div>
              <div class="value">{{ totalKpiScore }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 레이더 차트 -->
      <section class="section-block charts-row">
        <VueApexCharts
          type="radar"
          height="260"
          :options="radarOptions"
          :series="userRadarSeries"
        />
        <VueApexCharts
          type="radar"
          height="260"
          :options="radarOptions"
          :series="deptRadarSeries"
        />
      </section>

      <!-- 주간 리포트 -->
      <section class="section-block">
        <h3>주간 리포트</h3>
        <div
          v-for="r in weeklyReports"
          :key="r.weeklyReportId"
          class="report-item"
        >
          {{ r.weekNumber }}주차 · {{ formatDate(r.createdAt) }}
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'

import userService from '@/services/user'
import kpiService from '@/services/kpiService'
import tasksService from '@/services/tasksService'

/* ================= Router ================= */
const route = useRoute()
const router = useRouter()

const userId = computed(() => route.params.userId || null)
const departmentIdFromQuery = computed(() =>
  route.query.departmentId ? Number(route.query.departmentId) : null
)

const isOverview = computed(() => route.path === '/kpi')

function goToOverview() {
  router.push('/kpi')
}
function goToUser() {
  router.push('/kpi/user')
}

/* ================= 검색 ================= */
const searchKeyword = ref('')
const searchResult = ref([])
const searching = ref(false)

async function searchUsers() {
  if (!searchKeyword.value.trim()) return

  searching.value = true
  try {
    const resp = await userService.searchUsers({
      keyword: searchKeyword.value
    })

    searchResult.value =``
      Array.isArray(resp?.data?.content)
        ? resp.data.content
        : []

  } catch (e) {
    console.error('유저 검색 실패', e)
    searchResult.value = []
  } finally {
    searching.value = false
  }
}

function selectUser(u) {
  router.push({
    path: `/kpi/user/${u.userId}`,
    query: { departmentId: u.departmentId }
  })
}

/* ================= 데이터 ================= */
const user = ref(null)
const dashboard = ref(null)
const tasks = ref([])
const weeklyReports = ref([])
const exporting = ref(false)

watch(
  userId,
  async id => {
    reset()
    if (!id) return
    await loadDetail(id)
  },
  { immediate: true }
)

function reset() {
  user.value = null
  dashboard.value = null
  tasks.value = []
  weeklyReports.value = []
}

async function loadDetail(id) {
  const departmentId = departmentIdFromQuery.value
  if (!departmentId) return

  const d = await kpiService.getDashboard(departmentId)
  dashboard.value = d.data

  const u = dashboard.value.users?.find(v => v.userId === Number(id))
  user.value = u ?? null

  const t = await tasksService.getuser(id)
  tasks.value = t.data?.tasks ?? []

  const w = await kpiService.getweeklyreports(id)
  weeklyReports.value = w.data ?? []
}

/* ================= computed ================= */
const userDisplay = computed(() => user.value?.name || '')
const userInitial = computed(() => userDisplay.value.charAt(0))
const departmentName = computed(() => dashboard.value?.departmentName || '')

const taskAvg = computed(() => {
  const graded = tasks.value.filter(t => t.status === 'GRADED')
  if (!graded.length) return '0.0'
  return (
    graded.reduce((a, b) => a + Number(b.grade || 0), 0) / graded.length
  ).toFixed(1)
})

const totalKpiScore = computed(() =>
  user.value?.totalScore?.toFixed(1) || '0.0'
)

/* ================= Radar Chart (핵심) ================= */
const radarOptions = computed(() => ({
  chart: { type: 'radar', toolbar: { show: false } },
  xaxis: {
    categories: dashboard.value?.chart?.years?.map(y => `${y}년`) ?? []
  },
  stroke: { width: 2 },
  fill: { opacity: 0.35 },
  markers: { size: 4 },
  legend: { show: false }
}))

const userRadarSeries = computed(() => [{
  name: '개인 KPI',
  data: dashboard.value?.chart?.achievementPerYear ?? []
}])

const deptRadarSeries = computed(() => [{
  name: '부서 평균',
  data: dashboard.value?.chart?.achievementPerYear ?? []
}])

function formatDate(v) {
  return new Date(v).toLocaleDateString()
}

async function exportPdf() {
  const el = document.querySelector('.user-kpi-page')
  const html2pdf = (await import('html2pdf.js')).default
  exporting.value = true
  await html2pdf().from(el).save()
  exporting.value = false
}
</script>

<style scoped>
  .kpi-tabs {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 16px;
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.kpi-tab {
  background: transparent;
  border: none;
  padding: 14px 22px;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  position: relative;
}

.kpi-tab.active {
  color: #294594;
  font-weight: 700;
}

.kpi-tab.active::after {
  content: "";
  width: 100%;
  height: 3px;
  background: #294594;
  position: absolute;
  bottom: -1px;
  left: 0;
}
/* ================= 검색 박스 (KPI 스타일) ================= */
.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 16px;
}

/* input 래퍼 */
.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input-wrap:focus-within {
  border-color: #294594;
  box-shadow: 0 0 0 3px rgba(41, 69, 148, 0.12);
}

/* 돋보기 아이콘 */
.search-icon {
  width: 18px;
  height: 18px;
  color: #9ca3af;
  flex-shrink: 0;
}

/* input */
.search-input-wrap input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 14px;
  color: #111827;
}

.search-input-wrap input::placeholder {
  color: #9ca3af;
}

/* 검색 버튼 */
.search-btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: #294594;
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease,
    box-shadow 0.1s ease;
}

.search-btn:hover {
  background: #1f3a8a;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(41, 69, 148, 0.25);
}

.search-btn:disabled {
  background: #c7d2fe;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.empty {
  color: #888;
  margin-top: 12px;
}
/* Align styles with KPIView for consistent dashboard look */
.user-kpi-page {
  padding: 18px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial;
  max-width: 1200px;
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
