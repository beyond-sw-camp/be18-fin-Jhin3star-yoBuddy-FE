<template>
  <transition name="fade">
    <div v-if="visible" class="set-overlay" @click.self="close">
      <div class="set-modal">
        <header class="modal-top">
          <div class="modal-title">일정 등록 / 확인</div>
          <div class="modal-date">{{ formattedDateISO }}</div>
          <button class="modal-close-btn" @click="close" aria-label="닫기">✕</button>
        </header>

        <!-- Two column layout: left = schedules for selected date, right = trainings from API -->
        <div class="set-grid">
          <section class="left">
            <h4>해당 날짜 일정</h4>
            <div v-if="!(visibleDayItems && visibleDayItems.length) && !(selectedTrainings && selectedTrainings.length)" class="empty">해당 날짜에 일정이 없습니다.</div>
            <ul class="item-list">
              <!-- user-selected trainings for this date (not yet saved) -->
              <li v-for="(it, idx) in selectedTrainings" :key="`sel-${it.trainingId||it.id||idx}`" class="item-row">
                <div class="selected-row">
                  <div class="selected-left">
                    <div class="item-title">
                      {{ it.title }}
                      <span class="training-type">{{ formatTrainingType(it) }}</span>
                      <button class="btn-outline btn-small selected-inline-btn" @click="removeSelectedTraining(it)">취소</button>
                    </div>
                    <div class="item-time">{{ formatItemTime(it) }}</div>
                    <div class="dt-controls">
                      <label>날짜 <input type="date" v-model="it._editDate" @change="updateTrainingDateTime(it)" /></label>
                      <label>시작 <input type="time" v-model="it._startTime" @change="updateTrainingDateTime(it)" /></label>
                      <label>종료 <input type="time" v-model="it._endTime" @change="updateTrainingDateTime(it)" /></label>
                    </div>
                  </div>
                </div>
              </li>
              <!-- existing items from parent (visibleDayItems) -->
              <li v-for="(it, idx) in visibleDayItems" :key="it.id || idx" class="item-row">
                <div class="item-left">
                  <div class="item-title">{{ it.title }}</div>
                  <div class="item-time">{{ formatItemTime(it) }}</div>
                </div>
                <div class="item-actions">
                  <button class="btn-outline btn-small" @click="confirmAndDelete(it)">삭제</button>
                </div>
              </li>
            </ul>
          </section>

          <section class="right">
            <div class="right-tabs">
              <button :class="['tab', { active: activeRightTab === 'training' }]" @click="activeRightTab = 'training'">트레이닝</button>
              <button :class="['tab', { active: activeRightTab === 'assignment' }]" @click="activeRightTab = 'assignment'">과제</button>
            </div>

            <div v-if="activeRightTab === 'training'">
              <h4>트레이닝 목록</h4>
              <div v-if="loadingTrainings">로딩 중...</div>
              <div v-else>
                <ul class="training-list">
                  <li v-for="(t, i) in availableTrainings" :key="t.trainingId || t.id || i" class="training-row">
                    <div class="training-left">
                      <div>
                        <span class="training-title">{{ t.title || t.name || t.trainingTitle || t.trainingName }}</span>
                        <span class="training-type">{{ formatTrainingType(t) }}</span>
                      </div>
                      <div class="training-meta">{{ formatTrainingDates(t) }}</div>
                    </div>
                    <div class="training-actions">
                      <button class="btn-add" @click="addTrainingToDate(t)">추가</button>
                    </div>
                  </li>
                  <li v-if="availableTrainings.length === 0" class="empty">표시할 트레이닝이 없습니다.</li>
                </ul>
              </div>
            </div>

            <div v-else>
              <h4>과제 목록</h4>
              <div v-if="loadingAssignments">로딩 중...</div>
              <div v-else>
                <ul class="training-list">
                  <li v-for="(a, i) in availableAssignments" :key="a.assignmentId || a.id || i" class="training-row">
                    <div class="training-left">
                      <div>
                        <span class="training-title">{{ a.title || a.name || a.subject }}</span>
                        <span class="training-type">{{ a.type || '' }}</span>
                      </div>
                      <div class="training-meta">{{ formatTrainingDates(a) }}</div>
                    </div>
                    <div class="training-actions">
                      <button class="btn-add" @click="addAssignmentToDate(a)">추가</button>
                    </div>
                  </li>
                  <li v-if="availableAssignments.length === 0" class="empty">표시할 과제가 없습니다.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div class="set-body">
          <p><strong>선택한 날짜:</strong> {{ formattedDate }}</p>
        </div>

        <footer class="modal-actions">
          <button class="btn-outline" @click="close">취소</button>
          <button class="btn-primary" @click="save">저장</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import http from '@/services/http'

