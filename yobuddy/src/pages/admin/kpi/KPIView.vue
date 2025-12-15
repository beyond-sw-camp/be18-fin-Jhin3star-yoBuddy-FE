<template>

  <div class="kpi-overview page-container">
    <div class="kpi-tabs">
      <button
        class="kpi-tab"
        :class="{ active: activeTab === 'overview' }"
        @click="goToOverview"
      >
        통합조회
      </button>
    </div>

    <!-- 상단: 기간 + summary 카드 -->
    <header class="overview-header">
      <div class="period-main">
        <h1 class="period-title">
          {{ summary.periodLabel || 'KPI 성과 대시보드' }}
        </h1>
        <p class="period-range" v-if="summary.startDate && summary.endDate">
          온보딩 진행 기간:
          <span>{{ summary.startDate }}</span>
          ~
          <span>{{ summary.endDate }}</span>
        </p>
      </div>

      <div class="period-controls">
        <div class="period-select real">
          <select v-model="selectedPeriod" @change="onPeriodChange">
            <option v-for="p in periods" :key="p.label" :value="p">
              {{ p.label }}
            </option>
          </select>
        </div>
      </div>
    </header>

    <!-- Summary stat cards -->
    <section class="summary-row">
      <div class="summary-card">
        <div class="summary-label">신입 수</div>
        <div class="summary-value">{{ summary.newUserCount ?? 0 }}명</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">총 멘토링 횟수</div>
        <div class="summary-value">{{ summary.totalMentoringCount ?? 0 }}회</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">평균 과제 점수</div>
        <div class="summary-value">
          {{ (summary.avgTaskScore ?? 0).toFixed(1) }}점
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-label">
          부서 평균 KPI 점수
          <span
            class="hint"
            title="선택한 기간 동안 각 부서의 KPI 종합 점수를 평균한 값입니다."
          >
            ⓘ
          </span>
        </div>
        <div class="summary-value">
          {{ (summary.avgKpiScore ?? 0).toFixed(1) }}점
        </div>
      </div>
    </section>

    <!-- 메인 바 차트 영역 -->
    <section class="dept-charts">
      <div class="card chart-card">
        <div class="card-header">
          <div class="card-title-main">부서별 KPI 비교 (현재 vs 목표)</div>
        </div>
        <div class="card-body">
          <div v-if="loading" class="skeleton skeleton-chart"></div>
          <VueApexCharts
            v-else
            type="bar"
            height="320"
            :options="kpiBarOptions"
            :series="kpiBarSeries"
          />
        </div>
      </div>

      <div class="card chart-card">
        <div class="card-header">
          <div class="card-title-main">부서별 누적 멘토링 횟수</div>
        </div>
        <div class="card-body">
          <div v-if="loading" class="skeleton skeleton-chart small"></div>
          <VueApexCharts
            v-else
            type="bar"
            height="260"
            :options="mentoringBarOptions"
            :series="mentoringBarSeries"
          />
        </div>
      </div>
    </section>

    <!-- 하단: 부서별 레이더 묶음 -->
    <section class="radar-overview card">
      <div class="card-header radar-header">
        <div class="card-title-main">부서별 KPI 추이</div>
        <div class="period-pill">
          {{ radarPeriodLabel }}
        </div>
      </div>

      <div class="card-body">
        <div v-if="loading" class="skeleton skeleton-radar-grid"></div>

        <div v-else class="radar-grid">
          <div
            v-for="(dep, idx) in radarDepartments"
            :key="dep.departmentId || idx"
            class="radar-item"
          >
            <div class="radar-title">{{ dep.departmentName }}</div>
            <VueApexCharts
              type="radar"
              height="260"
              :options="getRadarOptions(dep, idx)"
              :series="[
                {
                  name: dep.departmentName,
                  data: (dep.points || []).map(p => Number(p.avgScore ?? 0))
                }
              ]"
            />
          </div>
        </div>
      </div>
    </section>

    <div v-if="error" class="error-box">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'
import kpiService from '@/services/kpiService'

/* --- Router --- */
const router = useRouter()
const activeTab = ref('overview')

const goToOverview = () => {
  activeTab.value = 'overview'
  router.push('/kpi')
}

const periods = ref([
    { label: '2025 하반기', start: '2025-07-01', end: '2025-12-31' },
  { label: '2025 상반기', start: '2025-01-01', end: '2025-06-30' },
  { label: '2024 하반기', start: '2024-07-01', end: '2024-12-31' },
  { label: '2024 상반기', start: '2024-01-01', end: '2024-06-30' },
  { label: '2023 하반기', start: '2023-07-01', end: '2023-12-31' },
  { label: '2023 상반기', start: '2023-01-01', end: '2023-06-30' },
  { label: '2022 하반기', start: '2022-07-01', end: '2022-12-31' },
  { label: '2022 상반기', start: '2022-01-01', end: '2022-06-30' },
  { label: '2021 하반기', start: '2021-07-01', end: '2021-12-31' },
  { label: '2021 상반기', start: '2021-01-01', end: '2021-06-30' }
])

const selectedPeriod = ref(periods.value[0])

const overview = ref({
  summary: null,
  departments: [],
  radar: { periodLabel: '', departments: [] }
})

