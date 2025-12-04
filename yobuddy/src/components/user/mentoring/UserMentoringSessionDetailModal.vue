<template>
  <transition name="fade">
    <div v-if="visible" class="overlay" @click.self="close">
      <div class="modal">
        <div class="content-card">
          <!-- HEADER -->
          <div class="card-header">
            <div class="title-wrap">
              <h2 class="card-title">멘토링 세션</h2>
              <p class="card-sub" v-if="session">
                멘토 {{ session.mentorName }} 님과의 멘토링
              </p>
            </div>
            <button class="close-btn" @click="close">×</button>
          </div>

          <!-- BODY -->
          <div class="card-body">
            <!-- 로딩 -->
            <div v-if="loading" class="loading-indicator">
              멘토링 세션 정보를 불러오는 중...
            </div>

            <!-- 에러 -->
            <div v-if="error && !loading" class="error-banner">
              {{ error }}
            </div>

            <!-- 실제 내용 -->
            <template v-if="!loading && session">
              <!-- 상단 요약: 멘토 이름 + 예정 일시 + 상태 -->
              <div class="session-summary">
                <div class="mentor-name">
                  {{ session.mentorName }}
                </div>
                <div class="session-meta-row">
                  <span class="session-datetime">
                    {{ formatDisplayDateTime(session.scheduledAt) }}
                  </span>
                  <span class="dot">·</span>
                  <span :class="['status-pill', getStatusClass(session.status)]">
                    {{ getStatusLabel(session.status) }}
                  </span>
                </div>
              </div>

              <!-- 세션 설명 -->
              <div class="info-group">
                <h3 class="group-title">세션 설명</h3>
                <p class="text-box">
                  {{ session.description || '설명이 없습니다.' }}
                </p>
              </div>

              <!-- 피드백 -->
              <div class="info-group">
                <h3 class="group-title">피드백</h3>
                <p class="text-box">
                  {{ session.feedback || '아직 피드백이 작성되지 않았습니다.' }}
                </p>
              </div>
            </template>
          </div>

          <!-- FOOTER -->
          <div class="card-footer">
            <button class="btn-secondary" @click="close">닫기</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, watch } from 'vue';
import mentoringService from '@/services/mentoringService';
import { useAuthStore } from '@/store/authStore';

export default {
  name: 'UserMentoringSessionDetailModal',
  props: {
    visible: Boolean,
    sessionId: {
      type: [String, Number],
      required: true,
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const session = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const auth = useAuthStore();

    const fetchSessionDetail = async () => {
      if (!props.visible || !props.sessionId) {
        session.value = null;
        return;
      }

      loading.value = true;
      error.value = null;
      try {
        const userId = auth.user?.userId;
        if (!userId) {
          throw new Error('User ID not found.');
        }
        const fetchedSession = await mentoringService.getUserSessionDetails(
          userId,
          props.sessionId
        );
        session.value = fetchedSession.data;
      } catch (err) {
        console.error('멘토링 세션 상세 정보 조회 실패:', err);
        error.value = '멘토링 세션 상세 정보를 불러오지 못했습니다.';
      } finally {
        loading.value = false;
      }
    };

    const close = () => {
      emit('close');
    };

    const getStatusLabel = (status) => {
      switch (status) {
        case 'PENDING':
          return '대기 중';
        case 'SCHEDULED':
          return '예정됨';
        case 'COMPLETED':
          return '완료됨';
        case 'CANCELLED':
          return '취소됨';
        case 'NO_SHOW':
          return '불참';
        default:
          return status;
      }
    };

    const formatDisplayDateTime = (dateTime) => {
      if (!dateTime) return 'N/A';
      return new Date(dateTime).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const getStatusClass = (status) => {
      const classMap = {
        SCHEDULED: 'pill-blue',
        COMPLETED: 'pill-green',
        NO_SHOW: 'pill-red',
        CANCELLED: 'pill-gray',
        PENDING: 'pill-amber',
      };
      return classMap[status] || 'pill-gray';
    };

    watch(
      [() => props.visible, () => props.sessionId],
      () => {
        fetchSessionDetail();
      },
      { immediate: true }
    );

    return {
      session,
      loading,
      error,
      close,
      getStatusLabel,
      formatDisplayDateTime,
      getStatusClass,
    };
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  width: 520px;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.content-card {
  width: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* HEADER */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 22px 12px;
  border-bottom: 1px solid #eef2f7;
  position: relative;
}

.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.card-sub {
  margin: 0;
  color: #7d93ad;
  font-size: 13px;
}

/* CLOSE BTN */
.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  color: #9ca3af;
  cursor: pointer;
}
.close-btn:hover {
  color: #4b5563;
}

/* BODY */
.card-body {
  padding: 18px 22px 10px;
  overflow-y: auto;
}

.loading-indicator {
  padding: 24px 0;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.error-banner {
  padding: 14px 16px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  margin-bottom: 12px;
}

/* SUMMARY */
.session-summary {
  margin-bottom: 20px;
}

.mentor-name {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
}

.session-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.session-datetime {
  font-weight: 500;
}

.dot {
  font-size: 12px;
  color: #d1d5db;
}

/* INFO GROUP */
.info-group {
  margin-bottom: 18px;
}

.group-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

/* TEXT BOX */
.text-box {
  white-space: pre-wrap;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  background: #f8fafc;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  min-height: 56px;
}

/* STATUS PILL */
.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.pill-blue {
  background: #e0f2fe;
  color: #0369a1;
}

.pill-green {
  background: #dcfce7;
  color: #15803d;
}

.pill-red {
  background: #fee2e2;
  color: #b91c1c;
}

.pill-gray {
  background: #e5e7eb;
  color: #4b5563;
}

.pill-amber {
  background: #fef3c7;
  color: #92400e;
}

/* FOOTER */
.card-footer {
  padding: 12px 18px 16px;
  border-top: 1px solid #eef2f7;
  display: flex;
  justify-content: center;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  padding: 8px 20px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.btn-secondary:hover {
  background: #d4d4d8;
}
</style>
