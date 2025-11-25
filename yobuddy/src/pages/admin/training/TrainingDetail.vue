<template>
  <transition name="fade">
    <div class="detail-overlay">
      <div class="detail-modal layout-vertical">
        <header class="modal-top">
          <button class="back-btn" @click="close" aria-label="닫기">X</button>
          <div class="modal-title">교육 상세</div>
        </header>

        <section class="content-top section">
          <!-- 제목 -->
          <div class="title-large">{{ training ? training.title : '교육 상세' }}</div>

          <!-- URL (온라인만 표시) -->
          <div v-if="training && training.type === 'ONLINE'" class="url-section">
            <div class="val link-val">
              <a v-if="training && (training.onlineUrl || training.link)" :href="training.onlineUrl || training.link" target="_blank">{{ training.onlineUrl || training.link }}</a>
              <span v-else>정보 없음</span>
            </div>
          </div>

          <!-- 설명 -->
          <div class="desc-text">{{ training && (training.description || training.summary) ? (training.description || training.summary) : '-' }}</div>

          <!-- 작성/수정일 -->
          <div class="dates-section">
            <div class="meta-item">
              <span class="label">생성일</span>
              <span class="val">{{ formatDate(training && (training.createdAt || training.createdDate || training.createDate)) }}</span>
            </div>
            <div class="meta-item">
              <span class="label">수정일</span>
              <span class="val">{{ formatDate(training && (training.updatedAt || training.modifiedAt || training.updateDate)) }}</span>
            </div>
          </div>

          <!-- 등록된 프로그램 (5개 스크롤) -->
          <div class="programs-section">
            <div class="prog-header">등록된 프로그램:</div>
            <div v-if="training && training.assignedPrograms && training.assignedPrograms.length">
              <ul class="prog-list">
                <li v-for="p in training.assignedPrograms" :key="p.programId" class="prog-item">
                  <span class="prog-department">{{ p.department || p.departmentName }}</span>
                  <span class="prog-name">{{ p.programName || p.name }}</span>
                  <span :class="['prog-status', statusClass(p && p.status)]">{{ statusLabel(p && p.status) }}</span>
                </li>
              </ul>
            </div>
            <div v-else class="prog-empty">-</div>
          </div>

          <!-- 첨부 파일 (고정위치) -->
          <div class="attachments-section">
            <div class="label">첨부 파일</div>
            <div class="file-box-inline">
              <div v-if="training && training.attachments && training.attachments.length" class="file-box-inline-inner">
                <span class="file-name">{{ training.attachments[0].name || training.attachments[0].fileName }}</span>
                <a :href="training.attachments[0].url || '#'" class="btn-primary small" target="_blank">다운로드</a>
              </div>
              <div v-else class="file-empty">첨부 파일 없음</div>
            </div>
          </div>
        </section>

        <footer class="modal-actions section">
          <button class="btn-outline" @click="goEdit">수정</button>
          <button class="btn-primary danger" @click="onDelete">삭제</button>
        </footer>
      </div>

      <div v-if="showToast" class="toast">{{ toastMessage }}</div>
    </div>
  </transition>
</template>

<script>
import trainingService from '@/services/trainingService';

