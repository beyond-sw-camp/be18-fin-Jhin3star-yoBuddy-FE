<template>
  <div class="user-training-page">
    <div class="content-card">
      <header class="list-header">
      <div class="title-wrap">
        <h2 class="page-title">교육 목록</h2>
        <p class="page-sub">교육을 조회하고 관리합니다</p>
      </div>

      <div class="controls">
        <select v-model="filterType" @change="onSearch">
          <option value="">전체</option>
          <option value="ONLINE">온라인</option>
          <option value="OFFLINE">오프라인</option>
        </select>
        <input v-model="q" placeholder="검색" />
        <button class="btn-ghost" @click="onSearch">검색</button>
      </div>
      </header>

      <section class="cards" v-if="trainings.length">
      <TrainingCard v-for="t in trainings" :key="t.id || t.title" :training="t" @open="openDetail" />
      </section>
      <div v-else class="empty-state">할당된 교육이 없습니다.</div>
    </div>

    <TrainingDetailPopup
      v-if="showDetail && selected"
      :key="selected?.id || 'training-detail'"
      :visible="showDetail"
      :training="selected"
      @close="closeDetail"
      @deleted="onDeleted"
      @edit="onEdit"
    />
  </div>
</template>

<script>
import TrainingCard from '@/components/user/training/TrainingCard.vue';
import TrainingDetailPopup from '@/components/user/training/TrainingDetailPopup.vue';
import userTrainingService from '@/services/userTrainingService';
import { useAuthStore } from '@/store/authStore';
export default {
  name:'UserTrainingList',
  components:{ TrainingCard, TrainingDetailPopup },
  data(){ return { trainings:[], q:'', filterType:'', page:0, size:12, totalCourses:0, notStarted:0, completed:0, progress:0, selected:null, showDetail:false } },
  mounted(){ this.fetch() },
  methods:{
    typeLabel(t) {
      if (!t) return ''
      if (t === 'ONLINE') return '온라인'
      if (t === 'OFFLINE') return '오프라인'
      return t
    },
    getAssignedProgramsSummary(list) {
      if (!list || !list.length) return '-'
      const arr = (Array.isArray(list) ? list.slice() : [])
      arr.sort((a, b) => {
        const ka = new Date(a.assignedAt || a.assignedAtDate || a.createdAt || a.createdDate || 0).getTime() || 0
        const kb = new Date(b.assignedAt || b.assignedAtDate || b.createdAt || b.createdDate || 0).getTime() || 0
        return kb - ka
      })
      const latest = arr[0] || {}
      const name = latest.programName || latest.name || ''
      if (arr.length === 1) return name || '-'
      return `${name} 외 ${arr.length - 1}개`
    },
    mapTraining(t) {
      return {
        id: t.id || t.trainingId || null,
        title: t.title || t.name || '',
        subtitle: t.subtitle || '',
        type: t.type || '',
        typeLabel: this.typeLabel(t.type || ''),
        assignedPrograms: t.assignedPrograms || [],
        assignedProgramsNames: this.getAssignedProgramsSummary(t.assignedPrograms || []),
        departmentName: t.departmentName || t.department || ((t.assignedPrograms && t.assignedPrograms[0] && (t.assignedPrograms[0].departmentName || t.assignedPrograms[0].department)) ? (t.assignedPrograms[0].departmentName || t.assignedPrograms[0].department) : '-'),
        status: t.status || ((t.assignedPrograms && t.assignedPrograms[0] && t.assignedPrograms[0].status) ? t.assignedPrograms[0].status : ''),
        startDate: t.startDate,
        scheduledAt: t.scheduledAt,
        materials: t.materials || [],
        hero: t.headerImage || t.hero || ''
      }
    },
    statusLabel(s){ if(!s) return '상태 없음'; const up=String(s).toUpperCase(); if(up==='UPCOMING') return '예정'; if(up==='ACTIVE' || up==='IN_PROGRESS') return '진행 중'; if(up==='COMPLETED') return '완료'; if(up==='PUBLISHED') return '공개'; if(up==='DRAFT') return '임시'; if(up==='ARCHIVED' || up==='INACTIVE') return '비활성'; return s },
    statusClass(s){ const up = String(s || '').toUpperCase(); if (up === 'PUBLISHED' || up === 'ACTIVE') return 'tag-admin'; if (up === 'DRAFT') return 'tag-newbie'; return 'tag-mentor' },
    async fetch(){
      try{
        const auth = useAuthStore()
        if (!auth.user && auth.accessToken) await auth.loadUser()
        const userId = auth.user && (auth.user.id || auth.user.userId || auth.user.user_id)
        if (!userId) { console.error('user id not available'); return }

        const params = { page:this.page, size:this.size }
        if (this.q && this.q.trim()) params.title = this.q.trim()

        const resp = await userTrainingService.list(userId, params)
        const payload = resp?.data ?? resp
        const list = Array.isArray(payload?.trainings) ? payload.trainings
                    : Array.isArray(payload?.data) ? payload.data
                    : Array.isArray(payload?.content) ? payload.content
                    : Array.isArray(payload) ? payload : []
        this.trainings = list.map(this.mapTraining)
        // filter by type (전체 / ONLINE / OFFLINE)
        if (this.filterType) {
          const ft = String(this.filterType).toUpperCase()
          this.trainings = this.trainings.filter(t => String(t.type || '').toUpperCase() === ft)
        }
        // sort: non-completed by proximity to today (endDate for ONLINE, scheduledAt for OFFLINE), then completed trainings
        const now = Date.now()
        const getCompareDate = (t) => {
          if (!t) return null
          const tp = String(t.type||'').toUpperCase()
          if (tp === 'ONLINE') return t.endDate || t.startDate || null
          if (tp === 'OFFLINE') return t.scheduledAt || t.startDate || t.endDate || null
          return t.endDate || t.scheduledAt || t.startDate || null
        }
        const notCompleted = this.trainings.filter(x => String(x.status||'').toUpperCase() !== 'COMPLETED')
        const completed = this.trainings.filter(x => String(x.status||'').toUpperCase() === 'COMPLETED')
        notCompleted.sort((a,b) => {
          const da = getCompareDate(a) ? Math.abs(new Date(getCompareDate(a)).getTime() - now) : Number.MAX_SAFE_INTEGER
          const db = getCompareDate(b) ? Math.abs(new Date(getCompareDate(b)).getTime() - now) : Number.MAX_SAFE_INTEGER
          return da - db
        })
        completed.sort((a,b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
        this.trainings = [...notCompleted, ...completed]
        this.totalCourses = payload?.totalCount ?? this.trainings.length
        this.notStarted = this.trainings.filter(x=>!x.status||String(x.status).toUpperCase()==='UPCOMING').length
        this.completed = this.trainings.filter(x=>String(x.status).toUpperCase()==='COMPLETED').length
        this.progress = this.totalCourses? Math.round((this.completed/this.totalCourses)*100):0
      }catch(e){ console.error(e) }
    },
    onSearch(){ this.page=0; this.fetch() },
    async openDetail(t){
      try{
        const auth = useAuthStore()
        if (!auth.user && auth.accessToken) await auth.loadUser()
        const userId = auth.user && (auth.user.id || auth.user.userId || auth.user.user_id)
        if (!userId) { this.selected = t; this.showDetail = true; return }
        const resp = await userTrainingService.detail(userId, t.id)
        const payload = resp?.data ?? resp
        // payload may be the training object or { training: {...} } or { data: {...} }
        const detail = payload?.training || payload?.data || payload || t
        this.selected = detail
      }catch(e){ console.error(e); this.selected = t }
      this.showDetail=true
    },
    closeDetail(){ this.showDetail=false; this.selected=null },
    onDeleted(){ this.closeDetail(); this.fetch() },
    onEdit(t){ this.$router.push(`/admin/trainings/${t.id}/edit`) },
    openCreate(){ this.$router.push('/admin/trainings/create') }
  }
}
</script>

<style scoped>
.user-training-page{ padding:22px }
.list-header{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px }
.title-wrap{ display:flex; flex-direction:column; gap:4px }
.page-title{ margin:0; font-size:20px; font-weight:700; color:#10243b }
.page-sub{ margin:0; font-size:13px; color:#7d93ad }
.controls{ display:flex; gap:8px; align-items:center }
.controls select,
.controls input{ padding:8px 12px; border-radius:8px; border:1px solid #e6eef8 }
.controls input{ min-width:220px }
.cards{ display:flex; gap:18px; flex-wrap:wrap }
.content-card { width: 1100px; max-width: 100%; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(9,30,66,0.08); padding: 20px; }
.cards{ display:flex; gap:18px; flex-wrap:wrap; padding: 12px 0 }
.empty-state{ padding:40px 0; color:#6b7280; font-weight:600 }
.btn-ghost{ background:transparent; border:1px solid #e6eef8; padding:8px 12px; border-radius:8px }
.btn-primary{ background:#294594; color:#fff; padding:8px 12px; border-radius:8px; border:none; cursor:pointer }
@media (max-width:768px){
  .list-header{ flex-direction:column; align-items:flex-start }
  .controls{ flex-wrap:wrap }
}
</style>
