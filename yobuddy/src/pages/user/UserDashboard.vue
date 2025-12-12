<template>
  <div class="user-dashboard-page">
    <div v-if="loading" class="loading-spinner">Loading...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <template v-if="!loading && !error">
      <!-- Tabs -->
      <div class="tab-navigation">
        <button
          :class="['tab-item', { active: activeTab === 'overview' }]"
          @click="setActiveTab('overview')"
        >개요</button>

        <button
          :class="['tab-item', { active: activeTab === 'weeklyActivities' }]"
          @click="setActiveTab('weeklyActivities')"
        >주간 활동</button>

        <button
          :class="['tab-item', { active: activeTab === 'reports' }]"
          @click="setActiveTab('reports')"
        >주간 리포트</button>
      </div>

      <!-- OVERVIEW TAB -->
      <div v-if="activeTab === 'overview'" class="tab-content-wrapper">
        <div class="calendar-schedule-layout">
          <!-- 왼쪽: 캘린더 -->
          <div class="calendar-wrapper">
            <CustomCalendar
              :events-by-date="eventsByDate"
              :selected-date="selectedDate"
              @select-date="onSelectDate"
              @changed-month="onChangedMonth"
              @open-event-detail="openEvent"
            />
          </div>

          <!-- 오른쪽: 멘토 카드 + 일정 패널 -->
          <div class="right-column">
            <MentorInfoCard
              :mentor="mentor"
              class="mentor-info-card-standalone"
            />

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
                    <span class="event-type-label">{{ getTypeLabel(event.type) }}</span>
                    <span class="event-time-label">{{ event.time }}</span>
                  </div>
                  <div class="event-title-display">{{ event.title }}</div>
                  <div class="event-status-display">{{ formatStatus(event.status) }}</div>
                </div>
              </div>

              <div v-else class="no-events">
                <p>선택된 날짜에 일정이 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'weeklyActivities'" class="tab-content-wrapper">
        <WeeklyActivitiesList
          :activities="weeklyActivities"
          :weekly-range-text="weeklyRangeText"
          @view-activity-detail="handleViewActivityDetail"
          @go-prev-week="goToPreviousWeek"
          @go-next-week="goToNextWeek"
          @go-current-week="goToCurrentWeek"
        />
      </div>

      <!-- WEEKLY REPORT TAB -->
      <div v-if="activeTab === 'reports'" class="tab-content-wrapper">
        <WeeklyReportList
          :reports="weeklyReports"
          @view-detail="handleViewReportDetail"
        />
      </div>
    </template>

    <!-- MODALS -->
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

    <UserMentoringSessionDetailModal
      :visible="showMentoringDetailModal"
      :sessionId="selectedMentoringSessionId"
      @close="closeMentoringDetailModal"
    />
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from "vue";
import { useAuthStore } from "@/store/authStore";

import dashboardService from "@/services/dashboardService.js";
import tasksService from "@/services/tasksService.js";
import userTrainingService from "@/services/userTrainingService.js";

/* Components */
import CustomCalendar from "@/components/user/dashboard/CustomCalendar.vue";
import MentorInfoCard from "@/components/user/dashboard/MentorInfoCard.vue";
import WeeklyActivitiesList from "@/components/user/dashboard/WeeklyActivitiesList.vue";
import WeeklyReportList from "@/components/user/dashboard/WeeklyReportList.vue";

/* Modals */
import UserTaskDetailModal from "@/pages/user/tasks/UserTaskDetailModal.vue";
import TrainingDetailPopup from "@/components/user/training/TrainingDetailPopup.vue";
import UserWeeklyReportDetailPopup from "@/components/user/dashboard/UserWeeklyReportDetailPopup.vue";
import UserMentoringSessionDetailModal from "@/components/user/mentoring/UserMentoringSessionDetailModal.vue";