export default {
  name: 'TrainingDetail',
  data() {
    return {
      training: null,
      loading: false,
      toastMessage: '',
      showToast: false,
      toastTimer: null
    }
  },
  computed: { id() { return this.$route.params.id } },
  mounted() { this.fetch(); this.handleToastQuery(); },
  methods: {
    close() { this.$router.push('/admin/trainings') },
    handleToastQuery() {
      const toast = this.$route.query && this.$route.query.toast
      if (toast === 'updated') this.triggerToast('수정이 완료되었습니다.')
      this.$router.replace({ query: { ...this.$route.query, toast: undefined } }).catch(() => {})
    },
    triggerToast(msg) {
      this.toastMessage = msg
      this.showToast = true
      clearTimeout(this.toastTimer)
      this.toastTimer = setTimeout(() => { this.showToast = false }, 2000)
    },
    async fetch() {
      this.loading = true
      try {
        const resp = await trainingService.detail(this.id)
        const data = resp && resp.data ? resp.data : null
        if (data) {
          data.typeLabel = data.type === 'ONLINE' ? '온라인' : data.type === 'OFFLINE' ? '오프라인' : (data.type || '')
          data.assignedPrograms = data.assignedPrograms || []
          data.departmentName = data.departmentName || data.department || (data.assignedPrograms && data.assignedPrograms[0] && (data.assignedPrograms[0].departmentName || data.assignedPrograms[0].department)) || ''
          data.status = data.status || (data.assignedPrograms && data.assignedPrograms[0] && data.assignedPrograms[0].status) || ''
        }
        this.training = data
      } catch (e) {
        console.error('detail fetch failed', e)
        this.training = null
      } finally { this.loading = false }
    },
    goEdit() { this.$router.push(`/admin/trainings/${this.id}/edit`) },
    async onDelete() {
      if (!confirm('해당 교육을 삭제하시겠습니까?')) return
      try {
        await this.$nextTick()
        await (await import('@/services/trainingService')).default.delete(this.id)
        this.$router.push({ path: '/admin/trainings', query: { toast: 'deleted' } })
      } catch (e) {
        console.error('delete failed', e)
        alert('삭제에 실패했습니다.')
      }
    },
    statusLabel(s) {
      if (!s) return '상태 없음'
      const up = String(s).toUpperCase()
      if (up === 'UPCOMING') return '예정'
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
    formatDate(dt) {
      if (!dt) return '-'
      try {
        const d = new Date(dt)
        if (isNaN(d.getTime())) return String(dt).slice(0,10)
        return d.toLocaleDateString('ko-KR')
      } catch (e) { return String(dt).slice(0,10) }
    }
  }
}
</script>

<style scoped>
/* adopt modal styles from UserDetailpopup */
.detail-modal { --main-color: #294594; --muted: #64748b; --bg-soft: #f7f9fc; --radius: 10px; }
.detail-overlay { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(3, 10, 18, 0.48); z-index: 1400; -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); padding: 20px; }
.detail-modal { width: 720px; max-width: calc(100% - 48px); max-height: 92vh; overflow: auto; background: #fff; border: 1px solid rgba(16,36,59,0.04); border-radius: 12px; padding: 20px 22px; box-shadow: 0 12px 40px rgba(3, 10, 18, 0.12); position: relative; display:flex; flex-direction:column; }
.modal-top { position: relative; height: 52px; display:flex; align-items:center; justify-content:center }
.back-btn { position: absolute; left: 12px; top: 8px; border: none; background: transparent; font-size: 18px; cursor: pointer; padding: 6px; color: #4b5563; }
.modal-title { font-size:18px; font-weight:700; color: var(--main-color); }
.center-area { text-align:center; padding: 10px 0 18px 0 }
.avatar-large img { width: 100px; height:100px; border-radius:50%; object-fit:cover }
.avatar-fallback-large { display:inline-block; width:100px; height:100px; line-height:100px; border-radius:50%; background: linear-gradient(180deg,var(--bg-soft),#eef4ff); color:var(--main-color); font-size:36px; border: 2px solid rgba(41,69,148,0.06) }
.center-name { font-weight:700; margin-top:10px; font-size:20px; color:#10243b }
.two-cols { display:flex; gap:24px; padding: 12px 0; align-items:flex-start; flex-wrap:wrap; margin-left: 12%; padding-bottom: 30px; }
.col { flex:1; min-width:200px }
.label { font-size:12px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.6px }
.val { margin-top:8px; color:#0f172a; display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:15px; font-weight:500; min-height:44px }
.info-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; padding-top:6px; margin-left: 9%; padding-bottom: 5%; }
.info-item { background:transparent; padding:6px 4px }
.description-block { padding: 10px 0 6px 6%; margin-left: 6%; }
.description-block .desc-val { color:#10243b; font-size:15px; line-height:1.6; margin-top:8px }
.assigned-programs ul { margin:0; padding:0; list-style:none }
.assigned-programs li { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
.modal-actions { display:flex; justify-content:flex-end; gap:12px; padding-top:18px }

/* 리디자인 레이아웃 */
.content-top { padding: 16px 16px; display:flex; flex-direction:column; gap:12px; align-items:stretch }
.link-val { margin-top: 0; }
.desc-text { margin-top: 0; }

.title-large { font-size:20px; font-weight:800; color:#10243b; margin-bottom:0px }
.desc-text { color:#4b5563; line-height:1.6; margin:0px 0 }
.url-section { margin-top: 2px }
.url-section .label { display: block; margin-bottom: 0 }
.dates-section { display:flex; gap:180px; margin-top: 12px }
.meta-item { display:flex; gap:0; align-items:flex-start; flex-direction:column }
.meta-item .label { width:auto; color:#64748b; text-align:left }
.meta-item .val { color:#10243b; font-weight:550; margin-top: 0px }
.programs-section { margin-top: 12px; flex:1; display:flex; flex-direction:column }
.prog-header { color:#64748b; font-size:13px; font-weight:700; margin-bottom:8px }
.prog-list { list-style:none; padding:0; margin:0; max-height:calc(5 * 36px); overflow-y:auto; border:1px solid #f0f4fb; border-radius:4px }
.prog-list::-webkit-scrollbar { width:6px }
.prog-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius:6px }
.prog-list::-webkit-scrollbar-track { background: transparent }
.prog-item { display:flex; align-items:center; gap:8px; padding:6px 8px; border-bottom:1px dashed #f0f4fb; min-height:36px }
.prog-item:last-child { border-bottom: none }
.prog-department { color:#4b5563; font-size:13px; margin-right:12px; flex:0 0 140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.prog-name { color:#4b5563; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1 }
.prog-status { padding:4px 8px; border-radius:10px; font-size:12px; font-weight:500; white-space:nowrap; margin-left: 4px }
.prog-empty { color:#94a3b8; font-size:14px; padding: 8px }
.attachments-section { margin-top: 12px; padding-top: 12px; border-top:1px solid #eef3fb }
.attachments-section .label { display: block; margin-bottom: 8px }
.file-box-inline { display:flex; gap:12px; align-items:center }
.file-box-inline-inner { display:flex; gap:8px; align-items:center }
.file-name { color:#10243b; font-weight:500; font-size:14px }
.file-empty { color:#94a3b8; font-size:13px }
.link-val a { color:#2b57a0; text-decoration:none; word-break:break-all }
.link-val a:hover { text-decoration:underline }

.btn-outline { background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 14px; border-radius:10px; color:var(--main-color); font-weight:600 }
.btn-primary { background: linear-gradient(90deg,var(--main-color),#2b57a0); color:#fff; padding:10px 16px; border-radius:12px; border:none; box-shadow: 0 12px 30px rgba(41,69,148,0.14); font-weight:800; letter-spacing:0.2px }
.btn-primary.danger { background: #294594 }
.btn-primary.small { padding:6px 10px; font-size:13px }
.tag { padding:6px 10px; border-radius:14px; font-size:12px; font-weight:700 }
.tag-admin { background:#ffe9e9; color:#c94242 }
.tag-mentor { background:#f6f8d1; color:#b0b900 }
.tag-newbie { background:#f0fff6; color:#0a9a52 }

.file-box { display:flex; align-items:center; justify-content:space-between; border:1px solid #eef3fb; padding:12px; border-radius:8px; background:#fff }
.toast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  background: #fff;
  color: #294594;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.16);
  font-weight: 700;
  z-index: 2000;
  border: 1px solid rgba(41,69,148,0.16);
  min-width: 240px;
}
.toast::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  border-radius: 12px 0 0 12px;
  background: linear-gradient(180deg, #294594, #1f306d);
}

@media (max-width: 640px) {
  .detail-modal { width: 100%; padding: 14px }
  .content-top { padding: 12px }
  .dates-section { flex-direction: column; gap: 8px }
}
</style>
