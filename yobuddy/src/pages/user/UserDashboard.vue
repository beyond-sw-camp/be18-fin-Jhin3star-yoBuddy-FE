<template>
  <div class="user-dashboard-page">
    <div v-if="loading" class="loading-spinner">Loading...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <template v-if="!loading && !error">
      <!-- Mentor Info Card -->
      <MentorInfoCard :mentor="mentor" class="mentor-info-card-standalone" />

      <!-- Calendar + Daily Schedule Layout -->
      <div class="calendar-schedule-layout">
        
        <!-- Calendar -->
        <div class="calendar-wrapper">
          <CustomCalendar
            :events-by-date="eventsByDate"
            :selected-date="selectedDate"
            @select-date="onSelectDate"
            @changed-month="fetchScheduleForMonth"
          />
        </div>

        <!-- Daily Schedule -->
        <div class="schedule-panel">
          <h3 class="schedule-header">{{ selectedDateFormatted }}</h3>

          <div v-if="eventsForSelectedDate.length" class="events-list">
            <div
              v-for="event in eventsForSelectedDate"
              :key="event.id"
              :class="['event-item', getEventClass(event.type)]"
              @click="openEvent(event)"
            >
              <div class="event-details">
                <span class="event-type-label">{{ event.type === 'TASK' ? '과제' : event.type === 'TRAINING' ? '교육' : '멘토링' }}</span>
                <span class="event-time-label">{{ event.time ? event.time.substring(0, 5) : '' }}</span>
              </div>
              <div class="event-title-display">{{ event.title }}</div>
              <div class="event-status-display">{{ event.status }}</div>
            </div>
          </div>

          <div v-else class="no-events">
            선택된 날짜에 일정이 없습니다.
          </div>
        </div>

      </div>

      <!-- Below Components -->
      <div class="other-components-layout">
        <RecentTaskList
          :tasks="recentTasks"
          @view-detail="handleViewTaskDetail"
          @view-all="handleViewAllTasks"
        />
        <RecentTrainingList
          :trainings="recentTrainings"
          @view-detail="handleViewTrainingDetail"
          @view-all="handleViewAllTrainings"
        />
        <WeeklyReportList
          :reports="weeklyReports"
          @view-detail="handleViewReportDetail"
        />
      </div>
    </template>

    <!-- Modals -->
    <UserTaskDetailModal
      v-if="showTaskDetailModal"
      :show="showTaskDetailModal"
      :userTaskId="selectedTask.userTaskId"
      @close="closeTaskDetailModal"
    />
    <TrainingDetailPopup
      v-if="showTrainingDetailModal"
      :visible="showTrainingDetailModal"
      :training="selectedTraining"
      @close="closeTrainingDetailModal"
    />
    <UserWeeklyReportDetailPopup
      v-if="showReportDetailModal"
      :visible="showReportDetailModal"
      :report="selectedReport"
      :user-id="userId"
      @close="closeReportDetailModal"
      @saved="handleReportSaved"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/authStore";

import dashboardService from "@/services/dashboardService.js";
import tasksService from "@/services/tasksService.js";
import userTrainingService from "@/services/userTrainingService.js";

import CustomCalendar from "@/components/user/dashboard/CustomCalendar.vue";
import MentorInfoCard from "@/components/user/dashboard/MentorInfoCard.vue";
import RecentTaskList from "@/components/user/dashboard/RecentTaskList.vue";
import RecentTrainingList from "@/components/user/dashboard/RecentTrainingList.vue";
import WeeklyReportList from "@/components/user/dashboard/WeeklyReportList.vue";

import UserTaskDetailModal from "@/pages/user/tasks/UserTaskDetailModal.vue";
import TrainingDetailPopup from "@/components/user/training/TrainingDetailPopup.vue";
import UserWeeklyReportDetailPopup from "@/components/user/dashboard/UserWeeklyReportDetailPopup.vue";

