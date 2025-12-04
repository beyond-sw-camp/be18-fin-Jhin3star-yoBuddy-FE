<template>
  <div class="content-card schedule-card">
    <div class="card-header">
      <h2 class="card-title">나의 일정</h2>

      <div class="month-navigator">
        <button @click="goToPreviousMonth" class="nav-btn">‹</button>
        <h3 class="current-month-year">{{ currentMonthYearDisplay }}</h3>
        <button @click="goToNextMonth" class="nav-btn">›</button>
      </div>
    </div>

    <div class="card-body">
      <div class="calendar-grid">
        <div class="day-header" v-for="day in dayNames" :key="day">{{ day }}</div>

        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="['day-cell', { 'other-month': !day.isCurrentMonth, 'is-today': isToday(day.date) }]"
        >
          <span class="day-number">{{ day.dayOfMonth }}</span>

          <div v-if="day.events.length" class="events-list">
            <div
              v-for="event in day.events"
              :key="event.id"
              :class="['event-item', getEventClass(event.type)]"
              @click="openEvent(event)"
            >
              {{ event.title }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from "@/store/authStore";
import dashboardService from "@/services/dashboardService.js";
import { useRouter } from "vue-router";

export default {
  name: "UserSchedule",
  setup() {
    const router = useRouter();
    const auth = useAuthStore();
    const userId = computed(() => auth.user?.userId);

    const currentMonth = ref(new Date());
    const eventsByDate = ref({});

    // 한국어 요일
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

    const currentMonthYearDisplay = computed(() => {
      return currentMonth.value.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
      });
    });

    const formatDateToYYYYMMDD = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // 한국어 제목 생성
    const getEventTitle = (item) => {
      const time = item.time.substring(0, 5); // HH:mm

      switch (item.type) {
        case "MENTORING":
          return `• 멘토링 ${time}`;
        case "TASK":
          return `• 과제 마감 ${time}`;
        case "TRAINING":
          return `• 교육 ${time}`;
        default:
          return "• 일정";
      }
    };

    // 백엔드 응답 분류
    const processSchedule = (schedules) => {
      const grouped = {};

      schedules.forEach((item) => {
        const dateStr = item.date;
        if (!grouped[dateStr]) grouped[dateStr] = [];

        const id = item.sessionId || item.userTaskId || item.userTrainingId;

        grouped[dateStr].push({
          id,
          type: item.type,
          title: getEventTitle(item),
        });
      });

      eventsByDate.value = grouped;
    };

    const fetchSchedule = async () => {
      if (!userId.value) return;

      const monthString =
        currentMonth.value.getFullYear() +
        "-" +
        String(currentMonth.value.getMonth() + 1).padStart(2, "0");

      try {
        const res = await dashboardService.getMonthlySchedule(userId.value, monthString);
        processSchedule(res.data.schedules || []);
      } catch (err) {
        console.error("일정 불러오기 실패:", err);
        eventsByDate.value = {};
      }
    };

    // 이벤트 클릭 → 상세 페이지 이동
    const openEvent = (event) => {
      if (event.type === "MENTORING") {
        router.push(`/mentoring/${event.id}`);
      } else if (event.type === "TASK") {
        router.push(`/tasks/${event.id}`);
      } else if (event.type === "TRAINING") {
        router.push(`/trainings/${event.id}`);
      }
    };

    // 달력 계산
    const calendarDays = computed(() => {
      const year = currentMonth.value.getFullYear();
      const month = currentMonth.value.getMonth();

      const first = new Date(year, month, 1);
      const last = new Date(year, month + 1, 0);
      const daysInMonth = last.getDate();

      const startDayOfWeek = first.getDay();

      const days = [];

      // 이전 달
      for (let i = 0; i < startDayOfWeek; i++) {
        const prev = new Date(year, month, -(startDayOfWeek - 1 - i));
        days.push({ date: prev, dayOfMonth: prev.getDate(), isCurrentMonth: false, events: [] });
      }

      // 이번 달
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dateString = formatDateToYYYYMMDD(date);
        const dailyEvents = eventsByDate.value[dateString] || [];
        days.push({ date, dayOfMonth: i, isCurrentMonth: true, events: dailyEvents });
      }

      // 다음 달
      const totalCells = 42;
      const remain = totalCells - days.length;

      for (let i = 1; i <= remain; i++) {
        const next = new Date(year, month + 1, i);
        days.push({ date: next, dayOfMonth: next.getDate(), isCurrentMonth: false, events: [] });
      }

      return days;
    });

    const getEventClass = (type) => (type ? `event-${type.toLowerCase()}` : "");

    const goToPreviousMonth = () => {
      currentMonth.value = new Date(
        currentMonth.value.getFullYear(),
        currentMonth.value.getMonth() - 1,
        1
      );
      fetchSchedule();
    };

    const goToNextMonth = () => {
      currentMonth.value = new Date(
        currentMonth.value.getFullYear(),
        currentMonth.value.getMonth() + 1,
        1
      );
      fetchSchedule();
    };

    const isToday = (date) => {
      const today = new Date();
      return (
        today.getDate() === date.getDate() &&
        today.getMonth() === date.getMonth() &&
        today.getFullYear() === date.getFullYear()
      );
    };

    watch(userId, () => {
      if (userId.value) fetchSchedule();
    }, { immediate: true });

    onMounted(() => {
      if (userId.value) fetchSchedule();
    });

    return {
      currentMonth,
      dayNames,
      currentMonthYearDisplay,
      calendarDays,
      goToPreviousMonth,
      goToNextMonth,
      isToday,
      getEventClass,
      openEvent,
    };
  },
};
</script>

<style scoped>
.schedule-card {
  width: 1100px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(9,30,66,0.08);
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

.month-navigator {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  background: none;
  border: none;
  color: #374151;
  cursor: pointer;
  font-size: 24px;
  font-weight: 600;
}

.current-month-year {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #10243b;
  width: 150px;
  text-align: center;
}

.card-body {
    padding: 20px 28px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-header {
  text-align: center;
  font-weight: 600;
  color: #6b7280;
  padding-bottom: 10px;
  font-size: 14px;
}

.day-cell {
  height: 110px;
  padding: 6px;
  border-radius: 6px;
  background-color: #fff;
  border: 1px solid #eef2f7;
  transition: background-color 0.2s;
  overflow-y: auto;
}

.day-cell.other-month {
  background-color: #f8fafc;
}
.day-cell.other-month .day-number {
  color: #a0a7b5;
}

.day-number {
  font-size: 14px;
  font-weight: 600;
  color: #10243b;
  margin-bottom: 4px;
  display: block;
}

.day-cell.is-today {
  background-color: #f0f5ff;
}
.day-cell.is-today .day-number {
    color: #294594;
}

.events-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.event-item {
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-mentoring {
  background-color: #e6f0ff;
  color: #294594;
}

.event-task {
  background-color: #fff4e6;
  color: #b36b00;
}

.event-training {
  background-color: #e6fff2;
  color: #006622;
}
</style>
