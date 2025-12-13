<template>
  <div class="weekly-activities-list content-card">
  <div class="card-header">
      <h2 class="card-title">주간 활동</h2>

      <div class="week-controls">
        <div class="week-jump">
          <input
            v-model="weekInput"
            type="date"
            class="week-input"
            @keydown.enter="applyWeek"
          />
          <button class="week-apply-button" @click="applyWeek">이동</button>
          <span class="week-range-text">{{ weeklyRangeText }}</span>
        </div>

        <div class="week-navigation">
          <button @click="$emit('go-prev-week')" class="week-nav-button">‹ 이전 주</button>

          <button @click="$emit('go-current-week')" class="week-nav-button">이번 주</button>
          <button @click="$emit('go-next-week')" class="week-nav-button">다음 주 ›</button>
        </div>
      </div>
    </div>

    <div class="card-body">
      <div v-if="groupedByDate.length" class="activity-days">
        <div v-for="day in groupedByDate" :key="day.date" class="activity-day-group">
          <div class="activity-day-header">
            {{ formatDate(day.date) }}
          </div>

          <div
            v-for="activity in day.items"
            :key="activity.id"
            class="activity-item"
            @click="viewActivityDetail(activity)"
          >
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

      <div v-else class="empty-state">이번 주 활동이 없습니다.</div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from "vue";

export default {
  name: "WeeklyActivitiesList",
  props: {
    activities: { type: Array, default: () => [] },
    weeklyRangeText: { type: String, default: "" },
    weekBaseDate: { type: Date, required: true },
  },
  emits: ["view-activity-detail", "go-prev-week", "go-next-week", "go-current-week", "jump-to-week"],

  setup(props, { emit }) {
    const weekInput = ref("");

    const toYmd = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    watch(
      () => props.weekBaseDate,
      (d) => {
        if (d instanceof Date && !isNaN(d.getTime())) {
          weekInput.value = toYmd(d);
        }
      },
      { immediate: true }
    );

    const applyWeek = () => {
      if (!weekInput.value) return;
      emit("jump-to-week", weekInput.value);
    };

    const sortedActivities = computed(() => {
      return [...props.activities].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || "00:00:00"}`);
        const dateB = new Date(`${b.date}T${b.time || "00:00:00"}`);
        return dateA - dateB;
      });
    });

    const groupedByDate = computed(() => {
      const map = new Map();

      sortedActivities.value.forEach((item) => {
        if (!item.date) return;
        if (!map.has(item.date)) map.set(item.date, []);
        map.get(item.date).push(item);
      });

      return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
    });

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

    const getStatusLabel = (status) => {
      const map = {
        MISSING: "미제출",
        PENDING: "진행 중",
        COMPLETED: "완료됨",
        SCHEDULED: "예정",
        GRADED: "평가됨",
        SUBMITTED: "제출됨",
        LATE: "지연 제출",
      };
      return map[status] || status || "";
    };

    const getStatusClass = (status) => {
      const lower = String(status).toLowerCase();
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
      weekInput,
      applyWeek,
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

.week-controls {
  display: flex;
  gap: 10px;
}

.card-title {
  margin: 0;
  font-size: 20px;
  color: #10243b;
}

.card-body {
  padding: 22px 28px;
}

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

.week-jump {
  display: flex;
  align-items: center;
  gap: 8px;
}

.week-input {
  height: 30px;
  padding:  8px;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  font-size: 12px;
  color: #10243b;
}

.week-apply-button {
  background: #f3f4f6;
  color: #374151;
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 12px;
  white-space: nowrap;
}

.week-apply-button:hover {
  background: #e5e7eb;
}

.week-range-text {
  font-size: 13px;
  font-weight: 700;
  color: #10243b;
  white-space: nowrap;
}

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

.activity-status {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
}

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
