<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">멘토링 세션 목록</h2>
          <p class="card-sub">진행했거나 예정된 멘토링 세션 목록입니다.</p>
        </div>

        <div class="controls">
          <select v-model="statusFilter" class="select-filter" @change="onSearch">
            <option value="">전체 상태</option>
            <option value="SCHEDULED">예정</option>
            <option value="COMPLETED">완료</option>
            <option value="NO_SHOW">불참</option>
            <option value="CANCELLED">취소</option>
          </select>
          <input
            v-model="query"
            type="text"
            class="search"
            placeholder="멘티 이름으로 검색"
            @input="onInput"
            @keyup.enter="onSearch"
          />
          <button class="btn-ghost" @click="onSearch">검색</button>
          <button class="btn-primary" @click="goToCreatePage">+ 세션 생성</button>
        </div>
      </div>

      <div class="card-body">
        <table class="user-table" v-if="sessions && sessions.length">
          <thead>
            <tr>
              <th>멘티</th>
              <th>세션 설명</th>
              <th>상태</th>
              <th>날짜</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sessions" :key="s.id" @click="openDetail(s)" style="cursor:pointer">
              <td class="name-col">
                <div class="avatar">
                  <img v-if="s.menteeProfileImageUrl" :src="getFullImageUrl(s.menteeProfileImageUrl)" alt="Mentee Profile" class="profile-image" />
                  <span v-else>{{ initials(s.menteeName) }}</span>
                </div>
                <div class="meta">
                  <div class="name">{{ s.menteeName }}</div>
                  <div class="email">{{ s.menteeEmail }}</div>
                  <div class="training-stats" v-if="s.menteeCompletedTrainings !== undefined || s.menteePendingTrainings !== undefined">
                    <span class="stat-item completed">완료: {{ s.menteeCompletedTrainings || 0 }}</span>
                    <span class="stat-item pending">예정: {{ s.menteePendingTrainings || 0 }}</span>
                  </div>
                </div>
              </td>
              <td>{{ s.description }}</td>
              <td>
                <span :class="['tag', statusClass(s.status)]">{{ statusLabel(s.status) }}</span>
              </td>
              <td>{{ s.scheduledAt ? s.scheduledAt.split("T")[0] : "-" }}</td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">멘토링 세션이 없습니다.</div>
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

      <div v-if="showToast" class="toast">{{ toastMessage }}</div>
    </div>
  </div>
</template>

<script>
import mentoringService from "@/services/mentoringService";
import { useAuthStore } from "@/store/authStore";
import http from '@/services/http';

export default {
  name: "MentoringSessionListPage",
  data() {
    return {
      query: '',
      statusFilter: '',
      page: 0,
      size: 10,
      sessions: [],
      loading: false,
      searchTimer: null,
      totalPages: 1,
      totalElements: 0,
      toastMessage: '',
      showToast: false,
      toastTimer: null
    };
  },
  async mounted() {
    await this.fetchSessions();
  },
  computed: {
    pageList() {
      return this.pageRange()
    }
  },
  methods: {
    async fetchSessions() {
      const auth = useAuthStore();
      if (!auth.user?.userId) return;

      this.loading = true;
      const params = {
        page: this.page,
        size: this.size,
        status: this.statusFilter,
        query: this.query.trim(),
      };

      try {
        const response = await mentoringService.getMentoringSessions(params);
        
        let filteredSessions = response.content;
        const searchQuery = this.query.trim().toLowerCase();
        if (searchQuery) {
          filteredSessions = response.content.filter(s => 
            (s.menteeName && s.menteeName.toLowerCase().includes(searchQuery))
          );
        }

        this.sessions = filteredSessions;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
      } catch (error) {
        console.error("멘토링 세션 목록을 불러오는 데 실패했습니다.", error);
        this.triggerToast("세션 목록을 불러오는 데 실패했습니다.");
        this.sessions = [];
        this.totalPages = 1;
      } finally {
        this.loading = false;
      }
    },
    getFullImageUrl(relativePath) {
      if (!relativePath) return null;
      const base = http.defaults.baseURL.replace(/\/$/, '');
      const path = relativePath.replace(/^\//, '');
      return `${base}/${path}`;
    },
    goToCreatePage() {
      this.$router.push('/mentor/sessions/create');
    },
    openDetail(session) {
      this.$router.push({
        path: `/mentor/sessions/${session.id}`,
        query: { menteeId: session.menteeId }
      });
    },
    statusLabel(status) {
      const statusMap = {
        SCHEDULED: '예정',
        COMPLETED: '완료',
        NO_SHOW: '불참',
        CANCELLED: '취소'
      };
      return statusMap[status] || status;
    },
    statusClass(status) {
      const classMap = {
        SCHEDULED: 'tag-newbie',
        COMPLETED: 'tag-admin',
        NO_SHOW: 'tag-mentor',
        CANCELLED: 'tag-default'
      };
      return classMap[status] || 'tag-default';
    },
    initials(name) {
      if (!name) return ''
      return String(name).trim().charAt(0).toUpperCase();
    },
    onSearch() {
      this.page = 0
      if (this.searchTimer) { clearTimeout(this.searchTimer); this.searchTimer = null }
      this.fetchSessions()
    },
    onInput() {
      if (this.searchTimer) clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => { this.page = 0; this.fetchSessions(); this.searchTimer = null }, 300)
    },
    setPage(n) {
      if (n < 0) n = 0
      if (n >= this.totalPages) n = this.totalPages - 1
      if (n < 0) n = 0
      this.page = n
      this.fetchSessions()
    },
    pageRange() {
      const total = this.totalPages || 0
      const current = this.page || 0
      const maxVisible = 5
      if (total <= 0) return []
      const start = Math.max(0, Math.min(current, total - maxVisible))
      const end = Math.min(total, start + maxVisible)
      const pages = []
      for (let i = start; i < end; i++) pages.push(i)
      return pages
    },
    triggerToast(msg) {
      this.toastMessage = msg
      this.showToast = true
      clearTimeout(this.toastTimer)
      this.toastTimer = setTimeout(() => { this.showToast = false }, 2000)
    }
  }
};
</script>

