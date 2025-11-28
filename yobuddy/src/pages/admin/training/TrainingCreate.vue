<template>
  <transition name="fade">
    <div class="detail-overlay" @click.self="close">
      <div class="detail-modal create-modal layout-vertical">
        <header class="modal-top">
          <h1 class="modal-title">새 교육 등록</h1>
          <button class="back-btn" @click="close" aria-label="닫기">x</button>
        </header>

        <section class="form-wrapper">
          <div v-if="error" class="form-error">{{ error }}</div>

          <label class="type-label">수업 형태</label>
          <div class="type-toggle">
            <button type="button" :class="['toggle-btn', form.type === 'ONLINE' && 'active']" @click="form.type = 'ONLINE'">온라인</button>
            <button type="button" :class="['toggle-btn', form.type === 'OFFLINE' && 'active']" @click="form.type = 'OFFLINE'">오프라인</button>
          </div>

          <div v-if="form.type === 'ONLINE'" class="field">
            <label class="field-label">온라인 교육 URL</label>
            <input v-model="form.onlineUrl" type="text" class="field-input" placeholder="온라인 교육의 URL을 입력하세요." />
          </div>

          <div class="field">
            <label class="field-label">교육명</label>
            <input v-model="form.title" type="text" class="field-input" placeholder="교육 이름을 입력하세요." />
          </div>

          <div class="field">
            <label class="field-label">설명</label>
            <textarea v-model="form.description" class="field-input textarea" placeholder="교육에 대한 상세한 설명을 입력하세요."></textarea>
          </div>

          <div class="field">
            <div class="attach-header">
              <label class="field-label">첨부 파일</label>
              <button type="button" class="btn-primary btn-small align-right" @click="openFilePicker">등록하기</button>
            </div>
            <div v-if="newFiles.length" class="attach-list">
              <div v-for="(file, idx) in newFiles" :key="file.name + idx" class="attach-chip">
                <span class="file-name">{{ file.name }}</span>
                <button type="button" class="chip-remove align-right" @click.stop="removeNewFile(file)">X</button>
              </div>
            </div>
            <div v-else class="file-empty">등록된 첨부 파일이 없습니다.</div>
            <input ref="fileInput" type="file" multiple @change="onFileChange" class="file-input-hidden" />
          </div>
        </section>

        <footer class="modal-actions">
          <button class="btn-outline" @click="close">취소</button>
          <button class="btn-primary" @click="onSubmit" :disabled="submitting">확인</button>
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
      form: { title: '', type: 'ONLINE', description: '', onlineUrl: '' },
      submitting: false,
      error: null,
      newFiles: [],
      selectedFiles: [],
      dynamicFileInput: null
    }
  },
  mounted() { },
  methods: {
    close() { this.$router.back ? this.$router.back() : this.$router.push('/admin/trainings') },
    openFilePicker() {
      let input = this.$refs.fileInput || this.dynamicFileInput
      if (!input) {
        input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.style.display = 'none'
        input.addEventListener('change', (event) => this.onFileChange(event))
        document.body.appendChild(input)
        this.dynamicFileInput = input
      }
      input.value = ''
      input.click()
    },
    onFileChange(e){
      const files = Array.from(e.target.files || [])
      if (!files.length) return
      this.selectedFiles = files
      this.newFiles = [...this.newFiles, ...files]
      const input = this.$refs.fileInput || this.dynamicFileInput
      if (input) input.value = ''
      this.selectedFiles = []
    },
    removeNewFile(file) {
      this.newFiles = this.newFiles.filter(f => f !== file)
    },
    async onSubmit() {
      // client-side validation
      this.error = null
      if (!this.form.title || !this.form.title.trim()) { this.error = '제목은 필수입니다.'; return }
      this.submitting = true
      const formData = new FormData()
      formData.append('title', this.form.title)
      formData.append('type', this.form.type)
      formData.append('description', this.form.description || '')
      if (this.form.type === 'ONLINE' && this.form.onlineUrl) formData.append('onlineUrl', this.form.onlineUrl)
      if (this.newFiles.length) {
        this.newFiles.forEach(file => formData.append('files', file))
      }
      try {
        await trainingService.create(formData)
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
.detail-modal { --main-color: #3255a4; background:#fff; border-radius:16px; padding:22px 24px; width:640px; max-width:calc(100% - 32px); box-shadow: 0 16px 44px rgba(0,0,0,0.12); border:1px solid rgba(0,0,0,0.06); }
.create-modal { gap:14px; }
.modal-top{ position:relative; display:flex; align-items:center; justify-content:flex-start; padding-right:32px; }
.back-btn{ margin-left:auto; border:none; background:transparent; font-size:20px; cursor:pointer; color:#6b7280 }
.modal-title{ font-weight:800; color:#111827; font-size:18px; }
.form-wrapper{ display:flex; flex-direction:column; gap:14px; padding-top:4px; }
.type-label{ font-weight:700; color:#1f2937; font-size:14px; margin-top: 10px; }
.type-toggle{ display:inline-flex; background:#e5e7eb; border-radius:16px; padding:0px; gap:4px; width:fit-content; }
.toggle-btn{ border:none; background:transparent; padding:8px 18px; border-radius:14px; font-weight:700; color:#4b5563; cursor:pointer; transition:all 0.2s; min-width:90px; }
.toggle-btn.active{ background:var(--main-color); color:#fff; box-shadow:0 6px 16px rgba(50,85,164,0.25); }
.field{ display:flex; flex-direction:column; gap:6px; }
.field-label{ font-weight:700; color:#1f2937; font-size:14px; }
.field-input{ width:100%; border:1px solid #d7e2ff; background:#eef3ff; border-radius:12px; padding:12px 14px; font-size:14px; color:#0f172a; }
.field-input::placeholder{ color:#9ca3af; }
.field-input.textarea{ min-height:120px; resize:vertical; line-height:1.5; }
.attach-header{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.attach-header .btn-primary{ margin-left:auto; }
.btn-small{ padding:6px 12px; font-size:13px; border-radius:10px; min-width:88px; }
.attach-list{ display:flex; flex-direction:column; gap:8px; margin-top:8px; }
.attach-chip{ display:flex; align-items:center; gap:8px; padding:10px 12px; border:1px solid #d7e2ff; border-radius:10px; background:#eef3ff; }
.chip-remove{ margin-left:auto; background:transparent; border:none; color:#9a1f2e; font-weight:700; cursor:pointer; padding:4px 6px; line-height:1; box-shadow:none; }
.chip-remove:focus{ outline:none; }
.align-right{ margin-left:auto; }
.file-empty{ color:#9ca3af; font-size:13px; margin-top:8px; }
.file-input-hidden{ display:none }
.modal-actions{ display:flex; justify-content:flex-end; gap:10px; padding-top:6px; }
.btn-outline{ background:transparent; border:1px solid rgba(50,85,164,0.35); padding:10px 16px; border-radius:12px; color:#3255a4; font-weight:700; cursor:pointer; }
.btn-primary{ background:linear-gradient(90deg,#3255a4,#2c4c96); color:#fff; padding:10px 18px; border-radius:12px; border:none; font-weight:800; cursor:pointer; box-shadow:0 12px 22px rgba(50,85,164,0.2); }
.form-error{ color:#b00020; font-weight:700; margin-top:4px; }
.detail-overlay{ position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(3, 10, 18, 0.48); z-index: 1400; -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); padding: 20px; }
.fade-enter-active, .fade-leave-active { transition: all 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.98); }
@media (max-width:640px){ .detail-modal{ width:100%; padding:16px } .type-toggle{ width:100%; justify-content:space-between; } }
</style>
