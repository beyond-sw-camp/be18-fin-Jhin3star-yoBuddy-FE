<template>
  <div class="weekly-activities-list content-card">
    <div class="card-header">
      <h2 class="card-title">주간 활동</h2>

      <!-- 여기로 week-navigation 이사 -->
      <div class="week-navigation">
        <button @click="$emit('go-prev-week')" class="week-nav-button">‹ 이전 주</button>
        <span class="week-range">{{ weeklyRangeText }}</span>
        <button @click="$emit('go-current-week')" class="week-nav-button">이번 주</button>
        <button @click="$emit('go-next-week')" class="week-nav-button">다음 주 ›</button>
      </div>
    </div>

    <div class="card-body">
      <!-- 활동이 있을 때 -->
      <div v-if="groupedByDate.length" class="activity-days">
        <div
          v-for="day in groupedByDate"
          :key="day.date"
          class="activity-day-group"
        >
          <!-- 날짜 헤더 -->
          <div class="activity-day-header">
            {{ formatDate(day.date) }}
          </div>

          <!-- 해당 날짜의 활동들 -->
          <div
            v-for="activity in day.items"
            :key="activity.id"
            class="activity-item"
            @click="viewActivityDetail(activity)"
          >
            <!-- 타입별 색 점 -->
            <div
              :class="['activity-type-indicator', `event-${activity.type.toLowerCase()}`]"
            ></div>

            <div class="activity-content">
              <div class="activity-header">
                <span class="activity-type-icon">
                  {{ getTypeIcon(activity.type) }}
                </span>

                <span class="activity-title">
                  {{ activity.title }}
                </span>

                <span class="activity-time">
                  {{
                    activity.time
                      ? activity.time.substring(0, 5)
                      : activity.type === 'MENTORING'
                        ? '시간 미정'
                        : ''
                  }}
                </span>

                <span
                  v-if="activity.status"
                  :class="['activity-status', getStatusClass(activity.status)]"
                >
                  {{ getStatusLabel(activity.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 활동이 없을 때 -->
      <div v-else class="empty-state">이번 주 활동이 없습니다.</div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";

export default {
  name: "WeeklyActivitiesList",
  props: {
    activities: {
      type: Array,
      default: () => [],
    },
    weeklyRangeText: {
      type: String,
      default: "",
    },
  },

  emits: [
    "view-activity-detail",
    "go-prev-week",
    "go-next-week",
    "go-current-week",
  ],

  setup(props, { emit }) {
    // 날짜/시간 기준으로 정렬
    const sortedActivities = computed(() => {
      return [...props.activities].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || "00:00:00"}`);
        const dateB = new Date(`${b.date}T${b.time || "00:00:00"}`);
        return dateA - dateB;
      });
    });

    // 날짜별 그룹
    const groupedByDate = computed(() => {
      const map = new Map();

      sortedActivities.value.forEach((item) => {
        if (!item.date) return;

        if (!map.has(item.date)) {
          map.set(item.date, []);
        }
        map.get(item.date).push(item);
      });

      return Array.from(map.entries()).map(([date, items]) => ({
        date,
        items,
      }));
    });

    // 날짜 포맷
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
    };

    const getTypeIcon = (type) => {
      if (type === "TASK") return "과제";
      if (type === "TRAINING") return "교육";
      if (type === "MENTORING") return "멘토링";
      return "•";
    };

    // 상태 한글 라벨
    const getStatusLabel = (status) => {
      const map = {
        MISSING: "미제출",
        PENDING: "진행중",
        COMPLETED: "완료",
        SCHEDULED: "예정",
      };
      return map[status] || status || "";
    };

    // 상태별 CSS 클래스
    const getStatusClass = (status) => {
      const lower = status.toLowerCase();
      if (lower === "missing") return "status-missing";
      if (lower === "pending") return "status-pending";
      if (lower === "completed") return "status-completed";
      if (lower === "scheduled") return "status-scheduled";
      return "";
    };

    const viewActivityDetail = (activity) => {
      emit("view-activity-detail", activity);
    };

    return {
      groupedByDate,
      formatDate,
      getTypeIcon,
      getStatusLabel,
      getStatusClass,
      viewActivityDetail,
    };
  },
};
</script>

<style scoped>
.weekly-activities-list {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(9, 30, 66, 0.08);
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

.card-body {
  padding: 22px 28px;
}

/* ⬇⬇ 주간 네비게이션 (헤더 안 오른쪽 정렬) */
.week-navigation {
  display: flex;
  align-items: center;
  gap: 10px;
}

.week-nav-button {
  background: #e6f0ff;
  color: #294594;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
}

.week-nav-button:hover {
  background: #d0e0ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.week-range {
  font-size: 13px;
  font-weight: 700;
  color: #10243b;
}

/* 날짜 그룹 */
.activity-days {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.activity-day-group {
  padding-bottom: 4px;
  border-bottom: 1px solid #f3f4f6;
}

.activity-day-group:last-child {
  border-bottom: none;
}

.activity-day-header {
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 8px;
}

/* 개별 활동 */
.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
}

.activity-type-indicator {
  width: 8px;
  height: 40px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 4px;
}

.activity-content {
  flex-grow: 1;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.activity-type-icon {
  font-size: 14px;
}

.activity-title {
  font-size: 14px;
  font-weight: 600;
  color: #10243b;
}

.activity-time {
  margin-left: auto;
  font-weight: 500;
}

/* 상태 공통 스타일 */
.activity-status {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
}

/* 상태별 색상 */
.status-missing {
  background-color: #ffe6e6;
  color: #cc0000;
}
.status-pending {
  background-color: #fff4e6;
  color: #b36b00;
}
.status-completed {
  background-color: #e6fff2;
  color: #006622;
}
.status-scheduled {
  background-color: #e6f0ff;
  color: #294594;
}

/* 타입별 색상 - 왼쪽 막대 */
.event-mentoring {
  background-color: #294594;
}
.event-task {
  background-color: #b36b00;
}
.event-training {
  background-color: #006622;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #7d93ad;
}
</style>
