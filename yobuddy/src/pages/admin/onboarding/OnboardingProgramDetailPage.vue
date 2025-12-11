<template>
  <div class="page-container">
    <header class="page-top">
      <h1 class="page-title">온보딩 프로그램 상세</h1>
      <div class="actions">
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
            <!-- show a numeric badge when the date has trainings -->
            <div class="day-empty">
              <div
                v-if="countItemsForDateKey(slotProps) > 0 && !showSetScheduleModal"
                :class="['day-badge', (String(countItemsForDateKey(slotProps)).length === 1) ? 'single' : 'pill']"
                :style="badgeStyle(countItemsForDateKey(slotProps))">
                {{ countItemsForDateKey(slotProps) }}
              </div>
              <!-- debug: show plain count when debugging is enabled -->
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
            <select class="program-team">
              <option>개발팀</option>
            </select>
          </div>
        </div>

        <div class="program-grid">
          <div class="card chart-card">
            <div class="card-title">위험도 분포</div>
            <div class="card-body chart-placeholder">&nbsp;</div>
          </div>
          <div class="card chart-card">
            <div class="card-title">KPI 점수</div>
            <div class="card-body chart-placeholder">&nbsp;</div>
          </div>
          <div class="card list-card mentors-card">
            <div class="card-title">멘토 목록</div>
            <div class="card-body">
                <ul class="people-list">
                  <li v-if="mentorDisplayList.length === 0" class="empty">멘토 정보 없음</li>
                  <li v-else v-for="(mentor, i) in mentorDisplayList" :key="mentor.id || i">
                    <div class="person-row" @click="openUserDetail(mentor)">
                      <div class="avatar">{{ initials(mentor.name || mentor.label) }}</div>
                      <div class="meta">
                        <div class="name">{{ mentor.name || mentor.label }}</div>
                        <div class="email">{{ mentor.email || '' }}</div>
                      </div>
                      <div class="right">
                        <div class="dept">{{ mentor.department || '' }}</div>
                      </div>
                    </div>
                  </li>
                </ul>
            </div>
          </div>
          <div class="card list-card mentees-card">
            <div class="card-title">멘티 목록
              <button class="btn-add-mentee" @click="onAddMentee" title="멘티 추가">+</button>
            </div>
            <div class="card-body">
                <ul class="people-list">
                  <li v-if="menteeDisplayList.length === 0" class="empty">멘티 정보 없음</li>
                  <li v-else v-for="(mentee, i) in menteeDisplayList" :key="mentee.id || i">
                    <div class="person-row" @click="openUserDetail(mentee)">
                      <div class="avatar">{{ initials(mentee.name || mentee.label) }}</div>
                      <div class="meta">
                        <div class="name">{{ mentee.name || mentee.label }}</div>
                        <div class="email">{{ mentee.email || '' }}</div>
                      </div>
                      <div class="right">
                        <div class="dept">{{ mentee.department || '' }}</div>
                        <div class="join">{{ mentee.joinDate ? (String(mentee.joinDate)).slice(0,10) : '' }}</div>
                      </div>
                    </div>
                  </li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- simplified UI: no per-day modal; use schedule popup on date click -->
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

