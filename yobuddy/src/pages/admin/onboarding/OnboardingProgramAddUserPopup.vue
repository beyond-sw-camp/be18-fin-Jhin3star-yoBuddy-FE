<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="visible" class="set-overlay" @click.self="$emit('close')">
        <div class="set-modal" role="dialog" aria-modal="true">
          <header class="modal-top">
            <div class="modal-title">멘티 추가</div>
            <button class="modal-close-btn" @click="$emit('close')" aria-label="닫기">✕</button>
          </header>

          <div class="set-grid">
            <section class="left">
              <h4>선택된 멘티</h4>
              <div v-if="!selectedUsers.length" class="empty">선택된 멘티가 없습니다.</div>
              <ul class="item-list">
                <li v-for="(u, idx) in selectedUsers" :key="u.id || idx" class="item-row">
                  <div class="item-left">
                    <div class="item-title">{{ u.name || u.label }}</div>
                    <div class="item-time">{{ u.email || '' }}</div>
                  </div>
                  <div class="item-actions">
                    <button class="btn-outline btn-small" @click="removeSelected(u)">삭제</button>
                  </div>
                </li>
              </ul>
            </section>

            <section class="right">
              <h4>유저 목록</h4>
              <div class="field">
                <input v-model="searchQuery" placeholder="이름/이메일/ID로 검색" @input="debouncedSearch" />
              </div>
              <div v-if="loadingUsers">로딩 중...</div>
              <div v-else>
                <ul class="training-list">
                  <li v-for="(u, i) in users" :key="u.id || u.userId || i" class="training-row">
                    <div class="training-left">
                      <div class="training-title">{{ u.name || u.displayName || u.username || u.email || u.id }}</div>
                      <div class="training-meta">{{ u.email || '' }}</div>
                    </div>
                    <div class="training-actions">
                      <button class="btn-add" @click="addUserFromList(u)">추가</button>
                    </div>
                  </li>
                  <li v-if="users.length === 0" class="empty">사용자 결과가 없습니다.</li>
                </ul>
              </div>
            </section>
          </div>

          <footer class="modal-actions">
            <button class="btn-outline" @click="$emit('close')">취소</button>
            <button class="btn-primary" @click="onConfirm">저장</button>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import userService from '@/services/user'