export default {
  name: "UserDashboard",
  components: {
    MentorInfoCard,
    WeeklyActivitiesList,
    WeeklyReportList,
    UserTaskDetailModal,
    TrainingDetailPopup,
    UserWeeklyReportDetailPopup,
    CustomCalendar,
    UserMentoringSessionDetailModal,
  },

  setup() {
    const auth = useAuthStore();
    const userId = computed(() => auth.user?.userId);

    /* Core states */
    const loading = ref(true);
    const error = ref(null);

    /* Data */
    const mentor = ref(null);
    const weeklyReports = ref([]);
    const weeklyActivities = ref([]);

    /* Tabs */
    const activeTab = ref("overview");

    /* Calendar */
    const selectedDate = ref(new Date());
    const eventsByDate = ref({});

    /* Weekly navigation */
    const weekBaseDate = ref(new Date());

    /* Modals */
    const showReportDetailModal = ref(false);
    const showTaskDetailModal = ref(false);
    const showTrainingDetailModal = ref(false);
    const showMentoringDetailModal = ref(false);

    const selectedReport = ref(null);
    const selectedTask = ref(null);
    const selectedTraining = ref(null);
    const selectedMentoringSessionId = ref(null);

    /* ------------------------------
       CALENDAR EVENT TITLE
    ------------------------------- */
    const getEventTitle = (item) => {
      const time = item.time?.substring(0, 5) || "";

      switch (item.type) {
        case "MENTORING":
          return `멘토링 ${time}`;

        case "TASK":
          return item.taskTitle || "과제";

        case "TRAINING":
          return item.trainingTitle || "교육";

        default:
          return "일정";
      }
    };

    /* ------------------------------
       FETCH MONTHLY SCHEDULE
    ------------------------------- */
    const fetchScheduleForMonth = async (date) => {
      if (!userId.value) return;

      const monthString =
        date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");

      try {
        const res = await dashboardService.getMonthlySchedule(
          userId.value,
          monthString
        );
        const schedules = res.data.schedules || [];

        const grouped = {};

        schedules.forEach((item) => {
          if (!grouped[item.date]) grouped[item.date] = [];

          grouped[item.date].push({
            id: item.type === "TRAINING" ? item.trainingId : (item.sessionId || item.userTaskId || item.userTrainingId),
            type: item.type,
            title: getEventTitle(item),
            time: item.time?.substring(0, 5) || "",
            status: item.status,
          });
        });

        eventsByDate.value = grouped;
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
      }
    };

    /* ------------------------------
       DAILY EVENTS
    ------------------------------- */
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

    /* ------------------------------
       WEEK RANGE HELPERS
    ------------------------------- */
    const getStartOfWeek = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return new Date(d.setDate(d.getDate() - d.getDay()));
    };

    const getEndOfWeek = (date) => {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return new Date(d.setDate(d.getDate() + (6 - d.getDay())));
    };

    const weeklyRangeText = computed(() => {
      const start = getStartOfWeek(weekBaseDate.value);
      const end = getEndOfWeek(weekBaseDate.value);
      return `${start.toLocaleDateString("ko-KR")} ~ ${end.toLocaleDateString(
        "ko-KR"
      )}`;
    });

    /* ------------------------------
       FETCH WEEKLY ACTIVITIES
    ------------------------------- */
    const fetchWeeklyActivities = async () => {
      if (!userId.value) return;

      const startOfWeek = getStartOfWeek(weekBaseDate.value);
      const endOfWeek = getEndOfWeek(weekBaseDate.value);

      try {
        const [tasksRes, trainingsRes, scheduleRes] = await Promise.all([
          tasksService.getUserTasks(userId.value, { page: 0, size: 100 }),
          userTrainingService.list(userId.value, { page: 0, size: 100 }),
          dashboardService.getMonthlySchedule(
            userId.value,
            `${weekBaseDate.value.getFullYear()}-${String(
              weekBaseDate.value.getMonth() + 1
            ).padStart(2, "0")}`
          ),
        ]);

        const tasks = tasksRes.data?.data?.tasks || [];
        const trainings =
          trainingsRes.data?.trainings || trainingsRes.data?.data || [];
        const schedules = scheduleRes.data?.schedules || [];

        // TASK
        const taskActivities = tasks.map((task) => ({
          id: task.userTaskId,
          type: "TASK",
          title: task.title,
          date: task.dueDate,
          time: "",
          status: task.status,
          activityDate: new Date(task.dueDate),
        }));

        // TRAINING
        const trainingActivities = trainings.map((training) => {
          let date = "";
          let time = "";

          if (training.scheduledAt) {
            [date, time] = training.scheduledAt.split("T");
            time = time.substring(0, 5);
          } else if (training.startDate) {
            date = training.startDate;
          }

          return {
            id: training.trainingId,
            type: "TRAINING",
            title: training.title,
            date,
            time,
            status: training.status,
            activityDate: new Date(date),
          };
        });

        // MENTORING
        const mentoringActivities = schedules
          .filter((s) => s.type === "MENTORING")
          .map((s) => ({
            id: s.sessionId,
            type: "MENTORING",
            title: "멘토링",
            date: s.date,
            time: s.time?.substring(0, 5) || "",
            status: s.status || "SCHEDULED",
            activityDate: new Date(s.date),
          }));

        // 주간 필터링
        const weekly = [...taskActivities, ...trainingActivities, ...mentoringActivities].filter(
          (a) => {
            const d = new Date(a.activityDate);
            d.setHours(0, 0, 0, 0);
            return d >= startOfWeek && d <= endOfWeek;
          }
        );

        weeklyActivities.value = weekly;
      } catch (err) {
        console.error("Failed to fetch weekly activities:", err);
      }
    };

    /* ------------------------------
       WEEK NAVIGATION
    ------------------------------- */
    const goToPreviousWeek = () => {
      weekBaseDate.value = new Date(
        weekBaseDate.value.setDate(weekBaseDate.value.getDate() - 7)
      );
      fetchWeeklyActivities();
    };

    const goToNextWeek = () => {
      weekBaseDate.value = new Date(
        weekBaseDate.value.setDate(weekBaseDate.value.getDate() + 7)
      );
      fetchWeeklyActivities();
    };

    const goToCurrentWeek = () => {
      weekBaseDate.value = new Date();
      fetchWeeklyActivities();
    };

    /* ------------------------------
       CALENDAR ACTIONS
    ------------------------------- */
    const onSelectDate = (date) => {
      selectedDate.value = date;
      weekBaseDate.value = date;
      fetchWeeklyActivities();
    };

    const onChangedMonth = (date) => {
      fetchScheduleForMonth(date);
      fetchWeeklyActivities(); // Refresh week
    };

    const getTypeLabel = (type) => {
      if (type === "TASK") return "과제";
      if (type === "TRAINING") return "교육";
      return "멘토링";
    };

    const getEventClass = (type) => (type ? `event-${type.toLowerCase()}` : "");

    const formatStatus = (status) => {
      const up = String(status || "").toUpperCase();
      const map = {
        COMPLETED: "완료됨",
        GRADED: "평가됨",
        PENDING: "진행 중",
        SUBMITTED: "제출됨",
        LATE: "지연 제출",
        MISSING: "미제출",
        SCHEDULED: "예정",
        REVIEWED: "피드백 완료",
      };
      return map[up] || status || "";
    };

    const openEvent = async (event) => {
      if (event.type === "MENTORING") {
        selectedMentoringSessionId.value = event.id;
        showMentoringDetailModal.value = true;
        return;
      }

      if (event.type === "TASK") {
        selectedTask.value = { userTaskId: event.id };
        showTaskDetailModal.value = true;
        return;
      }

      if (event.type === "TRAINING") {
    console.log("Opening TRAINING event:", event);
    console.log("userId:", userId.value, "trainingId (event.id):", event.id);
    try {
      const res = await userTrainingService.detail(userId.value, event.id);
      selectedTraining.value = res.data; // detail 결과 그대로 저장
      showTrainingDetailModal.value = true;
    } catch (e) {
      console.error("Failed to load training detail:", e);
    }
  }
    };

    /* ------------------------------
       FETCH EVERYTHING ON LOAD
    ------------------------------- */
    const fetchWeeklyReports = () =>
      dashboardService
        .getWeeklyReports(userId.value, { page: 0, size: 12 })
        .then((res) => (weeklyReports.value = res.data.content));

    const fetchAllDashboardData = async () => {
      loading.value = true;
      error.value = null;
      try {
        await Promise.all([
          dashboardService
            .getMentor(userId.value)
            .then((res) => (mentor.value = res.data)),
          fetchWeeklyReports(),
          fetchWeeklyActivities(),
          fetchScheduleForMonth(new Date()),
        ]);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        const status = err?.response?.status;
        const message =
          err?.response?.data?.message ||
          (status === 403
            ? "접근 권한이 없습니다. 다시 로그인해 주세요."
            : "대시보드 데이터를 불러오지 못했습니다.");
        error.value = message;
      } finally {
        loading.value = false;
      }
    };

    /* ------------------------------ */
    const handleViewReportDetail = (report) => {
      console.log(
        "handleViewReportDetail called. userId:",
        userId.value,
        "report:",
        report
      );
      selectedReport.value = report;
      showReportDetailModal.value = true;
    };

    const handleViewActivityDetail = (activity) => {
      console.log("handleViewActivityDetail called with activity:", activity);
      openEvent(activity);
    };

    const closeReportDetailModal = () => {
      showReportDetailModal.value = false;
      selectedReport.value = null;
    };

    const handleReportSaved = () => {
      closeReportDetailModal();
      fetchWeeklyReports(); // 저장 이후 주간 리포트 다시 불러오기
    };

    const closeTaskDetailModal = () => {
      showTaskDetailModal.value = false;
      selectedTask.value = null;
    };

    const closeTrainingDetailModal = () => {
      showTrainingDetailModal.value = false;
      selectedTraining.value = null;
    };

    const closeMentoringDetailModal = () => {
      showMentoringDetailModal.value = false;
      selectedMentoringSessionId.value = null;
    };

    const setActiveTab = (tabName) => {
      activeTab.value = tabName;
      if (tabName === "weeklyActivities") fetchWeeklyActivities();
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
      weeklyActivities,
      userId,

      activeTab,
      setActiveTab,

      selectedDate,
      eventsByDate,
      eventsForSelectedDate,
      selectedDateFormatted,
      getTypeLabel,
      getEventClass,
      formatStatus,

      onSelectDate,
      onChangedMonth,

      openEvent,

      weeklyRangeText,
      goToPreviousWeek,
      goToNextWeek,
      goToCurrentWeek,

      showReportDetailModal,
      selectedReport,
      handleViewReportDetail,
      closeReportDetailModal,
      handleReportSaved,

      showTaskDetailModal,
      selectedTask,
      closeTaskDetailModal,

      showTrainingDetailModal,
      selectedTraining,
      closeTrainingDetailModal,

      handleViewActivityDetail,
      showMentoringDetailModal,
      selectedMentoringSessionId,
      closeMentoringDetailModal,
    };
  },
};
</script>

