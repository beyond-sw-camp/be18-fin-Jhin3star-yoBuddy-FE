<template>
  <div class="schedule-wrapper">
    <div class="calendar-container">
      <div class="month-navigator">
        <button @click="goToPreviousMonth" class="nav-btn">‹</button>
        <h3 class="current-month-year">{{ currentMonthYearDisplay }}</h3>
        <button @click="goToNextMonth" class="nav-btn">›</button>
      </div>

      <div class="calendar-grid">
        <div class="day-header" v-for="day in dayNames" :key="day">{{ day }}</div>
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="['day-cell', { 'other-month': !day.isCurrentMonth, 'has-sessions': day.hasSessions, 'is-today': isToday(day.date), 'is-selected': isSelected(day.date) }]"
          @click="selectDate(day.date)"
        >
          <span class="day-number">{{ day.dayOfMonth }}</span>
          <span v-if="day.hasSessions" class="session-indicator">{{ day.sessionCount }}</span>
        </div>
      </div>
    </div>

    <div class="schedule-pane">
      <h3 class="schedule-header">{{ selectedDateDisplay }} 일정</h3>
      <div v-if="dailyAgenda.length" class="schedule-list">
        <div v-for="item in dailyAgenda" :key="item.sessionId" class="schedule-item">
          <span class="schedule-time">{{ item.time }}</span>
          <span class="schedule-mentee">{{ item.menteeName }}</span>
          <span :class="['schedule-status', getStatusClass(item.status)]">{{ getStatusText(item.status) }}</span>
        </div>
      </div>
      <div v-else class="empty-schedule">선택된 날짜에 멘토링 세션이 없습니다.</div>
    </div>
  </div>
</template>

<script>
import mentoringService from "@/services/mentoringService";
import { useAuthStore } from "@/store/authStore";
import { watch } from "vue";

export default {
  name: "MentorSchedule",
  data() {
    return {
      mentorId: null,
      currentMonth: new Date(), // Tracks the month being displayed
      schedules: [], // Raw schedule items from API
      selectedDate: new Date(), // Tracks the currently selected date for agenda
      isLoading: false,
      scheduleByDate: {}, // Processed schedules grouped by 'YYYY-MM-DD'
      dayNames: ["일", "월", "화", "수", "목", "금", "토"],
    };
  },
  async mounted() {
    const auth = useAuthStore();
    this.mentorId = auth.user?.userId;

    watch(
      () => auth.user,
      (newUser) => {
        if (newUser) {
          this.mentorId = newUser.userId;
          this.fetchSchedule();
        }
      },
      { immediate: true }
    );

    // Ensure selectedDate is set to today on initial load
    this.selectedDate = new Date();
    this.selectedDate.setHours(0, 0, 0, 0);
  },
  computed: {
    currentMonthYearDisplay() {
      return this.currentMonth.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
      });
    },
    selectedDateDisplay() {
      return this.selectedDate.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
    },
    calendarDays() {
      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();

      const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

      const days = [];

      // Add padding days from previous month
      for (let i = 0; i < startDayOfWeek; i++) {
        const prevMonthDay = new Date(year, month, 0 - (startDayOfWeek - 1 - i));
        days.push({
          date: prevMonthDay,
          dayOfMonth: prevMonthDay.getDate(),
          isCurrentMonth: false,
          hasSessions: false,
          sessionCount: 0,
        });
      }

      // Add days of the current month
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dateString = this.formatDateToYYYYMMDD(date);
        const sessions = this.scheduleByDate[dateString] || [];
        days.push({
          date: date,
          dayOfMonth: i,
          isCurrentMonth: true,
          hasSessions: sessions.length > 0,
          sessionCount: sessions.length,
        });
      }

      // Add padding days from next month to fill the last week
      const totalCells = days.length;
      const remainingCells = 42 - totalCells; // Ensure 6 rows (6*7=42 cells)
      for (let i = 1; i <= remainingCells; i++) {
        const nextMonthDay = new Date(year, month + 1, i);
        days.push({
          date: nextMonthDay,
          dayOfMonth: nextMonthDay.getDate(),
          isCurrentMonth: false,
          hasSessions: false,
          sessionCount: 0,
        });
      }

      return days;
    },
    dailyAgenda() {
      const dateString = this.formatDateToYYYYMMDD(this.selectedDate);
      return this.scheduleByDate[dateString] || [];
    },
  },
  methods: {
    async fetchSchedule() {
      if (!this.mentorId) return;
      this.isLoading = true;
      try {
        const monthString = this.currentMonth.getFullYear() + "-" + String(this.currentMonth.getMonth() + 1).padStart(2, "0");
        const response = await mentoringService.getMentorSchedule(this.mentorId, monthString);
        this.schedules = response.schedules || [];
        this.processSchedules();
      } catch (e) {
        console.error("스케줄 조회 실패", e);
        this.schedules = [];
        this.scheduleByDate = {};
      } finally {
        this.isLoading = false;
      }
    },
    processSchedules() {
      const grouped = {};
      this.schedules.forEach((item) => {
        if (!grouped[item.date]) {
          grouped[item.date] = [];
        }
        grouped[item.date].push(item);
      });

      // Sort sessions within each day by time
      for (const date in grouped) {
        grouped[date].sort((a, b) => a.time.localeCompare(b.time));
      }
      this.scheduleByDate = grouped;
    },
    goToPreviousMonth() {
      this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
      this.fetchSchedule();
    },
    goToNextMonth() {
      this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
      this.fetchSchedule();
    },
    selectDate(date) {
      this.selectedDate = new Date(date);
      this.selectedDate.setHours(0, 0, 0, 0); // Normalize to start of day
    },
    formatDateToYYYYMMDD(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    isToday(date) {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    },
    isSelected(date) {
      return (
        date.getDate() === this.selectedDate.getDate() &&
        date.getMonth() === this.selectedDate.getMonth() &&
        date.getFullYear() === this.selectedDate.getFullYear()
      );
    },
    getStatusClass(status) {
      const classMap = {
        SCHEDULED: 'status-blue',
        COMPLETED: 'status-green',
        CANCELLED: 'status-red',
        NO_SHOW: 'status-gray'
      };
      return classMap[status] || 'status-default';
    },
    getStatusText(status) {
      const statusMap = {
        SCHEDULED: '예정',
        COMPLETED: '완료',
        CANCELLED: '취소',
        NO_SHOW: '불참'
      };
      return statusMap[status] || status;
    }
  },
};
</script>

