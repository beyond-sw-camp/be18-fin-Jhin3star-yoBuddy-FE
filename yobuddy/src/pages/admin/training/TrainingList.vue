<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">교육 관리</h2>
          <p class="card-sub">교육 목록 조회 및 관리</p>
        </div>

        <div class="controls">
          <input v-model="query" type="text" class="search" placeholder="제목으로 검색" @input="onInput" @keyup.enter="onSearch" />
          <select v-model="typeFilter" class="select-filter" @change="onSearch">
            <option value="">전체 유형</option>
            <option value="ONLINE">온라인</option>
            <option value="OFFLINE">오프라인</option>
          </select>
          <button class="btn-ghost" @click="onSearch">검색</button>
          <button class="btn-primary" @click="openCreate">+ 교육 등록</button>
        </div>
      </div>

      <div class="card-body">

        <table class="user-table" v-if="trainings && trainings.length">
          <thead>
            <tr>
              <th>제목</th>
              <th>유형</th>
              <th>프로그램</th>
              <th>부서</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in trainings" :key="t.id" @click="openDetail(t)" style="cursor:pointer">
              <td class="name-col">
                <div class="avatar">{{ initials(t.title) }}</div>
                <div class="meta">
                  <div class="name">{{ t.title }}</div>
                  <div class="email">{{ t.subtitle || '' }}</div>
                </div>
              </td>
              <td>{{ t.typeLabel }}</td>
              <td>{{ t.assignedProgramsNames }}</td>
              <td>{{ t.departmentName }}</td>
              <td>
                <span :class="['tag', statusClass(t.status)]">{{ statusLabel(t.status) }}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">교육이 없습니다.</div>
      </div>

      <div class="card-footer">
        <div class="pagination numeric">
          <button class="page-nav" @click="setPage(page-1)" :disabled="page<=0">◀</button>
          <template v-for="p in pageList" :key="p.key">
            <button v-if="p.type==='page'" :class="['page-num', { active: p.num === page }]" @click="setPage(p.num)">{{ p.num + 1 }}</button>
            <span v-else class="ellipsis">…</span>
          </template>
          <button class="page-nav" @click="setPage(page+1)" :disabled="page>=totalPages-1">▶</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import trainingService from '@/services/trainingService';

