<template>
  <div class="page-container">
    <header class="page-top">
      <h1 class="page-title">온보딩 프로그램 상세</h1>
      <div class="actions">
        <button class="btn-primary" @click="showEditModal = true">
      정보 수정
    </button>
        <button class="btn-outline" @click="goBack">목록으로</button>
      </div>
    </header>
    <div class="calendar-and-list">
      <section class="calendar-area">
        <div class="calendar-wrapper" style="overflow: hidden; position: relative;">
        <div ref="calendarBlocker" class="calendar-blocker" aria-hidden="true"></div>
        <CalendarView
          :show-date="calendarShowDate"
          :items="calendarItems"
          :date-classes="calendarDateClasses"
          class="theme-default holiday-us-traditional holiday-us-official"
          @click-date="onCalendarDateClick"
        >
          <template #header="{ headerProps }">
            <CalendarViewHeader :headerProps="headerProps" @input="setShowDate" />
          </template>
          <template #dayContent="slotProps">
             <div class="day-empty">
              <div
                v-if="countItemsForDateKey(slotProps) > 0 && !anyModalOpen"
                :class="['day-badge', (String(countItemsForDateKey(slotProps)).length === 1) ? 'single' : 'pill']"
                :style="badgeStyle(countItemsForDateKey(slotProps))">
                {{ countItemsForDateKey(slotProps) }}
              </div>
              <div v-if="showDebug" class="dbg-count">{{ countItemsForDateKey(slotProps) }}</div>
            </div>
          </template>
        </CalendarView>
        </div>
      </section>

      <aside class="day-list">
        <div class="list-header">
          <div class="header-left"><h3>선택된 날짜</h3></div>
          <div class="header-right">
            <div class="selected-date">{{ selectedDate ? (new Date(selectedDate)).toLocaleDateString() : '선택 없음' }}</div>
            <button v-if="selectedDate" class="btn-outline btn-small add-btn" @click="showSetScheduleModal = true">일정 추가</button>
          </div>
        </div>
        <div class="list-body">
          <div v-if="!selectedDate" class="empty">날짜를 선택하면 해당 날짜의 일정을 보여줍니다.</div>
          <div v-else>
            <ul class="day-items">
              <li v-for="(it, idx) in dayItems" :key="it.id || idx" class="day-item">
                <div class="left">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px">
                    <div class="item-type-badge">{{ it.kind === 'task' ? '과제' : (it.kind === 'training' ? '교육' : '') }}</div>
                    <div class="title">{{ it.title }}</div>
                  </div>
                  <div class="meta">{{ formatItemTime(it) }}</div>
                </div>
                <div class="actions">
                  <button class="btn-outline btn-small" @click="openDateModal(selectedDate)">편집</button>
                </div>
              </li>
              <li v-if="dayItems.length === 0" class="empty">해당 날짜에 일정이 없습니다.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
    <section class="program-info">
      <div class="program-frame">
        <div class="program-header">
          <div class="program-title">
            <h2 class="program-name">{{ program?.name || '—' }}</h2>
            <div class="program-period">{{ formattedPeriod }}</div>
          </div>
          <div class="program-actions">
            <div class="program-status" :class="getStatusClass(program?.status)">{{ statusText }}</div>
          </div>
        </div>

        <div class="program-grid">
          <div class="card list-card mentees-card">
            <div class="card-title">멘티 목록
              <button class="btn-add-mentee" @click="onAddMentee" title="멘티 추가">+</button>
            </div>
            <div class="card-body">
                <ul class="people-list">
                  <li v-if="menteeDisplayList.length === 0" class="empty">멘티 정보 없음</li>
                  <li v-else v-for="(mentee, i) in menteeDisplayList" :key="mentee.id || i">
<div
  class="person-row"
  :class="{ selected: isSelectedMentee(mentee) }"
  @click="selectMentee(mentee)"
>
                      <div class="avatar">{{ initials(mentee.name || mentee.label) }}</div>
                      <div class="meta">
                        <div class="name">{{ mentee.name || mentee.label }}</div>
                        <div class="email">{{ mentee.email || '' }}</div>
                      </div>
                      <div class="right">
                        <div class="dept">{{ mentee.department || '' }}</div>
                        <div class="join">{{ mentee.joinDate ? (String(mentee.joinDate)).slice(0,10) : '' }}</div>

                      </div>
<button
  class="btn-outline btn-small"
  @click.stop="openJobPerformanceModal(mentee)"
>
  평가
</button>
                    </div>
                  </li>
                </ul>
            </div>
          </div>

          <div class="right-column">
<div class="card chart-card kpi-card">
  <div class="card-title">
    KPI 점수 비교
    <span v-if="selectedMentee" class="sub">
      · {{ selectedMentee.name }}
    </span>
  </div>

  <div class="card-body">

    <!-- 로딩 -->
    <div v-if="kpiLoading" class="kpi-loading">
      KPI 불러오는 중…
    </div>

    <!-- 미선택 -->
    <div v-else-if="!kpiCompare" class="kpi-empty">
      멘티를 선택하면 KPI 비교가 표시됩니다.
    </div>

    <!-- ApexCharts -->
    <apexchart
      v-else
      type="bar"
      height="300"
      :options="kpiChartOptions"
      :series="kpiChartSeries"
    />
<div v-if="kpiCompare" class="kpi-summary">
  <div class="score">
    <span class="label">KPI 종합 점수</span>
    <strong class="value">{{ kpiTotalScore }}점</strong>
  </div>

  <div class="grade" :class="kpiGrade">
    <span class="badge">{{ kpiGrade }}</span>
    <span class="desc">{{ kpiGradeText }}</span>
  </div>
</div>
  </div>
</div>
            <div class="card chart-card risk-card">
  <div class="card-title">위험도 분포</div>

  <div class="card-body">
    <div v-if="riskLoading" class="kpi-loading">
      위험도 계산 중…
    </div>

    <div v-else-if="!riskDistribution" class="kpi-empty">
      위험도 데이터가 없습니다.
    </div>

    <apexchart
      v-else
      type="donut"
      height="260"
      :options="riskOptions"
      :series="riskSeries"
    />
  </div>
</div>

          </div>
        </div>
      </div>
    </section>

    <UserDetailpopup
      :show="showUserDetail"
      :user="selectedUser"
      @close="showUserDetail = false"
      @saved="onUserSaved"
    />

    <OnboardingProgramAddUserPopup
      :visible="showAddMenteeModal"
      :initial-selected="menteeProfiles"
      @close="showAddMenteeModal = false"
      @added="onAddMenteeConfirmed"
      @confirm="onModalConfirmed"
    />

    <OnboardingSetschedulePopup
      :visible="showSetScheduleModal"
      :date="selectedDate"
      :day-items="dayItems"
      :program-id="programId"
      @close="showSetScheduleModal = false"
      @assignments-saved="fetchProgramTasks"
      @training-assigned="onTrainingAssigned"
      @training-removed="onTrainingRemoved"
    />
    <OnboardingProgramEditModal
  :visible="showEditModal"
  :program="program"
  @close="showEditModal = false"
  @save="onProgramUpdated"
/>

<JobPerformanceEvaluateModal
  :key="selectedMentee?.id || selectedMentee?.userId"
  :visible="showJobPerformanceModal"
  :user="selectedMentee"
  :department-id="selectedMentee?.departmentId"
  :mode="jobPerformanceMode"
  @close="showJobPerformanceModal = false"
  @saved="onJobPerformanceSaved"
/>
  </div>
</template>

<script>
import { CalendarView, CalendarViewHeader } from 'vue-simple-calendar'
import 'vue-simple-calendar/dist/vue-simple-calendar.css'
import http from '@/services/http'
import userService from '@/services/user'
import tasksService from '@/services/tasksService'
import OnboardingSetschedulePopup from '@/pages/admin/onboarding/onboardingSetschedulePopup.vue'
import UserDetailpopup from '@/pages/admin/organization/User/UserDetailpopup.vue'
import OnboardingProgramAddUserPopup from '@/pages/admin/onboarding/OnboardingProgramAddUserPopup.vue'
import OnboardingProgramEditModal from '@/pages/admin/onboarding/OnboardingProgramEditModal.vue'
import JobPerformanceEvaluateModal from '@/pages/admin/kpi/JobPerformanceEvaluateModal.vue'
import ApexChart from 'vue3-apexcharts'