const loading = ref(true)
const error = ref(null)

const summary = computed(() => overview.value.summary || {})
const departments = computed(() => overview.value.departments || [])
const radarDepartments = computed(() => overview.value.radar?.departments || [])
const radarPeriodLabel = computed(
  () => overview.value.radar?.periodLabel || summary.value.periodLabel || ''
)

const deptCategories = computed(() =>
  departments.value.map(d => d.departmentName)
)

const kpiBarSeries = computed(() => [
  { name: '현재 KPI', data: departments.value.map(d => Number(d.currentAvgKpi ?? 0)) },
  { name: '목표 KPI', data: departments.value.map(d => Number(d.targetAvgKpi ?? 0)) }
])

const mentoringBarSeries = computed(() => [
  { name: '멘토링 횟수', data: departments.value.map(d => Number(d.mentoringCount ?? 0)) }
])

const kpiBarOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false } },
  plotOptions: {
    bar: { columnWidth: '40%', borderRadius: 6 }
  },
  dataLabels: {
    enabled: true,
    formatter: v => Number(v).toFixed(1),
    style: { colors: ['#fff'], fontSize: '12px' }
  },
  xaxis: { categories: deptCategories.value },
  yaxis: {
    min: 0,
    max: 100,
    tickAmount: 5,
    decimalsInFloat: 0,
    labels: { formatter: v => Math.round(v) }
  },
  tooltip: {
    y: { formatter: v => Number(v).toFixed(1) }
  },
  colors: ['#294594', '#9cb5ff']
}))

const mentoringBarOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false } },
  plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
  xaxis: { categories: deptCategories.value },
  colors: ['#294594']
}))

const radarPalette = ['#f59e0b', '#3b82f6', '#a855f7', '#22c55e', '#ef4444']

function getRadarOptions(dep, idx) {
  return {
    chart: { type: 'radar', toolbar: { show: false } },
    xaxis: {
      categories: (dep.points || []).map(p => p.label),
      labels: { style: { fontSize: '11px' } }
    },
    colors: [radarPalette[idx % radarPalette.length]],
    fill: { opacity: 0.25 },
    markers: { size: 3 }
  }
}

async function loadOverview() {
  loading.value = true
  error.value = null

  try {
    const params = {
      start: selectedPeriod.value.start,
      end: selectedPeriod.value.end
    }
    const resp = await kpiService.getOverview(params)
    overview.value = resp.data
  } catch (e) {
    console.error(e)
    error.value = '데이터 조회 실패'
  } finally {
    loading.value = false
  }
}

async function onPeriodChange() {
  await loadOverview()
}

onMounted(loadOverview)
</script>

<style scoped>
.kpi-tabs {
  width: 100%;
  max-width: 1200px;
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
.kpi-overview {
  padding: 18px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial;
}

/* 헤더 */
.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.period-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}

.period-range {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.period-range span {
  font-weight: 600;
  color: #111827;
}

.period-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ===== 변경된 드롭다운 스타일 ===== */
.period-select {
  border: none;
  background: transparent;
  padding: 0;
}

/* 깔끔한 기본 셀렉트 박스 스타일 */
.period-select.real select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-size: 14px;
  color: #374151;
  cursor: pointer;

  /* 기본 화살표 제거 */
  appearance: none;

  /* 커스텀 화살표 아이콘 */
  background-image: url("data:image/svg+xml,%3Csvg fill='none' stroke='%236B7280' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 15px;
  padding-right: 32px;

  transition: border-color 0.15s ease;
}

.period-select.real select:hover {
  border-color: #9ca3af;
}

.period-select.real select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.pdf-btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #e6eef9;
  background: linear-gradient(180deg, #ffffff, #f6f9ff);
  cursor: pointer;
  font-weight: 700;
  color: #0b5fff;
}

.pdf-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Summary cards */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.summary-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #eef2ff;
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.04);
}

.summary-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}

/* 카드 공통 */
.card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #eef2ff;
  box-shadow: 0 4px 12px rgba(2, 6, 23, 0.04);
}

.card-header {
  padding: 10px 14px 0;
}

.card-body {
  padding: 8px 14px 14px;
}

.card-title-main {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

/* 상단 바 차트 영역 */
.dept-charts {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  padding-bottom: 6px;
}

/* 레이더 전체 영역 */
.radar-overview {
  padding-bottom: 10px;
}

.radar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.period-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  font-size: 12px;
  color: #374151;
}

/* 레이더 그리드 */
.radar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-top: 8px;
}

.radar-item {
  padding: 6px 4px 4px;
}

.radar-title {
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
}

/* Skeleton 로딩 */
.skeleton {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  background: #eef2ff;
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

.skeleton-chart {
  height: 320px;
}

.skeleton-chart.small {
  height: 260px;
}

.skeleton-radar-grid {
  height: 420px;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* Error */
.error-box {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 13px;
}

/* 반응형 */
@media (max-width: 900px) {
  .summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .overview-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-row {
    grid-template-columns: 1fr;
  }
}
.hint {
  margin-left: 4px;
  font-size: 12px;
  color: #9ca3af;
  cursor: help;
  vertical-align: middle;
}

.hint:hover {
  color: #374151;
}
</style>
