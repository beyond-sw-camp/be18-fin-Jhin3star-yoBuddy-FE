<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">조직 관리</h2>
          <p class="card-sub">조직 구조 및 멤버 관리</p>
        </div>

        <div class="controls">
          <input v-model="query" type="text" class="search" placeholder="이름 또는 이메일로 검색" @input="onInput" />
          <select v-model="roleFilter" class="select-filter" @change="onSearch">
            <option value="">전체 역할</option>
            <option value="ADMIN">관리자</option>
            <option value="MENTOR">멘토</option>
            <option value="NEWBIE">신입</option>
          </select>
          <button class="btn-ghost" @click="onSearch">검색</button>
          <button class="btn-primary" @click="openCreate">+ 단건 등록</button>
          <button class="btn-primary" @click="onAdd">+ 일괄 등록</button>
        </div>
      </div>

      <div class="card-body">

        <table class="user-table" v-if="users && users.length">
          <thead>
            <tr>
              <th>이름</th>
              <th>연락처</th>
              <th>권한</th>
              <th>부서</th>
              <th>입사일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" @click="openDetail(u)" style="cursor:pointer">
              <td class="name-col">
                <div class="avatar">{{ initials(u.name) }}</div>
                <div class="meta">
                  <div class="name">{{ u.name }}</div>
                  <div class="email">{{ u.email }}</div>
                </div>
              </td>
              <td>{{ u.phone }}</td>
              <td><span :class="['tag', u.role === 'ADMIN' ? 'tag-admin' : u.role === 'MENTOR'? 'tag-mentor' : 'tag-newbie']">{{ u.roleLabel }}</span></td>
              <td>{{ u.department }}</td>
              <td>{{ u.joinDate.slice(0,10) }}</td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">사용자가 없습니다.</div>
      </div>

      <div class="card-footer">
        <div class="pagination numeric">
          <button class="page-nav" @click="setPage(page-1)" :disabled="page<=0" aria-label="이전 페이지">&lt;</button>
          <button
            v-for="p in pageList"
            :key="p"
            :class="['page-num', { active: p === page }]"
            @click="setPage(p)"
          >
            {{ p + 1 }}
          </button>
          <button class="page-nav" @click="setPage(page+1)" :disabled="page>=totalPages-1" aria-label="다음 페이지">&gt;</button>
        </div>
      </div>
    </div>
    <!-- User detail modal -->
    <UserDetailpopup
      :show="showDetail"
      :user="selectedUser"
      :mentors="(selectedUser && selectedUser.mentors) ? selectedUser.mentors : []"
      @close="closeDetail"
      @saved="onSaved"
      @delete="onDelete"
    />
      <UserCreatePopup
        :show="showCreate"
        @close="showCreate = false"
        @created="onCreated"
      />
      <UserBulkUploadPopup
        :show="showBulkUpload"
        @close="showBulkUpload = false"
        @uploaded="onBulkUploaded"
      />
  </div>
</template>

<script>
import http from '@/services/http'
import UserDetailpopup from './UserDetailpopup.vue'
import UserCreatePopup from './UserCreatePopup.vue'
import UserBulkUploadPopup from './UserBulkUploadPopup.vue'

