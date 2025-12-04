<template>
  <div class="content-card performance-summary-card">
    <div class="card-header">
      <h2 class="card-title">온보딩 성과 요약</h2>
      <div class="date-range-picker">
        <span>{{ formattedPeriod }}</span>
      </div>
    </div>

    <div class="card-body" v-if="header">
      <div class="summary-header">
        <div class="summary-item">
          <span class="label">멘토링 횟수</span>
          <span class="value">{{ header.mentoringCount || 0 }}</span>
        </div>
        <div class="summary-item">
          <span class="label">총 멘토링 시간</span>
          <span class="value">{{ header.totalMentoringHours || 0 }}h</span>
        </div>
        <div class="summary-item">
          <span class="label">평균 과제 점수</span>
          <span class="value">{{ header.averageTaskScore ? header.averageTaskScore.toFixed(1) : 'N/A' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">평균 교육 점수</span>
          <span class="value">{{ header.averageTrainingScore ? header.averageTrainingScore.toFixed(1) : 'N/A' }}</span>
        </div>
      </div>

      <div class="charts-container">
        <MentoringPerformanceChart v-if="mentoringSection" :data="mentoringSection" />
        <TaskPerformanceChart v-if="taskSection" :data="taskSection" />
        <TrainingPerformanceChart v-if="trainingSection" :data="trainingSection" />
      </div>
    </div>

    <div v-else class="loading-state">
      <p>성과 데이터를 불러오는 중입니다...</p>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import MentoringPerformanceChart from "./MentoringPerformanceChart.vue";
import TaskPerformanceChart from "./TaskPerformanceChart.vue";
import TrainingPerformanceChart from "./TrainingPerformanceChart.vue";

export default {
  name: "OnboardingPerformance",

  components: {
    MentoringPerformanceChart,
    TaskPerformanceChart,
    TrainingPerformanceChart,
  },

  props: ["header", "mentoringSection", "taskSection", "trainingSection"],

  setup(props) {
    const formattedPeriod = computed(() => {
      if (!props.header?.periodStart || !props.header?.periodEnd)
        return "기간 정보 없음";

      const s = new Date(props.header.periodStart).toLocaleDateString("ko-KR");
      const e = new Date(props.header.periodEnd).toLocaleDateString("ko-KR");
      return `${s} ~ ${e}`;
    });

    return {
      formattedPeriod,
    };
  },
};
</script>

<style scoped>
.performance-summary-card {
  width: 1000px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(9, 30, 66, 0.08);
}

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  border-bottom: 1px solid #eef2f7;
}

.card-title {
  margin: 0;
  font-size: 20px;
  color: #10243b;
}

.date-range-picker span {
  font-size: 14px;
  color: #5a6e85;
  font-weight: 500;
}

/* Body */
.card-body {
  padding: 24px 28px;
}

/* Summary Top Grid */
.summary-header {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  background-color: #f8fafc;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 24px;
  text-align: center;
}

.summary-item .label {
  display: block;
  font-size: 14px;
  color: #7d93ad;
  margin-bottom: 8px;
}

.summary-item .value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #294594;
}

/* Chart Container */
.charts-container {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 16px;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 60px 0;
  color: #7d93ad;
}
</style>