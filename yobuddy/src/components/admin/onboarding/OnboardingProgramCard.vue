<template>
  <div class="program-card">
    <div class="card-header">
      <span :class="['status-tag', getStatusClass(program.status)]">
        {{ getStatusText(program.status) }}
      </span>
      <h3 class="program-name">{{ program.name }}</h3>
      <p class="program-department">{{ program.department }}</p>
    </div>

    <div class="card-body">
      <div class="info-row">
        <span class="label">기간</span>
        <span class="value">{{ program.startDate }} ~ {{ program.endDate }}</span>
      </div>
      <div class="info-row">
        <span class="label">참여 인원</span>
        <span class="value">{{ program.participantCount }}명</span>
      </div>
    </div>

    <div class="card-footer">
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: program.progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ program.progress.toFixed(1) }}%</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "OnboardingProgramCard",
  props: {
    program: {
      type: Object,
      required: true,
    },
  },
  methods: {
    getStatusText(status) {
      const statusMap = {
        ACTIVE: '진행중',
        UPCOMING: '예정',
        COMPLETED: '완료',
      };
      return statusMap[status] || status;
    },
    getStatusClass(status) {
      const classMap = {
        ACTIVE: 'active',
        UPCOMING: 'upcoming',
        COMPLETED: 'completed',
      };
      return classMap[status] || 'default';
    },
  },
};
</script>

<style scoped>
.program-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(9, 30, 66, 0.07);
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease-in-out;
  border: 1px solid #eef2f7;
}
.program-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(9, 30, 66, 0.1);
}
.card-header {
  padding: 20px;
  border-bottom: 1px solid #eef2f7;
}
.program-name {
  margin: 8px 0 4px;
  font-size: 18px;
  color: #10243b;
}
.program-department {
  margin: 0;
  font-size: 13px;
  color: #7d93ad;
}
.card-body {
  padding: 20px;
  flex-grow: 1;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 12px;
}
.info-row:last-child {
  margin-bottom: 0;
}
.label {
  color: #6b7280;
  font-weight: 600;
}
.value {
  color: #10243b;
  font-weight: 500;
}
.card-footer {
  padding: 20px;
  border-top: 1px solid #eef2f7;
  display: flex;
  align-items: center;
  gap: 12px;
}
.progress-bar-container {
  flex-grow: 1;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background-color: #294594;
  border-radius: 4px;
  transition: width 0.5s ease;
}
.progress-text {
  font-size: 13px;
  font-weight: 700;
  color: #294594;
}

.status-tag {
  padding: 5px 12px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
.status-tag.active { background: #d1fae5; color: #059669; }
.status-tag.upcoming { background: #fef3c7; color: #92400e; }
.status-tag.completed { background: #e0e7ff; color: #3730a3; }
.status-tag.default { background: #e5e7eb; color: #4b5563; }
</style>