export default {
  name: 'OrganizationUserPage',
  components: { UserDetailpopup, UserCreatePopup, UserBulkUploadPopup },
  data() {
    return {
      // query and filters
      query: '',
      roleFilter: '',
      // debounce timer for live-search
      searchTimer: null,

      // pagination / sorting
      page: 0,
      size: 10,
      sort: 'userId,desc',
      totalPages: 1,
      totalElements: 0,

      // data / state
      users: [],
      loading: false,
      error: null,

      // detail modal
      showDetail: false,
      selectedUser: null
      ,
      // create modal
      showCreate: false
      ,
      // bulk upload modal
      showBulkUpload: false
    }
  },
  mounted() {
    this.fetchUsers()
  },
  computed: {
    pageList() {
      const total = this.totalPages || 0
      const current = this.page || 0
      const maxVisible = 5
      if (total <= 0) return []
      const start = Math.max(0, Math.min(current, total - maxVisible))
      const end = Math.min(total, start + maxVisible)
      const pages = []
      for (let i = start; i < end; i++) pages.push(i)
      return pages
    }
  },
  methods: {
    applyPaginationMeta(rawData, listLength) {
      if (rawData && typeof rawData.totalPages === 'number') {
        this.totalPages = Math.max(1, rawData.totalPages)
      } else if (rawData && typeof rawData.totalElements === 'number') {
        this.totalPages = Math.max(1, Math.ceil(rawData.totalElements / this.size))
      } else {
        this.totalPages = Math.max(1, Math.ceil(listLength / this.size))
      }

      if (rawData && typeof rawData.totalElements === 'number') {
        this.totalElements = rawData.totalElements
      } else {
        this.totalElements = listLength
      }

      if (this.page > this.totalPages - 1) {
        this.page = Math.max(0, this.totalPages - 1)
      }
    },
    // escape helper for building regex from wildcard
    escapeRegExp(s) {
      return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    },
    // map server user object to view model
    mapUser(u) {
      const roleRaw = u.role || (u.roles && u.roles[0]) || ''
      const roleUpper = String(roleRaw).toUpperCase()
      return {
        id: u.userId || u.id || u.uuid || null,
        name: u.name || u.fullName || u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email || u.username || '',
        // server may return phone as phoneNumber, phone or mobile
        phone: u.phoneNumber || u.phone || u.mobile || '',
        role: roleUpper,
        roleLabel: roleUpper === 'ADMIN' ? '관리자' : roleUpper === 'MENTOR'? '멘토' : '신입',
        // server may return department as departmentName, department, or nested team.name
        department: u.departmentName || u.department || (u.team && u.team.name) || '',
        // server may return join date in various fields: joinedAt, joinDate, hireDate
        joinDate: u.joinedAt || u.joinDate || u.hireDate || ''
      }
    },

    async fetchUsers() {
      this.loading = true
      this.error = null
      const params = { page: this.page, size: this.size, sort: this.sort }
      if (this.query && this.query.trim()) params.name = this.query.trim()
      if (this.roleFilter) {
        // map client-friendly role 'NEWBIE' to server role 'USER'
        params.role = this.roleFilter === 'NEWBIE' ? 'USER' : this.roleFilter
      }

      // dev debug: show outgoing params to help verify request format
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[UserManagement] fetchUsers params:', params)
      }

      try {
        const resp = await http.get('/api/v1/admin/users', { params })
        const data = resp && resp.data ? resp.data : []
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[UserManagement] fetchUsers response:', data)
        }
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : [])
        let mapped = list.map(this.mapUser)
        // If user provided a query, apply wildcard or partial match on the client
        if (this.query && this.query.trim()) {
          const q = this.query.trim()
          if (q.indexOf('*') !== -1) {
            // convert wildcard '*' to '.*' regex, escape other chars
            const pattern = '^' + q.split('*').map(this.escapeRegExp).join('.*') + '$'
            const re = new RegExp(pattern, 'i')
            mapped = mapped.filter(u => u.name && re.test(u.name))
          } else {
            const ql = q.toLowerCase()
            mapped = mapped.filter(u => u.name && u.name.toLowerCase().includes(ql))
          }
        }
        // apply client-side role filter if a role selection is present
        if (this.roleFilter) {
          const rf = this.roleFilter.toUpperCase()
          if (rf === 'NEWBIE') {
            mapped = mapped.filter(u => u.role !== 'ADMIN' && u.role !== 'MENTOR')
          } else {
            mapped = mapped.filter(u => u.role === rf)
          }
        }

        this.users = mapped
        this.applyPaginationMeta(data, this.users.length)
      } catch (err) {
        console.error('Failed to fetch users', err)
        const status = err && err.response && err.response.status
        if (status === 403) {
          // fallback to non-admin endpoint when permissions differ
          try {
            const resp2 = await http.get('/api/v1/users', { params })
            const data2 = resp2 && resp2.data ? resp2.data : []
            const list2 = Array.isArray(data2) ? data2 : (data2 && Array.isArray(data2.content) ? data2.content : [])
            let mapped2 = list2.map(this.mapUser)
            if (this.query && this.query.trim()) {
              const q2 = this.query.trim()
              if (q2.indexOf('*') !== -1) {
                const pattern2 = '^' + q2.split('*').map(this.escapeRegExp).join('.*') + '$'
                const re2 = new RegExp(pattern2, 'i')
                mapped2 = mapped2.filter(u => u.name && re2.test(u.name))
              } else {
                const q2l = q2.toLowerCase()
                mapped2 = mapped2.filter(u => u.name && u.name.toLowerCase().includes(q2l))
              }
            }
            // apply client-side role filter if a role selection is present
            if (this.roleFilter) {
              const rf2 = this.roleFilter.toUpperCase()
              if (rf2 === 'NEWBIE') {
                mapped2 = mapped2.filter(u => u.role !== 'ADMIN' && u.role !== 'MENTOR')
              } else {
                mapped2 = mapped2.filter(u => u.role === rf2)
              }
            }

            this.users = mapped2
            this.applyPaginationMeta(data2, this.users.length)
            this.error = null
            return
          } catch (err2) {
            console.error('Fallback fetch also failed', err2)
            this.error = (err2 && err2.response && err2.response.data && err2.response.data.message) || err2.message || '사용자 목록을 불러오지 못했습니다.'
            return
          }
        }
        this.error = (err && err.response && err.response.data && err.response.data.message) || err.message || '사용자 목록을 불러오지 못했습니다.'
      } finally {
        this.loading = false
      }
    },

    onSearch() {
      this.page = 0
      // clear any pending debounce timer
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
        this.searchTimer = null
      }
      this.fetchUsers()
    },

    onInput() {
      // live-search with debounce to avoid flooding requests while typing
      if (this.searchTimer) clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.page = 0
        this.fetchUsers()
        this.searchTimer = null
      }, 350)
    },

    initials(name) {
      if (!name) return ''
      const parts = name.split('')
      return parts.slice(0,2).join('')
    },

    openDetail(user) {
      this.selectedUser = user
      this.showDetail = true
    },

    closeDetail() {
      this.showDetail = false
      this.selectedUser = null
    },

    onAdd() {
      // open bulk upload modal
      this.showBulkUpload = true
    },

    async onBulkUploaded() {
      // refresh list after bulk upload
      this.fetchUsers()
    },

    openCreate() {
      this.showCreate = true
    },

    async onCreated(newUser) {
      // when a user is created via the modal, insert into list and refresh
      try {
        const mapped = this.mapUser(newUser)
        this.users.unshift(mapped)
      } catch (e) { console.warn('onCreated mapping failed', e) }
      this.showCreate = false
      // refresh to ensure server-side consistency
      this.fetchUsers()
    },
    onEdit(user) {
      try {
        sessionStorage.setItem('yb_edit_user', JSON.stringify(user))
      } catch (e) {
        console.warn('Could not store edit user', e)
      }
      this.$router.push({ path: `/organization/usermanagement/${user.id}/edit` }).catch(()=>{})
    },

    onSaved(updated) {
      console.debug('[UserManagement] onSaved updated:', updated)
      // updated is server object; map for list view
      const mapped = this.mapUser(updated)
      const idx = this.users.findIndex(u => String(u.id) === String(mapped.id))
      if (idx !== -1) {
        // replace in list
        this.users.splice(idx, 1, mapped)
      } else {
        this.users.unshift(mapped)
      }
      // update selected user shown in modal
      this.selectedUser = updated
      this.showDetail = false
      // refresh list from server to ensure consistency
      this.fetchUsers()
    },

    async onDelete(user) {
      if (!user || !user.id) return
      try {
        if (process.env.NODE_ENV !== 'production') console.debug('[UserManagement] deleting user', user)
        // try admin delete endpoint first
        await http.delete(`/api/v1/admin/users/${user.id}`)
        if (process.env.NODE_ENV !== 'production') console.debug('[UserManagement] delete succeeded (admin endpoint)')
      } catch (err) {
        const status = err && err.response && err.response.status
        console.warn('[UserManagement] delete failed, status:', status, err)
        if (status === 403) {
          // try non-admin endpoint fallback
          try {
            await http.delete(`/api/v1/users/${user.id}`)
            if (process.env.NODE_ENV !== 'production') console.debug('[UserManagement] delete succeeded (fallback endpoint)')
          } catch (err2) {
            console.error('Delete failed on fallback endpoint', err2)
            this.error = (err2 && err2.response && err2.response.data && err2.response.data.message) || err2.message || '삭제 중 오류가 발생했습니다.'
            return
          }
        } else {
          this.error = (err && err.response && err.response.data && err.response.data.message) || err.message || '삭제 중 오류가 발생했습니다.'
          return
        }
      }

      // remove from local list if present
      const idx = this.users.findIndex(u => String(u.id) === String(user.id))
      if (idx !== -1) this.users.splice(idx, 1)

      // close modal and refresh list to ensure consistency
      this.closeDetail()
      this.fetchUsers()
    },

    setPage(n) {
      const maxPage = Math.max(0, this.totalPages - 1)
      let next = n
      if (next < 0) next = 0
      if (next > maxPage) next = maxPage
      if (next === this.page) return
      this.page = next
      this.fetchUsers()
    }
  }
}
</script>