export default {
  name: 'OnboardingProgramAddUserPopup',
  props: {
    visible: { type: Boolean, default: false },
    initialSelected: { type: Array, default: () => [] }
  },
  data() {
    return {
      userId: '',
      loading: false,
      users: [],
      loadingUsers: false,
      searchQuery: '',
      selectedUsers: [],
      initialSelectedIds: []
    }
  },
  emits: ['close', 'added', 'confirm'],
  watch: {
    visible(val) {
      if (val) {
        this.searchUsers()
        // populate selectedUsers from parent-provided initial list when opened
        try {
          this.selectedUsers = Array.isArray(this.initialSelected) ? JSON.parse(JSON.stringify(this.initialSelected)) : []
        } catch (e) {
          this.selectedUsers = (this.initialSelected || []).slice()
        }
        // snapshot initial ids for diff on confirm (be generous with possible id fields)
        this.initialSelectedIds = (this.selectedUsers || []).map(u => String(u.id || u.userId || (u.meta && (u.meta.id || u.meta.userId)) || '')).filter(Boolean)
      }
    }
  },
  created() {
    this._searchTimer = null
  },
  methods: {
    async addUser() {
      if (!this.userId) return
      this.loading = true
      try {
        const resp = await userService.getUserById(this.userId)
        const user = resp ?? null
        if (!user) {
          window.alert('유저를 찾을 수 없습니다: ' + this.userId)
          return
        }
        this.selectedUsers.push(user)
        this.$emit('added', user)
        this.userId = ''
      } catch (err) {
        console.error('OnboardingProgramAddUserPopup.addUser error', err)
        window.alert('유저 조회 중 오류가 발생했습니다.')
      } finally {
        this.loading = false
        this.$emit('close')
      }
    },
    async searchUsers() {
      this.loadingUsers = true
      try {
        const params = this.searchQuery ? { q: this.searchQuery } : {}
        const resp = await userService.searchUsers(params)
        // normalize to array
        const payload = resp && resp.data ? resp.data : resp
        if (Array.isArray(payload)) {
          this.users = payload
        } else if (Array.isArray(payload.content)) {
          this.users = payload.content
        } else if (Array.isArray(payload.items)) {
          this.users = payload.items
        } else if (Array.isArray(payload.data)) {
          this.users = payload.data
        } else {
          this.users = []
        }
        // filter out users already selected (either initial or currently selected)
        const excluded = new Set((this.selectedUsers || []).map(x => String(x.id || x.userId)).filter(Boolean))
        if (excluded.size) {
          this.users = (this.users || []).filter(u => !excluded.has(String(u.id || u.userId)))
        }
      } catch (err) {
        console.error('user search failed', err)
        this.users = []
      } finally {
        this.loadingUsers = false
      }
    },
    debouncedSearch() {
      if (this._searchTimer) clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(() => {
        this.searchUsers()
      }, 450)
    },
    addUserFromList(u) {
      if (!u) return
      const exists = this.selectedUsers.some(s => String(s.id || s.userId) === String(u.id || u.userId))
      if (!exists) {
        this.selectedUsers.push(u)
      }
      // remove added user from right-side users list
      this.users = (this.users || []).filter(x => String(x.id || x.userId) !== String(u.id || u.userId))
    },
    removeSelected(u) {
      this.selectedUsers = (this.selectedUsers || []).filter(x => String(x.id || x.userId) !== String(u.id || u.userId))
      // when removing from selected, optionally re-run search to include this user back into results
      // simple approach: if current searchQuery is empty, push back the user to users list; else re-search
      if (!this.searchQuery) {
        this.users = this.users || []
        this.users.unshift(u)
      } else {
        this.searchUsers()
      }
    }
      ,
      onConfirm() {
        const currentIds = (this.selectedUsers || []).map(u => String(u.id || u.userId || (u.meta && (u.meta.id || u.meta.userId)) || '')).filter(Boolean)
        const initial = new Set(this.initialSelectedIds || [])
        const added = currentIds.filter(id => !initial.has(id))
        const removed = (this.initialSelectedIds || []).filter(id => !currentIds.includes(id))
        console.debug('[OnboardingAddUserPopup] confirm', { initial: this.initialSelectedIds, current: currentIds, added, removed })
        this.$emit('confirm', { added, removed, selected: this.selectedUsers })
        this.$emit('close')
      }
  }
}
</script>

<style scoped>
.set-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.set-modal {
  width: 960px;
  max-width: 98vw;
  min-width: 720px;
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.2);
  max-height: 90vh;
  overflow: auto;
}
.modal-top { display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:12px }
.modal-title { font-size:18px; font-weight:700 }
.modal-close-btn { position:absolute; right:8px; top:6px; border:none; background:transparent; font-size:16px; cursor:pointer }
.set-body { padding: 8px 0 12px }
.field { margin-bottom:12px }
.field .label { font-size:12px; color:#6b7280; margin-bottom:6px }
input { width:100%; box-sizing:border-box; padding:8px; border:1px solid #dfe6f0; border-radius:6px }
.modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:8px }
.btn-outline { background:transparent; border:1px solid #d0d7e2; padding:8px 12px; border-radius:8px }
.btn-primary { background:var(--color-primary,#294594); color:#fff; border:none; padding:8px 12px; border-radius:8px }
.hint { color:#6b7280; font-size:13px }
/* two-column layout inside modal */
.set-grid { display:flex; gap:18px; margin-bottom:12px }
.set-grid .left { flex: 1.2; max-height:360px; overflow:auto; background:#fbfdff; padding:12px; border-radius:8px; border:1px solid #eef3fb }
.set-grid .right { flex: 1; max-height:360px; overflow:auto; background:#fbfdff; padding:12px; border-radius:8px; border:1px solid #eef3fb }
.item-list, .training-list { list-style:none; padding:0; margin:0 }
.item-row, .training-row { padding:8px; border-bottom:1px dashed #e6eef8; display:flex; align-items:center; justify-content:space-between }
.item-row:last-child, .training-row:last-child { border-bottom:none }
.item-left { flex:1 }
.item-title, .training-title { font-weight:600 }
.item-time, .training-meta { font-size:12px; color:#6b7280 }
.btn-add { background:#2b8af6; color:#fff; border:none; padding:6px 10px; border-radius:8px; cursor:pointer }
.btn-small { padding:6px 8px; font-size:13px; border-radius:8px }
</style>
