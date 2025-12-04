<template>
  <div class="content-card training-list-card">
    <div class="card-header">
      <h2 class="card-title">최신 교육</h2>
      <button class="btn-view-all" @click="viewAllTrainings">전체 보기</button>
    </div>

    <div class="card-body">
      <table class="training-table">
        <thead>
          <tr>
            <th>교육명</th>
            <th>타입</th>
            <th>교육일</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!trainings || trainings.length === 0">
            <td colspan="5" class="empty-state">진행중인 교육이 없습니다.</td>
          </tr>
          <tr v-for="training in trainings" :key="training.id">
            <td>{{ training.title }}</td>
            <td>{{ typeLabel(training.type) }}</td>
            <td>{{ formatDate(training.startDate || training.scheduledAt) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(training.status)]">
                {{ statusLabel(training.status) }}
              </span>
            </td>
            <td>
              <button class="btn-action" @click="viewTrainingDetail(training)">
                상세보기
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "RecentTrainingList",
  props: {
    trainings: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["view-detail", "view-all"],
  setup(props, { emit }) {
    const formatDate = (iso) => {
      if (!iso) return "-";
      return new Date(iso).toLocaleDateString();
    };

    const typeLabel = (t) => {
      if (!t) return ''
      if (t === 'ONLINE') return '온라인'
      if (t === 'OFFLINE') return '오프라인'
      return t
    }

    const statusLabel = (s) => {
      if(!s) return '상태 없음';
      const up = String(s).toUpperCase();
      if(up==='UPCOMING') return '예정';
      if(up==='ACTIVE' || up==='IN_PROGRESS') return '진행 중';
      if(up==='COMPLETED') return '완료';
      return s;
    };

    const getStatusClass = (status) => {
      if (!status) return "status-pending";
      const s = String(status).toLowerCase();
      if (s === 'completed') return 'status-completed';
      if (s === 'active' || s === 'in_progress') return 'status-active';
      if (s === 'upcoming') return 'status-upcoming';
      return `status-default`;
    };

    const viewTrainingDetail = (training) => {
      emit("view-detail", training);
    };

    const viewAllTrainings = () => {
      emit("view-all");
    };

    return {
      formatDate,
      typeLabel,
      statusLabel,
      getStatusClass,
      viewTrainingDetail,
      viewAllTrainings,
    };
  },
};
</script>

<style scoped>
/* Using similar styles to WeeklyReportList for consistency */
.training-list-card {
  width: 1100px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(9,30,66,0.08);
  overflow: hidden;
}
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
.btn-view-all {
  background: #f0f5ff;
  color: #294594;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #d6e0f5;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}
.card-body {
  padding: 10px 28px 28px;
}
.training-table {
  width: 100%;
  border-collapse: collapse;
}
.training-table th,
.training-table td {
  padding: 14px 10px;
  text-align: left;
  border-bottom: 1px solid #eef2f7;
  font-size: 14px;
  vertical-align: middle;
}
.training-table th {
  color: #7d93ad;
  font-weight: 600;
}
.training-table td {
  color: #10243b;
}
.training-table tbody tr:last-child td {
    border-bottom: none;
}
.empty-state {
    text-align: center;
    padding: 40px 0;
    color: #7d93ad;
}
.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
}
.status-completed { background-color: #e6fff2; color: #008a3e; }
.status-active { background-color: #e6f0ff; color: #294594; }
.status-upcoming { background-color: #fff4e6; color: #b36b00; }
.status-default { background-color: #f0f2f5; color: #5a6e85; }
.btn-action {
    background: none;
    border: 1px solid #d6e0f5;
    color: #5a6e85;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
}
</style>
