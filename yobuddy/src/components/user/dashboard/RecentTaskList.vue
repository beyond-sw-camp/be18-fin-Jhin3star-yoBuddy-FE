<template>
  <div class="content-card task-list-card">
    <div class="card-header">
      <h2 class="card-title">최신 과제</h2>
      <button class="btn-view-all" @click="viewAllTasks">전체 보기</button>
    </div>

    <div class="card-body">
      <table class="task-table">
        <thead>
          <tr>
            <th>과제명</th>
            <th>마감일</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!tasks || tasks.length === 0">
            <td colspan="4" class="empty-state">진행중인 과제가 없습니다.</td>
          </tr>
          <tr v-for="task in tasks" :key="task.userTaskId">
            <td>{{ task.title }}</td>
            <td>{{ formatDate(task.dueDate) }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(task.status)]">
                {{ statusLabel(task.status) }}
              </span>
            </td>
            <td>
              <button class="btn-action" @click="viewTaskDetail(task)">
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
  name: "RecentTaskList",
  props: {
    tasks: {
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

    const statusLabel = (s) => {
      const map = {
        PENDING: "진행 중",
        SUBMITTED: "제출됨",
        LATE: "지연 제출",
        MISSING: "미제출",
        GRADED: "평가됨",
        COMPLETED: "완료됨",
      };
      return map[s] || s;
    };

    const getStatusClass = (status) => {
      if (!status) return "status-pending";
      return `status-${status.toLowerCase()}`;
    };

    const viewTaskDetail = (task) => {
      emit("view-detail", task);
    };

    const viewAllTasks = () => {
      emit("view-all");
    };

    return {
      formatDate,
      statusLabel,
      getStatusClass,
      viewTaskDetail,
      viewAllTasks,
    };
  },
};
</script>

<style scoped>
/* Using similar styles to WeeklyReportList for consistency */
.task-list-card {
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
.task-table {
  width: 100%;
  border-collapse: collapse;
}
.task-table th,
.task-table td {
  padding: 14px 10px;
  text-align: left;
  border-bottom: 1px solid #eef2f7;
  font-size: 14px;
  vertical-align: middle;
}
.task-table th {
  color: #7d93ad;
  font-weight: 600;
}
.task-table td {
  color: #10243b;
}
.task-table tbody tr:last-child td {
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
.status-pending { background: #D8D8D8; color: #6F6F6F; }
.status-submitted { background: #E9F0FF; color: #294594; }
.status-late { background: #F8E3E2; color: #AE5E62; }
.status-missing { background: #F8E3E2; color: #AE5E62; }
.status-graded { background: #E3F7E9; color: #0A9A52; }
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
