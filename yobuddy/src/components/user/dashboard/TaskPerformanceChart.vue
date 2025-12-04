<template>
  <div class="chart-card">
    <h3 class="chart-title">과제 수행 현황</h3>

    <div class="chart-content-task">
      
      <!-- KPI 카드 영역 -->
      <div class="kpi-grid">
        <div class="kpi-item">
          <span class="label">전체 과제</span>
          <span class="value">{{ data.totalTasks || 0 }}</span>
        </div>

        <div class="kpi-item">
          <span class="label">제출 완료</span>
          <span class="value submitted">{{ data.submittedTasks || 0 }}</span>
        </div>

        <div class="kpi-item">
          <span class="label">미제출</span>
          <span class="value remaining">{{ data.remainingTasks || 0 }}</span>
        </div>
      </div>

      <!-- 막대 그래프 -->
      <div class="chart-wrapper">
        <apexchart
          type="bar"
          height="120"
          :options="chartOptions"
          :series="series"
        ></apexchart>
      </div>

      <!-- 비율 카드 영역 -->
      <div class="rate-grid">
        <div class="rate-item">
          <span class="label">제출율</span>
          <span class="value">{{ data.submissionRate || 0 }}%</span>
        </div>

        <div class="rate-item">
          <span class="label">정시 제출율</span>
          <span class="value">{{ data.onTimeRate || 0 }}%</span>
        </div>

        <div class="rate-item">
          <span class="label">지각 제출율</span>
          <span class="value">{{ data.lateRate || 0 }}%</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts";

export default {
  name: "TaskPerformanceChart",
  components: { apexchart: VueApexCharts },
  props: {
    data: {
      type: Object,
      required: true,
    },
  },

  computed: {
    series() {
      return [
        {
          name: "과제 현황",
          data: [
            this.data.submittedTasks || 0,
            this.data.remainingTasks || 0,
          ],
        },
      ];
    },

    chartOptions() {
      return {
        chart: {
          stacked: true,
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            horizontal: true,
          },
        },
        colors: ["#294594", "#d6e0f5"],
        xaxis: {
          categories: ["제출 완료", "미제출"],
          labels: { show: false },
        },
        yaxis: { show: false },
        tooltip: {
          y: {
            formatter: (value) => `${value}개`,
          },
        },
        legend: { show: false },
      };
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

.chart-content-task {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.kpi-item .value.submitted {
  color: #294594;
}

.kpi-item .value.remaining {
  color: #ff6347;
}

.chart-wrapper {
  margin: 0;
}

.rate-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  text-align: center;
  background: #fff;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #eef2f7;
}

.rate-item .label {
  font-size: 12px;
  color: #7d93ad;
  display: block;
}

.rate-item .value {
  font-size: 16px;
  font-weight: 700;
  color: #294594;
}
</style>
