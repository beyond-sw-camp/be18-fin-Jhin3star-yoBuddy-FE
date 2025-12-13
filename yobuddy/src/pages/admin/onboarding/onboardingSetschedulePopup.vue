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
              <li v-for="(it, idx) in selectedTrainings" :key="`sel-${it.trainingId||it.assignmentId||it.taskId||it.id||idx}`" class="item-row">
                <div class="selected-row">
                  <div class="selected-left">
                    <div class="item-title">
                      {{ it.title }}
                      <span v-if="(it._isAssignment || it.taskId || it.task_id)" class="item-badge">과제</span>
                      <span v-else class="item-badge item-badge--training">교육</span>
                      <span class="training-type">{{ formatTrainingType(it) }}</span>
                      <button class="btn-outline btn-small selected-inline-btn" @click="removeSelectedTraining(it)">취소</button>
                    </div>

                    <div class="item-time">{{ formatItemTime(it) }}</div>

                    <div class="dt-controls">
                      <template v-if="it._isAssignment || it.taskId || it.task_id">
                        <label>
                          제출일
                          <input
                            type="date"
                            v-model="it._editDate"
                            @change="updateAssignmentDueDate(it)"
                          />
                        </label>
                        <label>
                          제출 시간
                          <input
                            type="time"
                            v-model="it._dueTime"
                            @change="updateAssignmentDueDate(it)"
                          />
                        </label>
                      </template>

                      <!-- ✅ 교육일 때: 기존처럼 날짜 + 시작 + 종료 -->
                      <template v-else>
                        <!-- 🔹 ONLINE 교육일 때: 시작일/종료일 -->
                        <template v-if="isOnline(it)">
                          <label>
                            시작일
                            <input
                              type="date"
                              v-model="it._onlineStartDate"
                              @change="updateOnlineTrainingDates(it)"
                            />
                          </label>
                          <label>
                            종료일
                            <input
                              type="date"
                              v-model="it._onlineEndDate"
                              @change="updateOnlineTrainingDates(it)"
                            />
                          </label>
                        </template>

                        <!-- 🔹 그 외 교육 (OFFLINE 등): 날짜 + 시작/종료 시간 -->
                        <template v-else>
                          <label>
                            날짜
                            <input
                              type="date"
                              v-model="it._editDate"
                              @change="updateTrainingDateTime(it)"
                            />
                          </label>
                          <label>
                            시작
                            <input
                              type="time"
                              v-model="it._startTime"
                              @change="updateTrainingDateTime(it)"
                            />
                          </label>
                          <label>
                            종료
                            <input
                              type="time"
                              v-model="it._endTime"
                              @change="updateTrainingDateTime(it)"
                            />
                          </label>
                        </template>
                      </template>
                    </div>
                  </div>
                </div>
              </li>
              <!-- existing items from parent (visibleDayItems) -->
              <li v-for="(it, idx) in mergedVisibleDayItems" :key="it.id || idx" class="item-row">
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
              <button :class="['tab', { active: activeRightTab === 'training' }]" @click="setActiveRightTab('training')">교육</button>
              <button :class="['tab', { active: activeRightTab === 'assignment' }]" @click="setActiveRightTab('assignment')">과제</button>
            </div>

            <div v-if="activeRightTab === 'training'">
              <h4>교육 목록</h4>
              <div v-if="loadingTrainings">로딩 중...</div>
              <div v-else>
                <ul class="training-list">
                  <li v-for="(t, i) in availableTrainings" :key="t.trainingId || t.id || i" class="training-row">
                    <div class="training-left">
                      <div>
                        <span class="training-title">{{ t.title || t.name || t.trainingTitle || t.trainingName }}</span>
                        <span class="item-badge item-badge--training">교육</span>
                        <span class="training-type">{{ formatTrainingType(t) }}</span>
                      </div>
                      <div class="training-meta">{{ formatTrainingDates(t) }}</div>
                    </div>
                    <div class="training-actions">
                      <button class="btn-add" @click="addTrainingToDate(t)">추가</button>
                    </div>
                  </li>
                  <li v-if="availableTrainings.length === 0" class="empty">표시할 교육이 없습니다.</li>
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
                        <span class="item-badge">과제</span>
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
      deletedAssignmentIds: [],
    }
  },
  watch: {
    visible(val) {
      if (val) {
      // 🔹 팝업 열릴 때: 내부 상태 리셋 + 데이터 로드
      this.deletedAssignmentIds = []
      this.selectedTrainings = []
      this.title = ''
      this.description = ''

      this.loadTrainings()
      this.loadAssignments()
    } else {
      // 🔹 팝업 닫힐 때: 임시 편집 값들 정리(선택된 것들만 초기화)
      this.selectedTrainings = []
      this.deletedAssignmentIds = []
    }

    console.log('[OnboardingPopup] visible ->', val, 'date:', this.date)
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
        return this.dayItems
          .filter(it => {
            if (!it) return false
            if (Array.isArray(it.classes) && it.classes.includes('training-duration')) return false
            if (typeof it.id === 'string' && it.id.includes('duration')) return false
            return true
          })
          .map(it => {
            const isAssignment =
              it.type === 'ASSIGNMENT' ||
              it.kind === 'task' ||
              (Array.isArray(it.classes) && it.classes.includes('task'))

          return {
            ...it,
            _isAssignment: isAssignment  // 🔥 핵심
          }
      })
    },
    // Merge parent-provided visibleDayItems with program-scoped assignments (tasks)
    mergedVisibleDayItems() {
      const base = this.visibleDayItems || []
      // if no program or no assignments loaded, return base
      if (!this.programId || !(this.assignments && this.assignments.length) || !this.date) return base
      const datePart = this.getLocalDatePart(this.date)

      const mapped = (this.assignments || []).map(a => {
        const id = a.assignmentId || a.id || a.taskId || a.task_id
        const title = a.title || a.name || a.subject
        const due = a.due_date || a.dueDate || a.startDate || a.assignedDate || a.assigned_date || a.date || a.trainingDate
        const start = a.startDate || a.scheduledAt || a.scheduled_at || due
        return Object.assign({}, a, { id, title, startDate: start, _isAssignment: true })
      }).filter(it => {
        const itemDate = this.getLocalDatePart(it.startDate)
        return itemDate === datePart
      })

      // avoid duplicates against base by id/title
      const baseIds = new Set((base || []).map(b => String(b.id || b.assignmentId || b.taskId || b.id)).filter(Boolean))
      const uniques = mapped.filter(m => !baseIds.has(String(m.id)))
      const merged = base.concat(uniques)
      return merged.filter(it => {
        const aid = it.assignmentId || it.id || it.taskId || it.task_id
        if (!aid) return true
        return !this.deletedAssignmentIds.includes(String(aid))
      })
    }
    ,
    availableTrainings() {
      // Exclude trainings that are already present in visibleDayItems or already selected locally
      const assignedIds = new Set((this.mergedVisibleDayItems || []).map(it => (it.id != null ? String(it.id) : null)).filter(Boolean))
      const assignedTitles = new Set((this.mergedVisibleDayItems || []).map(it => (it.title || '').toString()).filter(Boolean))
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
      const assignedIds = new Set((this.mergedVisibleDayItems || []).map(it => (it.id != null ? String(it.id) : null)).filter(Boolean))
      const assignedTitles = new Set((this.mergedVisibleDayItems || []).map(it => (it.title || '').toString()).filter(Boolean))
      return (this.assignments || []).filter(a => {
        const aid = a.assignmentId || a.id || a.assignment_id || a.taskId || a.task_id
        if (aid && assignedIds.has(String(aid))) return false
        const title = (a.title || a.name || a.subject || '').toString()
        if (title && assignedTitles.has(title)) return false
        const alreadySelected = this.selectedTrainings.some(s => (s.assignmentId || s.id || s.taskId || s.task_id) && (s.assignmentId || s.id || s.taskId || s.task_id) === (a.assignmentId || a.id || a.taskId || a.task_id))
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
    updateAssignmentDueDate(item) {
      const date = item._editDate || this.getLocalDatePart(this.date)
      const time = item._dueTime || '18:00'
      // 최종 마감일시 (백엔드 LocalDateTime용)
      item.dueDate = this.combineLocalDateTime(date, time)
    },
    isOnline(item) {
      const type = (item && (item.type || item.trainingType || item.training_type) || '').toString().toUpperCase()
      return type === 'ONLINE'
    },
    updateOnlineTrainingDates(training) {
      const start = training._onlineStartDate || this.getLocalDatePart(this.date)
      const end = training._onlineEndDate || start
      training.startDate = start   // 백엔드에 보낼 startDate(LocalDate)
      training.endDate = end       // 백엔드에 보낼 endDate(LocalDate)
    },
    
    async confirmAndDelete(item) {
      if (!item) return
      console.log('삭제 시도 item:', JSON.parse(JSON.stringify(item)));
      const ok = window.confirm('이 일정을 삭제하시겠습니까?')
      if (!ok) return
      await this.deleteAssignedTraining(item)
    },
    async deleteAssignedTraining(item) {
      if (!this.programId) {
        console.warn('programId가 없습니다.', item);
        return;
      }
      // determine whether this is an assignment/task or a training
      const isAssignment =
        !!(
          item._isAssignment ||
          item.assignmentId ||
          item.assignment_id ||
          item.taskId ||
          item.task_id ||
          item.kind === 'task' ||                          // ← 여기가 중요
          (Array.isArray(item.classes) && (
            item.classes.includes('task') ||
            item.classes.includes('tesk')                  // 오타로 들어온 'tesk'도 커버
          ))
        );

      const assignmentId = isAssignment
        ? (item.assignmentId ||
            item.assignment_id ||
            item.taskId ||
            item.task_id ||
            item.id)                                        // ← 과제면 id를 taskId로 사용
        : null;
              
      const trainingId =
        item.trainingId ||
        item.training_id ||
        (!assignmentId ? item.id : null);

      console.log('삭제 타입 판정:', { isAssignment, assignmentId, trainingId, raw: JSON.parse(JSON.stringify(item)) });
      if (isAssignment && assignmentId) {
        try {
          await http.delete(
            `/api/v1/admin/programs/${this.programId}/tasks/${assignmentId}`
          );
          this.removeAssignmentLocally(assignmentId)
          this.deletedAssignmentIds.push(String(assignmentId))
          this.$emit('training-removed', { assignmentId });
          return;
        } catch (e) {
          console.debug('tasks delete failed, trying assignments delete', e);
          try {
            await http.delete(
              `/api/v1/admin/programs/${this.programId}/tasks/${assignmentId}`
            );

            this.removeAssignmentLocally(assignmentId)
            this.deletedAssignmentIds.push(String(assignmentId))
            this.$emit('training-removed', { assignmentId });
            return;
          } catch (e2) {
            console.error('과제 삭제 실패 (both tasks/assignments)', e2);
            alert('과제 삭제에 실패했습니다.');
            return;
          }
        }
      }
      if (trainingId) {
        try {
          await http.delete(
            `/api/v1/admin/programs/${this.programId}/trainings/${trainingId}`
          );
          this.trainings = (this.trainings || []).filter(tr => {
            const tid = tr.trainingId || tr.id || tr.training_id;
            return String(tid) !== String(trainingId);
          });
          this.selectedTrainings = (this.selectedTrainings || []).filter(t => {
            const tid = t.trainingId || t.id || t.training_id;
            return String(tid) !== String(trainingId);
          });
          this.$emit('training-removed', { trainingId });
        } catch (e) {
          console.error('교육 삭제 실패', e);
          alert('교육 삭제에 실패했습니다.');
        }
      } else {
        console.warn(
          '삭제할 training/assignment id를 찾을 수 없습니다.',
          item
        );
      }
    },
    removeAssignmentLocally(assignmentId) {
      if (!assignmentId) return

      // 🔹 과제 목록에서 제거
      this.assignments = (this.assignments || []).filter(a => {
        const aid = a.assignmentId || a.id || a.taskId || a.task_id
        return String(aid) !== String(assignmentId)
      })

      // 🔹 선택된 일정(selectedTrainings)에서도 제거
      this.selectedTrainings = (this.selectedTrainings || []).filter(t => {
        const tid = t.assignmentId || t.id || t.taskId || t.task_id
        return String(tid) !== String(assignmentId)
      })
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
        const params = this.programId ? { params: { programId: this.programId } } : {}
        const resp = await http.get('/api/v1/admin/tasks', params)
        console.debug('[OnboardingSetschedulePopup] loadAssignments resp:', resp)
        // tolerate multiple response shapes. examples:
        // 1) array response: [ ... ]
        // 2) wrapper with { content: [...] } or { items: [...] }
        // 3) our API: { message, data: { totalCount, tasks: [...] }, statusCode }
        const body = resp?.data ?? resp
        const tryArray = (obj) => Array.isArray(obj) ? obj : null

        let found = tryArray(body) || tryArray(body.content) || tryArray(body.items) || tryArray(body.data) || null
        if (!found && body && typeof body === 'object') {
          // check common nested fields
          if (Array.isArray(body.tasks)) found = body.tasks
          else if (body.data && Array.isArray(body.data.tasks)) found = body.data.tasks
          else if (body.result && Array.isArray(body.result.items)) found = body.result.items
        }
        this.assignments = found || []
      } catch (e) {
        console.error('과제 목록 로드 실패', e)
        this.assignments = []
      } finally {
        this.loadingAssignments = false
      }
    },

    setActiveRightTab(tab) {
      if (!tab) return
      this.activeRightTab = tab
      if (tab === 'assignment' && (!this.assignments || this.assignments.length === 0)) {
        // try loading assignments when user switches to that tab
        this.loadAssignments()
      }
    },

    addTrainingToDate(training) {
      // Do NOT call server here. Move training to local selected list for this date.
      const tid = training.trainingId || training.id
      const exists = this.selectedTrainings.some(t => (t.trainingId || t.id) === tid)
      if (exists) return

      const copy = Object.assign({}, training)
      const yyyy = this.getLocalDatePart(this.date)
      copy._editDate = yyyy

      if (this.isOnline(copy)) {
        // 🔹 ONLINE: 기간(시작일/종료일)만 사용
        copy._onlineStartDate = yyyy
        copy._onlineEndDate = yyyy
        copy.startDate = yyyy
        copy.endDate = yyyy
      } else {
        // 🔹 OFFLINE 등: 기존처럼 날짜 + 시간
        copy._startTime = '12:00'
        copy._endTime = '13:00'
        copy.startDate = this.combineDateTime(yyyy, copy._startTime)
        copy.endDate = this.combineDateTime(yyyy, copy._endTime)
      }

      this.selectedTrainings.push(copy)
    },

    addAssignmentToDate(assignment) {
      const aid = assignment.assignmentId || assignment.id || assignment.taskId || assignment.task_id
      const exists = this.selectedTrainings.some(t => (t.assignmentId || t.id || t.taskId || t.task_id) === aid)
      if (exists) return
      const copy = Object.assign({}, assignment)
      copy._isAssignment = true
      const yyyy = this.getLocalDatePart(this.date)
      copy._editDate = yyyy
      copy._dueTime = "18:00"
      copy.dueDate = this.combineLocalDateTime(yyyy, copy._dueTime)
      this.selectedTrainings.push(copy)
    },

    removeSelectedTraining(training) {
      const id = training.trainingId || training.assignmentId || training.taskId || training.id
      this.selectedTrainings = this.selectedTrainings.filter(t => {
        const tid = t.trainingId || t.assignmentId || t.taskId || t.id
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
        if (it._isAssignment || it.taskId || it.task_id) {
          const date = it._editDate || (it.dueDate ? this.getLocalDatePart(it.dueDate) : null)
          const time = it._dueTime || (it.dueDate ? it.dueDate.substring(11, 16) : null)
          if (!date || !time) return ''
          const [yyyy, mm, dd] = date.split('-')
          return `${yyyy}.${mm}.${dd} ${time}`
        }

        const rawStart = it._onlineStartDate || it.startDate || it.start_date || it.scheduledAt || it.scheduled_at || null
        const rawEnd = it._onlineEndDate || it.endDate || it.end_date || it.end || null
        if (!rawStart) return ''
        const start = new Date(rawStart)
        const end = rawEnd ? new Date(rawEnd) : null
        const formatMonthDay = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
        const type = (it.type || it.trainingType || it.training_type || '').toString().toUpperCase()
        const classes = Array.isArray(it.classes) ? it.classes : []
        const isTrainingLike = it.kind === 'training' || (!it.kind && !(it._isAssignment || it.taskId || it.task_id))
        const isOnlineTraining = isTrainingLike && (type === 'ONLINE' || classes.includes('online'))
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
      const toSave = this.selectedTrainings || []

      if ((this.selectedTrainings || []).length !== toSave.length) {
        console.debug('[OnboardingSetschedulePopup] save: filtered already-assigned items', {
          total: this.selectedTrainings.length,
          toSave: toSave.length
        })
      }

      const assignedList = []

      const promises = toSave.map(async (t) => {
        const isAssignment = !!(t._isAssignment || t.assignmentId || t.assignment_id || t.taskId || t.task_id)
        const id = isAssignment
          ? (t.assignmentId || t.id || t.taskId || t.task_id)
          : (t.trainingId || t.id)

        if (!this.programId || !id) {
          assignedList.push({ ...t })
          return
        }

        try {
          const payload = {}

          // 🔹 1) 과제일 경우: dueDate(LocalDateTime) + assignedAt(LocalDate)
          if (isAssignment) {
            const datePart =
              t._editDate ||
              (t.dueDate ? this.getLocalDatePart(t.dueDate) : null) ||
              this.getLocalDatePart(this.date)

            const timePart =
              t._dueTime ||
              (t.dueDate && typeof t.dueDate === 'string' ? t.dueDate.substring(11, 16) : null) ||
              '18:00'

            if (datePart) {
              const due = this.combineLocalDateTime(datePart, timePart)
              payload.dueDate = due
              payload.due_date = due
              // payload.due_date = due     // 백엔드가 snake_case면 이 줄로 교체
            }

            // 캘린더에서 선택한 날짜를 기본 assignedAt 으로 사용
            const assignedBaseDate =
              this.getLocalDatePart(this.date) ||   // 캘린더에서 선택한 날짜
              datePart ||
              this.formattedDateISO ||
              null

            if (assignedBaseDate) {
              const assignedAt = this.combineLocalDateTime(assignedBaseDate, '00:00')
              payload.assignedAt = assignedAt
              // payload.assigned_at = assignedAt   // snake_case면 이 줄 사용
            }
            // 혹시라도 아무 것도 안 들어가면 안전하게 채워주기
            if (Object.keys(payload).length === 0) {
              const fallbackDate = this.getLocalDatePart(this.date) || this.formattedDateISO || this.date
              const due = this.combineLocalDateTime(fallbackDate, '18:00')
              payload.dueDate = due
              payload.due_date = due
              payload.assignedAt = fallbackDate
              payload.assigned_at = fallbackDate
            }
          }

          // 🔹 2) 교육일 경우
          else {
            const rawType = (t && (t.type || t.trainingType || t.training_type) || '').toString().toUpperCase()

            if (rawType === 'ONLINE') {
              const sdDate =
                t._onlineStartDate ||
                t._editDate ||
                (t.startDate ? this.getLocalDatePart(t.startDate) : null)

              const edDate =
                t._onlineEndDate ||
                t._editDate ||
                (t.endDate ? this.getLocalDatePart(t.endDate) : null)

              if (sdDate) payload.startDate = sdDate   // "YYYY-MM-DD"
              if (edDate) payload.endDate = edDate
            } else {
              const datePart = t._editDate || (t.startDate ? this.getLocalDatePart(t.startDate) : null)
              const timePart = t._startTime || '09:00'
              const sched = datePart ? this.combineLocalDateTime(datePart, timePart) : null
              if (sched) payload.scheduledAt = sched
            }

            if (Object.keys(payload).length === 0) {
              const assigned = this.getLocalDatePart(this.date) || this.formattedDateISO || this.date
              payload.assignedDate = assigned
              payload.assigned_date = assigned
            }
          }

          // 🔹 3) URL 구성
          const url = isAssignment
            ? `/api/v1/admin/programs/${this.programId}/tasks/${id}`
            : `/api/v1/admin/programs/${this.programId}/trainings/${id}`

          let resp

          // 🔹 4) 기본은 POST
          try {
            resp = await http.post(url, payload)
          } catch (e) {
            const respErr = e?.response
            const status = respErr?.status
            const data = respErr?.data
            const msg = (data && (data.message || data.error || data.msg)) || ''
            const msgStr = String(msg || '')

            const alreadyMapped =
              status === 400 &&
              (msgStr.includes('이미 매핑') || msgStr.includes('이미 등록') || msgStr.includes('이미 맵'))

            if (alreadyMapped) {
              if (isAssignment) {
                // ✅ 과제 PATCH: @PatchMapping("/{programId}/tasks/{taskId}")
                const patchPayload = {
                  dueDate: payload.dueDate || null,
                  due_date: payload.dueDate || null,
                  assignedAt: payload.assignedAt || this.getLocalDatePart(this.date) || null,
                  assigned_at: payload.assignedAt || this.getLocalDatePart(this.date) || null,
                }
                console.debug('[OnboardingSetschedulePopup] TASK PATCH', url, patchPayload)
                resp = await http.patch(url, patchPayload)
              } else {
                // ✅ 교육 PATCH (기존 로직)
                const patchPayload = {
                  scheduledAt: payload.scheduledAt || null,
                  startDate: payload.startDate || null,
                  endDate: payload.endDate || null,
                }
                console.debug('[OnboardingSetschedulePopup] TRAINING PATCH', url, patchPayload)
                resp = await http.patch(url, patchPayload)
              }
            } else {
              console.error('일정 할당 실패', e)
              const fallbackMsg = msgStr || (data ? JSON.stringify(data) : '') || e.message
              window.alert(`할당 실패: ${status || ''}\n${fallbackMsg}`)
              assignedList.push({ ...t })
              return
            }
          }

          // 🔹 5) POST/PATCH 성공 후 리스트에 반영
          console.debug('[OnboardingSetschedulePopup] POST/PATCH resp', resp)
          const body = resp?.data ?? resp
          const assigned = body || { ...t }

          if (isAssignment) {
            assigned.dueDate = assigned.dueDate || assigned.due_date || t.dueDate || payload.dueDate
            assigned.assignedAt = assigned.assignedAt || assigned.assigned_at || payload.assignedAt
          } else {
            assigned.startDate = assigned.startDate || t.startDate
            assigned.endDate = assigned.endDate || t.endDate
            if (!assigned.startDate && (assigned.scheduledAt || assigned.scheduled_at)) {
              assigned.startDate = assigned.scheduledAt || assigned.scheduled_at
            }
          }

          assignedList.push(assigned)
        } catch (e) {
          console.error('일정 처리 실패', e)
          assignedList.push({ ...t })
        }
      })

      Promise.all(promises).then(() => {
        // emit assigned trainings to parent
        assignedList.forEach(a => this.$emit('training-assigned', a))
        // also emit generic save event for other metadata if needed
        this.$emit('save', { date: this.date, title: this.title, description: this.description })
        // notify parent that assignments were saved so it can refresh program-scoped tasks
        try { this.$emit('assignments-saved') } catch (e) { /* ignore */ }
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
   width: 960px;
  max-width: 98vw;
  min-width: 720px;
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
.item-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;  /* 기존 그대로 유지 */
  flex-wrap: wrap;   /* 제목/뱃지가 길면 아래 줄로 내려가도록 */
}
.training-title { font-weight:600 }
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
.selected-inline-btn { margin-left: auto; vertical-align: middle }
.item-badge { display:inline-block; margin-left:8px; padding:2px 8px; font-size:11px; border-radius:12px; background:#fff3cd; color:#854d00; border:1px solid #ffeeba }
.item-badge--training { background:#e6f0ff; color:#13306e; border-color:#d3e1ff }
.dt-controls { display:flex; gap:8px; align-items:center; margin-top:8px }
.dt-controls label { font-size:12px; color:#6b7280 }
.dt-controls input { margin-left:6px; padding:4px; border-radius:4px; border:1px solid #dfe6f0 }
.btn-outline.btn-small { padding:6px 10px; font-size:13px; border-radius:8px }
.item-actions .btn-outline { min-width:64px }
</style>
