<template>
  <div class="session-page">
    <div class="session-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">전체 멘토링 세션 목록</h2>
          <p class="card-sub">시스템에 등록된 모든 멘토링 세션입니다.</p>
        </div>
      </div>

      <div class="card-body">
        <table class="session-table">
          <thead>
            <tr>
              <th>멘토</th>
              <th>멘티</th>
              <th>상태</th>
              <th>예정일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sessions" :key="s.id" @click="openDetail(s)" class="row-hover">
              <td>{{ s.mentorName }}</td>
              <td>{{ s.menteeName }}</td>
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
import mentoringService from "@/services/mentoringService";

export default {
  name: "AdminMentoringSessionList",
  data() {
    return {
      sessions: []
    };
  },
  async mounted() {
    try {
      // getMentoringSessions는 역할에 따라 자동으로 ADMIN용 API를 호출합니다.
      this.sessions = await mentoringService.getMentoringSessions();
    } catch (e) {
      console.error("전체 멘토링 세션 목록 조회 실패", e);
      alert("세션 목록을 불러오는 데 실패했습니다.");
    }
  },
  methods: {
    openDetail(session) {
      this.$router.push(`/admin/mentoring/sessions/${session.id}`);
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
/* 멘토 세션 목록 페이지와 동일한 스타일 사용 */
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
.empty-text { text-align: center; padding: 30px 0; color: #9ca3af; }

.status-tag { padding: 5px 12px; border-radius: 14px; font-size: 12px; font-weight: 700; text-align: center; }
.status-tag.completed { background: #d1fae5; color: #059669; }
.status-tag.scheduled { background: #fef3c7; color: #92400e; }
.status-tag.noshow { background: #fee2e2; color: #b91c1c; }
.status-tag.cancelled { background: #e5e7eb; color: #4b5563; }
.status-tag.default { background: #e5e7eb; color: #4b5563; }
</style>
