<template>
  <div class="user-mentoring-session-list">
    <h2>나의 멘토링 세션</h2>

    <div v-if="loading" class="loading-indicator">멘토링 세션을 불러오는 중...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="sessions.length > 0" class="session-cards">
      <div v-for="session in sessions" :key="session.sessionId" class="session-card" @click="openDetailModal(session.sessionId)">
        <div class="card-header">
          <h3>{{ session.menteeName }} - {{ session.mentorName }}</h3>
          <span :class="['status-badge', session.status.toLowerCase()]">{{ session.status }}</span>
        </div>
        <p><strong>예정일:</strong> {{ formatDate(session.scheduledAt) }}</p>
        <p><strong>설명:</strong> {{ session.description }}</p>
      </div>
    </div>
    <div v-else-if="!loading">
      <p>참여 중인 멘토링 세션이 없습니다.</p>
    </div>

    <UserMentoringSessionDetailModal
      :visible="isModalVisible"
      :sessionId="selectedSessionId"
      @close="closeDetailModal"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import mentoringService from '@/services/mentoringService';
import UserMentoringSessionDetailModal from '@/components/user/mentoring/UserMentoringSessionDetailModal.vue';

export default {
  name: 'UserMentoringSessionList',
  components: {
    UserMentoringSessionDetailModal
  },
  setup() {
    const sessions = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const isModalVisible = ref(false);
    const selectedSessionId = ref(null);

    const fetchMentoringSessions = async () => {
      loading.value = true;
      error.value = null;
      try {
        // Assuming getMentoringSessions handles user ID internally via authStore
        const response = await mentoringService.getMentoringSessions();
        sessions.value = response.content; // Assuming content array for paged response
      } catch (err) {
        console.error('멘토링 세션 목록 조회 실패:', err);
        error.value = '멘토링 세션 목록을 불러오지 못했습니다.';
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('ko-KR', options);
    };

    const openDetailModal = (sessionId) => {
      selectedSessionId.value = sessionId;
      isModalVisible.value = true;
    };

    const closeDetailModal = () => {
      isModalVisible.value = false;
      selectedSessionId.value = null;
    };

    onMounted(() => {
      fetchMentoringSessions();
    });

    return {
      sessions,
      loading,
      error,
      isModalVisible,
      selectedSessionId,
      formatDate,
      openDetailModal,
      closeDetailModal
    };
  }
};
</script>

<style scoped>
.user-mentoring-session-list {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

h2 {
  color: #333;
  margin-bottom: 25px;
  text-align: center;
  font-size: 28px;
}

.loading-indicator, .error-message {
  text-align: center;
  margin-top: 20px;
  font-size: 16px;
}

.error-message {
  color: #dc2626;
}

.session-cards {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.session-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.session-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.card-header h3 {
  font-size: 18px;
  color: #2c3e50;
  margin: 0;
}

.status-badge {
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.status-badge.pending { background-color: #ffc107; } /* Yellow */
.status-badge.scheduled { background-color: #17a2b8; } /* Info Blue */
.status-badge.completed { background-color: #28a745; } /* Green */
.status-badge.cancelled { background-color: #dc3545; } /* Red */

.session-card p {
  font-size: 14px;
  color: #555;
  margin-bottom: 5px;
}

.session-card strong {
  color: #333;
}
</style>
