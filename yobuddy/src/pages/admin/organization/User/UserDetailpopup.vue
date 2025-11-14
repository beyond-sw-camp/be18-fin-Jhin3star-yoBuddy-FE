<template>
  <transition name="fade">
    <div v-if="show" class="detail-overlay" @click.self="close">
      <div class="detail-modal layout-vertical">
        <header class="modal-top">
          <button class="back-btn" @click="close" aria-label="뒤로가기">X</button>
          <div class="modal-title">사용자 정보</div>
        </header>

        <section class="center-area section">
          <div class="avatar-large">
            <img v-if="user && (user.avatarUrl || user.avatar)" :src="user.avatarUrl || user.avatar" alt="avatar" />
            <span v-else class="avatar-fallback-large">👤</span>
          </div>
          <div class="center-name">{{ user && (user.name || user.userName) ? (user.name || user.userName) : '알 수 없음' }}</div>
        </section>

        <section class="two-cols section">
          <div class="col">
            <div class="label">이메일</div>
            <div class="val">
              <template v-if="isEditMode && editingField === 'email'">
                <input v-model="form.email" />
              </template>
              <template v-else>
                {{ user && user.email ? user.email : '—' }}
              </template>
              <button v-if="isEditMode" class="inline-edit" @click.stop.prevent="toggleEditing('email')">✎</button>
            </div>
          </div>

          <div class="col">
            <div class="label">전화 번호</div>
            <div class="val">
              <template v-if="isEditMode && editingField === 'phone'">
                <input v-model="form.phone" />
              </template>
              <template v-else>
                {{ user && (user.phone || user.phoneNumber) ? (user.phone || user.phoneNumber) : '—' }}
              </template>
              <button v-if="isEditMode" class="inline-edit" @click.stop.prevent="toggleEditing('phone')">✎</button>
            </div>
          </div>
        </section>

        <section class="info-grid section">
          <div class="info-item">
            <div class="label">역할</div>
            <div class="val">
              <template v-if="isEditMode && editingField === 'role'">
                <select v-model="form.role">
                  <option value="ADMIN">관리자</option>
                  <option value="MENTOR">멘토</option>
                  <option value="USER">뉴비</option>
                </select>
              </template>
              <template v-else>
                {{ user && (user.roleLabel || user.role) ? (user.roleLabel || user.role) : '—' }}
              </template>
            </div>
          </div>

          <div class="info-item">
            <div class="label">부서</div>
            <div class="val">
              <template v-if="isEditMode && editingField === 'department'">
                <input v-model="form.department" />
              </template>
              <template v-else>
                {{ user && (user.department || user.departmentName) ? (user.department || user.departmentName) : '—' }}
              </template>
            </div>
          </div>

          <div class="info-item">
            <div class="label">입사일</div>
            <div class="val">
              <template v-if="isEditMode && editingField === 'joinDate'">
                <input type="date" v-model="form.joinDate" />
              </template>
              <template v-else>
                {{ formattedJoinDate }}
              </template>
            </div>
          </div>
        </section>

        <footer class="modal-actions section">
          <template v-if="!isEditMode">
            <button class="btn-outline" @click="enterEditMode">수정</button>
            <button class="btn-primary" @click="confirmDelete">삭제</button>
          </template>
          <template v-else>
            <button class="btn-outline" @click="cancelEdit">취소</button>
            <button class="btn-primary" @click="saveAll" :disabled="saving">완료</button>
          </template>
        </footer>

        <ConfirmDialog
          :show="showConfirm"
          title="사용자 삭제"
          :message="confirmMessage"
          confirmText="삭제"
          cancelText="취소"
          :danger="true"
          @confirm="doDelete"
          @cancel="showConfirm = false"
        />
      </div>
    </div>
  </transition>
</template>

<script>
import http from '@/services/http'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