export default {
  name: 'OnboardingProgramDetailPage',
  components: { CalendarView, CalendarViewHeader, OnboardingSetschedulePopup, UserDetailpopup, OnboardingProgramAddUserPopup, OnboardingProgramEditModal, JobPerformanceEvaluateModal, apexchart: ApexChart},
  data() {
    return {
      programId: this.$route.params.programId || null,
      program: null,
      internalShowDate: new Date(),
      trainings: [],
      selectedDate: null,
      showSetScheduleModal: false,
      showDebug: true,
      enrollments: [],
      programTasks: [],
      mentorProfiles: [],
      showAddMenteeModal: false,
      showUserDetail: false,
      selectedUser: null,
      menteeProfiles: [],
      showEditModal: false,
      showJobPerformanceModal: false,
      jobPerformanceMode: 'edit',
      selectedMentee: null,
      kpiCompare: null,
      kpiLoading: false,
      riskDistribution: null,
      riskLoading: false,
    }
  },
  computed: {
      kpiTotalScore() {
    if (!this.kpiCompare?.items) return 0

    const WEIGHTS = {
      '교육 이수율': 0.1,
      '과제 제출률': 0.2,
      '과제 평균 점수': 0.2,
      '주간 보고서 제출률': 0.2,
      '오프라인 참여율': 0.05,
      '직무 수행 능력': 0.25,
    }

    const total = this.kpiCompare.items.reduce((sum, item) => {
      const w = WEIGHTS[item.kpiName] || 0
      return sum + (Number(item.userScore) || 0) * w
    }, 0)

    return Math.round(total * 10) / 10
  },

  kpiGrade() {
    const s = this.kpiTotalScore
    if (s >= 90) return 'A'
    if (s >= 80) return 'B'
    if (s >= 70) return 'C'
    return 'D'
  },

  kpiGradeText() {
    switch (this.kpiGrade) {
      case 'A': return '우수 – 완벽 적응한 인원'
      case 'B': return '양호 – 정상 온보딩 완료'
      case 'C': return '보통 – 추가 교육 필요'
      default: return '미흡 – 부적응 가능성'
    }
  },
  kpiChartSeries() {
    if (!this.kpiCompare) return []

    return [
      {
        name: '개인 점수',
        data: this.kpiCompare.items.map(i => i.userScore),
      },
      {
        name: '부서 평균',
        data: this.kpiCompare.items.map(i => i.departmentAvgScore),
      },
    ]
  },
riskSeries() {
  if (!this.riskDistribution) return []
  return [
    this.riskDistribution.low,
    this.riskDistribution.medium,
    this.riskDistribution.high,
  ]
},

riskOptions() {
  return {
    chart: {
      type: 'donut',
    },
    labels: ['LOW', 'MEDIUM', 'HIGH'],
    colors: ['#16a34a', '#f59e0b', '#dc2626'],
    legend: {
      position: 'bottom',
      fontSize: '13px',
      fontWeight: 700,
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Math.round(val)}%`,
      style: {
        fontSize: '13px',
        fontWeight: 700,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: '전체',
              fontSize: '14px',
              fontWeight: 800,
              formatter: (w) =>
                w.globals.seriesTotals.reduce((a, b) => a + b, 0),
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (v) => `${v} 명`,
      },
    },
  }
},

  kpiChartOptions() {
    if (!this.kpiCompare) return {}

    return {
      chart: {
        toolbar: { show: false },
      },
  plotOptions: {
  bar: {
    dataLabels: {
      position: 'top',
    },
    columnWidth: '50%',
    borderRadius: 8,
  },
},


      colors: ['#1e40af', '#cbd5e1'],
  dataLabels: {
  enabled: false,
  offsetY: -6,
  style: {
    fontSize: '13px',
    fontWeight: 800,
    colors: ['#111827'],
  },
  dropShadow: {
    enabled: true,
    top: 1,
    left: 1,
    blur: 2,
    color: '#ffffff',
    opacity: 1,
  },
  formatter: (val, opts) => {
    const item = this.kpiCompare.items[opts.dataPointIndex]

    if (
      opts.seriesIndex === 0 &&
      item.userScore > item.departmentAvgScore
    ) {
      return `▲ ${Math.round(val)}`
    }
    return Math.round(val)
  },
},

states: {
  hover: {
    filter: {
      type: 'none', 
    }
  },
  active: {
    filter: {
      type: 'none',
    }
  }
},

      xaxis: {
  categories: this.kpiCompare.items.map(i =>
    i.kpiGoalId === 6 ? `${i.kpiName}` : i.kpiName
  ),
  labels: {
    rotate: -35,
    rotateAlways: true,
    style: {
      fontSize: '13px',
      fontWeight: 700,
      colors: '#374151',
    },
  },
},
yaxis: {
  min: 0,
  max: 100,
  tickAmount: 5,
  labels: {
    formatter: (val) => Math.round(val),
  },
},
grid: {
  borderColor: '#e5e7eb',
  strokeDashArray: 4,
},

      fill: {
  colors: [
    ({ seriesIndex, dataPointIndex }) => {
      const item = this.kpiCompare.items[dataPointIndex]

      if (item.kpiGoalId === 6) {
        return seriesIndex === 0 ? '#16a34a' : '#cbd5e1'
      }

      if (seriesIndex === 0) return '#1e40af'
      return '#cbd5e1'
    }
  ]
},

      tooltip: {
        y: {
          formatter: v => `${v} 점`,
        },
      },
      legend: {
        position: 'top',
      },
    }
  },
    formattedPeriod() {
      const s = this.program?.startDate;
      const e = this.program?.endDate;
      if (!s && !e) return '—';
      return `${s || '—'} ~ ${e || '—'}`;
    },
    statusText() {
      const map = { ACTIVE: '진행중', UPCOMING: '예정', COMPLETED: '완료' };
      return map[this.program?.status] || (this.program?.status ?? '—');
    },
    calendarShowDate() {
      return this.internalShowDate
    },
    anyModalOpen() {
      return (this.showUserDetail || this.showSetScheduleModal || this.showAddMenteeModal ||
    this.showJobPerformanceModal);
    },
    dayItems() {
      if (!this.selectedDate) return []
      const target = new Date(this.selectedDate)
      target.setHours(0,0,0,0)
      const trainingItems = (this.trainings || []).filter(t => {
        const startRaw = t.startDate || t.start_date || t.scheduledAt || t.scheduled_at || null
        const sd = startRaw ? new Date(startRaw) : null
        if (!sd) return false
        sd.setHours(0,0,0,0)
        return sd.getTime() === target.getTime()
      }).map(t => {
        const startRaw = t.startDate || t.start_date || t.scheduledAt || t.scheduled_at || null
        const endRaw = t.endDate || t.end_date || t.end || null
        const type = t.type || t.trainingType || t.training_type || null
        return {
          id: t.trainingId || t.id || t.training_id || `${t.title}-${startRaw}`,
          title: t.title || t.name || t.trainingTitle || '일정',
          startDate: startRaw,
          endDate: endRaw,
          classes: (type ? [String(type).toLowerCase()] : []),
          kind: 'training',
          type,
        }
      })

      const taskItems = (this.programTasks || []).filter(p => {
        if (!p || !p.startDate) return false
        const sd = new Date(p.startDate)
        if (isNaN(sd.getTime())) return false
        sd.setHours(0,0,0,0)
        return sd.getTime() === target.getTime()
      }).map(p => ({ id: p.id, title: p.title || '과제', startDate: p.startDate, endDate: p.endDate, classes: p.classes || ['tesk'] }))

      const taskItemsMarked = taskItems.map(i => Object.assign({}, i, { kind: 'task' }))

      return [...trainingItems, ...taskItemsMarked]
    },
    allDayItems() {
      const trainingItems = (this.trainings || []).map(t => {
        const startRaw = t.startDate || t.start_date || t.scheduledAt || t.scheduled_at || null
        const endRaw = t.endDate || t.end_date || t.end || null
        const type = t.type || t.trainingType || t.training_type || null
        return {
          id: t.trainingId || t.id || t.training_id || `${t.title}-${startRaw}`,
          title: t.title || t.name || t.trainingTitle || '일정',
          startDate: startRaw,
          endDate: endRaw,
          classes: (type ? [String(type).toLowerCase()] : []),
          kind: 'training',
          type,
        }
      })
      const taskItems = (this.programTasks || []).map(p => ({
        id: p.id,
        title: p.title || '과제',
        startDate: p.startDate || null,
        endDate: p.endDate || null,
        classes: p.classes || ['task'],
        kind: 'task'
      }))
      return [...trainingItems, ...taskItems]
    },
    calendarItems() {
      return []
    },
    calendarDateClasses() {
      const map = {}
      if (!this.program || !this.program.startDate) return map
      const start = new Date(this.program.startDate)
      const end = this.program.endDate ? new Date(this.program.endDate) : new Date(this.program.startDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        map[key] = (map[key] || []).concat(['program-date'])
      }
      const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
      map[startKey] = (map[startKey] || []).concat(['program-start'])
      const endKey = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
      map[endKey] = (map[endKey] || []).concat(['program-end'])
      return map
    },
    dateCountMap() {
      const map = {}
      const items = this.allDayItems || []
      items.forEach(it => {
        if (!it || !it.startDate) return
        const sd = new Date(it.startDate)
        if (isNaN(sd.getTime())) return
        sd.setHours(0,0,0,0)
        const key = `${sd.getFullYear()}-${String(sd.getMonth()+1).padStart(2,'0')}-${String(sd.getDate()).padStart(2,'0')}`
        map[key] = (map[key] || 0) + 1
      })
      return map
    },
    mentorDisplayList() {
      if (this.mentorProfiles && this.mentorProfiles.length) return this.mentorProfiles
      return this.normalizeProgramPeople(this.program?.mentors)
    },
    menteeDisplayList() {
      if (this.menteeProfiles && this.menteeProfiles.length) return this.menteeProfiles
      return this.normalizeProgramPeople(this.program?.mentees)
    }
  },
  watch: {
      showJobPerformanceModal(val) {
    if (val) {
      this.removeCalendarBadges()
    } else {
      this.$nextTick(() => {
        this.applyDomBadges()
      })
    }
  },
    '$route.params.programId': {
      immediate: true,
      handler(v) {
        this.programId = v
        console.log('[Onboarding] route param programId changed', v)
        this.loadProgram()
      }
    }
    ,
    internalShowDate() {
      this.$nextTick(() => {
        this.applyDomBadges()
      })
    }
    ,
    showSetScheduleModal(val) {
      try {
        if (val) {
          document.querySelectorAll('.day-badge-dom').forEach(n => n.remove())
        } else {
          this.$nextTick(() => { try { this.applyDomBadges() } catch (e) { /* ignore */ } })
        }
      } catch (e) {
        // ignore
      }
    }
  },
  mounted() {
    console.log('[Onboarding] mounted - programId', this.programId)
    this.$nextTick(() => {
      try { this.applyDomBadges() } catch (e) { /* ignore */ }
    })
    
    try {
      this.$nextTick(() => {
        try {
          const ev = new CustomEvent('onboarding:mounted', { detail: { programId: this.programId } })
          document.dispatchEvent(ev)
          console.debug('[Onboarding] dispatched onboarding:mounted', { programId: this.programId })
        } catch (err) {
          console.debug('[Onboarding] failed to dispatch onboarding:mounted', err)
        }
      })
    } catch (err) {
      console.debug('[Onboarding] onboarding:mounted dispatch setup failed', err)
    }
    window.addEventListener('resize', this.applyDomBadges)
    try {
      this._calendarWheelHandler = (e) => {
        try {
          if (e && typeof e.preventDefault === 'function') e.preventDefault()
        } catch (err) { /* ignore */ }
        try { if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation() } catch (err) { /* ignore */ }
      }
      const rootEl = this.$el && this.$el.querySelector && this.$el.querySelector('.calendar-wrapper')
      const innerEl = this.$el && this.$el.querySelector && this.$el.querySelector('.calendar-area ::v-deep .cv-wrapper')
      if (rootEl) {
        rootEl.addEventListener('wheel', this._calendarWheelHandler, { capture: true, passive: false })
        rootEl.addEventListener('touchmove', this._calendarWheelHandler, { capture: true, passive: false })
      }
      const cv = this.$el && this.$el.querySelector && (this.$el.querySelector('.cv-wrapper') || (innerEl && innerEl.parentElement))
      if (cv) {
        cv.addEventListener('wheel', this._calendarWheelHandler, { capture: true, passive: false })
        cv.addEventListener('touchmove', this._calendarWheelHandler, { capture: true, passive: false })
      }
      this._documentCalendarBlocker = (e) => {
        try {
          const path = e.composedPath ? e.composedPath() : (e.path || [])
          const hit = Array.from(path || []).some(el => {
            try { return el && el.classList && (el.classList.contains && el.classList.contains('calendar-area') || el.classList.contains('cv-wrapper') || el.classList.contains('calendar-wrapper')) } catch (err) { return false }
          })
          if (!hit) {
            const tgt = e.target || (e.srcElement || null)
            if (tgt && tgt.closest) {
              const found = tgt.closest && (tgt.closest('.calendar-area') || tgt.closest('.cv-wrapper') || tgt.closest('.calendar-wrapper'))
              if (!found) return
            } else {
              return
            }
          }
          if (e && typeof e.preventDefault === 'function') e.preventDefault()
          if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation()
        } catch (err) {
          /* ignore */
        }
      }
      document.addEventListener('wheel', this._documentCalendarBlocker, { capture: true, passive: false })
      document.addEventListener('touchmove', this._documentCalendarBlocker, { capture: true, passive: false })
    } catch (err) {
      console.debug('[Onboarding] failed to attach calendar wheel blocker', err)
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.applyDomBadges)
    try {
      const el = this.$el && this.$el.querySelector && this.$el.querySelector('.calendar-wrapper')
      if (el && this._calendarWheelHandler) {
        el.removeEventListener('wheel', this._calendarWheelHandler, { capture: true })
        el.removeEventListener('touchmove', this._calendarWheelHandler, { capture: true })
      }
      const cv = this.$el && this.$el.querySelector && (this.$el.querySelector('.cv-wrapper') || this.$el.querySelector('.calendar-area ::v-deep .cv-wrapper'))
      if (cv && this._calendarWheelHandler) {
        cv.removeEventListener('wheel', this._calendarWheelHandler, { capture: true })
        cv.removeEventListener('touchmove', this._calendarWheelHandler, { capture: true })
      }
      if (this._documentCalendarBlocker) {
        document.removeEventListener('wheel', this._documentCalendarBlocker, { capture: true })
        document.removeEventListener('touchmove', this._documentCalendarBlocker, { capture: true })
      }
    } catch (err) {
      console.debug('[Onboarding] failed to remove calendar wheel blocker', err)
    }
  },
  methods: {
      removeCalendarBadges() {
    document.querySelectorAll('.day-badge-dom').forEach(el => el.remove())
  },
async onJobPerformanceSaved() {
  if (!this.selectedMentee) return

  this.kpiLoading = true
  try {
    const res = await http.get('/api/v1/admin/kpi/compare', {
      params: {
        userId: this.selectedMentee.userId || this.selectedMentee.id,
        programId: this.programId,
      }
    })
    this.kpiCompare = res.data
  } catch (e) {
    console.warn('KPI 비교 재조회 실패', e)
  } finally {
    this.kpiLoading = false
  }
},
  isSelectedMentee(mentee) {
    if (!this.selectedMentee) return false
    return String(mentee.id || mentee.userId)
      === String(this.selectedMentee.id || this.selectedMentee.userId)
  },
async fetchRiskDistribution() {
  if (!this.programId) return

  this.riskLoading = true
  try {
    const res = await http.get(
      `/api/v1/admin/programs/${this.programId}/risk-distribution`
    )
    this.riskDistribution = res.data
  } catch (e) {
    console.error('위험도 분포 조회 실패', e)
    this.riskDistribution = null
  } finally {
    this.riskLoading = false
  }
},


async selectMentee(mentee) {
  this.selectedMentee = mentee
  this.kpiCompare = null
  this.kpiLoading = true

  try {
    const res = await http.get('/api/v1/admin/kpi/compare', {
      params: {
        userId: mentee.userId || mentee.id,
        programId: this.programId,
      }
    })
    this.kpiCompare = res.data
  } catch (e) {
    console.warn('KPI 비교 조회 실패', e)
    this.kpiCompare = null
  } finally {
    this.kpiLoading = false
  }
},
async openJobPerformanceModal(mentee) {
  if (this.program?.status !== 'COMPLETED') {
    alert('프로그램 종료 후 평가할 수 있습니다.')
    return
  }

  this.selectedMentee = mentee

  try {
    const res = await http.get('/api/v1/admin/kpi/job-performance', {
      params: {
        userId: mentee.userId || mentee.id,
        departmentId: mentee.departmentId,
      }
    })

    if (res?.data?.score !== null && res?.data?.score !== undefined) {
      this.jobPerformanceMode = 'view'
    } else {
      this.jobPerformanceMode = 'edit'
    }
  } catch (e) {
    this.jobPerformanceMode = 'edit'
  }

  this.showJobPerformanceModal = true
},
    getStatusClass(status) {
      const classMap = {
        ACTIVE: 'active',
        UPCOMING: 'upcoming',
        COMPLETED: 'completed',
      };
      return classMap[status] || 'default';
    },
    initials(name) {
      if (!name) return ''
      const parts = String(name).split('')
      return parts.slice(0,2).join('')
    },
    formatItemTime(it) {
      try {
        const rawStart = it.startDate || it.start_date || it.scheduledAt || it.scheduled_at || null
        const rawEnd = it.endDate || it.end_date || it.end || null
        if (!rawStart) return ''
        const start = new Date(rawStart)
        const end = rawEnd ? new Date(rawEnd) : null
        const formatMonthDay = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
        const type = (it.type || it.trainingType || it.training_type || '').toString().toUpperCase()
        const isOnlineTraining = (it.kind === 'training') && (type === 'ONLINE' || (Array.isArray(it.classes) && it.classes.includes('online')))
        if (isOnlineTraining && rawEnd) {
          if (!isNaN(start.getTime()) && end && !isNaN(end.getTime())) {
            return `${formatMonthDay(start)} ~ ${formatMonthDay(end)}`
          }
          return `${rawStart} ~ ${rawEnd}`
        }
        const isMidnight = (d) => d && d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0
        if (end && start.getTime() === end.getTime()) {
          if (isMidnight(start)) return start.toLocaleDateString()
          return start.toLocaleTimeString()
        }
        if (end && isMidnight(start) && isMidnight(end)) {
          return `${start.toLocaleDateString()} ~ ${end.toLocaleDateString()}`
        }
        if (!end) {
          if (isMidnight(start)) return start.toLocaleDateString()
          return start.toLocaleTimeString()
        }
        return `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`
      } catch (e) {
        return ''
      }
    },
    dumpDebugState(hint) {
      try {
        console.groupCollapsed('[Onboarding] DEBUG SNAPSHOT', hint || '')
        console.log('selectedDate (raw):', this.selectedDate)
        try { console.log('selectedDate (ISO):', this.selectedDate ? (new Date(this.selectedDate)).toISOString().slice(0,10) : null) } catch(e) { console.debug('[Onboarding] selectedDate ISO conversion error', e) }
        console.log('dayItems.length:', Array.isArray(this.dayItems) ? this.dayItems.length : 'no dayItems')
        if (Array.isArray(this.dayItems)) console.table(this.dayItems.map(it => ({ id: it.id, title: it.title, startDate: it.startDate, kind: it.kind })))
        console.log('allDayItems.length:', Array.isArray(this.allDayItems) ? this.allDayItems.length : 'no allDayItems')
        if (Array.isArray(this.allDayItems)) console.table(this.allDayItems.map(it => ({ id: it && it.id, title: it && it.title, startDate: it && it.startDate, meta_detail_start: it && it.meta && it.meta.detail && (it.meta.detail.startDate || it.meta.detail.scheduledAt), meta_mapping_due: it && it.meta && it.meta.mapping && (it.meta.mapping.dueDate || it.meta.mapping.due_date) })))
        console.log('programTasks.length:', Array.isArray(this.programTasks) ? this.programTasks.length : 0)
        if (Array.isArray(this.programTasks)) console.table(this.programTasks.map(t => ({ id: t.id, title: t.title, startDate: t.startDate })))
        console.log('dateCountMap sample keys:', Object.keys(this.dateCountMap || {}).slice(0,10))
        console.groupEnd()
      } catch (e) {
        console.error('[Onboarding] dumpDebugState failed', e)
      }
    },
    goBack() {
      this.$router.push('/admin/onboarding/programs')
    },
    async loadProgram() {
      if (!this.programId) return
      try {
        console.log('[Onboarding] loadProgram start for', this.programId)
        const resp = await http.get(`/api/v1/admin/programs/${this.programId}`)
        this.program = resp?.data ?? resp
        if (this.program && this.program.startDate) this.internalShowDate = new Date(this.program.startDate)
        this.fetchTrainings()
        this.fetchProgramTasks()
        this.fetchEnrollments()
        console.log('[Onboarding] program loaded', this.program)
        console.log('[Onboarding] calendarItems after program load', this.calendarItems)
        console.log('[Onboarding] allDayItems after program load', this.allDayItems)
      } catch (e) {
        console.error('프로그램 조회 실패', e)
        this.program = null
      }
      await this.fetchEnrollments()
      await this.fetchRiskDistribution()
    },
    async fetchTrainings() {
      if (!this.programId) return
      try {
        const resp = await http.get(`/api/v1/admin/programs/${this.programId}/trainings`)
       const body = resp?.data ?? resp
        if (this.showDebug) {
          console.debug('[Onboarding] fetchTrainings resp', resp)
          console.debug('[Onboarding] fetchTrainings body keys', body && typeof body === 'object' ? Object.keys(body) : typeof body)
        }
        this.trainings = Array.isArray(body.trainings) ? body.trainings : (Array.isArray(body.items) ? body.items : (Array.isArray(body.content) ? body.content : []))
        const seen = {}
        this.trainings = this.trainings.filter(t => {
          const id = t.trainingId || t.id || t.training_id
          if (!id) return true
          if (seen[id]) return false
          seen[id] = true
          return true
        })
        console.log('[Onboarding] trainings loaded', this.trainings.length, (this.trainings || []).slice(0,5))
        console.log('[Onboarding] allDayItems after trainings load', this.allDayItems, 'allDayItems.length', (this.allDayItems || []).length)
        this.$nextTick(() => {
          try {
            this.applyDomBadges()
          } catch (e) {
            console.debug('[Onboarding] applyDomBadges error', e)
          }
        })
      } catch (e) {
        console.error('트레이닝 조회 실패', e)
        this.trainings = []
      }
    },
    async fetchProgramTasks() {
      if (!this.programId) return
      try {
        const resp = await http.get(`/api/v1/admin/programs/${this.programId}/tasks`)
        const body = resp?.data ?? resp
        if (this.showDebug) console.debug('[Onboarding] fetchProgramTasks raw', body)
        const mappings = (body && (body.data && Array.isArray(body.data.tasks) ? body.data.tasks : (Array.isArray(body.tasks) ? body.tasks : (Array.isArray(body.data) ? body.data : [])))) || []
        const unique = []
        const seen = new Set()
        mappings.forEach(m => {
          const tid = m.taskId || m.task_id || m.id || m.task || null
          if (!tid) return
          if (seen.has(String(tid))) return
          seen.add(String(tid))
          unique.push(m)
        })
        console.log('[Onboarding] program task mappings unique', unique.length, unique.slice(0,3))
       const enriched = await Promise.all(unique.map(async (m) => {
          const tid = m.taskId || m.task_id || m.id || m.task
          try {
            const dresp = await tasksService.get(tid)
            const detail = dresp?.data ?? dresp
            console.log('[Onboarding] fetched task detail', tid, detail)
            const title = detail.data.title || detail.name || detail.taskTitle || detail.trainingTitle || (detail.titleName) || '과제'
            let dueRaw = m.dueDate || m.due_date || m.assignedDate || m.assigned_at || detail.dueDate || detail.due_date || detail.scheduledAt || detail.startDate || null
            let due = null
            this.applyDomBadges()
            if (dueRaw) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(String(dueRaw))) {
                due = String(dueRaw) + 'T00:00:00'
              } else {
                due = dueRaw
              }
            }
            return {
              id: detail.id || detail.taskId || tid,
              title,
              startDate: due || detail.startDate || detail.scheduledAt || null,
              endDate: due || detail.endDate || null,
              classes: ['tesk'],
              meta: { mapping: m, detail }
            }
          } catch (err) {
            const title = m.title || m.name || `task-${tid}`
            let dueRaw = m.dueDate || m.due_date || m.assignedDate || m.assigned_at || null
            let due = null
            if (dueRaw) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(String(dueRaw))) {
                due = String(dueRaw) + 'T00:00:00'
              } else {
                due = dueRaw
              }
            }
            return { id: tid, title, startDate: due, endDate: due, classes: ['tesk'], meta: { mapping: m } }
          }
        }))
        this.programTasks = enriched.filter(Boolean)
        if (this.showDebug) console.debug('[Onboarding] programTasks enriched', this.programTasks)
        this.$nextTick(() => {
          try {
            this.applyDomBadges()
          } catch (e) { /* ignore */ }
          try {
            this.dumpDebugState && this.dumpDebugState('afterFetchProgramTasks')
          } catch (e) { /* ignore */ }
        })
      } catch (err) {
        console.warn('[Onboarding] fetchProgramTasks failed', err)
        this.programTasks = []
      }
    },
      async onProgramUpdated(updatedProgram) {
      if (!updatedProgram) {
        this.showEditModal = false;
        return;
      }
      try {
        await http.patch(`/api/v1/admin/programs/${this.programId}`, updatedProgram);
      } catch (e) {
        console.error('프로그램 업데이트 실패', e);
        alert('프로그램 업데이트에 실패했습니다.');
      } finally {
        await this.loadProgram();
        this.showEditModal = false;
      }
    },
    async fetchEnrollments() {
      if (!this.programId) return
      try {
        const resp = await http.get(`/api/v1/admin/programs/${this.programId}/enrollments`)
        if (this.showDebug) console.log('[Onboarding] fetchEnrollments resp', resp)
        const body = resp;
        if (this.showDebug) console.log('[Onboarding] fetchEnrollments body keys', body && typeof body === 'object' ? Object.keys(body) : typeof body)
        const items = Array.isArray(body)
          ? body.enrollments
          : Array.isArray(body.items)
            ? body.items
            : Array.isArray(body.content)
              ? body.content
              : Array.isArray(body.data)
                ? body.data
                : []
        this.enrollments = items
        const activeEnrollments = (items || []).filter(en => {
          try {
            const status = (en.enrollmentStatus || en.status || en.enrollment_status || (en.user && (en.user.enrollmentStatus || en.user.status)) || '').toString().toUpperCase()
            return status !== 'WITHDRAWN'
          } catch (e) {
            return true
          }
        })
        if (this.showDebug) console.log('[Onboarding] enrollments parsed', { count: items.length, sample: items.slice(0,3) })
       try {
          const quick = (activeEnrollments || []).map(en => {
            const uid = this.extractEnrollmentUserId(en)
            return this.buildPersonFromData({ userId: uid, id: uid }, `#${uid}`)
          }).filter(Boolean)
          this.mentorProfiles = []
          this.menteeProfiles = quick
        } catch (e) {
          // ignore
        }
       await this.populateEnrollmentUsers(activeEnrollments)
      } catch (e) {
        console.error('프로그램 등록 정보 조회 실패', e)
        this.enrollments = []
        this.mentorProfiles = []
        this.menteeProfiles = []
      }
    },
    async populateEnrollmentUsers(enrollments) {
      if (!enrollments || enrollments.length === 0) {
        this.mentorProfiles = []
        this.menteeProfiles = []
        return
      }
      const ids = [...new Set(enrollments.map(enr => this.extractEnrollmentUserId(enr)).filter(Boolean))]
      if (this.showDebug) console.log('[Onboarding] enrollment user ids', ids)
      if (!ids.length) {
        this.mentorProfiles = []
        this.menteeProfiles = []
        return
      }
      const userMap = {}
      await Promise.all(ids.map(async userId => {
        try {
          const resp = await userService.getUserById(userId)
          userMap[String(userId)] = resp ?? null
          if (this.showDebug) console.log('[Onboarding] fetched user', userId, userMap[String(userId)])
        } catch (err) {
          console.warn('[Onboarding] user lookup failed', userId, err)
        }
      }))
      if (this.showDebug) console.log('[Onboarding] userMap keys', Object.keys(userMap))
      const mentors = []
      const mentees = []
      enrollments.forEach(enrollment => {
        const userId = this.extractEnrollmentUserId(enrollment)
        const role = this.detectEnrollmentRole(enrollment)
        const user = userId ? userMap[String(userId)] : null
        const person = user
          ? this.buildPersonFromData(user)
          : this.buildPersonFromData(enrollment.user || enrollment, enrollment.userName || enrollment.name || enrollment.nickname || enrollment.title)
        if (!person) {
          if (this.showDebug) console.log('[Onboarding] skipped enrollment - no person data', enrollment)
          return
        }
        if (this.showDebug) console.log('[Onboarding] enrollment resolved', { enrollment, userId, role, person })
        if (role === 'mentor') {
          mentors.push(person)
        } else if (role === 'mentee') {
          mentees.push(person)
        } else {
         mentees.push(person)
        }
      })
      this.mentorProfiles = mentors
      this.menteeProfiles = mentees
      if (this.showDebug) console.log('[Onboarding] mentor/mentee profiles', { mentors: mentors.length, mentees: mentees.length, mentorSample: mentors.slice(0,3), menteeSample: mentees.slice(0,3) })
    },
    extractEnrollmentUserId(enrollment) {
      if (!enrollment) return null
      return enrollment.userId || enrollment.user_id || (enrollment.user && (enrollment.user.id || enrollment.user.userId)) || enrollment.memberId || null
    },
    detectEnrollmentRole(enrollment) {
      if (!enrollment) return null
      const candidate = (enrollment.role || enrollment.type || enrollment.enrollmentType || enrollment.userType || enrollment.category || '').toString().toLowerCase()
      if (/mentor/.test(candidate)) return 'mentor'
      if (/mentee|learner|trainee/.test(candidate)) return 'mentee'
      if (enrollment.isMentor || enrollment.mentor || enrollment.is_mentor || (enrollment.user && enrollment.user.isMentor)) return 'mentor'
      if (enrollment.isMentee || enrollment.mentee || enrollment.is_mentee || (enrollment.user && enrollment.user.isMentee)) return 'mentee'
      return null
    },
    buildPersonFromData(value, fallbackName) {
      if (!value && !fallbackName) return null
      if (typeof value === 'string' || typeof value === 'number') {
        const label = String(value)
        return { id: label, label, name: label }
      }
      const id = value.id || value.userId || value.user_id || (value.user && (value.user.id || value.user.userId)) || null
      const name = value.name || value.fullName || value.full_name || value.displayName || `${value.firstName || ''} ${value.lastName || ''}`.trim() || null
      const email = value.email || value.username || null
      const phone = value.phoneNumber || value.phone || value.mobile || null
      const roleRaw = value.role || (value.roles && value.roles[0]) || null
      const role = roleRaw ? String(roleRaw).toUpperCase() : null
      const roleLabel = role === 'ADMIN' ? '관리자' : role === 'MENTOR' ? '멘토' : '신입'
      const department = value.departmentName || value.department || (value.team && value.team.name) || null
      const joinDate = value.joinedAt || value.joinDate || value.hireDate || null
      const label = name || email || id || fallbackName || `#${id}`
      const departmentId = value.departmentId || (value.department && value.department.departmentId)
      return { id, label, name, email, phone, role, roleLabel, department, departmentId, joinDate, meta: value }
    },
    normalizeProgramPeople(list) {
      if (!Array.isArray(list) || !list.length) return []
      return list.map(item => this.buildPersonFromData(item)).filter(Boolean)
    },
    openUserDetail(user) {
      if (!user) return
      const payload = user && user.meta ? user.meta : user
      this.selectedUser = payload || user
      this.showUserDetail = true
    },
    onAddMentee() {
      this.showAddMenteeModal = true
    },
    async onAddMenteeConfirmed(user) {
      if (!user) return
      const person = this.buildPersonFromData(user)
      const exists = (this.menteeProfiles || []).some(p => String(p.id) === String(person.id) || (p.meta && String(p.meta.id) === String(person.id)))
      if (exists) {
        window.alert('이미 멘티 목록에 존재합니다.')
        return
      }
      this.menteeProfiles = Array.isArray(this.menteeProfiles) ? [...this.menteeProfiles, person] : [person]
      const uid = person.id || (person.meta && person.meta.id)
      if (uid) {
        try {
          try {
            await http.post(`/api/v1/admin/programs/${this.programId}/enrollments`, [uid])
          } catch (err) {
           await http.post(`/api/v1/admin/programs/${this.programId}/enrollments`, { userIds: [uid] })
          }
        } catch (err) {
          console.error('Failed to persist single enrollment add', err)
        } finally {
          this.fetchEnrollments()
        }
      }
    },
    async onModalConfirmed(payload) {
      console.debug('[Onboarding] modal confirmed payload', payload)
      if (!payload) {
        this.fetchEnrollments()
        return
      }
      let added = Array.isArray(payload.added) ? payload.added.map(String).filter(Boolean) : []
      const removed = Array.isArray(payload.removed) ? payload.removed.filter(Boolean) : []
      const existingUserIds = new Set((this.enrollments || []).map(e => String(this.extractEnrollmentUserId(e))).filter(Boolean))
      const beforeFilterCount = added.length
      added = added.filter(id => !existingUserIds.has(String(id)))
      const filteredCount = beforeFilterCount - added.length
      if (filteredCount > 0) {
        console.debug('[Onboarding] filtered already-registered userIds from added', { filteredCount })
      }
      if (!added.length && !removed.length) {
        this.fetchEnrollments()
        return
      }
      try {
        if (added.length) {
          try {
            await http.post(`/api/v1/admin/programs/${this.programId}/enrollments`, added)
          } catch (err) {
            try {
              await http.post(`/api/v1/admin/programs/${this.programId}/enrollments`, { userIds: added })
            } catch (err2) {
              const errMsg = err2 && err2.response && err2.response.data && (err2.response.data.message || JSON.stringify(err2.response.data)) || err2.message || String(err2)
              console.error('Failed to add enrollments', err, err2)
              if (/already registered|이미 등록|already enrolled/i.test(errMsg)) {
                console.warn('[Onboarding] server reports some users already registered; continuing')
              } else {
                throw err2
              }
            }
          }
        }

        if (removed.length) {
          const enrollmentIds = (removed || []).map(uid => {
            const en = (this.enrollments || []).find(e => String(this.extractEnrollmentUserId(e)) === String(uid))
            if (!en) return null
            return en.id || en.enrollmentId || en.enrollment_id || (en.enrollment && (en.enrollment.id || en.enrollment.enrollmentId)) || null
          }).filter(Boolean)
          const missingCount = removed.length - enrollmentIds.length
          if (missingCount > 0) {
            console.warn('[Onboarding] some removals could not be mapped to enrollmentId', { removed, enrollmentIds })
            window.alert(`일부 삭제 항목을 찾을 수 없어 건너뛰었습니다 (${missingCount}건).`)
          }
          if (enrollmentIds.length) {
            await Promise.all(enrollmentIds.map(eid => http.delete(`/api/v1/admin/programs/${this.programId}/enrollments/${encodeURIComponent(eid)}`)))
          }
        }
      } catch (err) {
        console.error('onModalConfirmed error', err)
        const msg = err && err.response && (err.response.data && (err.response.data.message || JSON.stringify(err.response.data))) || err.message || String(err)
        window.alert('저장 중 오류가 발생했습니다: ' + msg)
      } finally {
        this.fetchEnrollments()
      }
    },
    onUserSaved(updated) {
      if (!updated || !updated.id) {
        this.showUserDetail = false
        this.selectedUser = null
        return
      }
      const merge = (arr) => arr.map(p => {
        if (!p) return p
        if (String(p.id) === String(updated.id) || (p.meta && String(p.meta.id) === String(updated.id))) {
          return this.buildPersonFromData(updated)
        }
        return p
      })
      this.mentorProfiles = merge(this.mentorProfiles || [])
      this.menteeProfiles = merge(this.menteeProfiles || [])
      this.showUserDetail = false
      this.selectedUser = null
    },
    setShowDate(d) {
      if (d) this.internalShowDate = new Date(d)
    },
    onCalendarDateClick(d) {
      this.selectedDate = d ? new Date(d) : null
      console.log('date clicked', this.selectedDate)
      try { this.dumpDebugState && this.dumpDebugState('onCalendarDateClick') } catch(e){ console.debug('[Onboarding] dumpDebugState error', e) }
    },
    countItemsForDate(d) {
      if (!d) return 0
      let candidate = d
      if (typeof d === 'object') {
        candidate = d.date || d.day || d.value || d.raw || d.dateObj || d
      }
      const target = new Date(candidate)
      if (isNaN(target.getTime())) return 0
      target.setHours(0,0,0,0)

      if (this.showDebug) {
        try {
          const sampleTrainings = (this.trainings || []).slice(0,3).map(t => ({ id: t.trainingId || t.id, title: t.title }))
          console.debug('[Onboarding] countItemsForDate', { candidate, target: target.toDateString(), trainingsCount: (this.trainings || []).length, sampleTrainings })
        } catch (e) {
          console.debug('[Onboarding] countItemsForDate debug error', e)
        }
      }

      return (this.trainings || []).reduce((acc, t) => {
        const sd = t.startDate ? new Date(t.startDate) : (t.scheduledAt ? new Date(t.scheduledAt) : null)
        if (!sd || isNaN(new Date(sd).getTime())) return acc
        sd.setHours(0,0,0,0)
        return acc + (sd.getTime() === target.getTime() ? 1 : 0)
      }, 0)
    },
    countItemsForDateKey(slotProps) {
      if (!slotProps) return 0
      let candidate = slotProps
      if (typeof slotProps === 'object') {
        candidate = slotProps.date || slotProps.day || slotProps.value || slotProps.raw || slotProps.dateObj || slotProps
      }
      const toKey = (d) => {
        if (!d) return null
        try {
          if (d instanceof Date) {
            const dt = new Date(d.getTime())
            dt.setHours(0,0,0,0)
            return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
          }
          const s = String(d)
          const m = s.match(/(\d{4}-\d{2}-\d{2})/)
          if (m && m[1]) return m[1]
          const dt = new Date(s)
          if (isNaN(dt.getTime())) return null
          dt.setHours(0,0,0,0)
          return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
        } catch (e) { return null }
      }
      const targetKey = toKey(candidate)
      if (!targetKey) {
        if (this.showDebug) console.debug('[Onboarding] countItemsForDateKey invalid candidate', { candidate, slotProps })
        return 0
      }
      let cnt = 0
      try {
        const items = this.allDayItems || []
        for (let i = 0; i < items.length; i++) {
          try {
            const it = items[i]
            const cand = it.startDate || it.scheduledAt || it.scheduled_at || (it.meta && it.meta.detail && (it.meta.detail.startDate || it.meta.detail.scheduledAt || it.meta.detail.scheduled_at || it.meta.detail.dueDate || it.meta.detail.due_date)) || (it.meta && it.meta.mapping && (it.meta.mapping.dueDate || it.meta.mapping.due_date)) || null
            const k = toKey(cand)
            if (k === targetKey) cnt += 1
          } catch (e) { /* ignore item parse error */ }
        }
      } catch (e) {
        if (this.showDebug) console.debug('[Onboarding] countItemsForDateKey scan failed', e)
      }
      try {
        if (this.selectedDate) {
          const selKey = toKey(this.selectedDate)
          if (selKey && selKey === targetKey) {
            cnt = Array.isArray(this.dayItems) ? this.dayItems.length : cnt
          }
        }
      } catch (e) { /* ignore */ }
      if (this.showDebug) console.debug('[Onboarding] countItemsForDateKey', { candidate, targetKey, cnt })
      return cnt
    },
    async onTrainingAssigned(assigned) {
      if (!assigned) return
      const t = Object.assign({}, assigned)
      if (!t.startDate) {
        if (t.scheduledAt || t.scheduled_at) {
          t.startDate = t.scheduledAt || t.scheduled_at
        } else {
          t.startDate = this.selectedDate || new Date()
        }
      }
      if (!t.endDate) t.endDate = t.startDate
      const newId = t.trainingId || t.id || t.training_id || t.taskId || t.task_id

       if (t.trainingId || t.training_id || (!t.taskId && !t.task_id && newId)) {
        if (newId) {
          const idx = this.trainings.findIndex(x => (x.trainingId || x.id || x.training_id) === newId)
          if (idx !== -1) {
            this.trainings.splice(idx, 1, Object.assign({}, this.trainings[idx], t))
          } else {
            this.trainings = Array.isArray(this.trainings) ? [...this.trainings, t] : [t]
          }
        } else {
          const exists = this.trainings.some(x => x.title === t.title && x.startDate && new Date(x.startDate).toDateString() === new Date(t.startDate).toDateString())
          if (!exists) this.trainings = Array.isArray(this.trainings) ? [...this.trainings, t] : [t]
        }
      }

      try {
        const isLikelyTask = !(t.trainingId || t.training_id) && (t.taskId || t.task_id || (!t.trainingId && !t.training_id && t.id))
        if (isLikelyTask) {
          const tid = t.taskId || t.task_id || t.id
          const already = (this.programTasks || []).some(p => String(p.id) === String(tid))
          if (!already) {
            try {
              const dresp = await tasksService.get(tid)
              const detail = dresp?.data ?? dresp
              const title = detail.title || detail.name || detail.taskTitle || '과제'
              let dueRaw = t._editDate || t.startDate || t.dueDate || t.due_date || detail.dueDate || detail.due_date || detail.startDate || null
              let due = null
              if (dueRaw) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(String(dueRaw))) {
                  due = String(dueRaw) + 'T00:00:00'
                } else {
                  due = dueRaw
                }
              }
              const item = { id: detail.id || tid, title, startDate: due || detail.startDate || null, endDate: due || detail.endDate || null, classes: ['tesk'], meta: { detail, mapping: t } }
              this.programTasks = Array.isArray(this.programTasks) ? [...this.programTasks, item] : [item]
              if (this.showDebug) console.debug('[Onboarding] onTrainingAssigned enriched task added', item)
            } catch (err) {
              console.warn('[Onboarding] onTrainingAssigned - task detail fetch failed', err)
            }
          }
        }
      } catch (e) {
        // ignore
      }

      this.fetchProgramTasks()
    },
    onTrainingRemoved(payload) {
      const tid = payload && (payload.trainingId || payload.id)
      if (!tid) return
      this.trainings = (this.trainings || []).filter(t => {
        const id = t.trainingId || t.id || t.training_id
        return String(id) !== String(tid)
      })
      this.fetchTrainings()
      this.fetchProgramTasks()
    },
    openDateModal(d) {
      this.selectedDate = d ? new Date(d) : null
      if (this.selectedDate) this.showSetScheduleModal = true
    },
    getDayPills(date) {
      if (!date || !this.program) return []
      const items = []
      const dStr = new Date(date).toDateString()
      const idBase = this.program.programId || this.program.id || 'prog'

      const arr = this.allDayItems || []
      arr.forEach((it, idx) => {
        if (!it || !it.startDate) return
        const sd = new Date(it.startDate)
        if (sd.toDateString() === dStr) {
          const id = it.id || `${idBase}-item-${idx}`
          items.push({ id, title: it.title || '일정', classes: it.classes || [] })
        }
      })
      return items
    },
    badgeStyle(count) {
      const text = String(count || '')
      if (text.length === 1) {
        return {
          position: 'absolute', right: '6px', top: '6px', zIndex: '5', background: '#ff3b30', color: '#fff', fontSize: '12px', pointerEvents: 'none', width: '24px', height: '24px', lineHeight: '24px', padding: '0px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxSizing: 'border-box'
        }
      }
      return {
        position: 'absolute', right: '6px', top: '6px', zIndex: '5', background: '#ff3b30', color: '#fff', fontSize: '12px', pointerEvents: 'none', minWidth: '24px', height: '24px', lineHeight: '24px', padding: '0 6px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxSizing: 'border-box'
      }
    },
    applyDomBadges() {
      if (this.showSetScheduleModal) {
        try { document.querySelectorAll('.day-badge-dom').forEach(n => n.remove()) } catch (e) { /* ignore */ }
        return
      }
      const map = this.dateCountMap || {}
      document.querySelectorAll('.day-badge-dom').forEach(n => n.remove())
      const cells = document.querySelectorAll('.calendar-area .cv-day')
      if (!cells || !cells.length) return

      let headerText = ''
      try {
        const headerEl = document.querySelector('.calendar-area .cv-header .periodLabel') || document.querySelector('.calendar-area .cv-header')
        if (headerEl) headerText = headerEl.textContent && headerEl.textContent.trim()
      } catch (e) { headerText = '' }

      let headerYear = null, headerMonth = null
      if (headerText) {
        const yMatch = headerText.match(/(\d{4})/)
        if (yMatch) headerYear = parseInt(yMatch[1], 10)
        const mMatch = headerText.match(/(\d{1,2})\s*월/) || headerText.match(/(\d{1,2})\s*(?=\D*$)/) || headerText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i)
        if (mMatch) {
          if (mMatch[1] && /\D/.test(mMatch[1])) {
             const names = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12 }
            headerMonth = names[mMatch[1].toLowerCase()] || null
          } else {
            headerMonth = parseInt(mMatch[1], 10)
          }
        }
      }

      cells.forEach(cell => {
        try {
          let dateAttr = cell.getAttribute('data-date') || cell.dataset && cell.dataset.date
          let dayNum = null
          const numEl = cell.querySelector('.cv-day-number') || cell.querySelector('.cv-day-num')
          if (numEl) dayNum = numEl.textContent && numEl.textContent.trim()

          let yyyy=null, mm=null, dd=null
          if (dateAttr) {
            const d = new Date(dateAttr)
            if (!isNaN(d.getTime())) {
              yyyy = d.getFullYear(); mm = d.getMonth()+1; dd = d.getDate()
            }
          }
          if (!yyyy && dayNum && headerYear && headerMonth) {
            const txt = String(dayNum).replace(/[^0-9]/g,'')
            dd = parseInt(txt,10)
            yyyy = headerYear
            mm = headerMonth
            const cls = (cell.className || '')
            if (/outside|cv-day--outside|cv-day-outside|other-month/i.test(cls)) {
              if (dd > 15) {
                mm = mm - 1
                if (mm < 1) { mm = 12; yyyy = yyyy - 1 }
              } else {
                mm = mm + 1
                if (mm > 12) { mm = 1; yyyy = yyyy + 1 }
              }
            }
          }

          if (!yyyy || !mm || !dd) return
          const key = `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`
          const cnt = map[key] || 0
          if (cnt > 0) {
            const badge = document.createElement('div')
            const text = String(cnt)
            badge.className = 'day-badge day-badge-dom ' + (text.length === 1 ? 'single' : 'pill')
            badge.textContent = text
            if (text.length === 1) {
              Object.assign(badge.style, {
                position: 'absolute', right: '6px', top: '6px', zIndex: '5', background: '#ff3b30', color: '#fff', fontSize: '12px', pointerEvents: 'none', width: '24px', height: '24px', lineHeight: '24px', padding: '0', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxSizing: 'border-box'
              })
            } else {
              Object.assign(badge.style, {
                position: 'absolute', right: '6px', top: '6px', zIndex: '5', background: '#ff3b30', color: '#fff', fontSize: '12px', pointerEvents: 'none', minWidth: '24px', height: '24px', lineHeight: '24px', padding: '0 6px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxSizing: 'border-box'
              })
            }
            if (!cell.style.position) cell.style.position = 'relative'
            cell.appendChild(badge)
          }
        } catch (e) {
          // ignore
        }
      })
    },
    }
}
</script>