export default {
  name: 'OnboardingProgramDetailPage',
  components: { CalendarView, CalendarViewHeader, OnboardingSetschedulePopup, UserDetailpopup, OnboardingProgramAddUserPopup },
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
    }
  },
  computed: {
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
    dayItems() {
      // Return trainings and program-assigned tasks scheduled for the currently selected date.
      if (!this.selectedDate) return []
      const target = new Date(this.selectedDate)
      target.setHours(0,0,0,0)
      const trainingItems = (this.trainings || []).filter(t => {
        const sd = t.startDate ? new Date(t.startDate) : (t.scheduledAt ? new Date(t.scheduledAt) : null)
        if (!sd) return false
        sd.setHours(0,0,0,0)
        return sd.getTime() === target.getTime()
      }).map(t => {
        return {
          id: t.trainingId || t.id || t.training_id || `${t.title}-${t.startDate}`,
          title: t.title || t.name || t.trainingTitle || '일정',
          startDate: t.startDate || t.scheduledAt || t.scheduled_at || null,
          endDate: t.endDate || t.end || null,
          classes: (t.type ? [String(t.type).toLowerCase()] : []),
          kind: 'training'
        }
      })

      // programTasks are already normalized in fetchProgramTasks
      const taskItems = (this.programTasks || []).filter(p => {
        if (!p || !p.startDate) return false
        const sd = new Date(p.startDate)
        if (isNaN(sd.getTime())) return false
        sd.setHours(0,0,0,0)
        return sd.getTime() === target.getTime()
      }).map(p => ({ id: p.id, title: p.title || '과제', startDate: p.startDate, endDate: p.endDate, classes: p.classes || ['tesk'] }))

      // mark task kind
      const taskItemsMarked = taskItems.map(i => Object.assign({}, i, { kind: 'task' }))

      return [...trainingItems, ...taskItemsMarked]
    },
    // All items mapped per-date (used for custom rendering and popup)
    allDayItems() {
      // Build a normalized list of day items from trainings and program tasks
      const trainingItems = (this.trainings || []).map(t => ({
        id: t.trainingId || t.id || t.training_id || `${t.title}-${t.startDate}`,
        title: t.title || t.name || t.trainingTitle || '일정',
        startDate: t.startDate || t.scheduledAt || t.scheduled_at || null,
        endDate: t.endDate || t.end || null,
        classes: (t.type ? [String(t.type).toLowerCase()] : []),
        kind: 'training'
      }))
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
      // Intentionally return no items so calendar doesn't render pill UI.
      // We still use `allDayItems` and `trainings` for badges and the
      // right-side list; keeping the calendar visually simple per UX request.
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
    // date => count map computed from trainings/allDayItems to avoid repeated parsing
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
      // when modal opens, remove/hide any DOM-injected badges to avoid overlap
      try {
        if (val) {
          document.querySelectorAll('.day-badge-dom').forEach(n => n.remove())
        } else {
          // re-apply after modal closes (allow layout to settle)
          this.$nextTick(() => { try { this.applyDomBadges() } catch (e) { /* ignore */ } })
        }
      } catch (e) {
        // ignore
      }
    }
  },
  mounted() {
    console.log('[Onboarding] mounted - programId', this.programId)
    // ensure badges are applied when component first appears
    this.$nextTick(() => {
      try { this.applyDomBadges() } catch (e) { /* ignore */ }
    })
    
    // emit a global event so external listeners can react when this page mounts
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
    // re-apply badges on window resize (layout may change)
    window.addEventListener('resize', this.applyDomBadges)
    // Block calendar element from reacting to wheel/touch gestures that navigate by week
    try {
      // use a handler that prevents default and stops propagation; attach as non-passive so preventDefault works
      this._calendarWheelHandler = (e) => {
        try {
          if (e && typeof e.preventDefault === 'function') e.preventDefault()
        } catch (err) { /* ignore */ }
        try { if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation() } catch (err) { /* ignore */ }
      }
      const rootEl = this.$el && this.$el.querySelector && this.$el.querySelector('.calendar-wrapper')
      const innerEl = this.$el && this.$el.querySelector && this.$el.querySelector('.calendar-area ::v-deep .cv-wrapper')
      // attach to both wrapper and inner calendar if available
      if (rootEl) {
        rootEl.addEventListener('wheel', this._calendarWheelHandler, { capture: true, passive: false })
        rootEl.addEventListener('touchmove', this._calendarWheelHandler, { capture: true, passive: false })
      }
      // try to attach to cv-wrapper (library DOM) if present
      const cv = this.$el && this.$el.querySelector && (this.$el.querySelector('.cv-wrapper') || (innerEl && innerEl.parentElement))
      if (cv) {
        cv.addEventListener('wheel', this._calendarWheelHandler, { capture: true, passive: false })
        cv.addEventListener('touchmove', this._calendarWheelHandler, { capture: true, passive: false })
      }
      // overlay blocker (stronger) - if element injected in template exists, attach direct handlers
      // Note: do NOT attach pointer/pointerdown handlers to the visual overlay.
      // The overlay element exists only to positionally cover the calendar when
      // needed, but it must allow clicks to pass through so date selection still
      // works. We rely on root+document-level wheel/touchmove handlers to block
      // scroll-based week navigation instead.
      // also attach a document-level blocker to catch events the library may listen for elsewhere
      this._documentCalendarBlocker = (e) => {
        try {
          const path = e.composedPath ? e.composedPath() : (e.path || [])
          // if any element in the event path is inside our calendar-area, block
          const hit = Array.from(path || []).some(el => {
            try { return el && el.classList && (el.classList.contains && el.classList.contains('calendar-area') || el.classList.contains('cv-wrapper') || el.classList.contains('calendar-wrapper')) } catch (err) { return false }
          })
          if (!hit) {
            // fallback: check target.closest
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
      // overlay had no pointer handlers attached (clicks must be allowed through)
      if (this._documentCalendarBlocker) {
        document.removeEventListener('wheel', this._documentCalendarBlocker, { capture: true })
        document.removeEventListener('touchmove', this._documentCalendarBlocker, { capture: true })
      }
    } catch (err) {
      console.debug('[Onboarding] failed to remove calendar wheel blocker', err)
    }
  },
  methods: {
    initials(name) {
      if (!name) return ''
      const parts = String(name).split('')
      return parts.slice(0,2).join('')
    },
    formatItemTime(it) {
      try {
        const s = it.startDate ? new Date(it.startDate) : null
        const e = it.endDate ? new Date(it.endDate) : null
        if (!s) return ''
        // if start and end exist and both are midnight (00:00:00) or identical date-times, show date only
        const isMidnight = (d) => d && d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0
        if (e && s.getTime() === e.getTime()) {
          if (isMidnight(s)) return s.toLocaleDateString()
          return s.toLocaleTimeString()
        }
        if (e && isMidnight(s) && isMidnight(e)) {
          // multi-day/date range where both are dates (no times)
          return `${s.toLocaleDateString()} ~ ${e.toLocaleDateString()}`
        }
        if (!e) {
          if (isMidnight(s)) return s.toLocaleDateString()
          return s.toLocaleTimeString()
        }
        // default: show time range
        return `${s.toLocaleTimeString()} - ${e.toLocaleTimeString()}`
      } catch (e) {
        return ''
      }
    },
    // temporary debug helper: prints current lists and normalized dates to console
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
        // fetch trainings for this program
        this.fetchTrainings()
        this.fetchProgramTasks()
        // fetch enrollments (mentors & mentees)
        this.fetchEnrollments()
        // fetch program-scoped task mappings and enrich them
        // debug log
        console.log('[Onboarding] program loaded', this.program)
        console.log('[Onboarding] calendarItems after program load', this.calendarItems)
        console.log('[Onboarding] allDayItems after program load', this.allDayItems)
      } catch (e) {
        console.error('프로그램 조회 실패', e)
        this.program = null
      }
    },
    async fetchTrainings() {
      if (!this.programId) return
      try {
        const resp = await http.get(`/api/v1/admin/programs/${this.programId}/trainings`)
        // Debug: inspect raw response shape to ensure we pick the right field
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
        // ensure DOM badges reflect loaded trainings (in case slot isn't invoked)
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
        // Support multiple response shapes: body.data.tasks, body.tasks, body.tasksList, body.data
        const mappings = (body && (body.data && Array.isArray(body.data.tasks) ? body.data.tasks : (Array.isArray(body.tasks) ? body.tasks : (Array.isArray(body.data) ? body.data : [])))) || []
        // normalize mappings: ensure array of objects with taskId and dueDate
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
        // enrich details
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
              // normalize YYYY-MM-DD to YYYY-MM-DDT00:00:00 to avoid Safari/older browser parsing issues
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
            // fallback to mapping-only item
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
        // ensure calendar badges are refreshed after programTasks load
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
        // filter out withdrawn enrollments for display/processing
        const activeEnrollments = (items || []).filter(en => {
          try {
            const status = (en.enrollmentStatus || en.status || en.enrollment_status || (en.user && (en.user.enrollmentStatus || en.user.status)) || '').toString().toUpperCase()
            return status !== 'WITHDRAWN'
          } catch (e) {
            return true
          }
        })
        if (this.showDebug) console.log('[Onboarding] enrollments parsed', { count: items.length, sample: items.slice(0,3) })
        // populate a quick fallback list so UI shows immediately (labels are userId until user detail resolves)
        try {
          const quick = (activeEnrollments || []).map(en => {
            const uid = this.extractEnrollmentUserId(en)
            return this.buildPersonFromData({ userId: uid, id: uid }, `#${uid}`)
          }).filter(Boolean)
          // by default enrollments are mentees for onboarding programs
          this.mentorProfiles = []
          this.menteeProfiles = quick
        } catch (e) {
          // ignore
        }
        // then enrich with real user data where possible
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
          // fallback to mentee when role undefined
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
      // try common user fields
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
      return { id, label, name, email, phone, role, roleLabel, department, joinDate, meta: value }
    },
    normalizeProgramPeople(list) {
      if (!Array.isArray(list) || !list.length) return []
      return list.map(item => this.buildPersonFromData(item)).filter(Boolean)
    },
    openUserDetail(user) {
      if (!user) return
      // ensure we pass the raw meta object if available for the detail popup
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
      // avoid duplicates
      const exists = (this.menteeProfiles || []).some(p => String(p.id) === String(person.id) || (p.meta && String(p.meta.id) === String(person.id)))
      if (exists) {
        window.alert('이미 멘티 목록에 존재합니다.')
        return
      }
      this.menteeProfiles = Array.isArray(this.menteeProfiles) ? [...this.menteeProfiles, person] : [person]
      // persist single add to server
      const uid = person.id || (person.meta && person.meta.id)
      if (uid) {
        try {
          try {
            await http.post(`/api/v1/admin/programs/${this.programId}/enrollments`, [uid])
          } catch (err) {
            // fallback to wrapped payload
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
      // filter out already-enrolled users from `added` by comparing to current enrollments' userId
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
        // POST added userIds (try plain array, then wrapped)
        if (added.length) {
          try {
            await http.post(`/api/v1/admin/programs/${this.programId}/enrollments`, added)
          } catch (err) {
            try {
              await http.post(`/api/v1/admin/programs/${this.programId}/enrollments`, { userIds: added })
            } catch (err2) {
              // if server complains that some users already enrolled, ignore and continue
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

        // For removals, backend expects enrollmentId (not userId). Map userId -> enrollmentId from this.enrollments
        if (removed.length) {
          const enrollmentIds = (removed || []).map(uid => {
            const en = (this.enrollments || []).find(e => String(this.extractEnrollmentUserId(e)) === String(uid))
            if (!en) return null
            return en.id || en.enrollmentId || en.enrollment_id || (en.enrollment && (en.enrollment.id || en.enrollment.enrollmentId)) || null
          }).filter(Boolean)
          const missingCount = removed.length - enrollmentIds.length
          if (missingCount > 0) {
            console.warn('[Onboarding] some removals could not be mapped to enrollmentId', { removed, enrollmentIds })
            // inform user but continue with mapped deletions
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
      // merge updates into mentor/mentee lists where applicable
      const merge = (arr) => arr.map(p => {
        if (!p) return p
        if (String(p.id) === String(updated.id) || (p.meta && String(p.meta.id) === String(updated.id))) {
          return this.buildPersonFromData(updated)
        }
        return p
      })
      this.mentorProfiles = merge(this.mentorProfiles || [])
      this.menteeProfiles = merge(this.menteeProfiles || [])
      // also close modal
      this.showUserDetail = false
      this.selectedUser = null
    },
    setShowDate(d) {
      if (d) this.internalShowDate = new Date(d)
    },
    onCalendarDateClick(d) {
      this.selectedDate = d ? new Date(d) : null
      // popup open on date click
      console.log('date clicked', this.selectedDate)
      try { this.dumpDebugState && this.dumpDebugState('onCalendarDateClick') } catch(e){ console.debug('[Onboarding] dumpDebugState error', e) }
    },
    countItemsForDate(d) {
      // Accept various input shapes: Date/string or slot object
      if (!d) return 0
      // extract date value if d is an object
      let candidate = d
      if (typeof d === 'object') {
        candidate = d.date || d.day || d.value || d.raw || d.dateObj || d
      }
      const target = new Date(candidate)
      if (isNaN(target.getTime())) return 0
      target.setHours(0,0,0,0)

      // Debug: log incoming candidate and trainings length to help trace why badge isn't shown
      if (this.showDebug) {
        try {
          // limit output size
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
    // New: use precomputed dateCountMap for more reliable badge counts
    countItemsForDateKey(slotProps) {
      if (!slotProps) return 0
      // extract candidate like earlier helper
      let candidate = slotProps
      if (typeof slotProps === 'object') {
        candidate = slotProps.date || slotProps.day || slotProps.value || slotProps.raw || slotProps.dateObj || slotProps
      }
      // compute target key
      const toKey = (d) => {
        if (!d) return null
        try {
          // If it's a Date object, use its components
          if (d instanceof Date) {
            const dt = new Date(d.getTime())
            dt.setHours(0,0,0,0)
            return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
          }
          const s = String(d)
          // If the string contains an ISO-like date, extract YYYY-MM-DD directly to avoid timezone parsing issues
          const m = s.match(/(\d{4}-\d{2}-\d{2})/)
          if (m && m[1]) return m[1]
          // fallback: attempt Date parse (less reliable across browsers)
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
      // compute by scanning allDayItems (trainings + tasks) with tolerant date parsing
      let cnt = 0
      try {
        const items = this.allDayItems || []
        for (let i = 0; i < items.length; i++) {
          try {
            const it = items[i]
            // consider multiple possible date sources including enriched detail and mapping due dates
            const cand = it.startDate || it.scheduledAt || it.scheduled_at || (it.meta && it.meta.detail && (it.meta.detail.startDate || it.meta.detail.scheduledAt || it.meta.detail.scheduled_at || it.meta.detail.dueDate || it.meta.detail.due_date)) || (it.meta && it.meta.mapping && (it.meta.mapping.dueDate || it.meta.mapping.due_date)) || null
            const k = toKey(cand)
            if (k === targetKey) cnt += 1
          } catch (e) { /* ignore item parse error */ }
        }
      } catch (e) {
        if (this.showDebug) console.debug('[Onboarding] countItemsForDateKey scan failed', e)
      }
      // Quick override (user option 2): if this slot's date equals the currently selectedDate,
      // use the right-side `dayItems` length so badge matches the list the user sees.
      try {
        if (this.selectedDate) {
          const selKey = toKey(this.selectedDate)
          if (selKey && selKey === targetKey) {
            // ensure dayItems is available and use its length
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

      // If this appears to be a training, merge into trainings list
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

      // If this looks like a task/assignment (no trainingId, but has task id), try to enrich immediately into programTasks
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

      // refresh program tasks as a safety net (server-side mapping list may differ)
      this.fetchProgramTasks()
    },
    onTrainingRemoved(payload) {
      // payload: { trainingId }
      const tid = payload && (payload.trainingId || payload.id)
      if (!tid) return
      // remove locally if present
      this.trainings = (this.trainings || []).filter(t => {
        const id = t.trainingId || t.id || t.training_id
        return String(id) !== String(tid)
      })
      // refresh from server to ensure consistency
      this.fetchTrainings()
      // refresh program task mappings as well
      this.fetchProgramTasks()
    },
    openDateModal(d) {
      this.selectedDate = d ? new Date(d) : null
      if (this.selectedDate) this.showSetScheduleModal = true
    },
    getDayPills(date) {
      // Use allDayItems (computed) to ensure items are available once trainings/program load
      if (!date || !this.program) return []
      const items = []
      const dStr = new Date(date).toDateString()
      const idBase = this.program.programId || this.program.id || 'prog'

      // Program Start/End pills and trainings are already represented in allDayItems
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
      // return inline style object for slot-rendered badges
      const text = String(count || '')
      if (text.length === 1) {
        return {
          position: 'absolute', right: '6px', top: '6px', zIndex: '2147483647', background: '#ff3b30', color: '#fff', fontSize: '12px', pointerEvents: 'none', width: '24px', height: '24px', lineHeight: '24px', padding: '0px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxSizing: 'border-box'
        }
      }
      return {
        position: 'absolute', right: '6px', top: '6px', zIndex: '2147483647', background: '#ff3b30', color: '#fff', fontSize: '12px', pointerEvents: 'none', minWidth: '24px', height: '24px', lineHeight: '24px', padding: '0 6px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxSizing: 'border-box'
      }
    },
    // Inject badges into calendar day DOM elements as a fallback
    applyDomBadges() {
      // if the schedule modal is open, do not render/inject badges
      if (this.showSetScheduleModal) {
        // ensure any previously injected badges are removed
        try { document.querySelectorAll('.day-badge-dom').forEach(n => n.remove()) } catch (e) { /* ignore */ }
        return
      }
      const map = this.dateCountMap || {}
      // remove existing dom badges
      document.querySelectorAll('.day-badge-dom').forEach(n => n.remove())
      // find calendar day cells
      const cells = document.querySelectorAll('.calendar-area .cv-day')
      if (!cells || !cells.length) return

      // try to read current header month/year (various formats)
      let headerText = ''
      try {
        const headerEl = document.querySelector('.calendar-area .cv-header .periodLabel') || document.querySelector('.calendar-area .cv-header')
        if (headerEl) headerText = headerEl.textContent && headerEl.textContent.trim()
      } catch (e) { headerText = '' }

      // parse year and month from header if possible
      let headerYear = null, headerMonth = null
      if (headerText) {
        // try YYYY first
        const yMatch = headerText.match(/(\d{4})/)
        if (yMatch) headerYear = parseInt(yMatch[1], 10)
        // try Korean '10월 2025' or '2025년 10월' or english 'October 2025'
        const mMatch = headerText.match(/(\d{1,2})\s*월/) || headerText.match(/(\d{1,2})\s*(?=\D*$)/) || headerText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i)
        if (mMatch) {
          if (mMatch[1] && /\D/.test(mMatch[1])) {
            // month name
            const names = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12 }
            headerMonth = names[mMatch[1].toLowerCase()] || null
          } else {
            headerMonth = parseInt(mMatch[1], 10)
          }
        }
      }

      cells.forEach(cell => {
        try {
          // prefer explicit data-date attribute if provided by calendar
          let dateAttr = cell.getAttribute('data-date') || cell.dataset && cell.dataset.date
          let dayNum = null
          const numEl = cell.querySelector('.cv-day-number') || cell.querySelector('.cv-day-num')
          if (numEl) dayNum = numEl.textContent && numEl.textContent.trim()

          // determine year/month/day
          let yyyy=null, mm=null, dd=null
          if (dateAttr) {
            const d = new Date(dateAttr)
            if (!isNaN(d.getTime())) {
              yyyy = d.getFullYear(); mm = d.getMonth()+1; dd = d.getDate()
            }
          }
          if (!yyyy && dayNum && headerYear && headerMonth) {
            // check if cell belongs to previous/next month by presence of 'outside' class
            const txt = String(dayNum).replace(/[^0-9]/g,'')
            dd = parseInt(txt,10)
            yyyy = headerYear
            mm = headerMonth
            const cls = (cell.className || '')
            // heuristics: if cell is marked as outside (common class names), adjust month
            if (/outside|cv-day--outside|cv-day-outside|other-month/i.test(cls)) {
              // if day number > 10 likely previous month, else next month — approximate
              if (dd > 15) {
                // previous month
                mm = mm - 1
                if (mm < 1) { mm = 12; yyyy = yyyy - 1 }
              } else {
                // next month
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
            // strong inline styles to force correct circle/pill regardless of scoped CSS
            if (text.length === 1) {
              Object.assign(badge.style, {
                position: 'absolute', right: '6px', top: '6px', zIndex: '2147483647', background: '#ff3b30', color: '#fff', fontSize: '12px', pointerEvents: 'none', width: '24px', height: '24px', lineHeight: '24px', padding: '0', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxSizing: 'border-box'
              })
            } else {
              Object.assign(badge.style, {
                position: 'absolute', right: '6px', top: '6px', zIndex: '2147483647', background: '#ff3b30', color: '#fff', fontSize: '12px', pointerEvents: 'none', minWidth: '24px', height: '24px', lineHeight: '24px', padding: '0 6px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff', boxSizing: 'border-box'
              })
            }
            // ensure cell positioned
            if (!cell.style.position) cell.style.position = 'relative'
            cell.appendChild(badge)
          }
        } catch (e) {
          // ignore per-cell errors
        }
      })
    },
    // No per-day modal handlers — simplified UI uses OnboardingSetschedulePopup on date click
  }
}
</script>

<style scoped>
.page-container { padding: 20px }
.page-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px }
.page-title { font-size:24px; font-weight:700;}
.program-info { text-align:center; margin-bottom:14px;  }
.calendar-area { max-width:1100px; margin:0; width: 70%; background: #fff; padding: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1) }
.calendar-wrapper { max-height: 540px; overflow: hidden; }
.calendar-wrapper { position: relative; }
.calendar-blocker { position: absolute; inset: 0; z-index: 9999; background: transparent; pointer-events: none; }
.btn-outline { background: transparent; border: 1px solid #d0d7e2; padding: 8px 14px; border-radius: 8px }

/* Adopt modal calendar styles but target the page's calendar area */
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

/* Hide the 'current period' (today/current date) button in the header inside the page calendar */
.calendar-area ::v-deep .cv-header .currentPeriod {
  display: none !important;
  margin-left: 50px;
}

/* Remove/hide current date (today) highlighting completely inside the page calendar */
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
  position: relative !important; /* allow badge absolute positioning (fixed invalid 'block' value) */
  flex: 1 1 0 !important;
  min-height: 80px !important;
  height: 88px !important;
  box-sizing: border-box !important;
  padding: 6px !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
}
/* ensure calendar day is positioned for absolute badges */
.calendar-area ::v-deep .cv-day { position: relative !important }
/* simplified day indicator (no pill UI) */
.day-simple { flex: 1; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 8px }
.day-indicator { width: 10px; height: 10px; border-radius: 50%; background: #294594; box-shadow: 0 1px 0 rgba(255,255,255,0.25) inset }

/* ensure our day-empty cell centers the indicator at bottom */
.day-empty { width:100%; height:100%; display:flex; align-items:flex-end; justify-content:center; padding-bottom:8px }
.day-empty .day-indicator { width:10px; height:10px; border-radius:50%; background:#294594 }
/* debug count in cell */
.dbg-count { position: absolute; left: 6px; bottom: 6px; color: #c53030; font-weight:700; font-size:12px; z-index:100000 !important }

/* small badge near the top-right of the day cell showing count */
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
  z-index: 2147483647 !important; /* max z-index to ensure visibility */
  border: 1px solid #fff !important; /* white border to separate from colored cells */
  box-shadow: 0 1px 4px rgba(0,0,0,0.12) !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transform: translateY(0) !important;
}
/* single-digit -> perfect circle */
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

/* multi-digit -> pill */
.day-badge.pill {
  min-width: 24px !important;
  padding: 0 6px !important;
  border-radius: 999px !important;
}
/* Show only start/end pill blocks; hide all other cv-item blocks (including duration) */
.calendar-area ::v-deep .cv-item.program-duration { display: none !important }

/* Highlight day cells within the program period */
::v-deep .cv-day.program-date {
  background-color: rgba(41, 69, 148, 0.12);
}

/* Styles for additional cv-item types: tesk (task?) and training */
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

/* Multi-day visible bar for trainings */
.calendar-area ::v-deep .cv-item.training-duration {
  background-color: rgba(0, 123, 255, 0.12) !important;
  border: 1px solid rgba(0, 123, 255, 0.18) !important;
  color: #00366b !important;
  height: 1.6em !important;
  top: 28px !important;
  border-radius: 6px !important;
  z-index: 0 !important;
}

/* Ensure pills (single-day items) appear above duration bars */
.calendar-area ::v-deep .cv-item.training,
.calendar-area ::v-deep .cv-item.program-start-item,
.calendar-area ::v-deep .cv-item.program-end-item {
  z-index: 2 !important;
}

/* stronger highlight for start/end dates */
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

.modal-top {
  text-align: center;
  position: relative;
  margin-bottom: 20px;
}
.modal-title { font-size: 31px; font-weight: bold }

/* close button in header */
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
.cv-day .day-scroll-area { display: none } /* legacy selector - hide */

  .calendar-area .calendar-wrapper { touch-action: auto } /* allow touch swipe scrolling inside calendar wrapper */

/* Two-column layout: calendar + right-side list */
.calendar-and-list { display: flex; gap: 18px; align-items: stretch; margin-bottom: 16px }
.calendar-area { width: 65%; display: flex; flex-direction: column; }
.calendar-area .calendar-wrapper { flex: 1 1 auto; display: flex; flex-direction: column; }
.day-list { width: 35%; background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 6px 24px rgba(41,69,148,0.06); box-sizing: border-box; display: flex; flex-direction: column; }
.list-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px }
.list-header h3 { margin:0; font-size:22px; color:#12263f }
.selected-date { font-weight:800; color:#294594; font-size:20px }
.header-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px }
.add-btn { align-self:flex-end }
.list-body { /* let the list-body fill remaining space and scroll independently */
  flex: 1 1 auto;
  max-height: none;
  overflow: auto;
}
.day-items { list-style:none; padding:0; margin:12px 0 0 0 }
.day-item { padding:14px 10px; border-bottom:1px solid #eef3fb; display:flex; align-items:flex-start; justify-content:space-between; gap:12px }
.day-item .left { display:flex; flex-direction:column; align-items:flex-start; gap:6px; flex:1; min-width:0 }
.day-item .title { font-weight:800; font-size:18px; color:#0f1724; line-height:1.25; word-break:break-word; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.day-item .meta { font-size:13px; color:#6b7280; white-space:normal }
.day-item .actions { margin-left:12px; flex:0 0 auto }
.day-list .empty { color:#6b7280; padding:12px }

/* Small button variant used inside the side panel */
.btn-small { padding:6px 10px; font-size:13px; border-radius:8px }
.btn-outline.btn-small { background: transparent; border: 1px solid #e2e8f0; color: #1f2937 }
.btn-outline.btn-small:hover { background: rgba(41,69,148,0.04) }

.program-info {
  /* make the bottom program-info stretch full width of the page container
     compensate for the .page-container padding (20px) so the frame appears
     edge-to-edge inside the page area */
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
.program-team { padding:6px 10px; border-radius:8px; border:1px solid #e6eef8; background:#fff }

.program-grid { display:grid; grid-template-columns: 1fr 1fr; gap:18px }
.card { background:#fbfdff; border:1px solid #eef3fb; border-radius:10px; padding:14px; box-sizing:border-box; min-height:150px }
.card-title { font-weight:700; color:#18335a; margin-bottom:10px }
.card-body { background:transparent }
.chart-placeholder { height:110px; border-radius:8px; background:linear-gradient(180deg,#ffffff,#fbfdff); border:1px dashed rgba(41,69,148,0.06) }
.people-list { list-style:none; padding:0; margin:0 }
.people-list li { padding:8px 0; border-bottom:1px dashed #eef3fb }
.people-list li.empty { color:#6b7280; padding:10px 0 }

/* Make mentee list compact and scrollable */
.mentees-card .card-body { max-height: 240px; overflow: auto; padding-right: 8px }
.mentees-card .people-list li { padding:8px 6px }
.mentors-card .card-body { max-height: 320px; overflow: auto; padding-right: 8px }

/* person row used for mentor/mentee compact view */
.person-row { display:flex; align-items:center; gap:25px; margin-bottom:12px }
.person-row .avatar { width:40px; height:40px; border-radius:50%; background:#e6eef8; display:flex; align-items:center; justify-content:center; font-weight:700; color:#294594 }
.person-row .meta { flex:1; min-width:0 }
.person-row .meta .name { font-weight:800; color:#0f1724 }
.person-row .meta .email { font-size:13px; color:#6b7280 }
.person-row .right { display:flex; flex-direction:column; align-items:flex-end; gap:4px }
.person-row .right .dept { font-size:13px; color:#44546a }
.person-row .right .join { font-size:12px; color:#94a3b8 }
/* Hover highlight for person rows */
.person-row { transition: all 140ms ease; border-radius:6px; }
.person-row:hover { background: rgba(41,69,148,0.04); cursor: pointer; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(3,10,18,0.04); }
.person-row:active { transform: translateY(0); }

/* Lightweight tooltip container (optional content can be injected) */
.person-row .tooltip { display:none; position:absolute; transform:translateY(-8px); background:#fff; border:1px solid rgba(16,36,59,0.06); padding:8px 10px; border-radius:8px; box-shadow:0 8px 30px rgba(3,10,18,0.06); font-size:13px; color:#10243b; white-space:nowrap; z-index:1200 }
.person-row:hover .tooltip { display:block }

/* small circular add button shown on the mentee card title */
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
</style>
