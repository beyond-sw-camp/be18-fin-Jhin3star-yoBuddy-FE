<template>
  <div class="custom-calendar">
    <div class="calendar-header">
      <button @click="previousMonth" class="nav-btn">‹</button>
      <h3 class="current-month-year">{{ monthYearLabel }}</h3>
      <button @click="nextMonth" class="nav-btn">›</button>
    </div>
    <div class="calendar-grid">
      <div class="day-header" v-for="day in dayNames" :key="day">{{ day }}</div>
      <div
        v-for="day in calendarDays"
        :key="day.date.toISOString()"
        :class="['day-cell', { 'other-month': !day.isCurrentMonth, 'is-today': day.isToday, 'selected': day.isSelected }]"
        @click="selectDate(day.date)"
      >
        <span class="day-number">{{ day.dayOfMonth }}</span>
        <div v-if="day.events.length" class="events-list-calendar">
          <div
            v-for="(event, index) in day.events.slice(0, 3)"
            :key="index"
            :class="['event-dot', `event-${event.type.toLowerCase()}`]"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'CustomCalendar',
  props: {
    eventsByDate: {
      type: Object,
      default: () => ({}),
    },
    selectedDate: {
      type: Date,
      required: true,
    }
  },
  emits: ['select-date', 'changed-month'],
  setup(props, { emit }) {
    const currentMonthDate = ref(new Date());
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    const monthYearLabel = computed(() => {
      return currentMonthDate.value.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
      });
    });

    const formatDateToYYYYMMDD = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const calendarDays = computed(() => {
      const year = currentMonthDate.value.getFullYear();
      const month = currentMonthDate.value.getMonth();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const selDate = new Date(props.selectedDate);
      selDate.setHours(0,0,0,0);

      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      const days = [];
      const startDayOfWeek = firstDayOfMonth.getDay();

      for (let i = 0; i < startDayOfWeek; i++) {
        const date = new Date(year, month, i - startDayOfWeek + 1);
        days.push({
          date,
          dayOfMonth: date.getDate(),
          isCurrentMonth: false,
          isToday: date.getTime() === today.getTime(),
          isSelected: date.getTime() === selDate.getTime(),
          events: props.eventsByDate[formatDateToYYYYMMDD(date)] || [],
        });
      }

      for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const date = new Date(year, month, i);
        days.push({
          date,
          dayOfMonth: i,
          isCurrentMonth: true,
          isToday: date.getTime() === today.getTime(),
          isSelected: date.getTime() === selDate.getTime(),
          events: props.eventsByDate[formatDateToYYYYMMDD(date)] || [],
        });
      }

      const remainingCells = 42 - days.length;
      for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
          date,
          dayOfMonth: i,
          isCurrentMonth: false,
          isToday: date.getTime() === today.getTime(),
          isSelected: date.getTime() === selDate.getTime(),
          events: props.eventsByDate[formatDateToYYYYMMDD(date)] || [],
        });
      }
      
      return days;
    });

    const changeMonth = (offset) => {
      currentMonthDate.value = new Date(
        currentMonthDate.value.getFullYear(),
        currentMonthDate.value.getMonth() + offset,
        1
      );
      emit('changed-month', currentMonthDate.value);
    };

    const previousMonth = () => changeMonth(-1);
    const nextMonth = () => changeMonth(1);

    const selectDate = (date) => {
      emit('select-date', date);
    };

    emit('changed-month', currentMonthDate.value);

    return {
      dayNames,
      monthYearLabel,
      calendarDays,
      previousMonth,
      nextMonth,
      selectDate,
    };
  },
};
</script>

<style scoped>
.custom-calendar {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  height: 100%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 15px;
}
.current-month-year {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #10243b;
}
.nav-btn {
  background: none;
  border: none;
  color: #374151;
  cursor: pointer;
  font-size: 22px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.nav-btn:hover {
  background-color: #f3f4f6;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid #eef2f7;
  border-radius: 8px;
  overflow: hidden;
}
.day-header {
  text-align: center;
  padding: 8px 0;
  font-weight: 600;
  color: #6b7280;
  background-color: #f8fafc;
  font-size: 14px;
}
.day-cell {
  min-height: 80px;
  padding: 6px;
  border-top: 1px solid #eef2f7;
  border-right: 1px solid #eef2f7;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}
.day-cell:nth-child(7n) {
  border-right: none;
}
.day-cell:hover {
  background-color: #f9fafb;
}
.day-cell.other-month .day-number {
  color: #a0a7b5;
}
.day-cell.is-today .day-number {
  background-color: #eef2ff;
  color: #294594;
}
.day-cell.selected .day-number {
  background-color: #294594;
  color: white;
  font-weight: 700;
}
.day-number {
  font-size: 14px;
  font-weight: 500;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.events-list-calendar {
  margin-top: 4px;
  display: flex;
  gap: 4px;
  justify-content: center;
}
.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.event-mentoring { background-color: #294594; }
.event-task { background-color: #b36b00; }
.event-training { background-color: #006622; }
</style>
