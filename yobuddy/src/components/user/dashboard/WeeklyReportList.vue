<template>
  <div class="content-card report-list-card">
    <div class="card-header">
      <h2 class="card-title">주간 리포트</h2>
    </div>

    <div class="card-body">
      <table class="report-table">
        <thead>
          <tr>
            <th>주차</th>
            <th>기간</th>
            <th>작성일</th>
            <th>제출 상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>

          <tr v-if="!reports || reports.length === 0">
            <td colspan="5" class="empty-state">표시할 주간 리포트가 없습니다.</td>
          </tr>

          <tr v-for="report in reports" :key="report.weeklyReportId">
            <td>{{ report.weekNumber }}주차</td>

            <td>{{ formatPeriod(report.startDate, report.endDate) }}</td>

            <td>{{ formatDate(report.createdAt) }}</td>

            <td>
              <span :class="['status-badge', getStatusClass(report.status)]">
                {{ translateStatus(report.status) }}
              </span>
            </td>

            <td>
              <button class="btn-action" @click="viewReportDetail(report)">
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
  name: "WeeklyReportList",

  props: {
    reports: {
      type: Array,
      default: () => [],
    },
  },

  emits: ["view-detail"],

  setup(props, { emit }) {

    const formatDate = (dateString) => {
      if (!dateString) return "—";
      return new Date(dateString).toLocaleDateString("ko-KR");
    };

    const formatPeriod = (start, end) => {
      if (!start || !end) return "—";
      return `${start} ~ ${end}`;
    };

    const translateStatus = (status) => {
      const map = {
        SUBMITTED: "제출됨",
        MISSING: "미제출",
        REVIEWED: "피드백 완료",
        FEEDBACK_OVERDUE: "피드백 지연",
        WRITTEN: "작성 중",
      };
      return map[status] || status;
    };

    const getStatusClass = (status) => {
      if (!status) return "status-pending";
      return `status-${status.toLowerCase()}`;
    };

    const viewReportDetail = (report) => {
      emit("view-detail", report);
    };

    return {
      formatDate,
      formatPeriod,
      translateStatus,
      getStatusClass,
      viewReportDetail,
    };
  },
};
</script>


<style scoped>
.report-list-card {
  width: 1200px;
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

.report-table {
  width: 100%;
  border-collapse: collapse;
}

.report-table th,
.report-table td {
  padding: 14px 10px;
  text-align: left;
  border-bottom: 1px solid #eef2f7;
  font-size: 14px;
  vertical-align: middle;
}

.report-table th {
  color: #7d93ad;
  font-weight: 600;
}

.report-table td {
  color: #10243b;
}

.report-table tbody tr:last-child td {
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
  text-transform: uppercase;
}

.status-submitted, .status-reviewed {
  background-color: #e6fff2;
  color: #008a3e;
}
.status-missing, .status-feedback-overdue {
  background-color: #ffebe6;
  color: #d93000;
}
.status-written {
  background-color: #e6f0ff;
  color: #294594;
}
.status-pending {
  background-color: #fff4e6;
  color: #b36b00;
}

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