<style scoped>
.user-dashboard-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner,
.error-message {
  width: 100%;
  text-align: center;
  padding: 50px;
  font-size: 18px;
  color: #5a6e85;
}

/* Tabs */
.tab-navigation {
  width: 100%;
  max-width: 1200px;
  display: flex;
  border-bottom: 1px solid #eef2f7;
  margin-bottom: 1px;
}

.tab-item {
  background: transparent;
  border: none;
  padding: 15px 25px;
  font-size: 16px;
  font-weight: 600;
  color: #7d93ad;
  cursor: pointer;
  min-height: 52px;
  position: relative;
  transition: 0.2s;
}

.tab-item.active {
  color: #294594;
  font-weight: 700;
}
.tab-item.active::after {
  content: "";
  width: 100%;
  height: 3px;
  background: #294594;
  position: absolute;
  bottom: -1px;
  left: 0;
}

.tab-content-wrapper {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}

/* Calendar + Schedule layout */
.calendar-schedule-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); /* 캘린더 : 일정 비율 */
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  align-items: flex-start; /* 캘린더 높이 강제로 안 늘어남 */
}

/* 왼쪽: 캘린더 영역 */
.calendar-wrapper {
  width: 100%;
  min-height: 0;
}

/* 오른쪽: 멘토 카드 + 일정 패널 세로 스택 */
.right-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-height: 0;
}

