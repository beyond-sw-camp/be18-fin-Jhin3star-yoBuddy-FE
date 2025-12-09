<template>
  <div v-if="visible" class="wdp-overlay">
    <div class="wdp-modal">
      <header class="wdp-header">
        <h3>{{ isNew ? '위키 항목 추가' : '위키 항목 수정' }}</h3>
        <button class="wdp-close" @click="close">×</button>
      </header>
      <section class="wdp-body">
        <label class="field">
          <div class="label">제목</div>
          <input class="form-input" type="text" v-model="form.title" placeholder="제목을 입력하세요" />
        </label>
        <label class="field">
          <div class="label">내용</div>
          <textarea class="form-textarea" v-model="form.content" rows="6" placeholder="내용을 입력하세요"></textarea>
        </label>
        <div class="parent-info">상위문서: <strong>{{ parent ? parent.title : '루트' }}</strong></div>
        <div v-if="error" class="error">{{ error }}</div>
      </section>
      <footer class="wdp-footer">
        <button class="btn" @click="save" :disabled="!hasUser">저장</button>
        <button class="btn muted" @click="close">취소</button>
      </footer>
      <div v-if="!hasUser" class="login-hint">문서를 등록하려면 로그인해야 합니다.</div>
    </div>
  </div>
</template>

<script>
import wikiService from '@/services/wikiService'
import { useAuthStore } from '@/store/authStore'

export default {
  name: 'WikiDetailPopup',
  props: {
    visible: { type: Boolean, default: false },
    parent: { type: Object, default: null },
    isNew: { type: Boolean, default: true },
    initial: { type: Object, default: null }
  },
  data() {
    return {
      form: {
        title: '',
        content: ''
      },
      loading: false,
      error: null
    }
  },
  computed: {
    auth() { return useAuthStore() },
    hasUser() {
      const uid = this.auth.user?.userId || this.auth.user?.id || sessionStorage.getItem('yb_user_id')
      return !!uid
    }
  },
  watch: {
    visible(val) {
      if (val) this.onOpen()
    }
  },
  methods: {
    onOpen() {
      this.error = null
      if (this.initial) {
        this.form.title = this.initial.title || ''
        this.form.content = this.initial.content || ''
      } else {
        this.form.title = ''
        this.form.content = ''
      }
    },
    close() {
      this.$emit('close')
    },
    async save() {
      if (!this.form.title || !this.form.title.trim()) {
        this.error = '제목을 입력하세요.'
        return
      }
      this.loading = true
      this.error = null
      try {
        const auth = useAuthStore()
        let uid = auth.user?.userId || auth.user?.id || null
        if (!uid) uid = sessionStorage.getItem('yb_user_id') || null

        if (!uid) {
          this.error = '로그인이 필요합니다.'
          this.loading = false
          return
        }

        const payload = {
          title: this.form.title.trim(),
          content: this.form.content || '',
          parentId: this.parent ? this.parent.wikiId : null,
          depth: this.parent ? (Number(this.parent.depth || 0) + 1) : 0,
          // include both camelCase and snake_case to match backend expectations
          userId: Number(uid),
          user_id: Number(uid),
        }

        console.debug('wiki save payload', payload)

        let resp
        if (!this.isNew && this.initial && (this.initial.wikiId || this.initial.id)) {
          const id = this.initial.wikiId || this.initial.id
          resp = await wikiService.update(id, payload)
        } else {
          resp = await wikiService.create(payload)
        }

        const result = resp && resp.data ? (resp.data.data ? resp.data.data : resp.data) : null
        this.$emit('saved', result)
        this.close()
      } catch (e) {
        console.error('Failed to create wiki node', e)
        if (e && e.response && e.response.data) this.error = e.response.data.message || JSON.stringify(e.response.data)
        else this.error = e && e.message ? e.message : '생성 실패'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.wdp-overlay{ position:fixed; inset:0; background:rgba(2,6,23,0.45); display:flex; align-items:center; justify-content:center; z-index:120 }
.wdp-modal{ width:720px; max-width:92%; background:#fff; border-radius:10px; box-shadow:0 20px 40px rgba(2,6,23,0.3); overflow:hidden }
.wdp-header{ display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #f1f5f9 }
.wdp-header h3{ margin:0; color:#0f1724 }
.wdp-close{ background:transparent; border:none; font-size:20px; cursor:pointer }
.wdp-body{ padding:18px 20px }
.field{ margin-bottom:12px }
.label{ font-size:13px; color:#475569; margin-bottom:6px }
/* Form field controls */
.form-input, .form-textarea { width:100%; padding:12px 14px; border:1px solid #e6eef8; border-radius:10px; font-size:14px; background: #ffffff; color: #071031; box-shadow: 0 6px 18px rgba(2,6,23,0.03); transition: box-shadow .18s ease, border-color .12s ease, transform .08s ease }
.form-input::placeholder, .form-textarea::placeholder { color: #9AA6B2 }
.form-input:focus, .form-textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 8px 28px rgba(37,99,235,0.08); transform: translateY(-1px) }
.form-textarea { min-height:120px; resize:vertical; line-height:1.6 }

.field { display:flex; flex-direction:column; margin-bottom:14px }
.label { font-size:13px; color:#475569; margin-bottom:8px; font-weight:600 }
.parent-info{ margin-top:8px; color:#64748b; font-size:13px }
.error{ margin-top:8px; color:#b00020 }
.wdp-footer{ padding:12px 20px; display:flex; justify-content:flex-end; gap:8px; border-top:1px solid #f1f5f9 }
.btn{ background:#294594; color:#fff; border:none; padding:8px 14px; border-radius:8px; cursor:pointer }
.btn.muted{ background:#f1f5f9; color:#0b1220 }

</style>