export default {
  name: 'TrainingList',
  data() {
    return {
      query: '',
      typeFilter: '',
      page: 0,
      size: 20,
      trainings: [],
      loading: false,
      searchTimer: null,
      totalPages: 1,
      totalElements: 0
    }
  },
  mounted() {
    this.fetchTrainings()
  },
  computed: {
    pageList() {
      const raw = this.pageRange()
      return raw.map((p, idx) => {
        if (p === 'left-ellipsis' || p === 'right-ellipsis') return { type: 'ellipsis', key: `e-${idx}` }
        return { type: 'page', num: p, key: `p-${p}` }
      })
    }
  },
  methods: {
    statusLabel(s) {
      if (!s) return '할당 전'
      const up = String(s).toUpperCase()
      if (up === 'UPCOMING') return '예정됨'
      if (up === 'ACTIVE') return '진행 중'
      if (up === 'COMPLETED') return '완료'
      if (up === 'PUBLISHED') return '공개'
      if (up === 'DRAFT') return '임시'
      if (up === 'ARCHIVED' || up === 'INACTIVE') return '비활성'
      return s
    },
    statusClass(s) {
      const up = String(s || '').toUpperCase()
      if (up === 'PUBLISHED' || up === 'ACTIVE') return 'tag-admin'
      if (up === 'DRAFT') return 'tag-newbie'
      return 'tag-mentor'
    },
    typeLabel(t) {
      if (!t) return ''
      if (t === 'ONLINE') return '온라인'
      if (t === 'OFFLINE') return '오프라인'
      return t
    },
    initials(name) {
      if (!name) return ''
      const parts = String(name).trim().split('')
      return parts.slice(0,2).join('')
    },
    getAssignedProgramsSummary(list) {
      if (!list || !list.length) return '—'
      const arr = (Array.isArray(list) ? list.slice() : [])
      arr.sort((a, b) => {
        const ka = new Date(a.assignedAt || a.assignedAtDate || a.createdAt || a.createdDate || 0).getTime() || 0
        const kb = new Date(b.assignedAt || b.assignedAtDate || b.createdAt || b.createdDate || 0).getTime() || 0
        return kb - ka
      })
      const latest = arr[0] || {}
      const name = latest.programName || latest.name || ''
      if (arr.length === 1) return name || '—'
      return `${name} 외 ${arr.length - 1}개`
    },
    mapTraining(t) {
      return {
        id: t.id || t.trainingId || null,
        title: t.title || t.name || '',
        type: t.type || '',
        typeLabel: this.typeLabel(t.type || ''),
        assignedPrograms: t.assignedPrograms || [],
        assignedProgramsNames: this.getAssignedProgramsSummary(t.assignedPrograms || []),
        // department and status may be provided inside assignedPrograms entries
        departmentName: t.departmentName || t.department || ((t.assignedPrograms && t.assignedPrograms[0] && (t.assignedPrograms[0].departmentName || t.assignedPrograms[0].department)) ? (t.assignedPrograms[0].departmentName || t.assignedPrograms[0].department) : '—'),
        status: t.status || ((t.assignedPrograms && t.assignedPrograms[0] && t.assignedPrograms[0].status) ? t.assignedPrograms[0].status : '')
      }
    },
    async fetchTrainings() {
      this.loading = true
      const params = { page: this.page, size: this.size }
      if (this.query && this.query.trim()) params.title = this.query.trim()
      if (this.typeFilter) params.type = this.typeFilter
      try {
        const resp = await trainingService.list(params)
        const data = resp && resp.data ? resp.data : []
        // support both array and pageable response shapes
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : [])
        this.trainings = list.map(this.mapTraining)
        // client-side search fallback: ensure query filters by title if backend doesn't support title param
        if (this.query && this.query.trim()) {
          const ql = this.query.trim().toLowerCase()
          this.trainings = this.trainings.filter(t => (t.title || '').toLowerCase().includes(ql))
        }
        // page metadata if provided
        if (data && typeof data.totalPages === 'number') this.totalPages = data.totalPages
        else if (data && typeof data.totalElements === 'number') this.totalPages = Math.max(1, Math.ceil(data.totalElements / this.size))
        if (data && typeof data.totalElements === 'number') this.totalElements = data.totalElements
        else this.totalElements = (Array.isArray(data) ? data.length : this.trainings.length)
      } catch (err) {
        console.error('trainings fetch failed', err)
        this.trainings = []
      } finally {
        this.loading = false
      }
    },
    onSearch() {
      this.page = 0
      if (this.searchTimer) { clearTimeout(this.searchTimer); this.searchTimer = null }
      this.fetchTrainings()
    },
    onInput() {
      if (this.searchTimer) clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => { this.page = 0; this.fetchTrainings(); this.searchTimer = null }, 300)
    },
    openCreate() {
      this.$router.push('/admin/trainings/create')
    },
    openDetail(t) {
      if (!t || !t.id) return
      // pass title as query so header breadcrumb can show training name
      const title = encodeURIComponent(t.title || '')
      this.$router.push(`/admin/trainings/${t.id}?title=${title}`)
    },
    prevPage() { if (this.page > 0) { this.page -= 1; this.fetchTrainings() } },
    nextPage() { if (this.page < this.totalPages - 1) { this.page += 1; this.fetchTrainings() } },
    setPage(n) {
      if (n < 0) n = 0
      if (n > this.totalPages - 1) n = this.totalPages - 1
      this.page = n
      this.fetchTrainings()
    },
    pageRange() {
      const total = this.totalPages
      const current = this.page
      const delta = 2
      const range = []
      for (let i = Math.max(0, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i)
      const pages = []
      if (range.length === 0) return pages
      if (range[0] > 0) pages.push(0)
      if (range[0] > 1) pages.push('left-ellipsis')
      for (const p of range) pages.push(p)
      if (range[range.length - 1] < total - 2) pages.push('right-ellipsis')
      if (range[range.length - 1] < total - 1) pages.push(total - 1)
      return pages
    }
  }
}
</script>

<style scoped>
/* reuse styles from UserManagement where possible */
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
.user-table { width:100%; border-collapse: collapse; }
.user-table thead th { text-align:left; color:#7c96b3; font-weight:700; padding:12px 10px; font-size:13px }
.user-table tbody tr { border-top:1px solid #f0f4fb }
.tag { padding:6px 10px; border-radius:14px; font-size:12px; font-weight:700 }
.tag-admin { background:#ffe9e9; color:#c94242 }
.tag-mentor { background:#f6f8d1; color:#b0b900 }
.tag-newbie { background:#f0fff6; color:#0a9a52 }

/* align with UserManagement table */
.user-table tbody td { padding:16px 10px; vertical-align:middle; color:#123 }
.name-col { display:flex; gap:12px; align-items:center }
.avatar { width:36px; height:36px; border-radius:50%; background:#294594; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700 }
.meta .name { font-weight:700; color:#10243b }
.meta .email { font-size:13px; color:#6d859a }

/* numeric pagination styles (like attached image) */
.pagination.numeric { display:flex; gap:8px; align-items:center }
.page-nav { background:transparent; border:none; color:#64748b; font-size:16px; padding:8px }
.page-num { width:36px; height:36px; border-radius:50%; border:none; background:transparent; color:#4b5563; font-weight:700; cursor:pointer }
.page-num.active { background:#3b4aa0; color:#fff; box-shadow: 0 6px 18px rgba(59,74,160,0.18) }
.ellipsis { color:#64748b; padding:0 6px }
/* center footer pagination */
.card-footer { padding: 16px 28px; border-top: 1px solid #eef2f7; display:flex; justify-content:center }
</style>
