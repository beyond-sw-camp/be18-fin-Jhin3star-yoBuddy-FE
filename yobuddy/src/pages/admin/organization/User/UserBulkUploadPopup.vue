<template>
  <transition name="fade">
    <div v-if="show" class="detail-overlay" @click.self="close">
      <div :class="['detail-modal layout-vertical', { 'preview-mode': isPreviewMode }]">
        <header class="modal-top">
          <div class="modal-title">일괄 등록</div>
          <button class="back-btn" @click="close" aria-label="뒤로가기">X</button>
        </header>

        <section class="section upload-area" v-if="!file">
          <div class="dropbox" @dragover.prevent @drop.prevent="onDrop" @click="openFilePicker">
            <div class="dropbox-inner">
              <div class="icon">⬆️</div>
              <div class="hint">업로드를 위해 클릭하거나 파일을 끌어다 놓으세요.</div>
              <div class="sub">.xlsx 파일만 가능합니다.</div>
            </div>
            <input ref="fileInput" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" @change="onFileChange" style="display:none" />
          </div>

        </section>

        <section class="section preview-only" v-if="file && previewRows && previewRows.length">
          <div class="file-info">선택된 파일: <strong>{{ fileName }}</strong></div>
          <div v-if="error" class="form-error">{{ error }}</div>
          <div v-if="result" class="result">{{ result }}</div>

          <div class="preview-area preview-large">
            <div class="preview-header">
              <strong>미리보기</strong>
              <button class="btn-outline small" @click="showAllPreview = !showAllPreview">{{ showAllPreview ? '상위 5개 보기' : '전체 보기' }}</button>
            </div>
            <div class="preview-table-wrap">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th style="width:40px"><input type="checkbox" :checked="allSelectedVisible" @change="toggleSelectAll($event.target.checked)" /></th>
                    <th v-for="col in previewColumns" :key="col.key">{{ col.label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in (showAllPreview ? parsedUsers : previewRows)" :key="idx" :class="{selected: row.__selected}">
                    <td><input type="checkbox" v-model="row.__selected" /></td>
                    <td v-for="col in previewColumns" :key="col.key">{{ row[col.key] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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
import * as XLSX from 'xlsx'

export default {
  name: 'UserBulkUploadPopup',
  props: { show: { type: Boolean, default: false } },
  emits: ['close','uploaded'],
  data() {
    return { file: null, fileName: '', uploading: false, error: null, result: null, parsedUsers: [], previewRows: [], showAllPreview: false }
  },

  computed: {
    previewColumns() {
      // return array of { key, label } to render Korean headers while using keys for values
      return [
        { key: 'name', label: '이름' },
        { key: 'email', label: '이메일' },
        { key: 'phoneNumber', label: '전화번호' },
        { key: 'role', label: '역할' },
        { key: 'departmentName', label: '부서' },
        { key: 'joinDate', label: '입사일' }
      ]
    }
    ,
    allSelectedVisible() {
      const list = this.showAllPreview ? this.parsedUsers : this.previewRows
      if (!list || !list.length) return false
      return list.every(r => r.__selected)
    }
    ,
    isPreviewMode() {
      return !!this.file && Array.isArray(this.parsedUsers) && this.parsedUsers.length > 0
    }
  },
  methods: {
    close() { this.$emit('close'); this.reset() },
    reset() { this.file = null; this.fileName = ''; this.uploading = false; this.error = null; this.result = null },
    openFilePicker() { this.$refs.fileInput && this.$refs.fileInput.click() },
    toggleSelectAll(checked) { const list = this.showAllPreview ? this.parsedUsers : this.previewRows; list.forEach(r => { r.__selected = checked }) },
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
      // parse immediately
      this.parseFile(f).catch(err => {
        console.error('parseFile error', err)
        this.error = '파일을 파싱하는 중 오류가 발생했습니다. 파일 포맷을 확인하세요.'
        this.parsedUsers = []
        this.previewRows = []
      })
    },
    async parseFile(file) {
      // read file as arrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const wb = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = wb.SheetNames && wb.SheetNames[0]
      if (!firstSheetName) throw new Error('시트가 없습니다.')
      const ws = wb.Sheets[firstSheetName]
      // convert to json using header row
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })
      if (!Array.isArray(raw) || raw.length === 0) {
        this.error = '엑셀 파일에 데이터가 없습니다.'
        this.parsedUsers = []
        this.previewRows = []
        return
      }

      // fetch departments to map department name -> id (if possible)
      let departments = []
      try {
        departments = await userService.getDepartments()
      } catch (err) {
        // ignore, we'll keep department as-is (string)
        departments = []
      }
      const deptMap = {}
      if (Array.isArray(departments)) {
        departments.forEach(d => {
          const possibleNames = [d.name, d.departmentName, d.department]
          possibleNames.forEach(n => {
            if (n) deptMap[String(n).toLowerCase()] = d.id || d.departmentId || d.id
          })
        })
      }
      const idToDeptName = {}
      if (Array.isArray(departments)) {
        departments.forEach(d => {
          const id = d.id || d.departmentId || d.id
          idToDeptName[id] = d.name || d.departmentName || d.department || ''
        })
      }

      // normalize headers and map to API payload fields
      const mapped = raw.map((row, idx) => {
        // helper to get value by possible header names
        const get = (...keys) => {
          for (const k of keys) {
            if (k in row && row[k] !== '') return row[k]
            const lower = Object.keys(row).find(h => h && h.toString().toLowerCase() === k.toString().toLowerCase())
            if (lower && row[lower] !== '') return row[lower]
          }
          return ''
        }

        const name = get('name', '이름', 'Name')
        const email = get('email', '이메일', 'Email')
        const password = get('password', '비밀번호', 'Password')
        const phone = get('phone', 'phoneNumber', '전화번호', 'Phone')
        const role = get('role', '역할', 'Role') || 'USER'
        const departmentCell = get('departmentId', 'department', '부서', 'departmentId')
        const joinDate = get('joinDate', '입사일', 'JoinDate')

        // map role text to API enum
        const mapRole = (r) => {
          if (!r) return 'USER'
          const s = String(r).toLowerCase()
          if (s.includes('뉴') || s.includes('user') || s.includes('유저')) return 'USER'
          if (s.includes('멘토') || s.includes('mentor')) return 'MENTOR'
          if (s.includes('관리') || s.includes('admin')) return 'ADMIN'
          return 'USER'
        }

        // map joinDate to yyyy-mm-dd if possible
        const formatDate = (val) => {
          if (!val) return ''
          if (val instanceof Date && !isNaN(val)) {
            const y = val.getFullYear(); const m = String(val.getMonth()+1).padStart(2,'0'); const d = String(val.getDate()).padStart(2,'0');
            return `${y}-${m}-${d}`
          }
          // sometimes Excel returns numbers (serial), but sheet_to_json usually returns Date or string
          // try parseable string
          const s = String(val).trim()
          const dt = new Date(s)
          if (!isNaN(dt)) {
            const y = dt.getFullYear(); const m = String(dt.getMonth()+1).padStart(2,'0'); const d = String(dt.getDate()).padStart(2,'0');
            return `${y}-${m}-${d}`
          }
          return s
        }

        // resolve department id by name if possible and keep department display name
        let resolvedDepartmentId = null
        let departmentNameValue = ''
        if (departmentCell !== '') {
          const key = String(departmentCell).toLowerCase()
          if (deptMap[key]) {
            resolvedDepartmentId = deptMap[key]
            departmentNameValue = idToDeptName[resolvedDepartmentId] || String(departmentCell).trim()
          } else if (!isNaN(Number(departmentCell))) {
            resolvedDepartmentId = Number(departmentCell)
            departmentNameValue = idToDeptName[resolvedDepartmentId] || String(departmentCell)
          } else {
            resolvedDepartmentId = String(departmentCell)
            departmentNameValue = String(departmentCell).trim()
          }
        }

        return {
          name: String(name).trim(),
          email: String(email).trim(),
          password: password ? String(password) : 'Password123!',
          phoneNumber: phone ? String(phone).trim() : '',
          role: mapRole(role),
          departmentId: resolvedDepartmentId === '' ? null : resolvedDepartmentId,
          departmentName: departmentNameValue,
          joinDate: formatDate(joinDate) ,
          __rowNum: idx + 2 // for useful error messages (assuming header on row 1)
        }
      })

      // basic validation: require name and email
      const invalid = mapped.filter(u => !u.name || !u.email)
      if (invalid.length) {
        this.error = `필수 칼럼 누락: 이름 또는 이메일이 비어있는 행이 ${invalid.length}개 있습니다. 첫 행 번호: ${invalid[0].__rowNum}`
        this.parsedUsers = []
        this.previewRows = mapped.slice(0, 5)
        return
      }

      // keep meta fields (__rowNum) for reference and add __selected flag
      this.parsedUsers = mapped.map(m => ({ ...m, __selected: true }))
      // previewRows should reference same objects so selection is synced
      this.previewRows = this.parsedUsers.slice(0, 5)
      this.error = null
      this.result = `${this.parsedUsers.length}명의 사용자 데이터가 파싱되었습니다.`
    },
    async upload() {
      if (!this.file) { this.error = '업로드할 파일을 선택하세요.'; return }
      if (!this.parsedUsers || !this.parsedUsers.length) { this.error = '파싱된 사용자 데이터가 없습니다.'; return }
      // only send selected rows
      const toSend = (this.parsedUsers || []).filter(p => p.__selected).map(p => { const copy = { ...p }; delete copy.__rowNum; delete copy.__selected; return copy })
      if (!toSend.length) { this.error = '업로드할 사용자를 하나 이상 선택하세요.'; return }
      this.uploading = true; this.error = null; this.result = null
      try {
        const resp = await userService.createUsers(toSend)
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
.detail-modal.preview-mode{ width:920px }
/* header */
.modal-top{ display:flex; align-items:center; justify-content:space-between; gap:12px }
.modal-title{ font-size:18px; font-weight:700; color:#10243b }
.back-btn{ position:absolute; right:12px; top:8px; background:transparent; border:1px solid rgba(16,36,59,0.06); padding:6px 10px; border-radius:8px; cursor:pointer; font-weight:600 }
.back-btn:hover{ background:rgba(41,69,148,0.06) }
.upload-area{ text-align:center; padding:20px 0 }
.dropbox{ border:2px dashed rgba(16,36,59,0.12); background:#fafcff; padding:28px; border-radius:10px; cursor:pointer }
.dropbox-inner{ padding:8px }
.icon{ font-size:28px; margin-bottom:8px }
.hint{ font-weight:700; color:#10243b }
.sub{ color:#94a3b8; font-size:13px; margin-top:6px }
.file-info{ margin-top:12px; color:#10243b }
.result{ margin-top:8px; color:green }
.form-error{ margin-top:8px; color:#b91c1c }
.modal-actions{ display:flex; justify-content:center; gap:12px; padding-top:18px }
.btn-outline{ background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 14px; border-radius:10px }
.btn-primary{ background:linear-gradient(90deg,var(--main-color),#2b57a0); color:#fff; padding:10px 16px; border-radius:12px }

.preview-area{ text-align:left; margin-top:16px }
.preview-header{ display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px }
.preview-table-wrap{ overflow:auto; max-height:240px }
.preview-area.preview-large .preview-table-wrap{ max-height:520px }
.preview-table{ width:100%; border-collapse:collapse; font-size:15px }
.preview-table td{ padding:12px 14px }
.preview-table th, .preview-table td{ border:1px solid #eef3fb; padding:10px 12px; text-align:left }
.btn-outline.small{ padding:6px 8px; font-size:13px }
.preview-table tr.selected{ background: #f3f6ff }
.preview-table th:first-child, .preview-table td:first-child{ text-align:center; width:40px }

/* simple fade transition used by <transition name="fade"> */
.fade-enter-active, .fade-leave-active { transition: all 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.98); }

@media (max-width:920px){ .detail-modal{ width:92%; padding:14px } .preview-table{ min-width:700px } }
@media (max-width:640px){ .detail-modal{ width:100%; padding:14px } .preview-table{ min-width:480px } }
</style>
