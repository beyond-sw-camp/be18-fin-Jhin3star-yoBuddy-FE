<template>
  <div class="chart-card">
    <h3 class="chart-title">멘토링 수행 현황</h3>

    <div class="chart-content">
      <!-- 도넛 차트 -->
      <div class="chart-wrapper">
        <apexchart
          type="donut"
          height="160"
          :options="chartOptions"
          :series="series"
        ></apexchart>
      </div>

      <!-- 통계 정보 -->
      <div class="stats-wrapper">
        <div class="stat-item">
          <span class="label">완료</span>
          <span class="value">{{ data.completedMentoring || 0 }}</span>
        </div>

        <div class="stat-item">
          <span class="label">예정</span>
          <span class="value">{{ data.notCompletedMentoring || 0 }}</span>
        </div>

        <div class="stat-item">
          <span class="label">노쇼</span>
          <span class="value">{{ data.noShowMentoring || 0 }}</span>
        </div>

        <div class="stat-item rate">
          <span class="label">완료율</span>
          <span class="value">{{ data.completedMentoringRate || 0 }}%</span>
        </div>

        <div class="stat-item rate">
          <span class="label">정시 수행율</span>
          <span class="value">{{ data.onTimeMentoringRate || 0 }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts";

export default {
  name: "MentoringPerformanceChart",
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
        this.data.completedMentoring || 0,
        this.data.notCompletedMentoring || 0,
        this.data.noShowMentoring || 0,
      ];
    },

    chartOptions() {
      return {
        labels: ["완료", "예정", "노쇼"],
        colors: ["#294594", "#5b9aff", "#ff6347"],

        tooltip: {
          y: { formatter: (val) => `${val}회` },
        },

        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "총 세션",
                  formatter: () => this.data.totalMentoring || 0,
                },
              },
            },
          },
        },
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

.chart-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-grow: 1;
}

.chart-wrapper {
  flex-shrink: 0;
}

.stats-wrapper {
  flex-grow: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  background: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #eef2f7;
}

.stat-item .label {
  font-size: 12px;
  color: #7d93ad;
  display: block;
}

.stat-item .value {
  font-size: 18px;
  font-weight: 700;
  color: #10243b;
}

.stat-item.rate {
  grid-column: span 2;
  text-align: center;
}

.stat-item.rate .value {
  color: #294594;
}
</style>
