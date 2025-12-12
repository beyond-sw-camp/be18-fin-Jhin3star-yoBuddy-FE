<template>
  <div class="period-summary">
    <div class="header-row">
      <h2>{{ periodLabel }}</h2>

      <select v-model="selectedPeriod" @change="onPeriodChange">
        <option v-for="p in periods" :key="p.value" :value="p.value">
          {{ p.label }}
        </option>
      </select>
    </div>

    <div class="date-range">
      로딩된 기간: {{ summary.periodStart }} ~ {{ summary.periodEnd }}
    </div>

    <div class="stats-row">
      <div class="stat">
        <div class="label">신입 수</div>
        <div class="value">{{ summary.newUsers }}명</div>
      </div>

      <div class="stat">
        <div class="label">총 멘토링 횟수</div>
        <div class="value">{{ summary.totalMentoring }}회</div>
      </div>

      <div class="stat">
        <div class="label">평균 과제 점수</div>
        <div class="value">{{ summary.avgTaskScore }}</div>
      </div>

      <div class="stat">
        <div class="label">KPI 종합 점수</div>
        <div class="value">{{ summary.kpiTotalScore }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  summary: Object,
  periods: Array,
  currentPeriod: String,
});

const emit = defineEmits(["change"]);

const selectedPeriod = ref(props.currentPeriod);

const periodLabel = computed(() => {
  return props.periods.find(p => p.value === selectedPeriod.value)?.label || "";
});

function onPeriodChange() {
  emit("change", selectedPeriod.value);
}
</script>

<style scoped>
.period-summary {
  background: #eff5ff;
  border: 1px solid #d8e6ff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  display: flex;
  gap: 40px;
  margin-top: 20px;
}

.stat .label {
  color: #555;
  font-size: 14px;
}

.stat .value {
  font-size: 22px;
  font-weight: 700;
  margin-top: 4px;
}

.date-range {
  margin-top: 6px;
  font-size: 14px;
  color: #666;
}
</style>