<template>
  <div class="org-page">

    <!-- Tab Navigation -->
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
        스케줄
      </button>
      <button 
        :class="['tab-item', { active: activeTab === 'performance' }]" 
        @click="setActiveTab('performance')"
      >
        온보딩 성과
      </button>
    </div>

    <!-- Tab Content: Assigned Mentees -->
    <div v-if="activeTab === 'mentees'" class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">담당 신입</h2>
        </div>

        <!-- ✅ 오른쪽 액션: 필터 + 등록 버튼 -->
        <div class="header-actions">
          <select v-model="statusFilter" class="dept-select">
            <option value="inProgress">진행 중</option>
            <option value="completed">완료</option>
            <option value="all">전체</option>
          </select>

          <button class="btn-primary" @click="openRegisterPopup">
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

    <!-- Tab Content: Mentor Schedule -->
    <div v-if="activeTab === 'schedule'" class="mentor-schedule-tab-content">
      <MentorSchedule @open-session-detail="handleOpenSessionDetail" />
    </div>

    <!-- Tab Content: Performance -->
    <div v-if="activeTab === 'performance'" class="mentor-performance-tab-content">
      <MenteeOnboardingPerformance
        v-if="mentees.length && mentorId"
        :mentor-id="mentorId"
        :mentees="mentees"
      />
    </div>

  </div>

  <!-- 멘티 등록 팝업 -->
  <MenteeRegisterPopup
    :show="showRegister"
    :mentor-id="mentorId"
    @close="showRegister = false"
    @registered="fetchMentees"
  />

  <!-- 멘티 상세 팝업 -->
  <MenteeDetailPopup
    :show="showMenteeDetail"
    :user="selectedMentee"
    :allowUnassign="true"
    @close="showMenteeDetail = false"
    @unassign="removeMentee"
  />
</template>

<script>
import http from "@/services/http"
import mentoringService from "@/services/mentoringService"
import MenteeSummaryCard from "@/components/mentor/MenteeSummaryCard.vue"
import MenteeRegisterPopup from "@/pages/mentor/MenteeRegisterPopup.vue"
import MenteeDetailPopup from "@/pages/mentor/MenteeDetailPopup.vue"
import MentorSchedule from "@/components/mentor/MentorSchedule.vue"
import MenteeOnboardingPerformance from "@/components/mentor/MenteeOnboardingPerformance.vue"
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

      // ✅ 필터 (기본: 진행 중)
      statusFilter: "inProgress",

      currentPage: 1,
      pageSize: 8,
      MAX_VISIBLE_PAGES: 5,
    }
  },

  watch: {
    // ✅ 필터 바뀌면 1페이지로
    statusFilter() {
      this.currentPage = 1
    }
  },

  computed: {
    // ✅ 입사일 기준 100일 필터링
    filteredMentees() {
      const list = this.mentees || []

      const today = new Date()
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      const isCompleted = (m) => {
        const joinedAt = m?.joinedAt
        if (!joinedAt) return false

        // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss" 대응
        const joinDate = new Date(joinedAt.slice(0, 10) + "T00:00:00")
        if (Number.isNaN(joinDate.getTime())) return false

        const diffDays = Math.floor((todayMidnight.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays >= 100
      }

      if (this.statusFilter === "completed") {
        return list.filter(isCompleted)
      }
      if (this.statusFilter === "inProgress") {
        return list.filter((m) => !isCompleted(m))
      }
      return list // all
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

    openRegisterPopup() {
      this.showRegister = true
    },

    async openMenteeDetail(mentee) {
      try {
        const resp = await http.get(
          `/api/v1/mentors/${this.mentorId}/mentees/${mentee.menteeId}`
        )
        this.selectedMentee = resp.data
        this.showMenteeDetail = true
      } catch (e) {
        console.error("멘티 상세 조회 실패", e)
      }
    },

    async removeMentee(mentee) {
      try {
        await http.delete(
          `/api/v1/mentors/${this.mentorId}/mentees/${mentee.menteeId}`
        )
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

/* Tab Navigation Styles */
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

.mentor-schedule-tab-content {
  width: 100%;
  max-width: 1200px;
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

/* ✅ 필터 + 버튼 감싸는 래퍼 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dept-select {
  width: 170px;
  height: 40px;
  padding: 8px 12px;
  padding-right: 30px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background-color: white;
  box-sizing: border-box;
  text-align: center;
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  cursor: pointer;
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
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #1e3a8a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(41, 69, 148, 0.3);
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

.pagination.numeric {
  display:flex;
  gap:10px;
  align-items:center;
  justify-content:center;
}
.page-nav {
  background:transparent;
  border:none;
  color:#4b5563;
  font-size:18px;
  padding:8px;
  cursor:pointer;
  transition: color 0.15s ease, opacity 0.15s ease
}
.page-nav:disabled {
  color: #c5c9d6;
  opacity: 0.7;
  cursor: default
}
.page-num {
  width:36px;
  height:36px;
  border-radius:50%;
  border:none;
  background:transparent;
  color:#4b5563;
  font-weight:700;
  cursor:pointer
}
.page-num.active {
  background:#3b4aa0;
  color:#fff;
  box-shadow: 0 6px 18px rgba(59,74,160,0.18)
}
.card-footer {
  padding: 16px 0;
  display:flex;
  justify-content:center
}
</style>