<style scoped>
.schedule-wrapper {
  display: flex;
  gap: 24px;
  width: 1100px; /* Fixed width to match other content cards */
  max-width: 100%; /* Ensure responsiveness on smaller screens */
  margin: 0 auto; /* Center the component */
  /* Removed padding from here, as it's now handled by parent org-page */
}

.calendar-container {
  flex: 3 1 0; /* Roughly 60% */
  min-height: 540px; /* Min height for 16:9 screens */
  flex-shrink: 0; /* Prevent shrinking */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(9,30,66,0.08);
  padding: 20px 12px; /* Reduced horizontal padding */
  display: flex; /* Use flex to stack month navigator and grid */
  flex-direction: column;
}

.month-navigator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.nav-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

.current-month-year {
  margin: 0;
  font-size: 20px;
  color: #10243b;
  text-align: center; /* Center month header text */
  flex-grow: 1; /* Allow it to take available space */
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  flex-grow: 1; /* Allow grid to take remaining vertical space */
}

.day-header {
  text-align: center;
  font-weight: 600;
  color: #6b7280;
  padding: 10px 0;
  font-size: 14px;
}

.day-cell {
  position: relative;
  height: 78px; /* Height: 78px */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  background-color: #f8fafc;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid #eef2f7;
}

.day-cell:hover {
  background-color: #eef2f7;
}

.day-cell.other-month {
  color: #a0a7b5;
  background-color: #f0f2f5;
  cursor: default;
}

.day-cell.other-month:hover {
  background-color: #f0f2f5;
}

.day-number {
  font-size: 16px;
  font-weight: 700;
  color: #10243b;
}

/* Visible Today Marker */
.day-cell.is-today {
  border: 2px solid #294594; /* Bold border */
  background: #e0e7ff; /* Light background */
}
.day-cell.is-today .day-number {
  color: #294594;
  background-color: transparent; /* Remove inner background */
  border-radius: 0; /* Remove inner border-radius */
  width: auto;
  height: auto;
}


.day-cell.is-selected {
  background-color: #294594;
  border-color: #294594;
}

.day-cell.is-selected .day-number {
  color: white;
}

.day-cell.is-selected.is-today .day-number {
  background-color: white;
  color: #294594;
}

.session-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: #059669; /* Green for sessions */
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.schedule-pane {
  flex: 2 1 0; /* Roughly 40% */
  height: 540px; /* Fixed height */
  flex-shrink: 0; /* Prevent shrinking */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(9,30,66,0.08);
  display: flex;
  flex-direction: column;
}

.schedule-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  margin: 0;
  font-size: 18px;
  color: #10243b;
  border-bottom: 1px solid #eef2f7;
  padding: 20px; /* Added padding */
}

.schedule-list {
  flex: 1; /* Allow list to take remaining vertical space */
  overflow-y: auto;
  padding: 0 20px 20px 20px; /* Added padding, removed right padding for scrollbar */
  padding-right: 12px; /* Adjusted padding for scrollbar */
  transition: opacity 0.2s ease; /* Smooth transition for date selection */
}

/* Scrollbar styling */
.schedule-list::-webkit-scrollbar {
  width: 6px;
}
.schedule-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.schedule-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}


.schedule-item { /* Compact schedule cards */
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0; /* Reduced padding for compactness */
  min-height: 48px; /* Compact list height */
  border-bottom: 1px solid #f0f2f5;
}

.schedule-item:last-child {
  border-bottom: none;
}

.schedule-time {
  font-weight: 700;
  color: #294594;
  flex-shrink: 0;
  width: 50px;
}

.schedule-mentee {
  flex-grow: 1;
  color: #10243b;
}

.schedule-status {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.status-blue { background-color: #e0e7ff; color: #3b82f6; } /* SCHEDULED */
.status-green { background-color: #d1fae5; color: #059669; } /* COMPLETED */
.status-red { background-color: #fee2e2; color: #ef4444; } /* CANCELLED */
.status-gray { background-color: #e5e7eb; color: #6b7280; } /* NO_SHOW */
.status-default { background-color: #f3f4f6; color: #4b5563; } /* Default/Unknown */

.empty-schedule {
  color: #7d93ad;
  text-align: center;
  padding: 30px 0;
}
</style>