<style scoped>
.org-page { padding: 28px 40px; display:flex; justify-content:center; }
.content-card { width: 1100px; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(9,30,66,0.08); overflow: hidden; }
.card-header { display:flex; justify-content:space-between; align-items:center; padding: 20px 28px; border-bottom: 1px solid #eef2f7; }
.title-wrap { display:flex; flex-direction:column; }
.card-title { margin:0; font-size:20px; color:#10243b }
.card-sub { margin: 4px 0 0; color:#7d93ad; font-size:13px }
.controls { display:flex; gap:12px; align-items:center }
.select-filter { padding:8px 12px; border-radius:8px; border:1px solid #e6eef8; background:#f8fbff }
.search { padding:10px 12px; border-radius:8px; border:1px solid #e6eef8; min-width:260px }
.btn-primary { background:#294594; color:#fff; padding:10px 16px; border-radius:10px; border:none; cursor:pointer }
.btn-ghost { background: transparent; border: 1px solid #e6eef8; color: #294594; padding:8px 12px; border-radius:8px; cursor:pointer }

.card-body { padding: 22px 28px; }
.status-row { display:flex; gap:12px; align-items:center; margin-bottom:12px }
.loading { color:#294594; font-weight:700 }
.error { color:#b00020; font-weight:700 }
.user-table { width:100%; border-collapse: collapse; }
.user-table thead th { text-align:left; color:#7c96b3; font-weight:700; padding:12px 10px; font-size:13px }
.user-table tbody tr { border-top:1px solid #f0f4fb }
.user-table tbody td { padding:16px 10px; vertical-align:middle; color:#123; }
.name-col { display:flex; gap:12px; align-items:center }
.avatar { width:36px; height:36px; border-radius:50%; background:#294594; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700 }
.meta .name { font-weight:700; color:#10243b }
.meta .email { font-size:13px; color:#6d859a }
.tag { padding:6px 10px; border-radius:14px; font-size:12px; font-weight:700 }
.tag-admin { background:#ffe9e9; color:#c94242 }
.tag-mentor { background:#f6f8d1; color:#b0b900 }
.tag-newbie { background:#f0fff6; color:#0a9a52 }

.card-footer { padding: 16px 28px; border-top: 1px solid #eef2f7; display:flex; justify-content:center }
.pagination.numeric { display:flex; gap:10px; align-items:center }
.page-nav { background:transparent; border:none; color:#4b5563; font-size:18px; padding:8px; cursor:pointer; transition: color 0.15s ease, opacity 0.15s ease }
.page-nav:disabled { color: #c5c9d6; opacity: 0.7; cursor: default }
.page-num { width:36px; height:36px; border-radius:50%; border:none; background:transparent; color:#4b5563; font-weight:700; cursor:pointer }
.page-num.active { background:#3b4aa0; color:#fff; box-shadow: 0 6px 18px rgba(59,74,160,0.18) }

@media (max-width: 980px) {
  .content-card { width: 100%; margin: 0 16px }
  .controls { flex-wrap:wrap }
  .search { min-width: 160px }
}
</style>
