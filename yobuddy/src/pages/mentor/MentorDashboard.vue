<template>
  <div class="org-page">

    <div class="tab-navigation">
      <button
        :class="['tab-item', { active: activeTab === 'mentees' }]"
        @click="setActiveTab('mentees')"
      >
        담당 신입
      </button>
      <button
        :class="['tab-item', { active: activeTab === 'schedule' }]"
        @click="setActiveTab('schedule')"
      >
        멘토링 스케줄
      </button>
      <button
        :class="['tab-item', { active: activeTab === 'performance' }]"
        @click="setActiveTab('performance')"
      >
        온보딩 성과
      </button>
    </div>

    <div v-if="activeTab === 'mentees'" class="content-card">
      <div class="card-header">
        <h2 class="card-title">담당 신입</h2>

        <div class="task-controls">
          <select class="dept-select" v-model="statusFilter" @change="currentPage = 1">      
            <option value="IN_PROGRESS">진행 중</option>
            <option value="COMPLETED">종료</option>
            <option value="ALL">전체</option>
          </select>

          <button class="btn-primary btn-small" @click="openRegisterPopup">
            + 멘티 등록
          </button>
        </div>  
      </div>


      <div class="card-body">
        <div v-if="paginatedMentees.length" class="mentee-list">
          <MenteeSummaryCard
            v-for="m in paginatedMentees"
            :key="`${mentorId}-${m.menteeId}`"
            :mentee="m"
            @select="openMenteeDetail"
          />
        </div>
        <div v-else class="empty-state">
          배정된 신입사원이 없습니다.
        </div>
      </div>

      <div class="card-footer" v-if="totalPages > 1">
        <div class="pagination numeric">
          <button
            class="page-nav"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            &lt;
          </button>

          <button
            v-for="p in visiblePages"
            :key="p"
            class="page-num"
            :class="{ active: p === currentPage }"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>

          <button
            class="page-nav"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'schedule'" class="mentor-schedule-tab-content">
      <MentorSchedule @open-session-detail="handleOpenSessionDetail" />
    </div>

    <div v-if="activeTab === 'performance'" class="mentor-performance-tab-content">
      <MenteeOnboardingPerformance
        v-if="mentees.length && mentorId"
        :mentor-id="mentorId"
        :mentees="mentees"
      />
    </div>
  </div>

  <MenteeRegisterPopup
    :show="showRegister"
    :mentor-id="mentorId"
    @close="showRegister = false"
    @registered="fetchMentees"
  />
  <MenteeDetailPopup
    :show="showMenteeDetail"
    :user="selectedMentee"
    :allowUnassign="true"
    @close="showMenteeDetail = false"
    @unassign="removeMentee"
  />
</template>

<script>
import MenteeOnboardingPerformance from "@/components/mentor/MenteeOnboardingPerformance.vue"
import MenteeSummaryCard from "@/components/mentor/MenteeSummaryCard.vue"
import MentorSchedule from "@/components/mentor/MentorSchedule.vue"
import MenteeDetailPopup from "@/pages/mentor/MenteeDetailPopup.vue"
import MenteeRegisterPopup from "@/pages/mentor/MenteeRegisterPopup.vue"
import http from "@/services/http"
import mentoringService from "@/services/mentoringService"
import { useAuthStore } from "@/store/authStore"
import { watch } from "vue"

