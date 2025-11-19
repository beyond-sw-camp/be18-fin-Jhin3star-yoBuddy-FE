<template>
  <div v-if="visible" class="kpi-goal-modal">
    <div class="overlay" @click="close"></div>
    <div class="modal">
      <header class="modal-header">
        <h3>{{ goalTitle }}</h3>
        <button class="close-btn" @click="close">×</button>
      </header>
      <section class="modal-body">
        <dl>
          <!-- <dt>목표명</dt>
          <dd v-if="!editMode">{{ detail.title || detail.name || detail.label || goal.title || goal.name || '무제' }}</dd>
          <dd v-else><input v-model="form.title" style="width:100%" /></dd> -->

          <dt>설명</dt>
          <dd v-if="!editMode">{{ detail.description || detail.detail || goal.description || '-' }}</dd>
          <dd v-else><textarea v-model="form.description" rows="3" style="width:100%"></textarea></dd>

          <dt>카테고리</dt>
          <dd v-if="!editMode">{{ displayCategoryName() }}</dd>
          <dd v-else>
            <select v-model="form.categoryId" style="width:100%">
              <option value="">선택하세요</option>
              <option v-for="c in categories" :key="c.id || c.kpiCategoryId || c._id" :value="c.id || c.kpiCategoryId || c._id">{{ c.name || c.title || c.categoryName }}</option>
            </select>
          </dd>

          <dt>부서</dt>
          <dd v-if="!editMode">{{ displayDepartmentName() }}</dd>
          <dd v-else>
            <select v-model="form.departmentId" style="width:100%">
              <option value="">선택하세요</option>
              <option v-for="d in departments" :key="d.departmentId || d.id || d._id" :value="d.departmentId || d.id || d._id">{{ d.name || d.departmentName || d.title }}</option>
            </select>
          </dd>

          <dt>가중치</dt>
          <dd v-if="!editMode">{{ detail.weight ?? detail.weightValue ?? detail.score ?? goal.weight ?? '-' }}</dd>
          <dd v-else>
            <div style="display:flex;align-items:center;gap:8px">
              <input type="range" min="0" max="1" step="0.01" v-model.number="form.weight" @input="onWeightInput" style="flex:1" />
              <span style="min-width:48px;text-align:right">{{ (form.weight ?? detail.weight ?? goal.weight ?? 0).toFixed(2) }}</span>
            </div>
            <div style="margin-top:8px;color:#294594;font-size:13px">
              <div>해당 부서 현재 합계(변경 반영 전): <strong>{{ deptExistingSum().toFixed(3) }}</strong></div>
              <div>남은 가중치 (변경 반영 전): <strong>{{ Math.max(0, (1 - deptExistingSum())).toFixed(3) }}</strong></div>
              <div v-if="form.weight !== undefined">변경 반영 후 합계: <strong>{{ Math.min(999, (deptExistingSumExcludingCurrent() + Number(form.weight || 0))).toFixed(3) }}</strong></div>
            </div>
          </dd>

          <dt>목표값</dt>
          <dd v-if="!editMode">{{ detail.targetValue ?? detail.goalValue ?? goal.targetValue ?? '-' }}</dd>
          <dd v-else><input v-model="form.targetValue" style="width:100%" /></dd>

          <dt>생성일</dt>
          <dd>{{ formatDate(detail.createdAt || goal.createdAt) }}</dd>
          <dt>수정일</dt>
          <dd>{{ formatDate(detail.updatedAt || goal.updatedAt) }}</dd>
        </dl>
        <div v-if="loading" style="margin-top:12px;color:#666">로딩 중...</div>
        <div v-if="error" style="margin-top:12px;color:#b00020">에러: {{ error }}</div>
      </section>
      <footer class="modal-footer">
        <template v-if="!editMode">
          <button class="btn" @click="enableEdit">수정</button>
          <button class="btn" style="margin-left:8px;background:#b00020" @click="confirmDelete">삭제</button>
          <button class="btn" style="margin-left:8px;background:#6c757d" @click="close">닫기</button>
        </template>
        <template v-else>
          <button class="btn" @click="saveGoal">저장</button>
          <button class="btn" style="margin-left:8px;background:#6c757d" @click="cancelEdit">취소</button>
        </template>
      </footer>
    </div>
  </div>
</template>

<script>
import kpiService from '@/services/kpiService'

