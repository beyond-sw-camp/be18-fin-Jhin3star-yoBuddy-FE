<template>
  <transition name="fade">
    <div v-if="show" class="detail-overlay" @click.self="close">
      <div class="detail-modal layout-vertical">
        <header class="modal-top">
          <button class="back-btn" @click="close" aria-label="뒤로가기">X</button>
          <div class="modal-title">사용자 등록</div>
        </header>

        <section class="center-area section">
          <div class="avatar-large">
            <span class="avatar-fallback-large">👤</span>
          </div>
          <div class="center-name">신규 사용자 등록</div>
          <div v-if="error" class="form-error">{{ error }}</div>
        </section>

        <section class="form-grid section">
          <div class="form-row">
            <label class="label">이름</label>
            <input v-model="form.name" type="text" />
          </div>
          <div class="form-row">
            <label class="label">비밀번호</label>
            <input v-model="form.password" type="password" />
          </div>
          <div class="form-row">
            <label class="label">전화 번호</label>
            <input v-model="form.phone" type="text" />
          </div>
          <div class="form-row">
            <label class="label">비밀번호 확인</label>
            <input v-model="form.confirmPassword" type="password" />
          </div>
          <div class="form-row">
            <label class="label">이메일</label>
            <input v-model="form.email" type="email" />
          </div>
          <div class="form-row">
            <label class="label">역할</label>
            <select v-model="form.role">
              <option value="USER">신입</option>
              <option value="MENTOR">멘토</option>
              <option value="ADMIN">관리자</option>
            </select>
          </div>
          <div class="form-row">
            <label class="label">부서</label>
            <select v-model="form.departmentId">
              <option v-for="d in departments" :key="d.id || d.departmentId" :value="d.id || d.departmentId">{{ d.name || d.departmentName || d.department }}</option>
            </select>
          </div>
          <div class="form-row">
            <label class="label">입사일</label>
            <input v-model="form.joinDate" type="date" />
          </div>
        </section>

        <footer class="modal-actions section">
          <div class="left-actions">
            <button class="btn-outline" @click="close">취소</button>
          </div>
          <div class="right-actions">
            <button class="btn-primary" @click="createUser" :disabled="saving">등록</button>
          </div>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import userService from '@/services/user'

export default {
  name: 'UserCreatePopup',
  props: { show: { type: Boolean, default: false } },
  emits: ['close', 'created'],
    data() {
    return {
      form: { name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'USER', departmentId: null, joinDate: '' },
      departments: [],
      saving: false,
      error: null
    }
  },
  watch: {
    show(val) { if (val) this.fetchDepartments(); else this.resetForm() }
  },
  methods: {
    resetForm() { this.form = { name: '', email: '', phone: '', role: 'USER', departmentId: null, joinDate: '' }; this.error = null },
    close() { this.$emit('close') },
    async fetchDepartments() {
      try {
        const list = await userService.getDepartments()
        this.departments = Array.isArray(list) ? list : []
      } catch (e) {
        this.departments = []
      }
    },
    async createUser() {
      // basic client-side validation
      if (!this.form.name || !this.form.email) {
        this.error = '이름과 이메일은 필수 항목입니다.'
        return
      }
      // password required and basic checks
      if (!this.form.password) {
        this.error = '비밀번호를 입력해주세요.'
        return
      }
      if (this.form.password.length < 8) {
        this.error = '비밀번호는 최소 8자 이상이어야 합니다.'
        return
      }
      if (this.form.password !== this.form.confirmPassword) {
        this.error = '비밀번호와 비밀번호 확인이 일치하지 않습니다.'
        return
      }
      // simple email format check
      const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
      if (!emailRe.test(this.form.email)) {
        this.error = '유효한 이메일 주소를 입력해주세요.'
        return
      }

      this.saving = true; this.error = null
      try {
        const payload = {
          name: this.form.name,
          email: this.form.email,
          password: this.form.password,
          phoneNumber: this.form.phone,
          role: this.form.role,
          departmentId: this.form.departmentId,
          joinDate: this.form.joinDate
        }
        const created = await userService.createUser(payload)
        this.$emit('created', created)
        this.close()
      } catch (e) {
        console.error('createUser failed', e)
        if (e && e.response) {
          try {
            const data = e.response.data
            this.error = data && (data.message || data.error || JSON.stringify(data)) || `서버 오류 (${e.response.status})`
          } catch (err) {
            this.error = `서버 오류 (${e.response.status})`
          }
        } else {
          this.error = (e && e.message) || '등록 중 오류가 발생했습니다.'
        }
      } finally { this.saving = false }
    }
  }
}
</script>

<style scoped>
.detail-modal { --main-color: #294594; background:#fff; border-radius:12px; padding:20px 22px; width:720px; max-width:calc(100% - 48px); }
.modal-top { position:relative; height:52px; display:flex; align-items:center; justify-content:center }
.back-btn{ position:absolute; left:12px; top:8px; border:none; background:transparent; font-size:18px; cursor:pointer }
.modal-title{ font-weight:700; color:var(--main-color) }
.center-area{ text-align:center; padding:10px 0 18px }
.avatar-fallback-large{ display:inline-block; width:100px; height:100px; line-height:100px; border-radius:50%; background: linear-gradient(180deg,#f7f9fc,#eef4ff); color:var(--main-color); font-size:36px }
.center-name{ font-weight:700; margin-top:10px }
.form-grid{ display:grid; grid-template-columns: repeat(2,1fr); gap:16px; padding-top:12px }
.form-row{ display:flex; flex-direction:column }
.form-row .label{ font-size:12px; color:#64748b; font-weight:600; margin-bottom:8px }
input, select{ padding:8px 10px; height:38px; border:1px solid #eef3fb; border-radius:10px }
.modal-actions{ display:flex; justify-content:space-between; padding-top:18px }
.btn-outline{ background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 14px; border-radius:10px }
.btn-primary{ background:linear-gradient(90deg,var(--main-color),#2b57a0); color:#fff; padding:10px 16px; border-radius:12px }

@media (max-width:640px){ .form-grid{ grid-template-columns:1fr } .detail-modal{ width:100%; padding:14px } }

/* Overlay + transition to behave like a real modal */
.detail-overlay{
  position: fixed;
  inset: 0;
  display:flex;
  align-items:center;
  justify-content:center;
  background: rgba(3, 10, 18, 0.48);
  z-index: 1400;
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  padding: 20px;
}

.fade-enter-active, .fade-leave-active { transition: all 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.98); }
</style>
