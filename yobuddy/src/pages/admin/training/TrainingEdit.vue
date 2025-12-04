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

          <div class="row attachments-row">
            <div class="label">첨부 파일</div>
            <div class="val attach-val">
              <div class="file-input-row">
                <input ref="fileInput" type="file" multiple @change="onFileChange" class="file-input-hidden" />
                <button type="button" class="btn-primary small" @click="openFilePicker">등록하기</button>
              </div>
              <div v-if="attachments.length" class="attach-list">
                <div v-for="file in attachments" :key="file.fileId || file.id" class="attach-item">
                  <span class="file-name">{{ file.filename || file.originalName || file.name }}</span>
                  <button type="button" class="btn-remove" @click="removeAttachment(file)">x</button>
                </div>
              </div>
              <div v-if="newFiles.length" class="attach-list pending-list">
                <div v-for="(file, idx) in newFiles" :key="file.name + idx" class="attach-item">
                  <span class="file-name">{{ file.name }}</span>
                  <button type="button" class="btn-remove" @click="removeNewFile(file)">x</button>
                </div>
              </div>
              <div v-if="!attachments.length && !newFiles.length" class="file-empty">등록된 첨부 파일 없음</div>
            </div>
          </div>

          <div class="row" :style="{ opacity: form.type === 'OFFLINE' ? 0.66 : 1, pointerEvents: form.type === 'OFFLINE' ? 'none' : 'auto' }">
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
  data() {
    return {
      form: { title: '', description: '', type: 'ONLINE', onlineUrl: '' },
      loading: false,
      attachments: [],
      newFiles: [],
      selectedFiles: [],
      removeFileIds: [],
      dynamicFileInput: null,
      originalForm: { title: '', description: '', type: 'ONLINE', onlineUrl: '' }
    }
  },
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
          this.form.description = t.description || t.summary || ''
          this.form.type = t.type || 'ONLINE'
          this.form.onlineUrl = t.onlineUrl || t.link || ''
          this.attachments = Array.isArray(t.attachedFiles) ? [...t.attachedFiles] : Array.isArray(t.trainingFiles) ? [...t.trainingFiles] : []
          this.removeFileIds = []
          this.newFiles = []
          this.selectedFiles = []
          this.originalForm = { title: this.form.title, description: this.form.description, type: this.form.type, onlineUrl: this.form.onlineUrl || '' }
        }
      } catch (e) { console.error('fetch detail failed', e) }
      finally { this.loading = false }
    },
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
    onFileChange(e) {
      const files = Array.from(e.target.files || [])
      if (!files.length) return
      this.selectedFiles = files
      this.newFiles = [...this.newFiles, ...files]
      const input = this.$refs.fileInput || this.dynamicFileInput
      if (input) input.value = ''
      this.selectedFiles = []
    },
    removeAttachment(file) {
      this.attachments = this.attachments.filter(f => f !== file)
      const fileId = file && (file.fileId || file.id)
      if (fileId && !this.removeFileIds.includes(fileId)) this.removeFileIds.push(fileId)
    },
    removeNewFile(file) {
      this.newFiles = this.newFiles.filter(f => f !== file)
    },
    async onSubmit() {
      const formData = new FormData()
      const changed = []
      const addChanged = (key, value) => { formData.append(key, value); changed.push(key) }

      if (this.form.title !== this.originalForm.title) addChanged('title', this.form.title)
      if (this.form.description !== this.originalForm.description) addChanged('description', this.form.description)
      if (this.form.type !== this.originalForm.type) addChanged('type', this.form.type)

      if (this.form.type === 'ONLINE') {
        if (this.form.onlineUrl !== this.originalForm.onlineUrl || this.form.type !== this.originalForm.type) addChanged('onlineUrl', this.form.onlineUrl || '')
      } else if (this.originalForm.type === 'ONLINE') {
        addChanged('onlineUrl', '')
      }

      if (this.removeFileIds.length) addChanged('removeFileIds', this.removeFileIds.join(','))

      if (this.newFiles.length) {
        this.newFiles.forEach(file => formData.append('files', file))
        changed.push('files')
      }

      if (!changed.length) {
        alert('첨부 파일 길이 초과')
        return
      }

      try {
        await trainingService.update(this.id, formData)
        this.$router.push(`/admin/trainings/${this.id}?toast=updated`)
      } catch (e) {
        console.error('update failed', e)
        alert('첨부 파일 등록에 실패했습니다.')
      }
    }
  }
}
</script>

<style scoped>
/* reuse modal styles from UserCreatePopup */
.detail-modal { --main-color: #294594; background:#fff; border-radius:12px; padding:20px 22px; width:720px; max-width:calc(100% - 48px); margin:0 auto; }
.modal-top{ position:relative; height:52px; display:flex; align-items:center; justify-content:center }
.back-btn{ position:absolute; right:12px; top:8px; border:none; background:transparent; font-size:18px; cursor:pointer }
.modal-title{ font-weight:700; color:var(--main-color) }
.center-area{ display:none }
.form-grid{ display:block }
.content.section{ display:flex; flex-direction:column; gap:12px; align-items:center }
.row{ display:flex; gap:12px; align-items:center; margin-bottom:10px; width:100%; max-width:640px; margin-left:auto; margin-right:auto }
.attachments-row{ align-items:flex-start }
.label{ width:120px; color:#64748b; font-weight:700; text-align:left }
.val{ flex:1; width:380px; max-width:100% }
.attach-val{ display:flex; flex-direction:column; gap:8px; width:100% }
.file-input-row{ display:flex; gap:8px; align-items:center; flex-wrap:wrap }
.attach-list{ display:flex; flex-direction:column; gap:6px }
.attach-item{ display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px solid #eef3fb; border-radius:8px; background:#fff }
.pending-list .attach-item{ background:#fff; border-style:dashed }
.btn-remove{ margin-left:auto; background:transparent; border:none; color:#9a1f2e; font-weight:700; cursor:pointer; padding:4px 6px }
.file-empty{ color:#94a3b8; font-size:13px }
.file-input-hidden{ display:none }
.file-name{ flex:1; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.val input, .val select, .val textarea{ width:100%; padding:8px; border-radius:6px; border:1px solid #e6eef8 }
.desc-row{ grid-column:1 / -1 }
.desc-box{ background:#f8fbff; border:1px solid #eef3fb; padding:12px; border-radius:8px; max-height:140px; overflow:auto; color:#10243b }
.desc-input{ width:100%; height:120px; border:none; resize:none; background:transparent }
.desc-input.small{ height:64px }
.modal-actions{ display:flex; justify-content:center; gap:10px }
.btn-outline{ background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 12px; border-radius:8px }
.btn-primary{ background:#294594; color:#fff; padding:8px 12px; border-radius:8px; border:none }
.btn-primary.small{ padding:6px 10px; font-size:13px }

/* Overlay */
.detail-overlay{ position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(3, 10, 18, 0.48); z-index: 1400; -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); padding: 20px; }

.fade-enter-active, .fade-leave-active { transition: all 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.98); }

@media (max-width:640px){ .form-grid{ grid-template-columns:1fr } .detail-modal{ width:100%; padding:14px } }
</style>
