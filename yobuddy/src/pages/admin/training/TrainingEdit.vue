<template>
  <transition name="fade">
    <div class="detail-overlay" @click.self="close">
      <div class="detail-modal layout-vertical">
        <header class="modal-top">
          <button class="back-btn" @click="close" aria-label="뒤로가기">X</button>
          <div class="modal-title">교육 수정</div>
        </header>

        <section class="center-area section">
          <div class="avatar-large"><span class="avatar-fallback-large">📘</span></div>
          <div class="center-name">교육 정보 수정</div>
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
          <div class="form-row">
            <label class="label">부서</label>
            <input v-model="form.departmentName" type="text" />
          </div>
          <div class="form-row">
            <label class="label">할당된 프로그램들 (쉼표로 구분)</label>
            <input v-model="form.assignedProgramsText" type="text" />
          </div>
        </section>

        <footer class="modal-actions section">
          <div class="left-actions"><button class="btn-outline" @click="close">취소</button></div>
          <div class="right-actions"><button class="btn-primary" @click="onSubmit">저장</button></div>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import trainingService from '@/services/trainingService';

export default {
    name: 'TrainingEdit',
    data() { return { form: { title: '', type: 'ONLINE', departmentName: '', assignedProgramsText: '' }, loading: false } },
    computed: { id() { return this.$route.params.id } },
    mounted() { this.fetch() },
    methods: {
      close() { this.$router.back ? this.$router.back() : this.$router.push(`/admin/trainings/${this.id}`) },
      async fetch() {
        this.loading = true
        try {
          const resp = await trainingService.detail(this.id)
          const t = resp && resp.data ? resp.data : null
          if (t) {
            this.form.title = t.title || ''
            this.form.type = t.type || 'ONLINE'
            this.form.departmentName = t.departmentName || t.department || ((t.assignedPrograms && t.assignedPrograms[0] && (t.assignedPrograms[0].departmentName || t.assignedPrograms[0].department)) ? (t.assignedPrograms[0].departmentName || t.assignedPrograms[0].department) : '')
            this.form.assignedProgramsText = (t.assignedPrograms || []).map(p => p.programName || p.name || '').join(', ')
            this.form.onlineUrl = t.onlineUrl || ''
          }
        } catch (e) { console.error('fetch detail failed', e) }
        finally { this.loading = false }
      },
      async onSubmit() {
        const payload = {
          title: this.form.title,
          type: this.form.type,
          departmentName: this.form.departmentName,
          assignedPrograms: this.form.assignedProgramsText ? this.form.assignedProgramsText.split(',').map(s => ({ programName: s.trim() })) : [],
          onlineUrl: this.form.type === 'ONLINE' ? (this.form.onlineUrl || '') : undefined
        }
        try {
          await trainingService.update(this.id, payload)
          this.$router.push(`/admin/trainings/${this.id}`)
        } catch (e) {
          console.error('update failed', e)
          alert('수정에 실패했습니다.')
        }
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
.modal-actions{ display:flex; justify-content:space-between; padding-top:18px }
.btn-outline{ background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 14px; border-radius:10px }
.btn-primary{ background:linear-gradient(90deg,var(--main-color),#2b57a0); color:#fff; padding:10px 16px; border-radius:12px }

/* Overlay */
.detail-overlay{ position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(3, 10, 18, 0.48); z-index: 1400; -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); padding: 20px; }

.fade-enter-active, .fade-leave-active { transition: all 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.98); }

@media (max-width:640px){ .form-grid{ grid-template-columns:1fr } .detail-modal{ width:100%; padding:14px } }
</style>