export default {
  name: 'KpiGoalsDetailPopup',
  props: {
    visible: { type: Boolean, default: false },
    goal: { type: Object, default: () => ({}) },
    isNew: { type: Boolean, default: false },
    departments: { type: Array, default: () => [] },
    initialDepartmentId: { type: [String, Number], default: null }
    ,categories: { type: Array, default: () => [] },
    goals: { type: Array, default: () => [] }
  },
  emits: ['close','saved','deleted'],
  data() {
    return {
      detail: {},
      loading: false,
      error: null,
      editMode: false,
      form: {}
    }
  },
  watch: {
    // when opened, fetch fresh detail if id present
    visible(val) {
      if (val) {
        if (this.isNew) {
          this.editMode = true
          this.form = {}
          // prefill department if parent passed selectedDepartmentId
          if (this.initialDepartmentId) this.form.departmentId = this.initialDepartmentId
          // ensure weight has a default so slider behaves
          if (this.form.weight === undefined || this.form.weight === null) this.form.weight = 0
          this.detail = {}
          this.error = null
        } else {
          this.loadDetail()
        }
      } else {
        this.detail = {}
        this.error = null
        this.editMode = false
        this.form = {}
      }
    },
    goal() {
      if (!this.visible) return
      if (this.isNew) {
        this.editMode = true
        this.form = {}
        if (this.initialDepartmentId) this.form.departmentId = this.initialDepartmentId
        if (this.form.weight === undefined || this.form.weight === null) this.form.weight = 0
      } else {
        this.loadDetail()
      }
    }
  },
  computed: {
    goalTitle() {
      return this.detail && (this.detail.title || this.detail.name || this.detail.label || 'KPI 목표 상세')
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    // compute existing sum for the department (including all goals)
    deptExistingSum() {
      try {
        const targetDeptId = this.form.departmentId || this.detail.departmentId || (this.detail.department && (this.detail.department.departmentId || this.detail.department.id)) || (this.goal && (this.goal.departmentId || (this.goal.department && (this.goal.department.departmentId || this.goal.department.id))))
        if (!targetDeptId) return 0
        let sum = 0
        const arr = this.goals || []
        arr.forEach(g => {
          const gDept = g.departmentId || (g.department && (g.department.departmentId || g.department.id)) || null
          if (String(gDept) === String(targetDeptId)) {
            const w = Number(g.weight ?? g.weightValue ?? g.score ?? 0)
            if (!Number.isNaN(w)) sum += w
          }
        })
        return sum
      } catch (e) {
        return 0
      }
    },
    // compute existing sum excluding current goal (useful when we consider update)
    deptExistingSumExcludingCurrent() {
      try {
        const targetDeptId = this.form.departmentId || this.detail.departmentId || (this.detail.department && (this.detail.department.departmentId || this.detail.department.id)) || (this.goal && (this.goal.departmentId || (this.goal.department && (this.goal.department.departmentId || this.goal.department.id))))
        if (!targetDeptId) return 0
        const thisId = this.detail && (this.detail.id || this.detail.kpiGoalId || this.detail._id || this.detail.goalId) || (this.goal && (this.goal.id || this.goal.kpiGoalId || this.goal._id || this.goal.goalId))
        let sum = 0
        const arr = this.goals || []
        arr.forEach(g => {
          const gid = g.id || g.kpiGoalId || g._id || g.goalId
          const gDept = g.departmentId || (g.department && (g.department.departmentId || g.department.id)) || null
          if (String(gDept) === String(targetDeptId)) {
            if (thisId && String(gid) === String(thisId)) return
            const w = Number(g.weight ?? g.weightValue ?? g.score ?? 0)
            if (!Number.isNaN(w)) sum += w
          }
        })
        return sum
      } catch (e) {
        return 0
      }
    },
    // maximum allowed weight for the slider (remaining for the department)
    rangeMax() {
      try {
        const max = 1 - this.deptExistingSumExcludingCurrent()
        if (Number.isNaN(max) || max < 0) return 0
        return Math.min(1, max)
      } catch (e) {
        return 0
      }
    },
    onWeightInput(e) {
      try {
        const value = Number(e.target.value)
        const max = this.rangeMax()
        if (Number.isNaN(value)) return
        if (value > max) {
          // clamp both the input element and the bound model
          this.form.weight = max
          e.target.value = String(max)
        }
      } catch (err) {
        // ignore
      }
    },
    displayDepartmentName() {
      // prefer loaded detail's department object
      try {
        if (this.detail && this.detail.department) return this.detail.department.name || this.detail.department.departmentName || JSON.stringify(this.detail.department)
        // try explicit ids on detail or goal
        let id = (this.detail && (this.detail.departmentId || (this.detail.department && (this.detail.department.id || this.detail.department.departmentId)))) || null
        if (!id && this.goal) id = this.goal.departmentId || (this.goal.department && (this.goal.department.id || this.goal.department.departmentId))
        if (!id) return '-'
        const found = (this.departments || []).find(d => String(d.departmentId || d.id || d._id) === String(id))
        if (found) return found.name || found.departmentName || found.title
        return String(id)
      } catch (e) {
        return '-'
      }
    },
    displayCategoryName() {
      try {
        if (this.detail && (this.detail.categoryName || this.detail.category)) {
          if (typeof this.detail.category === 'object') return this.detail.category.name || this.detail.category.title || this.detail.category.categoryName || JSON.stringify(this.detail.category)
          return this.detail.categoryName || this.detail.category
        }
        // look for category id in detail or goal
        let id = (this.detail && (this.detail.categoryId || this.detail.kpiCategoryId || this.detail.category)) || null
        if (!id && this.goal) id = this.goal.categoryId || this.goal.kpiCategoryId || this.goal.category
        if (!id) return '-'
        const found = (this.categories || []).find(c => String(c.id || c.kpiCategoryId || c._id) === String(id))
        if (found) return found.name || found.title || found.categoryName
        return String(id)
      } catch (e) {
        return '-'
      }
    },
    formatRange(start, end) {
      if (!start && !end) return '-'
      const s = start ? String(start).slice(0,10) : '-'
      const e = end ? String(end).slice(0,10) : '-'
      return `${s} ~ ${e}`
    },
    formatDate(d) {
      if (!d) return '-'
      try {
        return String(d).slice(0,10)
      } catch (e) {
        return String(d)
      }
    },
    async loadDetail() {
      this.error = null
      // try to use passed goal object first, but if id exists call API
      const id = this.goal && (this.goal.id || this.goal.kpiGoalId || this.goal._id || this.goal.goalId)
      if (!id) {
        // no id, use whatever was passed
        this.detail = this.goal || {}
        return
      }
      this.loading = true
      try {
        const resp = await kpiService.getGoal(id)
        // support resp.data or resp.data.data
        if (resp && resp.data) {
          this.detail = resp.data && resp.data.data ? resp.data.data : resp.data
        } else {
          this.detail = {}
        }
        console.debug('Loaded KPI goal detail:', this.detail)
        // sync form with detail
        this.form = Object.assign({}, this.detail)
        // normalize category id into form.categoryId for dropdown
        const _cat = this.form.categoryId || this.form.category || this.form.kpiCategoryId || (this.form.category && (this.form.category.id || this.form.category.kpiCategoryId))
        if (_cat) this.form.categoryId = _cat
      } catch (e) {
        console.error('Failed to load KPI goal detail (primary)', e)
        // surface status and response body when available
        if (e && e.response) {
          const status = e.response.status
          const body = e.response.data
          this.error = `status=${status} body=${JSON.stringify(body)}`
          // If server returned 5xx, try admin endpoint as a fallback
          if (status >= 500) {
            try {
              console.debug('Attempting admin fallback for KPI goal detail')
              const resp2 = await kpiService.getGoalAdmin(id)
              if (resp2 && resp2.data) {
                this.detail = resp2.data && resp2.data.data ? resp2.data.data : resp2.data
                this.error = null
                console.debug('Loaded KPI goal detail from admin fallback:', this.detail)
                return
              }
            } catch (e2) {
              console.error('Admin fallback also failed', e2)
              if (e2 && e2.response) {
                this.error += `; adminFallback status=${e2.response.status} body=${JSON.stringify(e2.response.data)}`
              } else {
                this.error += `; adminFallback error=${e2 && e2.message}`
              }
            }
          }
        } else {
          this.error = e && e.message ? e.message : '로드 실패'
        }
        // fallback to provided goal if we couldn't fetch detail
        this.detail = this.goal || {}
        this.form = Object.assign({}, this.detail)
        const _cat2 = this.form.categoryId || this.form.category || this.form.kpiCategoryId || (this.form.category && (this.form.category.id || this.form.category.kpiCategoryId))
        if (_cat2) this.form.categoryId = _cat2
      } finally {
        this.loading = false
      }
    }
    ,
    enableEdit() {
      this.editMode = true
      this.form = Object.assign({}, this.detail)
      const _cat3 = this.form.categoryId || this.form.category || this.form.kpiCategoryId || (this.form.category && (this.form.category.id || this.form.category.kpiCategoryId))
      if (_cat3) this.form.categoryId = _cat3
      this.error = null
    },
    cancelEdit() {
      this.editMode = false
      this.form = Object.assign({}, this.detail)
      const _cat4 = this.form.categoryId || this.form.category || this.form.kpiCategoryId || (this.form.category && (this.form.category.id || this.form.category.kpiCategoryId))
      if (_cat4) this.form.categoryId = _cat4
      this.error = null
    },
    async saveGoal() {
      this.loading = true
      this.error = null
      try {
        const payload = Object.assign({}, this.form)
        // VALIDATION: ensure sum of weights for the department is <= 1 (allow small epsilon for float errors)
        const targetDeptId = payload.departmentId || this.form.departmentId || this.detail.departmentId || (this.detail.department && (this.detail.department.departmentId || this.detail.department.id)) || (this.goal && (this.goal.departmentId || (this.goal.department && (this.goal.department.departmentId || this.goal.department.id))))
        const weightVal = Number(payload.weight ?? this.form.weight ?? this.detail.weight ?? 0)
        if (targetDeptId !== undefined && targetDeptId !== null && !Number.isNaN(weightVal)) {
          const existingSum = this.deptExistingSumExcludingCurrent()
          const newSum = existingSum + weightVal
          const EPS = 0.001
          if (newSum - 1 > EPS) {
            const remainingBefore = 1 - existingSum
            this.error = `해당 부서의 가중치 총합은 1 이하이어야 합니다. 변경 반영 후 합계: ${newSum.toFixed(3)} (남은 가중치: ${remainingBefore.toFixed(3)}).`
            this.loading = false
            return
          }
        }
        const id = this.detail && (this.detail.id || this.detail.kpiGoalId || this.detail._id || this.detail.goalId)
        if (this.isNew || !id) {
          // create new goal
          try {
            const resp = await kpiService.createGoal(payload)
            if (resp && resp.data) {
              this.detail = resp.data && resp.data.data ? resp.data.data : resp.data
            }
            this.$emit('saved', this.detail)
            this.close()
            return
          } catch (e) {
            // try admin fallback on server error
            if (e && e.response && e.response.status >= 500) {
              try {
                const resp2 = await kpiService.createGoalAdmin(payload)
                if (resp2 && resp2.data) {
                  this.detail = resp2.data && resp2.data.data ? resp2.data.data : resp2.data
                }
                this.$emit('saved', this.detail)
                this.close()
                return
              } catch (e2) {
                console.error('Admin create fallback failed', e2)
                if (e2 && e2.response) this.error = `status=${e2.response.status} body=${JSON.stringify(e2.response.data)}`
                else this.error = e2 && e2.message ? e2.message : '생성 실패'
              }
            } else {
              console.error('Failed to create KPI goal', e)
              if (e && e.response) this.error = `status=${e.response.status} body=${JSON.stringify(e.response.data)}`
              else this.error = e && e.message ? e.message : '생성 실패'
            }
          }
        }

        // update existing goal
        const resp = await kpiService.updateGoal(id, payload)
        if (resp && resp.data) {
          this.detail = resp.data && resp.data.data ? resp.data.data : resp.data
        }
        this.editMode = false
        this.$emit('saved', this.detail)
      } catch (e) {
        console.error('Failed to save KPI goal', e)
        if (e && e.response) this.error = `status=${e.response.status} body=${JSON.stringify(e.response.data)}`
        else this.error = e && e.message ? e.message : '저장 실패'
      } finally {
        this.loading = false
      }
    },
    async confirmDelete() {
      const ok = window.confirm('이 목표를 삭제하시겠습니까?')
      if (!ok) return
      const id = this.detail && (this.detail.id || this.detail.kpiGoalId || this.detail._id || this.detail.goalId)
      if (!id) {
        this.error = '삭제할 수 없습니다: id 없음'
        return
      }
      this.loading = true
      try {
        await kpiService.deleteGoal(id)
        this.$emit('deleted', id)
        this.close()
      } catch (e) {
        console.error('Failed to delete KPI goal', e)
        if (e && e.response) this.error = `status=${e.response.status} body=${JSON.stringify(e.response.data)}`
        else this.error = e && e.message ? e.message : '삭제 실패'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.kpi-goal-modal .overlay{ position:fixed; inset:0; background:rgba(0,0,0,0.45); }
.kpi-goal-modal .modal{ position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); background:#fff; border-radius:8px; width:640px; max-width:92%; box-shadow:0 20px 40px rgba(0,0,0,0.2); z-index:60; }
.modal-header{ display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #f3f6fb }
.modal-body{ padding:18px 20px }
.modal-footer{ padding:12px 20px; border-top:1px solid #f3f6fb; text-align:right }
.close-btn{ background:transparent; border:none; font-size:20px; cursor:pointer }
dl{ display:grid; grid-template-columns:120px 1fr; gap:8px 12px }
dt{ color:#294594; font-weight:700 }
dd{ margin:0; color:#10243b }
.btn{ background:#294594; color:#fff; border:none; padding:8px 14px; border-radius:8px; cursor:pointer }
</style>