export default {
  name: 'OnboardingSetschedulePopup',
  props: {
    visible: { type: Boolean, default: false },
    date: { default: null },
    dayItems: { type: Array, default: () => [] },
    programId: { type: [String, Number], default: null },
  },
  emits: ['close', 'save', 'training-assigned', 'training-removed'],
  data() {
    return {
      title: '',
      description: '',
      trainings: [],
      assignments: [],
      loadingTrainings: false,
      loadingAssignments: false,
      activeRightTab: 'training',
      selectedTrainings: [],
    }
  },
  watch: {
    visible(val) {
      if (val) { this.loadTrainings(); this.loadAssignments() }
      console.log('[OnboardingPopup] visible ->', val, 'date:', this.date)
      // also log incoming visibleDayItems for quick debug
      console.log('[OnboardingPopup] visibleDayItems ->', this.visibleDayItems)
    }
  },
  computed: {
    formattedDate() {
      if (!this.date) return '—'
      const d = new Date(this.date)
      return d.toLocaleDateString()
    },
    formattedDateISO() {
      if (!this.date) return '—'
      const d = new Date(this.date)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    },
    // visibleDayItems: filter out duration / multi-day items (e.g. those with class 'training-duration')
    visibleDayItems() {
      if (!this.dayItems) return []
      return this.dayItems.filter(it => {
        if (!it) return false
        // if classes present and contains 'training-duration', exclude
        if (Array.isArray(it.classes) && it.classes.includes('training-duration')) return false
        // also exclude any item whose id suggests it's a duration
        if (typeof it.id === 'string' && it.id.includes('duration')) return false
        return true
      })
    }
    ,
    availableTrainings() {
      // Exclude trainings that are already present in visibleDayItems or already selected locally
      const assignedIds = new Set((this.visibleDayItems || []).map(it => (it.id != null ? String(it.id) : null)).filter(Boolean))
      const assignedTitles = new Set((this.visibleDayItems || []).map(it => (it.title || '').toString()).filter(Boolean))
      return (this.trainings || []).filter(t => {
        const tid = t.trainingId || t.id || t.training_id
        if (tid && assignedIds.has(String(tid))) return false
        const title = (t.title || t.name || t.trainingTitle || t.trainingName || '').toString()
        if (title && assignedTitles.has(title)) return false
        // also exclude trainings already added to selectedTrainings
        const alreadySelected = this.selectedTrainings.some(s => (s.trainingId || s.id) && (s.trainingId || s.id) === (t.trainingId || t.id))
        if (alreadySelected) return false
        return true
      })
    },
    availableAssignments() {
      const assignedIds = new Set((this.visibleDayItems || []).map(it => (it.id != null ? String(it.id) : null)).filter(Boolean))
      const assignedTitles = new Set((this.visibleDayItems || []).map(it => (it.title || '').toString()).filter(Boolean))
      return (this.assignments || []).filter(a => {
        const aid = a.assignmentId || a.id || a.assignment_id
        if (aid && assignedIds.has(String(aid))) return false
        const title = (a.title || a.name || a.subject || '').toString()
        if (title && assignedTitles.has(title)) return false
        const alreadySelected = this.selectedTrainings.some(s => (s.assignmentId || s.id) && (s.assignmentId || s.id) === (a.assignmentId || a.id))
        if (alreadySelected) return false
        return true
      })
    }
  },
  methods: {
    // return local date part (YYYY-MM-DD) for a Date or parsable date string
    getLocalDatePart(d) {
      if (!d) return null
      const dt = new Date(d)
      if (isNaN(dt.getTime())) return null
      const yyyy = dt.getFullYear()
      const mm = String(dt.getMonth() + 1).padStart(2, '0')
      const dd = String(dt.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    },
    close() {
      this.$emit('close')
    },
    async confirmAndDelete(item) {
      if (!item) return
      const ok = window.confirm('이 일정을 삭제하시겠습니까?')
      if (!ok) return
      await this.deleteAssignedTraining(item)
    },
    async deleteAssignedTraining(item) {
      // determine whether this is an assignment or a training
      const aid = item.assignmentId || item.id || item.assignment_id
      const tid = item.trainingId || item.id || item.training_id
      if (aid && this.programId) {
        try {
          await http.delete(`/api/v1/admin/programs/${this.programId}/assignments/${aid}`)
          this.$emit('training-removed', { assignmentId: aid })
          return
        } catch (e) {
          console.error('과제 삭제 실패', e)
          alert('삭제에 실패했습니다.')
          return
        }
      }
      if (tid && this.programId) {
        try {
          await http.delete(`/api/v1/admin/programs/${this.programId}/trainings/${tid}`)
          // notify parent to refresh
          this.$emit('training-removed', { trainingId: tid })
        } catch (e) {
          console.error('트레이닝 삭제 실패', e)
          alert('삭제에 실패했습니다.')
        }
      } else {
        console.warn('삭제할 training/assignment id 또는 programId가 없습니다.', item)
      }
    },
    isSelected(training) {
      const tid = training.trainingId || training.id
      return this.selectedTrainings.some(t => (t.trainingId || t.id) === tid)
    },
    async loadTrainings() {
      this.loadingTrainings = true
      try {
        const resp = await http.get('/api/v1/admin/trainings')
        // normalize response: http wrapper may already return resp.data or raw body
        const body = resp?.data ?? resp
        // expected server shape: { content: [ ... ], pageable: { ... }, ... }
        if (Array.isArray(body)) {
          this.trainings = body
        } else if (Array.isArray(body.content)) {
          this.trainings = body.content
        } else if (Array.isArray(body.items)) {
          this.trainings = body.items
        } else {
          this.trainings = []
        }
      } catch (e) {
        console.error('트레이닝 목록 로드 실패', e)
        this.trainings = []
      } finally {
        this.loadingTrainings = false
      }
    },

    async loadAssignments() {
      this.loadingAssignments = true
      try {
        const resp = await http.get('/api/v1/admin/tasks')
        const body = resp?.data ?? resp
        if (Array.isArray(body)) {
          this.assignments = body
        } else if (Array.isArray(body.content)) {
          this.assignments = body.content
        } else if (Array.isArray(body.items)) {
          this.assignments = body.items
        } else {
          this.assignments = []
        }
      } catch (e) {
        console.error('과제 목록 로드 실패', e)
        this.assignments = []
      } finally {
        this.loadingAssignments = false
      }
    },

    addTrainingToDate(training) {
      // Do NOT call server here. Move training to local selected list for this date.
      const tid = training.trainingId || training.id
      const exists = this.selectedTrainings.some(t => (t.trainingId || t.id) === tid)
      if (exists) return
      const copy = Object.assign({}, training)
      // prepare editable fields for date/time
      const yyyy = this.getLocalDatePart(this.date)
      copy._editDate = yyyy
      // default times
      copy._startTime = '12:00'
      copy._endTime = '13:00'
      copy.startDate = this.combineDateTime(yyyy, copy._startTime)
      copy.endDate = this.combineDateTime(yyyy, copy._endTime)
      this.selectedTrainings.push(copy)
    },

    addAssignmentToDate(assignment) {
      const aid = assignment.assignmentId || assignment.id
      const exists = this.selectedTrainings.some(t => (t.assignmentId || t.id) === aid)
      if (exists) return
      const copy = Object.assign({}, assignment)
      copy._isAssignment = true
      const yyyy = this.getLocalDatePart(this.date)
      copy._editDate = yyyy
      copy._startTime = '12:00'
      copy._endTime = '13:00'
      copy.startDate = this.combineDateTime(yyyy, copy._startTime)
      copy.endDate = this.combineDateTime(yyyy, copy._endTime)
      this.selectedTrainings.push(copy)
    },

    removeSelectedTraining(training) {
      const id = training.trainingId || training.assignmentId || training.id
      this.selectedTrainings = this.selectedTrainings.filter(t => {
        const tid = t.trainingId || t.assignmentId || t.id
        return tid !== id
      })
    },
    combineDateTime(dateStr, timeStr) {
      if (!dateStr) return null
      // ensure timeStr like HH:MM
      const time = (timeStr && timeStr.length === 5) ? timeStr : '00:00'
      // create ISO-like string
      const iso = `${dateStr}T${time}:00`
      // return as ISO string (UTC) for UI/calendar usage
      try { return new Date(iso).toISOString() } catch (e) { return iso }
    },

    // Build a LocalDateTime string without timezone for backend LocalDateTime (YYYY-MM-DDTHH:mm:ss)
    combineLocalDateTime(dateStr, timeStr) {
      if (!dateStr) return null
      const time = (timeStr && timeStr.length === 5) ? timeStr : '00:00'
      return `${dateStr}T${time}:00`
    },

    updateTrainingDateTime(training) {
      const d = training._editDate || this.getLocalDatePart(this.date)
      const st = training._startTime || '12:00'
      const et = training._endTime || st
      training.startDate = this.combineDateTime(d, st)
      training.endDate = this.combineDateTime(d, et)
    },
    formatItemTime(it) {
      try {
        const s = it.startDate ? new Date(it.startDate) : null
        const e = it.endDate ? new Date(it.endDate) : null
        if (!s) return ''
        if (!e || s.getTime() === e.getTime()) return s.toLocaleTimeString()
        return `${s.toLocaleTimeString()} - ${e.toLocaleTimeString()}`
      } catch (e) {
        return ''
      }
    },
    formatTrainingDates(t) {
      const sd = t.startDate || t.date || t.trainingDate || t.trainingStart
      const ed = t.endDate || t.end || sd
      if (!sd) return '기간 정보 없음'
      const s = new Date(sd)
      const e = ed ? new Date(ed) : null
      return e ? `${s.toLocaleDateString()} ~ ${e.toLocaleDateString()}` : s.toLocaleDateString()
    },
    formatTrainingType(t) {
      const type = (t && (t.type || t.trainingType || t.training_type) || '').toString().toUpperCase()
      if (!type) return ''
      if (type === 'ONLINE') return '(온라인)'
      if (type === 'OFFLINE') return '(오프라인)'
      // fallback for other values
      return `(${type.toLowerCase()})`
    },
    save() {
      // On save, assign selectedTrainings to program (call API for each) then emit assigned events
      const assignedList = []
      const promises = this.selectedTrainings.map(async (t) => {
        const isAssignment = !!(t._isAssignment || t.assignmentId || t.assignment_id)
        const id = isAssignment ? (t.assignmentId || t.id) : (t.trainingId || t.id)
        if (this.programId && id) {
          try {
            const rawType = (t && (t.type || t.trainingType || t.training_type) || '').toString().toUpperCase()
            const payload = {}
            if (rawType === 'ONLINE') {
              const sdDate = t._editDate || (t.startDate ? this.getLocalDatePart(t.startDate) : null)
              const edDate = (t._editDate && (t._endTime || t._startTime)) ? (t._editDate) : (t.endDate ? this.getLocalDatePart(t.endDate) : null)
              if (sdDate) payload.startDate = sdDate
              if (edDate) payload.endDate = edDate
            } else {
              const datePart = t._editDate || (t.startDate ? this.getLocalDatePart(t.startDate) : null)
              const timePart = t._startTime || '09:00'
              const sched = datePart ? this.combineLocalDateTime(datePart, timePart) : null
              if (sched) payload.scheduledAt = sched
            }
            if (Object.keys(payload).length === 0) payload.assignedDate = this.date

            const url = isAssignment ? `/api/v1/admin/programs/${this.programId}/assignments/${id}` : `/api/v1/admin/programs/${this.programId}/trainings/${id}`
            const resp = await http.post(url, payload)
            const body = resp?.data ?? resp
            const assigned = body || Object.assign({}, t)
            assigned.startDate = assigned.startDate || t.startDate
            assigned.endDate = assigned.endDate || t.endDate
            if (!assigned.startDate && (assigned.scheduledAt || assigned.scheduled_at)) assigned.startDate = assigned.scheduledAt || assigned.scheduled_at
            assignedList.push(assigned)
          } catch (e) {
            console.error('일정 할당 실패', e)
            assignedList.push(Object.assign({}, t))
          }
        } else {
          assignedList.push(Object.assign({}, t))
        }
      })

      Promise.all(promises).then(() => {
        // emit assigned trainings to parent
        assignedList.forEach(a => this.$emit('training-assigned', a))
        // also emit generic save event for other metadata if needed
        this.$emit('save', { date: this.date, title: this.title, description: this.description })
        // clear local selections
        this.selectedTrainings = []
        this.close()
      })
    }
  }
}
</script>

<style scoped>
.set-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
}
.set-modal {
   width: 760px;
  max-width: 96vw;
  min-width: 520px;
  background: #fff;
  border-radius: 10px;
  padding: 22px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.2);
  max-height: 86vh;
  overflow: auto;
}
.set-grid { display:flex; gap:18px; margin-bottom:12px }
.set-grid .left { flex: 1.4; max-height:360px; overflow:auto; background:#fbfdff; padding:12px; border-radius:8px; border:1px solid #eef3fb }
.set-grid .right { flex: 1; max-height:360px; overflow:auto; background:#fbfdff; padding:12px; border-radius:8px; border:1px solid #eef3fb }
.item-list, .training-list { list-style:none; padding:0; margin:0 }
.item-row, .training-row { padding:8px; border-bottom:1px dashed #e6eef8 }
.item-row { display:flex; align-items:center; justify-content:space-between }
.item-left { flex:1 }
.item-actions { margin-left:12px }
.item-row:last-child, .training-row:last-child { border-bottom:none }
.item-title, .training-title { font-weight:600 }
.item-time, .training-meta { font-size:12px; color:#6b7280 }
.modal-top { display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:12px }
.modal-title { font-size:18px; font-weight:700 }
.modal-date { position: absolute; left: 18px; top: 10px; font-weight:700; color: #294594 }
.modal-close-btn { position:absolute; right:8px; top:6px; border:none; background:transparent; font-size:16px; cursor:pointer }
.set-body { padding: 8px 0 12px }
.field { margin-bottom:12px }
.field .label { font-size:12px; color:#6b7280; margin-bottom:6px }
input, textarea { width:100%; box-sizing:border-box; padding:8px; border:1px solid #dfe6f0; border-radius:6px }
.modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:8px }
.btn-outline { background:transparent; border:1px solid #d0d7e2; padding:8px 12px; border-radius:8px }
.btn-primary { background:var(--color-primary,#294594); color:#fff; border:none; padding:8px 12px; border-radius:8px }
/* training list layout */
.training-row { display:flex; align-items:center; justify-content:space-between }
.training-left { flex:1 }
.training-actions { margin-left:12px }
.btn-add { background: #2b7cff; color: #fff; border: none; padding:6px 10px; border-radius:6px; cursor:pointer }
.btn-add:hover { opacity:0.95 }
.right-tabs { display:flex; gap:8px; margin-bottom:8px }
.tab { padding:6px 10px; border-radius:8px; border:1px solid transparent; background:transparent; cursor:pointer }
.tab.active { background:#f1f5ff; border-color:#dfe8ff }
.training-assigned { margin-top:6px; font-size:12px; color:#475569 }
.training-type { font-size:12px; color:#475569; margin-left:8px; font-weight:600 }
.selected-row { display:flex; align-items:flex-start; justify-content:space-between }
.selected-left { flex:1 }
.selected-actions { margin-left:12px }
.selected-inline-btn { margin-left: 40%; vertical-align: middle }
.dt-controls { display:flex; gap:8px; align-items:center; margin-top:8px }
.dt-controls label { font-size:12px; color:#6b7280 }
.dt-controls input { margin-left:6px; padding:4px; border-radius:4px; border:1px solid #dfe6f0 }
.btn-outline.btn-small { padding:6px 10px; font-size:13px; border-radius:8px }
.item-actions .btn-outline { min-width:64px }
</style>
