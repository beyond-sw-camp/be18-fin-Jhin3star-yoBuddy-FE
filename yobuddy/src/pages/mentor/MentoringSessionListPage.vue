<template>
  <div class="session-page">
    <div class="session-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">멘토링 세션 목록</h2>
          <p class="card-sub">진행했거나 예정된 멘토링 세션 목록입니다.</p>
        </div>
        <div class="controls">
          <button class="btn-primary" @click="goToCreatePage">+ 세션 생성</button>
        </div>
      </div>

      <div class="card-body">
        <table class="session-table">
          <thead>
            <tr>
              <th>멘티</th>
              <th>세션 설명</th>
              <th>상태</th>
              <th>날짜</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sessions" :key="s.id" @click="openDetail(s)" class="row-hover">
              <td class="user-info">
                <div class="avatar">{{ s.menteeName.substring(0,1) }}</div>
                <div>
                  <div class="name">{{ s.menteeName }}</div>
                  <div class="email">{{ s.menteeEmail }}</div>
                </div>
              </td>
              <td>{{ s.description }}</td>
              <td>
                <span :class="['status-tag', getStatusClass(s.status)]">
                  {{ getStatusText(s.status) }}
                </span>
              </td>
              <td>{{ s.scheduledAt ? s.scheduledAt.split("T")[0] : "-" }}</td>
            </tr>
            <tr v-if="sessions.length === 0">
              <td colspan="4" class="empty-text">등록된 멘토링 세션이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import http from "@/services/http";
import { useAuthStore } from "@/store/authStore";

export default {
  name: "MentoringSessionListPage",
  data() {
    return {
      sessions: []
    };
  },
  async mounted() {
    const auth = useAuthStore();
    const mentorId = auth.user?.userId;
    if (!mentorId) return;

    const resp = await http.get(`/api/v1/mentors/${mentorId}/sessions`);
    this.sessions = resp.data;
  },
  methods: {
    goToCreatePage() {
      this.$router.push('/mentor/sessions/create');
    },
    openDetail(session) {
      this.$router.push({
        path: `/mentor/sessions/${session.id}`,
        query: { menteeId: session.menteeId }
      });
    },
    getStatusText(status) {
      const statusMap = {
        SCHEDULED: '예정',
        COMPLETED: '완료',
        NO_SHOW: '불참',
        CANCELLED: '취소'
      };
      return statusMap[status] || status;
    },
    getStatusClass(status) {
      const classMap = {
        SCHEDULED: 'scheduled',
        COMPLETED: 'completed',
        NO_SHOW: 'noshow',
        CANCELLED: 'cancelled'
      };
      return classMap[status] || 'default';
    }
  }
};
</script>

<style scoped>
.session-page { display: flex; justify-content: center; padding: 40px; }
.session-card { width: 1000px; background: white; border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.05); padding: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-bottom: 1px solid #eef2f7; }
.card-title { margin:0; font-size:20px; color:#10243b }
.card-sub { margin: 4px 0 0; color:#7d93ad; font-size:13px }
.card-body { padding: 10px 25px 20px; }
.session-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.session-table th { text-align: left; padding: 12px 6px; border-bottom: 1px solid #e5e7eb; color: #6b7280; }
.session-table td { padding: 14px 6px; border-bottom: 1px solid #f0f2f5; vertical-align: middle; }
.row-hover:hover { background: #f9fbff; cursor: pointer; }
.user-info { display: flex; align-items: center; gap: 12px; }
.avatar { width: 40px; height: 40px; background: #294594; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.name { font-weight: 700; }
.email { font-size: 12px; color: #6b7280; }
.empty-text { text-align: center; padding: 30px 0; color: #9ca3af; }
.btn-primary { background: #294594; color: #fff; padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; }

.status-tag { padding: 5px 12px; border-radius: 14px; font-size: 12px; font-weight: 700; text-align: center; }
.status-tag.completed { background: #d1fae5; color: #059669; }
.status-tag.scheduled { background: #fef3c7; color: #92400e; }
.status-tag.noshow { background: #fee2e2; color: #b91c1c; }
.status-tag.cancelled { background: #e5e7eb; color: #4b5563; }
.status-tag.default { background: #e5e7eb; color: #4b5563; }
</style>