export default {
  name: 'UserDetailpopup',
  components: { ConfirmDialog },
  props: {
    show: { type: Boolean, default: false },
    user: { type: Object, default: () => ({}) },
    mentors: { type: Array, default: () => [] }
  },
  emits: ['close', 'delete', 'saved'],
  data() {
    return {
      isEditMode: false,
      editingField: null,
      form: {},
      saving: false,
      error: null,
      showConfirm: false
    }
  },
  watch: {
    user: { immediate: true, handler(u) { this.form = u ? Object.assign({}, u) : {} } },
    show(val) { if (!val) { this.isEditMode = false; this.editingField = null } }
  },
  methods: {
    close() { this.$emit('close') },
    enterEditMode() { this.isEditMode = true; this.editingField = null; this.form = this.user ? Object.assign({}, this.user) : {} },
    toggleEditing(field) {
      if (this.editingField === field) { this.editingField = null }
      else {
        this.isEditMode = true
        this.editingField = field
        if (this.user) {
          switch (field) {
            case 'email': this.form.email = this.user.email || ''; break
            case 'phone': this.form.phone = this.user.phone || this.user.phoneNumber || ''; break
            case 'role': this.form.role = this.user.role || this.user.userRole || 'USER'; break
            case 'department': this.form.department = this.user.department || this.user.departmentName || ''; if (this.user.departmentId) this.form.departmentId = this.user.departmentId; break
            case 'joinDate': {
              const d = this.user.joinedAt || this.user.joinDate || this.user.hireDate || ''
              if (d) { const dt = new Date(d); if (!Number.isNaN(dt.getTime())) this.form.joinDate = dt.toISOString().slice(0,10); else this.form.joinDate = '' } else this.form.joinDate = ''
              break
            }
            default: break
          }
        }
      }
    },
    cancelEdit() { this.isEditMode = false; this.editingField = null; this.form = this.user ? Object.assign({}, this.user) : {}; this.error = null },
    async saveAll() {
      if (!this.user || !this.user.id) return
      this.saving = true; this.error = null
      try {
        const payload = {}
        if (this.form.email) payload.email = this.form.email
        if (this.form.phone || this.form.phoneNumber) payload.phoneNumber = this.form.phone || this.form.phoneNumber
        if (this.form.role) payload.role = this.form.role
        if (this.form.departmentId) payload.departmentId = this.form.departmentId
        else if (this.form.department) payload.departmentName = this.form.department
        if (this.form.joinDate) payload.joinDate = this.form.joinDate

        console.debug('[UserDetailpopup] PATCH payload:', payload)
        const resp = await http.patch(`/api/v1/admin/users/${this.user.id}`, payload)
        console.debug('[UserDetailpopup] PATCH resp:', resp && resp.data ? resp.data : resp)
        const updated = resp && resp.data ? resp.data : Object.assign({}, this.user, payload)
        this.$emit('saved', updated)
        this.isEditMode = false; this.editingField = null
      } catch (e) {
        console.error('Save failed', e)
        this.error = (e && e.response && e.response.data && (e.response.data.message || JSON.stringify(e.response.data))) || '저장 중 오류가 발생했습니다.'
      } finally { this.saving = false }
    },
    confirmDelete() { this.showConfirm = true },
    doDelete() { this.$emit('delete', this.user); this.showConfirm = false }
  },
  computed: {
    formattedJoinDate() {
      const d = this.user && (this.user.joinedAt || this.user.joinDate || this.user.hireDate) || ''
      if (!d) return '—'
      try { const dt = new Date(d); if (Number.isNaN(dt.getTime())) return d; const y = dt.getFullYear(); const m = String(dt.getMonth() + 1).padStart(2, '0'); const day = String(dt.getDate()).padStart(2, '0'); return `${y}-${m}-${day}` } catch (e) { return d }
    },
    confirmMessage() { const name = (this.user && (this.user.name || this.user.userName)) ? (this.user.name || this.user.userName) : '해당 사용자'; return `${name}님을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.` }
  }
}
</script>

<style scoped>
.detail-modal {
  --main-color: #294594;
  --muted: #64748b;
  --bg-soft: #f7f9fc;
  --radius: 10px;
  font-family: "Apple SD Gothic Neo", AppleSDGothicNeo, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Overlay */
.detail-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 10, 18, 0.48);
  z-index: 1400;
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  padding: 20px;
}