export default {
  name: "MentorDashboard",
  components: {
    MenteeSummaryCard,
    MenteeRegisterPopup,
    MenteeDetailPopup,
    MentorSchedule,
    MenteeOnboardingPerformance,
  },

  data() {
    return {
      mentees: [],
      mentorId: null,
      mentorSummary: {},

      showMenteeDetail: false,
      selectedMentee: null,

      showRegister: false,
      activeTab: "mentees",

      statusFilter: "IN_PROGRESS", 

      currentPage: 1,
      pageSize: 8,
      MAX_VISIBLE_PAGES: 5,
    }
  },

  computed: {
    filteredMentees() {
      const list = this.mentees || []
      if (this.statusFilter === "ALL") return list

      return list.filter((m) => {
        const status = this.getOnboardingStatusByJoinedAt(m?.joinedAt)
        return this.statusFilter === status
      })
    },

    totalPages() {
      return Math.ceil((this.filteredMentees?.length || 0) / this.pageSize)
    },

    paginatedMentees() {
      const start = (this.currentPage - 1) * this.pageSize
      return (this.filteredMentees || []).slice(start, start + this.pageSize)
    },

    visiblePages() {
      const total = this.totalPages
      const current = this.currentPage
      const maxVisible = this.MAX_VISIBLE_PAGES
      if (!total) return []

      const start = Math.max(1, Math.min(current, total - maxVisible + 1))
      const end = Math.min(total, start + maxVisible - 1)

      const pages = []
      for (let i = start; i <= end; i++) pages.push(i)
      return pages
    },
  },

  mounted() {
    const auth = useAuthStore()
    this.mentorId = auth.user?.userId

    watch(
      () => auth.user,
      (newUser) => {
        if (newUser) {
          this.mentorId = newUser.userId
          this.fetchMentees()
          this.fetchMentorSummary()
        }
      },
      { immediate: true }
    )
  },

  methods: {
    async fetchMentees() {
      if (!this.mentorId) return
      try {
        this.mentees = await mentoringService.getMenteesForMentor(this.mentorId)
        this.currentPage = 1
      } catch (e) {
        console.error("멘티 목록 조회 실패", e)
      }
    },

    async fetchMentorSummary() {
      if (!this.mentorId) return
      try {
        this.mentorSummary = await mentoringService.getMentorSummary(this.mentorId)
      } catch (e) {
        console.error("멘토 요약 정보 조회 실패", e)
        this.mentorSummary = {}
      }
    },

    setStatusFilter(next) {
      this.statusFilter = next
      this.currentPage = 1
    },

    getOnboardingStatusByJoinedAt(joinedAt) {
      if (!joinedAt) return "IN_PROGRESS" 

      const joined = new Date(joinedAt)
      if (Number.isNaN(joined.getTime())) return "IN_PROGRESS"

      const joinedDay = new Date(joined.getFullYear(), joined.getMonth(), joined.getDate())
      const today = new Date()
      const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      if (joinedDay.getTime() > todayDay.getTime()) return "IN_PROGRESS"

      const plus100 = new Date(joinedDay)
      plus100.setDate(plus100.getDate() + 100)

      if (plus100.getTime() <= todayDay.getTime()) return "COMPLETED"

      return "IN_PROGRESS"
    },

    openRegisterPopup() {
      this.showRegister = true
    },

    async openMenteeDetail(mentee) {
      try {
        const resp = await http.get(`/api/v1/mentors/${this.mentorId}/mentees/${mentee.menteeId}`)
        this.selectedMentee = resp.data
        this.showMenteeDetail = true
      } catch (e) {
        console.error("멘티 상세 조회 실패", e)
      }
    },

    async removeMentee(mentee) {
      try {
        await http.delete(`/api/v1/mentors/${this.mentorId}/mentees/${mentee.menteeId}`)
        this.showMenteeDetail = false
        this.fetchMentees()
      } catch (e) {
        console.error("멘티 배정 해제 실패", e)
      }
    },

    setActiveTab(tabName) {
      this.activeTab = tabName
      if (tabName === "mentees") {
        this.currentPage = 1
        this.fetchMentees()
      }
    },

    goToPage(page) {
      const total = this.totalPages
      if (total < 1) return
      const next = Math.min(Math.max(page, 1), total)
      if (next !== this.currentPage) this.currentPage = next
    },

    handleOpenSessionDetail(sessionId) {
      this.$router.push(`/mentor/sessions/${sessionId}`)
    },
  },
}
</script>

<style scoped>
.org-page {
  padding: 0px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

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
  position: relative;
  transition: color 0.2s, border-bottom-color 0.2s;
  min-height: 52px;
}

.tab-item.active {
  color: #294594;
  font-weight: 700;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #294594;
  transition: width 0.2s ease-in-out;
}

.content-card {
  width: 100%;
  max-width: 1200px;
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

.title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.card-title {
  margin: 0;
  font-size: 20px;
  color: #10243b;
}

.btn-primary {
  background: #294594;
  color: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.card-body {
  padding: 22px 28px;
}

.mentee-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 18px;
  row-gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #7d93ad;
}

.btn-primary:hover {
  background: #1e3a8a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(41, 69, 148, 0.3);
}

.pagination.numeric { display:flex; gap:10px; align-items:center; justify-content:center }
.page-nav { background:transparent; border:none; color:#4b5563; font-size:18px; padding:8px; cursor:pointer; transition: color 0.15s ease, opacity 0.15s ease }
.page-nav:disabled { color: #c5c9d6; opacity: 0.7; cursor: default }
.page-num { width:36px; height:36px; border-radius:50%; border:none; background:transparent; color:#4b5563; font-weight:700; cursor:pointer }
.page-num.active { background:#3b4aa0; color:#fff; box-shadow: 0 6px 18px rgba(59,74,160,0.18) }
.card-footer { padding: 16px 0; display:flex; justify-content:center }

.task-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: nowrap;
}

.dept-select {
  width: 100px;
  height: 40px;
  padding: 8px 12px;
  padding-right: 32px;
  border-radius: 10px; 
  border: 1px solid #d1d5db;
  background-color: #fff;
  box-sizing: border-box;
  text-align: center;

  font-size: 14px;
  font-weight: 600;
  color: #10243b;

  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;

  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dept-select:focus {
  outline: none;
  border-color: #294594;
  box-shadow: 0 0 0 3px rgba(41, 69, 148, 0.15);
}

.btn-small {
  height: 40px;
  padding: 0 14px;
  border-radius: 10px; 
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>