<style scoped>
.page-container { padding: 20px }
.page-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px }
.actions { display: flex; gap: 8px; }
.page-title { font-size:24px; font-weight:700;}
.program-info { text-align:center; margin-bottom:14px;  }
.calendar-area { max-width:1100px; margin:0; width: 70%; background: #fff; padding: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1) }
.calendar-wrapper { max-height: 540px; overflow: hidden; }
.calendar-wrapper { position: relative; }
.calendar-blocker { position: absolute; inset: 0; z-index: 100; background: transparent; pointer-events: none; }
.btn-primary {
  background-color: var(--color-primary, #294594);
  color: var(--color-surface, #ffffff);
  border: none;
  padding: 9px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary:hover {
  background-color: var(--color-primary-accent, #2b57a0);
}
.btn-outline { background: transparent; border: 1px solid #d0d7e2; padding: 8px 14px; border-radius: 8px }

.calendar-area ::v-deep .cv-wrapper {
  width: 100%;
  min-height: 540px;
  padding: 0 !important;
  box-sizing: border-box;
}


.calendar-area ::v-deep .cv-header {
  background: linear-gradient(90deg, var(--color-primary, #294594), var(--color-primary-accent, #2b57a0)) !important;
  color: #ffffff !important;
  border-color: transparent !important;
  padding: .4em .6em !important;
  border-radius: 8px !important;
}
.calendar-area ::v-deep .cv-header .periodLabel {
  color: #ffffff !important;
  font-weight: 600 !important;
  margin-left: 11%;
}
.calendar-area ::v-deep .cv-header-nav button,
.calendar-area ::v-deep .cv-header button {
  background: rgba(255,255,255,0.08) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  box-shadow: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 36px !important;
  height: 36px !important;
  padding: 0 !important;
  border-radius: 999px !important;
  transition: background .12s ease, transform .08s ease !important;
  margin-left: 3px;
}
.calendar-area ::v-deep .cv-header-nav button:nth-child(2) {
  margin-right: 10px !important;
}
.calendar-area ::v-deep .cv-header-nav button:hover,
.calendar-area ::v-deep .cv-header button:hover {
  background: rgba(255,255,255,0.16) !important;
  transform: translateY(-1px) !important;
}
.calendar-area ::v-deep .cv-header-nav button:active,
.calendar-area ::v-deep .cv-header button:active {
  transform: translateY(0) !important;
}

.calendar-area ::v-deep .cv-header .currentPeriod {
  display: none !important;
  margin-left: 50px;
}

.calendar-area ::v-deep .cv-day.today,
.calendar-area ::v-deep .cv-day.is-today,
.calendar-area ::v-deep .cv-day.current {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
.calendar-area ::v-deep .cv-day .cv-day-number.today,
.calendar-area ::v-deep .cv-day .cv-day-number.is-today,
.calendar-area ::v-deep .cv-day .cv-day-number.current {
  background: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
  
}
.calendar-area ::v-deep .cv-day .cv-day-number.today:before,
.calendar-area ::v-deep .cv-day .cv-day-number.is-today:before,
.calendar-area ::v-deep .cv-day .cv-day-number.current:before,
.calendar-area ::v-deep .cv-day .cv-day-number.today:after,
.calendar-area ::v-deep .cv-day .cv-day-number.is-today:after,
.calendar-area ::v-deep .cv-day .cv-day-number.current:after {
  display: none !important;
  content: none !important;
}
.calendar-area ::v-deep .cv-header-days .cv-header-day {
  background: transparent !important;
  color: rgba(255,255,255,0.9) !important;
  border-color: transparent !important;
}
.calendar-area ::v-deep .cv-day {
  position: relative !important; 
  min-height: 80px !important;
  height: 88px !important;
  box-sizing: border-box !important;
  padding: 6px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
}
.calendar-area ::v-deep .cv-day { position: relative !important }

.day-simple { flex: 1; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 8px }
.day-indicator { width: 10px; height: 10px; border-radius: 50%; background: #294594; box-shadow: 0 1px 0 rgba(255,255,255,0.25) inset }

.day-empty { width:100%; height:100%; display:flex; align-items:flex-end; justify-content:center; padding-bottom:8px }
.day-empty .day-indicator { width:10px; height:10px; border-radius:50%; background:#294594 }
.dbg-count { position: absolute; left: 6px; bottom: 6px; color: #c53030; font-weight:700; font-size:12px; z-index:200 }

.day-badge {
  position: absolute !important;
  right: 6px !important;
  top: 6px !important;
  min-width: 24px !important;
  height: 24px !important;
  line-height: 24px !important;
  padding: 0 6px !important;
  border-radius: 999px !important;
  background: #ff3b30 !important;
  color: #fff !important;
  font-size: 12px !important;
  text-align: center !important;
  z-index: 300; 
  border: 1px solid #fff !important; 
  box-shadow: 0 1px 4px rgba(0,0,0,0.12) !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transform: translateY(0) !important;
}
.day-badge.single {
  width: 24px !important;
  min-width: 0 !important;
  padding: 0 !important;
  height: 24px !important;
  line-height: 24px !important;
  border-radius: 50% !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

.day-badge.pill {
  min-width: 24px !important;
  padding: 0 6px !important;
  border-radius: 999px !important;
}
.calendar-area ::v-deep .cv-item.program-duration { display: none !important }

::v-deep .cv-day.program-date {
  background-color: rgba(41, 69, 148, 0.12);
}

.calendar-area ::v-deep .cv-item.tesk {
  background-color: rgba(255, 165, 0, 0.18) !important;
  border-color: rgba(255, 165, 0, 0.22) !important;
  color: #663c00 !important;
  padding: 2px 6px !important;
  border-radius: 8px !important;
  white-space: nowrap !important;
  overflow: visible !important;
  width: 7.2rem !important;
}
.calendar-area ::v-deep .cv-item.training {
  background-color: rgba(0, 123, 255, 0.14) !important;
  border-color: rgba(0, 123, 255, 0.22) !important;
  color: #00366b !important;
  padding: 2px 6px !important;
  border-radius: 8px !important;
  white-space: nowrap !important;
  overflow: visible !important;
  width: 6.4rem !important;
}

.calendar-area ::v-deep .cv-item.training-duration {
  background-color: rgba(0, 123, 255, 0.12) !important;
  border: 1px solid rgba(0, 123, 255, 0.18) !important;
  color: #00366b !important;
  height: 1.6em !important;
  top: 28px !important;
  border-radius: 6px !important;
  z-index: 0 !important;
}

.calendar-area ::v-deep .cv-item.training,
.calendar-area ::v-deep .cv-item.program-start-item,
.calendar-area ::v-deep .cv-item.program-end-item {
  z-index: 2 !important;
}

::v-deep .cv-day.program-start {
  background-color: rgba(76, 255, 59, 0.24);
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}
::v-deep .cv-day.program-end {
  background-color: rgba(255, 0, 0, 0.24);
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

::v-deep .cv-day.program-start::after {
  content: '시작일';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 700;
  color: #1e40af;
  background-color: rgba(219, 234, 254, 0.8);
  padding: 2px 5px;
  border-radius: 4px;
  z-index: 10;
}

::v-deep .cv-day.program-end::after {
  content: '종료일';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 700;
  color: #991b1b;
  background-color: rgba(254, 226, 226, 0.8);
  padding: 2px 5px;
  border-radius: 4px;
  z-index: 10;
}

.modal-top {
  text-align: center;
  position: relative;
  margin-bottom: 20px;
}
.modal-title { font-size: 31px; font-weight: bold }

.modal-close-btn, .close-btn {
  position: absolute;
  right: 12px;
  top: 8px;
  background: transparent;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
}
.modal-close-btn:hover, .close-btn:hover {
  background: rgba(0,0,0,0.06);
}

.center-area { text-align: center; margin-bottom: 12px }
.center-name { font-size: 20px; font-weight: 700 }
.center-sub { color: #6b7280; margin-top: 4px }

.info-grid { margin-top: 14px; display: grid; gap: 12px }
.label { font-size: 12px; color: #6b7280 }
.val { font-size: 15px; font-weight: 600 }

.modal-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:18px }
.btn-outline { background: transparent; border: 1px solid #d0d7e2; padding: 8px 14px; border-radius: 8px }

.fade-enter-active, .fade-leave-active { transition: opacity .2s }
.fade-enter-from, .fade-leave-to { opacity: 0 }
.cv-day .day-scroll-area { display: none } 

  .calendar-area .calendar-wrapper { touch-action: auto } 

.calendar-and-list { display: flex; gap: 18px; align-items: stretch; margin-bottom: 16px }
.calendar-area { width: 65%; display: flex; flex-direction: column; }
.calendar-area .calendar-wrapper { flex: 1 1 auto; display: flex; flex-direction: column; }
.day-list { width: 35%; background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 6px 24px rgba(41,69,148,0.06); box-sizing: border-box; display: flex; flex-direction: column; }
.list-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px }
.list-header h3 { margin:0; font-size:22px; color:#12263f }
.selected-date { font-weight:800; color:#294594; font-size:20px }
.header-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px }
.add-btn { align-self:flex-end }
.list-body { 
  flex: 1 1 auto;
  max-height: none;
  overflow: auto;
}
.day-items { list-style:none; padding:0; margin:12px 0 0 0 }
.day-item { padding:14px 10px; border-bottom:1px solid #eef3fb; display:flex; align-items:flex-start; justify-content:space-between; gap:12px }
.day-item .left { display:flex; flex-direction:column; align-items:flex-start; gap:6px; flex:1; min-width:0 }
.day-item .title { font-weight:800; font-size:18px; max-width: 240px; color:#0f1724; line-height:1.25; word-break:break-word; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; }
.day-item .meta { font-size:13px; color:#6b7280; white-space:normal }
.day-item .actions { margin-left:12px; flex:0 0 auto }
.day-list .empty { color:#6b7280; padding:12px }

.btn-small { padding:6px 10px; font-size:13px; border-radius:10px }
.btn-outline.btn-small { background: transparent; border: 1px solid #e2e8f0; color: #1f2937 }
.btn-outline.btn-small:hover { background: rgba(41,69,148,0.04) }

.program-info {
  max-width: none;
  width: calc(100% + 40px);
  margin-left: -20px;
  margin-right: -20px;
  padding: 18px 20px;
  box-sizing: border-box;
}

.program-frame {
  width: 100%;
  border-radius: 10px;
  padding: 18px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1)
}
.program-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px }
.program-title { display:flex; flex-direction:column }
.program-name { margin:0; font-size:20px; font-weight:800; color:#10305e }
.program-period { color:#44546a; font-size:14px; margin-top:6px }
.program-actions { display:flex; align-items:center }
.program-status {
  padding: 5px 12px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.program-status.active { background: #d1fae5; color: #059669; }
.program-status.upcoming { background: #fef3c7; color: #92400e; }
.program-status.completed { background: #e0e7ff; color: #3730a3; }
.program-status.default { background: #e5e7eb; color: #4b5563; }

.program-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;
}

.right-column {
  display: grid;
  grid-template-rows: 1.2fr 0.8fr;
  gap: 18px;
}
.card { background:#fbfdff; border:1px solid #eef3fb; border-radius:10px; padding:14px; box-sizing:border-box; min-height:150px }
.card-title { font-weight:700; color:#18335a; margin-bottom:10px }
.card-body { background:transparent }
.chart-card {
  min-height: 340px;
}
.chart-card.kpi-card {
  min-height: 380px;
}
.chart-placeholder { height:110px; border-radius:8px; background:linear-gradient(180deg,#ffffff,#fbfdff); border:1px dashed rgba(41,69,148,0.06) }
.people-list { list-style:none; padding:0; margin:0 }
.people-list li { padding:8px 0; border-bottom:1px dashed #eef3fb }
.people-list li.empty { color:#6b7280; padding:10px 0 }
.mentees-card {
  min-height: 520px;
  display: flex;
  flex-direction: column;
}
.mentees-card {
  min-height: 520px;
  display: flex;
  flex-direction: column;
}
.mentees-card .people-list li { padding:8px 6px }
.mentors-card .card-body { max-height: 320px; overflow: auto; padding-right: 8px }

.person-row { display:flex; align-items:center; gap:25px; margin-bottom:12px }
.person-row .avatar { width:40px; height:40px; border-radius:50%; background:#e6eef8; display:flex; align-items:center; justify-content:center; font-weight:700; color:#294594 }
.person-row .meta { flex:1; min-width:0 }
.person-row .meta .name { font-weight:800; color:#0f1724 }
.person-row .meta .email { font-size:13px; color:#6b7280 }
.person-row .right { display:flex; flex-direction:column; align-items:flex-end; gap:4px }
.person-row .right .dept { font-size:13px; color:#44546a }
.person-row .right .join { font-size:12px; color:#94a3b8 }
.person-row { transition: all 140ms ease; border-radius:6px; cursor: default; }
.person-row:active { transform: none; }

.person-row .tooltip { display:none; position:absolute; transform:translateY(-8px); background:#fff; border:1px solid rgba(16,36,59,0.06); padding:8px 10px; border-radius:8px; box-shadow:0 8px 30px rgba(3,10,18,0.06); font-size:13px; color:#10243b; white-space:nowrap; z-index:1200 }
.person-row:hover .tooltip { display:block }
.person-row.selected {
  background: rgba(41, 69, 148, 0.08);
  border-left: 4px solid #294594;
  padding-left: 12px;
}

.person-row.selected .avatar {
  background: #294594;
  color: #fff;
}

.person-row.selected .name {
  color: #294594;
  font-weight: 900;
}

.btn-add-mentee {
  float: right;
  width: 30px;
  height: 30px;
  line-height: 28px;
  border-radius: 50%;
  background: #294594;
  color: #fff;
  border: none;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(41,69,148,0.12);
}
.btn-add-mentee:hover { transform: translateY(-2px) }
.item-type-badge { display:inline-block; background:#eef2ff; color:#294594; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:700 }
.kpi-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.kpi-row {
  margin-bottom: 12px;
}

.kpi-name {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #0f1724;
}

.kpi-bars {
  display: flex;
  gap: 6px;
}

.bar {
  height: 18px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  padding-left: 6px;
  color: #fff;
}

.bar.user {
  background: #294594;
}

.bar.dept {
  background: #94a3b8;
}

.kpi-empty,
.kpi-loading {
  font-size: 13px;
  color: #6b7280;
  padding: 12px;
  text-align: center;
}
.kpi-summary {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.kpi-summary .label {
  font-size: 12px;
  color: #6b7280;
}

.kpi-summary .value {
  font-size: 26px;
  font-weight: 900;
  color: #294594;
}

.kpi-summary .grade {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kpi-summary .badge {
  min-width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #fff;
}

.kpi-summary .grade.A .badge { background: #16a34a; }
.kpi-summary .grade.B .badge { background: #2563eb; }
.kpi-summary .grade.C .badge { background: #f59e0b; }
.kpi-summary .grade.D .badge { background: #dc2626; }

.kpi-summary .desc {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

</style>
