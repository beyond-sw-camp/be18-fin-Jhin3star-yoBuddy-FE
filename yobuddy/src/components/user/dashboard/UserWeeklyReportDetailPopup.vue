<template>
  <transition name="fade">
    <div v-if="visible" class="overlay" @click.self="close">
      <div class="modal">
        <!-- Header -->
        <header class="header">
          <div class="header-left">
            <h3 class="title" v-if="reportDetail">
              {{ reportDetail.weekNumber }}주차 주간 리포트
            </h3>
            <p class="subtitle" v-if="reportDetail">
              ({{ reportDetail.startDate }} ~ {{ reportDetail.endDate }})
            </p>
          </div>
          <button class="close-btn" @click="close">×</button>
        </header>

        <!-- Body -->
        <section class="body" v-if="!loading && reportDetail">
          <!-- Accomplishments -->
          <div class="content-section">
            <h4 class="section-title">성과</h4>
            <textarea v-if="isEditing" v-model="form.accomplishments" rows="4"></textarea>
            <p v-else class="section-content">{{ reportDetail.accomplishments }}</p>
          </div>

          <!-- Challenges -->
          <div class="content-section">
            <h4 class="section-title">어려웠던 점</h4>
            <textarea v-if="isEditing" v-model="form.challenges" rows="4"></textarea>
            <p v-else class="section-content">{{ reportDetail.challenges }}</p>
          </div>

          <!-- Learnings -->
          <div class="content-section">
            <h4 class="section-title">배운 점</h4>
            <textarea v-if="isEditing" v-model="form.learnings" rows="4"></textarea>
            <p v-else class="section-content">{{ reportDetail.learnings }}</p>
          </div>

          <!-- Mentor Feedback -->
          <div v-if="reportDetail.mentorFeedback" class="feedback-box">
            <div class="feedback-header">
              <span class="feedback-author">멘토 피드백</span>
              <span class="feedback-date">
                ({{ formatTimestamp(reportDetail.updatedAt) }})
              </span>
            </div>
            <p class="feedback-text">{{ reportDetail.mentorFeedback }}</p>
          </div>
          <div v-else class="feedback-box feedback-empty">
            <p>아직 작성된 피드백이 없습니다.</p>
          </div>
          
          <div v-if="error" class="error-message">{{ error }}</div>
        </section>

        <div v-if="loading" class="loading-indicator">리포트를 불러오는 중...</div>

        <!-- Footer -->
        <footer class="footer">
          <button class="btn btn-secondary" @click="close">닫기</button>
          
          <template v-if="canEdit">
            <button v-if="isEditing" class="btn btn-secondary" @click="toggleEdit(false)">취소</button>
            <button v-if="isEditing" class="btn btn-primary" @click="saveReport" :disabled="loading">저장</button>
            <button v-else class="btn btn-primary" @click="toggleEdit(true)">수정</button>
          </template>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, computed, watchEffect } from 'vue';
import dashboardService from '@/services/dashboardService';

export default {
  name: 'UserWeeklyReportDetailPopup',
  props: {
    visible: Boolean,
    report: Object, // The summary report object from the list
    userId: Number,
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const loading = ref(false);
    const error = ref(null);
    const reportDetail = ref(null);
    const isEditing = ref(false);

    const form = ref({
      accomplishments: '',
      challenges: '',
      learnings: '',
    });

    const canEdit = computed(() => {
      return reportDetail.value && reportDetail.value.status !== 'SUBMITTED' && reportDetail.value.status !== 'REVIEWED';
    });

    const fetchReportDetails = async () => {
      if (!props.report || !props.userId) {
        console.error('Cannot fetch details: report or userId is missing.');
        return;
      }
      loading.value = true;
      error.value = null;
      try {
        const response = await dashboardService.getWeeklyReportDetail(
          props.userId,
          props.report.weeklyReportId
        );
        reportDetail.value = response.data;
        // Initialize form for editing
        form.value.accomplishments = response.data.accomplishments;
        form.value.challenges = response.data.challenges;
        form.value.learnings = response.data.learnings;
      } catch (e) {
        console.error(e);
        error.value = '리포트 상세 정보를 불러오지 못했습니다.';
      } finally {
        loading.value = false;
      }
    };

    const saveReport = async () => {
      loading.value = true;
      error.value = null;
      try {
        await dashboardService.updateWeeklyReport(
          props.userId,
          props.report.weeklyReportId,
          form.value
        );
        emit('saved');
        close();
      } catch (e) {
        console.error(e);
        error.value = '리포트 저장에 실패했습니다.';
      } finally {
        loading.value = false;
      }
    };

    const close = () => {
      isEditing.value = false;
      emit('close');
    };

    const toggleEdit = (editing) => {
      isEditing.value = editing;
      if (editing) {
        // Reset form to current details if user cancels and re-edits
        form.value.accomplishments = reportDetail.value.accomplishments;
        form.value.challenges = reportDetail.value.challenges;
        form.value.learnings = reportDetail.value.learnings;
      }
    };

    const formatTimestamp = (ts) => {
      if (!ts) return '';
      return new Date(ts).toLocaleString('ko-KR');
    };

    watchEffect(async () => {
      if (props.visible && props.report && props.userId) {
        // Fetch only if the report ID changes, to avoid re-fetching on minor prop updates
        if (reportDetail.value?.weeklyReportId !== props.report.weeklyReportId) {
          await fetchReportDetails();
        }
      } else {
        // Reset state when the modal is not visible
        reportDetail.value = null;
        isEditing.value = false;
        error.value = null;
      }
    });

    return {
      loading,
      error,
      reportDetail,
      isEditing,
      form,
      canEdit,
      close,
      saveReport,
      toggleEdit,
      formatTimestamp,
    };
  },
};
</script>

<style scoped>
/* Styles are copied and adapted from Mentor's popup for consistency */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter, .fade-leave-to { opacity: 0; }
.overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal { width: 650px; max-height: 85vh; background: #ffffff; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
.header { position: relative; padding: 22px 26px; display: flex; justify-content: space-between; border-bottom: 1px solid #edf0f4; }
.title { font-size: 20px; font-weight: 700; margin: 0; color: #1f2937; }
.subtitle { font-size: 13px; margin-top: 4px; color: #6b7280; }
.close-btn { position: absolute; right: 16px; top: 16px; border: none; background: none; font-size: 26px; color: #999; cursor: pointer; }
.body { padding: 24px 26px; overflow-y: auto; }
.content-section { margin-bottom: 26px; }
.section-title { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.section-content { font-size: 14px; color: #374151; white-space: pre-wrap; line-height: 1.6; }
.content-section textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; resize: vertical; font-size: 14px; }
.feedback-box { margin-top: 8px; border-radius: 10px; background: #f5f8ff; border: 1.5px solid #dbe5ff; padding: 16px 18px; }
.feedback-header { display: flex; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #dbe5ff; padding-bottom: 6px; }
.feedback-author { font-weight: 700; font-size: 14px; color: #294594; }
.feedback-date { font-size: 12px; color: #64748b; }
.feedback-text { font-size: 14px; color: #374151; line-height: 1.6; margin-top: 10px; }
.error-message { color: #dc2626; margin-top: 10px; }
.loading-indicator { padding: 40px; text-align: center; color: #6b7280; }
.footer { display: flex; justify-content: flex-end; gap: 12px; padding: 18px; border-top: 1px solid #edf0f4; }
.btn { padding: 10px 26px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; }
.btn-primary { background: #294594; color: white; }
.btn-secondary { background: #e5e7eb; color: #374151; }
</style>
