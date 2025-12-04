<!-- file: src/components/mentor/MenteeOnboardingPerformance.vue -->
<template>
  <div class="performance-card" v-if="mentorId">
    <!-- 헤더: 멘티 선택 + 기간 선택 -->
    <div class="perf-header">
      <div class="left">
        <h2 class="title">신입 온보딩 성과</h2>

        <div class="filters">
          <select v-model.number="selectedMenteeId" @change="onFilterChange">
            <option disabled value="">담당 멘티 선택</option>
            <option v-for="m in mentees" :key="m.menteeId" :value="m.menteeId">
              {{ m.name }} ({{ m.department || '부서 미지정' }})
            </option>
          </select>

          <div class="date-range">
            <input type="date" v-model="from" @change="onFilterChange" />
            <span>~</span>
            <input type="date" v-model="to" @change="onFilterChange" />
          </div>
        </div>
      </div>

      <!-- 상단 요약 메트릭 -->
      <div class="summary-metrics" v-if="data">
        <div class="metric">
          <span class="label">진행한 멘토링</span>
          <span class="value">{{ data.header.mentoringCount }}회</span>
        </div>
        <div class="metric">
          <span class="label">총 멘토링 시간</span>
          <span class="value">{{ data.header.totalMentoringHours.toFixed(1) }}시간</span>
        </div>
        <div class="metric">
          <span class="label">평균 과제 점수</span>
          <span class="value">
            {{ data.header.averageTaskScore != null ? data.header.averageTaskScore.toFixed(1) + '점' : '-' }}
          </span>
        </div>
        <div class="metric">
          <span class="label">KPI 점수</span>
          <span class="value">
            {{ data.header.kpiScore != null ? data.header.kpiScore.toFixed(1) + '점' : '-' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 본문: 과제 / 교육 카드 + 주간 리포트 테이블 -->
    <div v-if="data" class="perf-body">
      <div class="top-row">
        <!-- 과제 제출 현황 -->
        <div class="panel">
          <div class="panel-header">
            <h3>과제 제출 현황</h3>
          </div>
          <div class="panel-body">
            <div class="stat-row">
              <span>제출 완료</span>
              <span>{{ data.taskSection.submittedTasks }}개</span>
            </div>
            <div class="stat-row">
              <span>남은 과제</span>
              <span>{{ data.taskSection.remainingTasks }}개</span>
            </div>
            <div class="progress-wrap">
              <div class="progress-label">
                제출 기한 준수율
                <span>{{ data.taskSection.submissionRate.toFixed(1) }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill primary"
                  :style="{ width: Math.min(data.taskSection.submissionRate, 100) + '%' }"
                ></div>
              </div>
            </div>

            <div class="split-progress">
              <div class="progress-wrap small">
                <div class="progress-label">
                  제시간 제출
                  <span>{{ data.taskSection.onTimeRate.toFixed(1) }}%</span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: Math.min(data.taskSection.onTimeRate, 100) + '%' }"
                  ></div>
                </div>
              </div>
              <div class="progress-wrap small">
                <div class="progress-label">
                  지각 제출
                  <span>{{ data.taskSection.lateRate.toFixed(1) }}%</span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill late"
                    :style="{ width: Math.min(data.taskSection.lateRate, 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 교육 이수 현황 -->
        <div class="panel">
          <div class="panel-header">
            <h3>교육 이수 현황</h3>
          </div>
          <div class="panel-body">
            <div class="stat-row">
              <span>이수 완료</span>
              <span>{{ data.trainingSection.completedTrainings }}개</span>
            </div>
            <div class="stat-row">
              <span>남은 교육</span>
              <span>{{ data.trainingSection.remainingTrainings }}개</span>
            </div>
            <div class="progress-wrap">
              <div class="progress-label">
                이수 기한 준수율
                <span>{{ data.trainingSection.completionRate.toFixed(1) }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill primary"
                  :style="{ width: Math.min(data.trainingSection.completionRate, 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 주간 리포트 테이블 -->
      <div class="reports-panel">
        <div class="panel-header">
          <h3>주간 리포트</h3>
        </div>
        <div class="panel-body">
          <table class="report-table" v-if="data.weeklyReports.length">
            <thead>
              <tr>
                <th>작성자</th>
                <th>리포트</th>
                <th>작성일</th>
                <th>제출 여부</th>
                <th>피드백 작성 여부</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in data.weeklyReports" :key="r.reportId" @click="openReportPopup(r.reportId)">
                <td>{{ r.authorName }}</td>
                <td>{{ r.label }}</td>
                <td>{{ formatDate(r.writtenDate) }}</td>
                <td>
                  <span :class="['status-pill', submitStatusClass(r.submitStatus)]">
                    {{ submitStatusText(r.submitStatus) }}
                  </span>
                </td>
                <td>
                  <span :class="['status-pill', feedbackStatusClass(r.feedbackStatus)]">
                    {{ feedbackStatusText(r.feedbackStatus) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">
            표시할 주간 리포트가 없습니다.
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedMenteeId && !isLoading" class="empty">
      선택한 기간에 대한 데이터가 없습니다.
    </div>

    <div v-if="isLoading" class="loading">
      불러오는 중...
    </div>

    <weekly-report-detail-popup
      :visible="isReportPopupVisible"
      :mentor-id="mentorId"
      :mentee-id="selectedMenteeId"
      :report-id="selectedReportId"
      @close="closeReportPopup"
      @saved="handleReportSaved"
    />
  </div>
</template>

<script>
import mentoringService from "@/services/mentoringService";
import WeeklyReportDetailPopup from './WeeklyReportDetailPopup.vue';

export default {
  name: "MenteeOnboardingPerformance",
  components: {
    WeeklyReportDetailPopup,
  },
  props: {
    mentorId: {
      type: Number,
      required: true,
    },
    // MentorDashboard 에서 내려주는 담당 멘티 목록
    mentees: {
      type: Array,
      required: true,
    },
  },
  data() {
    const today = new Date()
    const start = new Date(today)
    start.setMonth(start.getMonth() - 1) // 기본 기간: 1개월

    return {
      selectedMenteeId: "",
      from: start.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
      data: null,
      isLoading: false,
      isReportPopupVisible: false,
      selectedReportId: null,
    }
  },
  watch: {
    mentees: {
      immediate: true,
      handler(newVal) {
        // 멘티 목록 처음 로드되면 첫 번째 멘티 자동 선택
        if (newVal && newVal.length && !this.selectedMenteeId) {
          this.selectedMenteeId = newVal[0].menteeId
          this.fetchData()
        }
      },
    },
  },
  methods: {
    async fetchData() {
      if (!this.mentorId || !this.selectedMenteeId || !this.from || !this.to) return
      this.isLoading = true
      try {
        this.data = await mentoringService.getMenteeOnboardingPerformance(
          this.mentorId,
          this.selectedMenteeId,
          this.from,
          this.to
        )
      } catch (e) {
        console.error("온보딩 성과 조회 실패", e)
        this.data = null
      } finally {
        this.isLoading = false
      }
    },
    onFilterChange() {
      this.fetchData()
    },
    openReportPopup(reportId) {
      this.selectedReportId = reportId;
      this.isReportPopupVisible = true;
    },
    closeReportPopup() {
      this.isReportPopupVisible = false;
      this.selectedReportId = null;
    },
    handleReportSaved() {
      this.closeReportPopup();
      this.fetchData(); // Refresh data after saving
    },
    formatDate(dateStr) {
      if (!dateStr) return "-"
      return dateStr
    },
    submitStatusClass(status) {
      switch (status) {
        case "SUBMITTED":
          return "pill-blue"
        case "MISSING":
          return "pill-gray"
        default:
          return "pill-gray"
      }
    },
    submitStatusText(status) {
      switch (status) {
        case "SUBMITTED":
          return "제출 완료"
        case "MISSING":
          return "미제출"
        default:
          return status || "-"
      }
    },
    feedbackStatusClass(status) {
      switch (status) {
        case "WRITTEN":
          return "pill-blue"
        case "PENDING":
          return "pill-gray"
        default:
          return "pill-gray"
      }
    },
    feedbackStatusText(status) {
      switch (status) {
        case "WRITTEN":
          return "작성 완료"
        case "PENDING":
          return "작성 대기"
        default:
          return status || "-"
      }
    },
  },
}
</script>

<style scoped>
.performance-card {
  width: 1200px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(9, 30, 66, 0.08);
  padding: 20px 24px 26px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.perf-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 12px;
}

.title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #10243b;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filters select {
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.date-range input {
  height: 34px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(4, max-content);
  gap: 16px;
  align-items: center;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.metric .label {
  font-size: 12px;
  color: #7d93ad;
}

.metric .value {
  font-size: 16px;
  font-weight: 700;
  color: #294594;
}

.perf-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel {
  border-radius: 12px;
  background: #f9fbff;
  padding: 14px 16px 18px;
}

.panel-header h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #10243b;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 4px;
  color: #111827;
}

.progress-wrap {
  margin-top: 10px;
}

.progress-wrap.small {
  flex: 1;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.progress-bar {
  height: 8px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #9ca3af;
}

.progress-fill.primary {
  background: #294594;
}

.progress-fill.late {
  background: #f97316;
}

.split-progress {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.reports-panel {
  border-radius: 12px;
  background: #f9fbff;
  padding: 14px 16px 18px;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.report-table th,
.report-table td {
  padding: 8px 6px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.report-table th {
  color: #6b7280;
  font-weight: 600;
}

.report-table tbody tr:hover {
  background-color: #f9fafb;
  cursor: pointer;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.pill-blue {
  background: #e0e7ff;
  color: #1d4ed8;
}

.pill-gray {
  background: #e5e7eb;
  color: #4b5563;
}

.empty {
  text-align: center;
  color: #7d93ad;
  padding: 24px 0;
}

.loading {
  text-align: center;
  color: #294594;
  padding: 12px 0;
}
</style>