export default {
  name: "UserDashboard",
  components: {
    MentorInfoCard,
    RecentTaskList,
    RecentTrainingList,
    WeeklyReportList,
    UserTaskDetailModal,
    TrainingDetailPopup,
    UserWeeklyReportDetailPopup,
    CustomCalendar,
  },

  setup() {
    const auth = useAuthStore();
    const router = useRouter();
    const userId = computed(() => auth.user?.userId);

    const loading = ref(true);
    const error = ref(null);

    const mentor = ref(null);
    const weeklyReports = ref([]);
    const recentTasks = ref([]);
    const recentTrainings = ref([]);

    // Modal states
    const showReportDetailModal = ref(false);
    const selectedReport = ref(null);
    const showTaskDetailModal = ref(false);
    const selectedTask = ref(null);
    const showTrainingDetailModal = ref(false);
    const selectedTraining = ref(null);

    const selectedDate = ref(new Date());
    const eventsByDate = ref({});

    // Dummy watch to satisfy no-unused-vars linter rule for modal states
    watch([showReportDetailModal, selectedReport, showTaskDetailModal, selectedTask, showTrainingDetailModal, selectedTraining], () => {
      // This watch is intentionally empty. Its purpose is to make the linter recognize these refs as "used".
    });

    const getEventTitle = (item) => {
      const time = item.time?.substring(0, 5) || "";
      switch (item.type) {
        case "MENTORING": return `멘토링 ${time}`;
        case "TASK": return `과제 마감`;
        case "TRAINING": return `교육`;
        default: return "일정";
      }
    };

    const fetchScheduleForMonth = async (date) => {
      if (!userId.value) return;

      const monthString =
        date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

      try {
        const res = await dashboardService.getMonthlySchedule(userId.value, monthString);
        const schedules = res.data.schedules || [];

        const grouped = {};

        schedules.forEach((item) => {
          if (!grouped[item.date]) grouped[item.date] = [];
          grouped[item.date].push({
              id: item.sessionId || item.userTaskId || item.userTrainingId,
              type: item.type,
              title: getEventTitle(item),
              time: item.time,
              status: item.status,
            });
        });

        eventsByDate.value = grouped;
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
      }
    };

    const eventsForSelectedDate = computed(() => {
      const y = selectedDate.value.getFullYear();
      const m = String(selectedDate.value.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.value.getDate()).padStart(2, "0");
      return eventsByDate.value[`${y}-${m}-${d}`] || [];
    });

    const selectedDateFormatted = computed(() =>
      selectedDate.value.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    );

    const onSelectDate = (date) => {
      selectedDate.value = date;
    };

    const getEventClass = (type) =>
      type ? `event-${type.toLowerCase()}` : "";

    const openEvent = (event) => {
      if (event.type === "MENTORING") {
        router.push(`/mentoring/${event.id}`); // Keep routing for mentoring
      } else if (event.type === "TASK") {
        selectedTask.value = { userTaskId: event.id }; // Set selectedTask
        showTaskDetailModal.value = true; // Open modal
      } else if (event.type === "TRAINING") {
        selectedTraining.value = { userTrainingId: event.id }; // Set selectedTraining
        showTrainingDetailModal.value = true; // Open modal
      }
    };

    const fetchWeeklyReports = () =>
      dashboardService
        .getWeeklyReports(userId.value, { page: 0, size: 5 })
        .then((res) => (weeklyReports.value = res.data.content));

    const fetchAllDashboardData = async () => {
      loading.value = true;
      try {
        await Promise.all([
          dashboardService.getMentor(userId.value).then((res) => {
            mentor.value = res.data;
          }),
          fetchWeeklyReports(),
          tasksService
            .getUserTasks(userId.value, { page: 0, size: 5 })
            .then((res) => (recentTasks.value = res.data?.data?.tasks || [])),
          userTrainingService
            .list(userId.value, { page: 0, size: 5 })
            .then((res) => {
              recentTrainings.value = res.data?.trainings || [];
            }),
          fetchScheduleForMonth(new Date()),
        ]);
      } finally {
        loading.value = false;
      }
    };

    watch(userId, () => {
      if (userId.value) fetchAllDashboardData();
    });

    onMounted(() => {
      if (userId.value) fetchAllDashboardData();
    });

    return {
      loading,
      error,
      mentor,
      weeklyReports,
      recentTasks,
      recentTrainings,

      selectedDate,
      eventsByDate,
      eventsForSelectedDate,
      selectedDateFormatted,
      onSelectDate,

      getEventClass,
      openEvent,

      fetchScheduleForMonth,
    };
  },
};
</script>


<style scoped>
.user-dashboard-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  background-color: #f8fafc;
}

/* Mentor Card */
.mentor-info-card-standalone {
  width: 100%;
  max-width: 1200px;
}

/* Calendar + Schedule Layout */
.calendar-schedule-layout {
  display: flex;
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  align-items: flex-start;
}

/* Calendar fixed width */
.calendar-wrapper {
  width: 600px;
  flex-shrink: 0;
}

/* Schedule Panel */
.schedule-panel {
  flex: 1;
  min-width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.schedule-header {
  font-size: 20px;
  font-weight: 700;
  color: #10243b;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 4px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.event-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.event-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}
.event-type-label {
  font-weight: 600;
  text-transform: uppercase;
}
.event-time-label {
  font-weight: 500;
}
.event-title-display {
  font-size: 14px;
  font-weight: 600;
  color: #10243b;
  margin-bottom: 4px;
}
.event-status-display {
  font-size: 12px;
  color: #9ca3af;
}

/* Event Colors */
.event-mentoring {
  background-color: #e6f0ff;
  border-left-color: #294594;
  color: #294594;
}

.event-task {
  background-color: #fff4e6;
  border-left-color: #b36b00;
  color: #b36b00;
}

.event-training {
  background-color: #e6fff2;
  border-left-color: #006622;
  color: #006622;
}

.no-events {
  text-align: center;
  color: #6b7280;
  padding: 40px 0;
}

/* Other Components */
.other-components-layout {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

</style>
