<template>
  <transition name="fade">
    <div v-if="show" class="detail-overlay" @click.self="close">
      <div class="detail-modal layout-vertical">
        <header class="modal-top">
          <button class="back-btn" @click="close" aria-label="뒤로가기">X</button>
          <div class="modal-title">일괄 등록</div>
        </header>

        <section class="section upload-area">
          <div class="dropbox" @dragover.prevent @drop.prevent="onDrop" @click="openFilePicker">
            <div class="dropbox-inner">
              <div class="icon">⬆️</div>
              <div class="hint">업로드를 위해 클릭하거나 파일을 끌어다 놓으세요.</div>
              <div class="sub">.xlsx 파일만 가능합니다.</div>
            </div>
            <input ref="fileInput" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" @change="onFileChange" style="display:none" />
          </div>

          <div v-if="fileName" class="file-info">선택된 파일: <strong>{{ fileName }}</strong></div>
          <div v-if="error" class="form-error">{{ error }}</div>
          <div v-if="result" class="result">{{ result }}</div>
        </section>

        <footer class="modal-actions section">
          <div class="left-actions">
            <button class="btn-outline" @click="close">취소</button>
          </div>
          <div class="right-actions">
            <button class="btn-primary" @click="upload" :disabled="!file || uploading">업로드</button>
          </div>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import userService from '@/services/user'

export default {
  name: 'UserBulkUploadPopup',
  props: { show: { type: Boolean, default: false } },
  emits: ['close','uploaded'],
  data() {
    return { file: null, fileName: '', uploading: false, error: null, result: null }
  },
  methods: {
    close() { this.$emit('close'); this.reset() },
    reset() { this.file = null; this.fileName = ''; this.uploading = false; this.error = null; this.result = null },
    openFilePicker() { this.$refs.fileInput && this.$refs.fileInput.click() },
    onFileChange(e) {
      const f = e.target && e.target.files && e.target.files[0]
      if (!f) return
      this.setFile(f)
    },
    onDrop(e) {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
      if (!f) return
      this.setFile(f)
    },
    setFile(f) {
      // basic type check
      const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      if (!allowed.includes(f.type) && !f.name.endsWith('.xlsx')) {
        this.error = '지원하지 않는 파일 형식입니다. .xlsx 파일을 올려주세요.'
        return
      }
      this.file = f
      this.fileName = f.name
      this.error = null
    },
    async upload() {
      if (!this.file) { this.error = '업로드할 파일을 선택하세요.'; return }
      this.uploading = true; this.error = null; this.result = null
      try {
        const resp = await userService.bulkCreate(this.file)
        this.result = '업로드 완료'
        this.$emit('uploaded', resp)
        this.close()
      } catch (e) {
        console.error('bulk upload failed', e)
        if (e && e.response && e.response.data) this.error = e.response.data.message || JSON.stringify(e.response.data)
        else this.error = e && e.message ? e.message : '업로드 중 오류가 발생했습니다.'
      } finally { this.uploading = false }
    }
  },
  watch: {
    show(val) { if (!val) this.reset() }
  }
}
</script>

<style scoped>
/* Overlay + centered modal */
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

.detail-modal { --main-color: #294594; background:#fff; border-radius:12px; padding:20px 22px; width:720px; max-width:calc(100% - 48px); }
.upload-area{ text-align:center; padding:20px 0 }
.dropbox{ border:2px dashed rgba(16,36,59,0.12); background:#fafcff; padding:28px; border-radius:10px; cursor:pointer }
.dropbox-inner{ padding:8px }
.icon{ font-size:28px; margin-bottom:8px }
.hint{ font-weight:700; color:#10243b }
.sub{ color:#94a3b8; font-size:13px; margin-top:6px }
.file-info{ margin-top:12px; color:#10243b }
.result{ margin-top:8px; color:green }
.form-error{ margin-top:8px; color:#b91c1c }
.modal-actions{ display:flex; justify-content:space-between; padding-top:18px }
.btn-outline{ background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 14px; border-radius:10px }
.btn-primary{ background:linear-gradient(90deg,var(--main-color),#2b57a0); color:#fff; padding:10px 16px; border-radius:12px }

/* simple fade transition used by <transition name="fade"> */
.fade-enter-active, .fade-leave-active { transition: all 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.98); }

@media (max-width:640px){ .detail-modal{ width:100%; padding:14px } }
</style>
