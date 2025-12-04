<template>
  <div class="chart-card">
    <h3 class="chart-title">교육 이수 현황</h3>

    <div class="chart-content-training">
      <div class="kpi-grid">
        <div class="kpi-item">
          <span class="label">전체 교육</span>
          <span class="value">{{ data.totalTrainings }}</span>
        </div>
        <div class="kpi-item">
          <span class="label">이수 완료</span>
          <span class="value completed">{{ data.completedTrainings }}</span>
        </div>
        <div class="kpi-item">
          <span class="label">남은 교육</span>
          <span class="value remaining">{{ data.remainingTrainings }}</span>
        </div>
      </div>

      <div class="progress-bar-wrapper">
        <div class="progress-bar-label">
          <span>이수율</span>
          <span>{{ data.completionRate }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: data.completionRate + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrainingPerformanceChart',
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
.chart-card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 20px;
}

.chart-title {
  margin-bottom: 14px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #10243b;
}

.chart-content-training {
    display: flex;
    flex-direction: column;
    gap: 24px;
    flex-grow: 1;
    justify-content: center;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    text-align: center;
}

.kpi-item .label {
    font-size: 12px;
    color: #7d93ad;
    display: block;
}

.kpi-item .value {
    font-size: 20px;
    font-weight: 700;
    color: #10243b;
}

.kpi-item .value.completed {
    color: #294594;
}
.kpi-item .value.remaining {
    color: #ff6347;
}

.progress-bar-wrapper {
    padding: 14px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #eef2f7;
}

.progress-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: #5a6e85;
    margin-bottom: 8px;
}

.progress-bar {
    width: 100%;
    height: 10px;
    background-color: #d6e0f5;
    border-radius: 5px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    background-color: #294594;
    border-radius: 5px;
    transition: width 0.5s ease-in-out;
}
</style>
