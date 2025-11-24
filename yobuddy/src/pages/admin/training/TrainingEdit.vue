<template>
  <transition name="fade">
    <div class="detail-overlay" @click.self="close">
      <div class="detail-modal layout-vertical">
        <header class="modal-top">
          <button class="back-btn" @click="close" aria-label="뒤로가기">X</button>
          <div class="modal-title">교육 수정</div>
        </header>

        <section class="content section">
          <div class="row">
            <div class="label">제목</div>
            <div class="val"><input v-model="form.title" type="text" /></div>
          </div>

          <div class="row">
            <div class="label">설명</div>
            <div class="val"><textarea v-model="form.description" class="desc-input small"></textarea></div>
          </div>

          <div class="row">
            <div class="label">유형</div>
            <div class="val">
              <select v-model="form.type">
                <option value="ONLINE">온라인</option>
                <option value="OFFLINE">오프라인</option>
              </select>
            </div>
          </div>

          <div class="row">
            <div class="label">부서</div>
            <div class="val">
              <select v-model="form.departmentId">
                <option value="">전체 부서</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.departmentName || d.name }}</option>
              </select>
            </div>
          </div>

          <div class="row">
            <div class="label">첨부파일</div>
            <div class="val"><input type="file" @change="onFileChange" /></div>
          </div>

          <div class="row" v-if="form.type === 'ONLINE'">
            <div class="label">온라인 URL</div>
            <div class="val"><input v-model="form.onlineUrl" type="text" /></div>
          </div>
        </section>

        <footer class="modal-actions">
          <button class="btn-outline" @click="close">취소</button>
          <button class="btn-primary" @click="onSubmit">저장</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import trainingService from '@/services/trainingService';

export default {
    name: 'TrainingEdit',
    data() { return { form: { title: '', description: '', type: 'ONLINE', departmentId: '', onlineUrl: '' }, loading: false, departments: [], file: null } },
    computed: { id() { return this.$route.params.id } },
    mounted() { this.fetch(); this.loadDepartments() },
    methods: {
      async loadDepartments(){ try{ const r = await (await import('@/services/departmentService')).getDepartments(); const data = r && r.data ? r.data : []; this.departments = Array.isArray(data) ? data : (data.content||[]) }catch(e){ console.error(e) } },
      close() { this.$router.back ? this.$router.back() : this.$router.push(`/admin/trainings/${this.id}`) },
      async fetch() {
        this.loading = true
        try {
          const resp = await trainingService.detail(this.id)
          const t = resp && resp.data ? resp.data : null
          if (t) {
            this.form.title = t.title || ''
            this.form.description = t.description || t.summary || ''
            this.form.type = t.type || 'ONLINE'
            this.form.departmentId = t.departmentId || ''
            this.form.onlineUrl = t.onlineUrl || t.link || ''
          }
        } catch (e) { console.error('fetch detail failed', e) }
        finally { this.loading = false }
      },
      onFileChange(e){ this.file = e.target.files && e.target.files[0] },
      async onSubmit() {
        const payload = { title: this.form.title, description: this.form.description, type: this.form.type }
        if(this.form.departmentId) payload.departmentId = this.form.departmentId
        if(this.form.type === 'ONLINE') payload.onlineUrl = this.form.onlineUrl || ''
        try {
          await trainingService.update(this.id, payload)
          this.$router.push(`/admin/trainings/${this.id}?toast=updated`)
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
.detail-modal { --main-color: #294594; background:#fff; border-radius:12px; padding:20px 22px; width:720px; max-width:calc(100% - 48px); margin:0 auto; }
.modal-top{ position:relative; height:52px; display:flex; align-items:center; justify-content:center }
.back-btn{ position:absolute; left:12px; top:8px; border:none; background:transparent; font-size:18px; cursor:pointer }
.modal-title{ font-weight:700; color:var(--main-color) }
.center-area{ display:none }
.form-grid{ display:block }
.content.section{ display:flex; flex-direction:column; gap:12px; align-items:center }
.row{ display:flex; gap:12px; align-items:center; margin-bottom:10px; width:100%; max-width:640px; margin-left:auto; margin-right:auto }
.label{ width:120px; color:#64748b; font-weight:700; text-align:left }
.val{ flex:1; width:380px; max-width:100% }
.val input, .val select, .val textarea{ width:100%; padding:8px; border-radius:6px; border:1px solid #e6eef8 }
.desc-row{ grid-column:1 / -1 }
.desc-box{ background:#f8fbff; border:1px solid #eef3fb; padding:12px; border-radius:8px; max-height:140px; overflow:auto; color:#10243b }
.desc-input{ width:100%; height:120px; border:none; resize:none; background:transparent }
.desc-input.small{ height:64px }
.modal-actions{ display:flex; justify-content:flex-end; gap:10px }
.btn-outline{ background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 12px; border-radius:8px }
.btn-primary{ background:#294594; color:#fff; padding:8px 12px; border-radius:8px; border:none }

/* Overlay */
.detail-overlay{ position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(3, 10, 18, 0.48); z-index: 1400; -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); padding: 20px; }

.fade-enter-active, .fade-leave-active { transition: all 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.98); }

@media (max-width:640px){ .form-grid{ grid-template-columns:1fr } .detail-modal{ width:100%; padding:14px } }
</style>
