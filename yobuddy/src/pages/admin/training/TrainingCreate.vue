<template>
  <transition name="fade">
    <div class="detail-overlay" @click.self="close">
      <div class="detail-modal layout-vertical">
        <header class="modal-top">
          <button class="back-btn" @click="close" aria-label="뒤로가기">X</button>
          <div class="modal-title">교육 등록</div>
        </header>

        <section class="center-area section">
          <div v-if="error" class="form-error">{{ error }}</div>
        </section>

        <section class="form-grid section">
          <div class="form-row">
            <label class="label">제목</label>
            <input v-model="form.title" type="text" />
          </div>

          <div class="form-row">
            <label class="label">유형</label>
            <select v-model="form.type">
              <option value="ONLINE">온라인</option>
              <option value="OFFLINE">오프라인</option>
            </select>
          </div>

          <div class="form-row description-row" style="grid-column: 1 / -1">
            <label class="label">설명</label>
            <textarea v-model="form.description" placeholder="교육에 대한 상세한 설명을 입력하세요."></textarea>
          </div>

          <div class="form-row">
            <label class="label">부서</label>
            <select v-model="form.departmentName">
              <option value="">전체 부서</option>
              <option v-for="d in departments" :key="d.id || d.departmentId" :value="d.name || d.departmentName || d.department">{{ d.name || d.departmentName || d.department }}</option>
            </select>
          </div>

          <div class="form-row" v-if="form.type === 'ONLINE'">
            <label class="label">온라인 URL</label>
            <input v-model="form.onlineUrl" type="text" placeholder="https://..." />
          </div>
        </section>

        <footer class="modal-actions section">
          <div class="left-actions"><button class="btn-outline" @click="close">취소</button></div>
          <div class="right-actions"><button class="btn-primary" @click="onSubmit" :disabled="submitting">등록</button></div>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import trainingService from '@/services/trainingService';

export default {
  name: 'TrainingCreate',
  data() {
    return {
      form: { title: '', type: 'ONLINE', description: '', departmentName: '', onlineUrl: '' },
      submitting: false,
      error: null,
      departments: []
    }
  },
  mounted() {
    this.fetchDepartments()
  },
  methods: {
    close() { this.$router.back ? this.$router.back() : this.$router.push('/admin/trainings') },
    async fetchDepartments() {
      try {
        const userService = await import('@/services/user')
        const list = await userService.default.getDepartments()
        this.departments = Array.isArray(list) ? list : []
      } catch (e) {
        this.departments = []
      }
    },
    async onSubmit() {
      // client-side validation
      this.error = null
      if (!this.form.title || !this.form.title.trim()) { this.error = '제목은 필수입니다.'; return }
      this.submitting = true
      const payload = {
        title: this.form.title,
        type: this.form.type,
        description: this.form.description,
        departmentName: this.form.departmentName
      }
      if (this.form.type === 'ONLINE' && this.form.onlineUrl) payload.onlineUrl = this.form.onlineUrl
      try {
        await trainingService.create(payload)
        this.$router.push({ path: '/admin/trainings', query: { toast: 'created' } })
      } catch (e) {
        console.error('create failed', e)
        this.error = (e && e.response && e.response.data && (e.response.data.message || JSON.stringify(e.response.data))) || (e && e.message) || '등록에 실패했습니다.'
      } finally { this.submitting = false }
    }
  }
}
</script>

<style scoped>
/* reuse modal styles from UserCreatePopup */
.detail-modal { --main-color: #294594; background:#fff; border-radius:12px; padding:20px 22px; width:720px; max-width:calc(100% - 48px); }
.modal-top{ position:relative; height:52px; display:flex; align-items:center; justify-content:center }
.back-btn{ position:absolute; left:12px; top:8px; border:none; background:transparent; font-size:18px; cursor:pointer }
.modal-title{ font-weight:700; color:var(--main-color) }
.center-area{ text-align:center; padding:10px 0 18px }
.avatar-fallback-large{ display:inline-block; width:100px; height:100px; line-height:100px; border-radius:50%; background: linear-gradient(180deg,#f7f9fc,#eef4ff); color:var(--main-color); font-size:36px }
.center-name{ font-weight:700; margin-top:10px }
.form-grid{ display:grid; grid-template-columns: repeat(2,1fr); gap:16px; padding-top:12px }
.form-row{ display:flex; flex-direction:column }
.form-row .label{ font-size:12px; color:#64748b; font-weight:600; margin-bottom:8px }
input, select{ padding:8px 10px; height:38px; border:1px solid #eef3fb; border-radius:10px }
textarea{ padding:10px; border:1px solid #eef3fb; border-radius:10px; min-height:96px; resize:vertical }
.modal-actions{ display:flex; justify-content:space-between; padding-top:18px }
.btn-outline{ background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 14px; border-radius:10px }
.btn-primary{ background:linear-gradient(90deg,var(--main-color),#2b57a0); color:#fff; padding:10px 16px; border-radius:12px }
.form-error{ color:#b00020; font-weight:700; margin-top:8px }

/* Overlay */
.detail-overlay{ position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(3, 10, 18, 0.48); z-index: 1400; -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); padding: 20px; }

.fade-enter-active, .fade-leave-active { transition: all 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.98); }

@media (max-width:640px){ .form-grid{ grid-template-columns:1fr } .detail-modal{ width:100%; padding:14px } }
</style>
