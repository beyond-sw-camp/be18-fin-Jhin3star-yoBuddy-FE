<template>
  <div class="org-page">
    <div class="content-card">

      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">담당 신입</h2>
        </div>

        <button class="btn-primary" @click="openRegisterPopup">
          + 멘티 등록
        </button>
      </div>

      <div class="card-body">
        <div v-if="mentees.length" class="mentee-list">
          <MenteeSummaryCard 
            v-for="m in mentees" 
            :key="m.userId" 
            :mentee="m"
            @select="openMenteeDetail"
          />
        </div>
        <div v-else class="empty-state">
          배정된 신입사원이 없습니다.
        </div>
      </div>
    </div>
  </div>

  <!-- 멘티 등록 팝업 -->
  <MenteeRegisterPopup
    :show="showRegister"
    :mentor-id="mentorId"
    @close="showRegister = false"
    @registered="fetchMentees"
  />

  <!-- 멘티 상세 팝업 (조회 + 배정 해제) -->
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
import { useAuthStore } from "@/store/authStore"
import { watch } from "vue"

export default {
  name: "MentorDashboard",
  components: { 
    MenteeSummaryCard, 
    MenteeRegisterPopup, 
    MenteeDetailPopup 
  },

  data() {
    return {
      mentees: [],
      mentorId: null,

      showMenteeDetail: false,
      selectedMentee: null,

      showRegister: false
    }
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
        }
      },
      { immediate: true }
    )
  },

  methods: {
    async fetchMentees() {
      if (!this.mentorId) return

      try {
        this.mentees = await mentoringService.getMenteesForMentor(this.mentorId);
      } catch (e) {
        console.error("멘티 목록 조회 실패", e)
      }
    },

    openRegisterPopup() {
      this.showRegister = true
    },

    async openMenteeDetail(mentee) {
      try {
        // mentee.userId 대신 mentee.menteeId를 사용하도록 수정
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
        await http.delete(`/api/v1/mentors/${this.mentorId}/mentees/${mentee.menteeId}`)
        this.showMenteeDetail = false
        this.fetchMentees()
      } catch (e) {
        console.error("멘티 배정 해제 실패", e)
      }
    }
  }
}
</script>

<style scoped>
/* 스타일은 그대로 유지 */
.org-page {
  padding: 28px 40px;
  display: flex;
  justify-content: center;
}

.content-card {
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
  gap: 18px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #7d93ad;
}
</style>