.detail-modal {
  width: 720px;
  max-width: 1000px;
  max-width: calc(100% - 48px);
  max-height: 92vh;
  overflow: auto;
  background: #fff;
  border-radius: 12px;
  padding: 20px 22px;
  box-shadow: 0 12px 40px rgba(3, 10, 18, 0.12);
  position: relative;
  display:flex;
  flex-direction:column;
}

.modal-top { position: relative; height: 52px; display:flex; align-items:center; justify-content:center }
.back-btn {
  position: absolute;
  left: 12px;
  top: 8px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  color: #4b5563;
}
.modal-title { font-size:18px; font-weight:700; color: var(--main-color); letter-spacing:0.2px }

.center-area { text-align:center; padding: 6px 0 14px 0 }
.avatar-large img { width: 100px; height:100px; border-radius:50%; object-fit:cover; border: 3px solid rgba(41,69,148,0.08); box-shadow: 0 8px 20px rgba(41,69,148,0.06) }
.avatar-fallback-large { display:inline-block; width:100px; height:100px; line-height:100px; border-radius:50%; background: linear-gradient(180deg,var(--bg-soft),#eef4ff); color:var(--main-color); font-size:36px; border: 2px solid rgba(41,69,148,0.06) }
.center-name { font-weight:700; margin-top:10px; font-size:20px; color:#10243b; letter-spacing:0.2px }

.two-cols { display:flex; gap:24px; padding: 12px 0; align-items:flex-start; flex-wrap:wrap }
.col { flex:1; min-width:200px }
.label { font-size:12px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.6px }
.val { margin-top:8px; color:#0f172a; display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:15px; font-weight:500 }

input[type="text"], input[type="date"], select {
  width:100%;
  padding:10px 12px;
  border:1px solid #eef3fb;
  border-radius:var(--radius);
  font-size:15px;
  color:#0f172a;
  box-sizing:border-box;
  background: #ffffff;
}

.inline-edit { background:transparent; border:none; color:var(--muted); cursor:pointer; padding:6px; font-size:14px }
.inline-edit:hover { color:var(--main-color) }

.info-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; padding-top:8px }
.info-item { background:transparent; padding:6px 4px }
.info-item .label { font-size:12px; font-weight:600; color:var(--muted); letter-spacing:0.5px }
.info-item .val { margin-top:6px; font-size:15px; color:#0f172a }

.mentors-area { padding-top:8px }
.mentor-list { margin-top:8px }
.mentor-card { display:flex; gap:12px; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.04) }
.mentor-left img { width:40px; height:40px; border-radius:50%; object-fit:cover }
.mentor-right { flex:1 }

.modal-actions { display:flex; justify-content:flex-end; gap:12px; padding-top:18px }
.btn-outline { background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 14px; border-radius:10px; color:var(--main-color); font-weight:600 }
.btn-outline:hover { background: rgba(41,69,148,0.06) }
.btn-primary { background: linear-gradient(90deg,var(--main-color),#2b57a0); color:#fff; padding:10px 16px; border-radius:12px; border:none; box-shadow: 0 12px 30px rgba(41,69,148,0.14); font-weight:800; letter-spacing:0.2px }
.btn-primary:disabled { opacity:0.6; cursor:not-allowed }

/* Section separators and spacing */
.section { padding: 14px 0; border-top: 1px solid rgba(41,69,148,0.06) }

/* Input focus */
input[type="text"]:focus, input[type="date"]:focus, select:focus {
  outline: none;
  border-color: rgba(41,69,148,0.36);
  box-shadow: 0 10px 30px rgba(41,69,148,0.08);
}

/* subtle transitions */
input, select, .btn-outline, .btn-primary { transition: all 180ms cubic-bezier(.2,.9,.2,1) }

/* scoped specificity */
.detail-modal .label { color: var(--muted) }
.detail-modal .val { color: #0f172a }

/* Responsive adjustments */
@media (max-width: 980px) {
  .info-grid { grid-template-columns: repeat(2, 1fr) }
}
@media (max-width: 640px) {
  .detail-modal { width: 100%; padding: 14px }
  .two-cols { flex-direction:column }
  .info-grid { grid-template-columns: 1fr }
  .avatar-large img, .avatar-fallback-large { width:84px; height:84px; line-height:84px }
  .center-name { font-size:16px }
  .modal-top { height:36px }
}

</style>