/* 멘토 카드가 위에서 줄어들지 않도록 */
.mentor-info-card-standalone {
  flex-shrink: 0;
}

/* 우측 일정 패널: 남은 공간 안에서 스크롤 */
.schedule-panel {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: 440px;
  max-height: 440px;   /* 필요하면 숫자만 조절해서 캘린더 높이랑 맞추기 */
  overflow-y: auto;
}

.schedule-header {
  font-size: 20px;
  font-weight: 700;
  color: #10243b;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.event-item {
  background: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 4px solid transparent;
  cursor: pointer;
  transition: 0.15s;
}
.event-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Colors */
.event-mentoring {
  background: #e6f0ff;
  border-left-color: #294594;
}
.event-task {
  background: #fff4e6;
  border-left-color: #b36b00;
}
.event-training {
  background: #e6fff2;
  border-left-color: #006622;
}

.event-details {
  display: flex;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
}
.event-title-display {
  font-size: 14px;
  font-weight: 600;
  color: #10243b;
  margin: 4px 0;
}
.event-status-display {
  font-size: 12px;
  color: #9ca3af;
}

.no-events {
  text-align: center;
  padding: 40px 0;
  color: #6b7280;
}

/* Weekly navigation */
.week-navigation {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  width: 100%;
}

.week-nav-button {
  background: #e6f0ff;
  color: #294594;
  padding: 8px 15px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.week-nav-button:hover {
  background: #d0e0ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.week-range {
  font-size: 16px;
  font-weight: 700;
  color: #10243b;
}
</style>
