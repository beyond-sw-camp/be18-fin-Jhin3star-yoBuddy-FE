<template>
  <div v-if="visible" class="kpi-modal-overlay" @click.self="close">
    <div class="kpi-modal">
      <header class="kpi-modal-header">
        <h3 class="kpi-modal-title">{{ category?.name || '카테고리 상세' }}</h3>
        <button class="kpi-modal-close" @click="close" aria-label="닫기">×</button>
      </header>
      <div class="kpi-modal-body">
        <template v-if="editMode">
          <div class="form-row">
            <label>이름</label>
            <input v-model="form.name" placeholder="카테고리 이름을 입력하세요" />
          </div>
          <div class="form-row">
            <label>설명</label>
            <textarea v-model="form.description" placeholder="설명을 입력하세요" rows="4"></textarea>
          </div>
        </template>
        <template v-else>
          <dl>
            <dt>ID</dt>
            <dd>{{ category?.id ?? '-' }}</dd>
            <dt>이름</dt>
            <dd>{{ category?.name ?? '-' }}</dd>
            <dt>설명</dt>
            <dd>{{ category?.description ?? '없음' }}</dd>
          </dl>
        </template>
      </div>
      <footer class="kpi-modal-actions">
        <template v-if="editMode">
          <button class="btn-outline" @click="isNew ? close() : (editMode = false)">취소</button>
          <button class="btn-primary" @click="save">저장</button>
        </template>
        <template v-else>
          <button class="btn-outline" @click="close">닫기</button>
          <button class="btn-danger" @click="confirmDelete">삭제</button>
          <button class="btn-primary" @click="toggleEdit">편집</button>
        </template>
      </footer>
    </div>
  </div>
</template>

<script>
import kpiService from '@/services/kpiService'

export default {
  name: 'KpiCategoryDetailPopup',
  props: {
    visible: { type: Boolean, default: false },
    category: { type: Object, default: () => ({}) },
    isNew: { type: Boolean, default: false }
  },
  emits: ['close', 'edit', 'saved'],
  data() {
    return {
      form: {
        name: this.category && this.category.name ? this.category.name : '',
        description: this.category && this.category.description ? this.category.description : ''
      },
      editMode: this.isNew,
      saving: false,
      error: null
    }
  },
  watch: {
    category(newVal) {
      this.form = { name: newVal?.name || '', description: newVal?.description || '' }
      if (!this.isNew) this.editMode = false
    },
    isNew(n) {
      this.editMode = !!n
      if (n && (!this.form || !this.form.name)) this.form = { name: '', description: '' }
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    toggleEdit() {
      this.editMode = true
    },
      async confirmDelete() {
        if (!this.category) return
        const id = this.category.id || this.category.kpiCategoryId || this.category.categoryId || this.category._id
        if (!id) return
        const ok = window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')
        if (!ok) return
        this.saving = true
        this.error = null
        try {
          await kpiService.deleteCategory(id)
          this.$emit('deleted', id)
          this.close()
        } catch (e) {
          console.error('delete failed', e)
          this.error = e && e.response && e.response.data ? (e.response.data.message || JSON.stringify(e.response.data)) : (e.message || '삭제 중 오류')
        } finally {
          this.saving = false
        }
      },
    async save() {
      // basic validation
      this.error = null
      if (!this.form.name || !this.form.name.trim()) {
        this.error = '이름을 입력하세요.'
        return
      }
      const payload = { ...this.form }
      this.saving = true
      try {
        let resp
        // support multiple possible id field names returned by backend
        const existingId = this.category && (this.category.id || this.category.kpiCategoryId || this.category.categoryId || this.category._id || null)
        if (existingId) {
          resp = await kpiService.updateCategory(existingId, payload)
        } else {
          resp = await kpiService.createCategory(payload)
        }
        this.$emit('saved', resp && resp.data ? resp.data : resp)
        this.close()
      } catch (e) {
        console.error('save category failed', e)
        this.error = e && e.response && e.response.data ? (e.response.data.message || JSON.stringify(e.response.data)) : (e.message || '저장 중 오류')
      } finally {
        this.saving = false
      }
    },
    emitEdit() {
      this.$emit('edit', this.category)
    }
  }
}
</script>

<style scoped>
.kpi-modal-overlay{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(3,10,18,0.48); z-index:1600 }
.kpi-modal{ width:520px; max-width:calc(100% - 48px); background:#fff; border-radius:12px; box-shadow:0 12px 30px rgba(16,36,59,0.12); overflow:hidden }
.kpi-modal-header{ display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid #eef3fb }
.kpi-modal-title{ margin:0; font-size:18px; color:#10243b; font-weight:700 }
.kpi-modal-close{ background:transparent; border:none; font-size:20px; line-height:1; cursor:pointer }
.kpi-modal-body{ padding:18px; color:#394b5a }
.kpi-modal-body dl{ display:grid; grid-template-columns:80px 1fr; row-gap:8px; column-gap:12px }
.kpi-modal-body dt{ color:#7f8c8d; font-size:13px }
.kpi-modal-body dd{ margin:0; color:#10243b }
.kpi-modal-actions{ display:flex; justify-content:flex-end; gap:12px; padding:14px 18px; border-top:1px solid #f3f6ff }
.btn-outline{ background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 14px; border-radius:10px }
.btn-primary{ background:linear-gradient(90deg,#294594,#2b57a0); color:#fff; padding:8px 14px; border-radius:8px; border:none }
.form-row{ margin-bottom:12px }
.form-row label{ display:block; color:#556b7a; font-size:13px; margin-bottom:6px }
.form-row input, .form-row textarea{ width:100%; border:1px solid #e6eefb; padding:8px 10px; border-radius:8px }
.btn-danger{ background:#fff; border:1px solid #ff4d4f; color:#ff4d4f; padding:8px 14px; border-radius:8px; cursor:pointer }
.btn-danger:hover{ background:#fff5f5 }
</style>