<style scoped>
.org-page { padding: 28px 40px; display:flex; justify-content:center; }
.content-card { width: 1100px; max-width: 100%; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(9,30,66,0.08); overflow: hidden; }
.card-header { display:flex; flex-direction:row; align-items:center; justify-content:space-between; gap:16px; padding: 20px 28px; border-bottom: 1px solid #eef2f7; flex-wrap:wrap; }
.title-wrap { display:flex; flex-direction:column; gap:4px; }
.card-title { margin:0; font-size:20px; color:#10243b }
.card-sub { margin: 4px 0 0; color:#7d93ad; font-size:13px }
.controls { display:flex; gap:12px; align-items:center; justify-content:flex-end; flex:1; flex-wrap:wrap }
.select-filter { padding:10px 12px; border-radius:8px; border:1px solid #e6eef8; background:#f8fbff; width:180px; max-width:100% }
.search { padding:10px 12px; border-radius:8px; border:1px solid #e6eef8; width:380px; max-width:100% }
.btn-primary { background:#294594; color:#fff; padding:10px 16px; border-radius:10px; border:none; cursor:pointer }
.btn-ghost { background: transparent; border: 1px solid #e6eef8; color: #294594; padding:8px 12px; border-radius:8px; cursor:pointer }
.card-body { padding: 22px 28px; display:flex; justify-content:center }
.user-table { width:100%; max-width:900px; margin:0 auto; border-collapse: collapse; }
.user-table thead th { text-align:left; color:#7c96b3; font-weight:700; padding:12px 10px; font-size:13px }
.user-table tbody tr { border-top:1px solid #f0f4fb }
.tag { padding:6px 10px; border-radius:14px; font-size:12px; font-weight:700 }
.tag-admin { background:#ffe9e9; color:#c94242 }
.tag-mentor { background:#f6f8d1; color:#b0b900 }
.tag-newbie { background:#f0fff6; color:#0a9a52 }
.tag-default { background: #e5e7eb; color: #4b5563; }
.user-table tbody td { padding:16px 10px; vertical-align:middle; color:#123 }
.name-col { display:flex; gap:12px; align-items:center }
.avatar { width:36px; height:36px; border-radius:50%; background:#294594; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; overflow: hidden; }
.profile-image { width: 100%; height: 100%; object-fit: cover; }
.meta .name { font-weight:700; color:#10243b }
.meta .email { font-size:13px; color:#6d859a }
.training-stats {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
}
.stat-item {
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.stat-item.completed {
  background-color: #d1fae5; /* Light green */
  color: #059669; /* Darker green */
}
.stat-item.pending {
  background-color: #fef3c7; /* Light yellow */
  color: #92400e; /* Darker yellow */
}
.pagination.numeric { display:flex; gap:10px; align-items:center }
.page-nav { background:transparent; border:none; color:#4b5563; font-size:18px; padding:8px; cursor:pointer; transition: color 0.15s ease, opacity 0.15s ease }
.page-nav:disabled { color: #c5c9d6; opacity: 0.7; cursor: default }
.page-num { width:36px; height:36px; border-radius:50%; border:none; background:transparent; color:#4b5563; font-weight:700; cursor:pointer }
.page-num.active { background:#3b4aa0; color:#fff; box-shadow: 0 6px 18px rgba(59,74,160,0.18) }
.ellipsis { color:#64748b; padding:0 6px }
.card-footer { padding: 16px 28px; border-top: 1px solid #eef2f7; display:flex; justify-content:center }
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
.empty-state { text-align: center; padding: 40px; color: #7d93ad; }
</style>
