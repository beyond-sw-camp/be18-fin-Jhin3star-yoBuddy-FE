<template>
  <div class="dashboard">
    <section class="mentee-section">
      <h3>담당 신입</h3>

      <div class="mentee-list">
        <MenteeSummaryCard
          v-for="m in mentees"
          :key="m.userId"
          :mentee="m"
        />
      </div>
    </section>

  </div>
</template>

<script>
import http from "@/services/http"
import MenteeSummaryCard from "@/components/mentor/MenteeSummaryCard.vue"
import { useAuthStore } from "@/store/authStore"
import { watch } from "vue"

export default {
  name: "MentorDashboard",
  components: { MenteeSummaryCard },

  data() {
    return {
      mentees: [],
      mentorId: null,
    }
  },

  async mounted() {
    const auth = useAuthStore()

    // Pinia에서 직접 값 가져오기
    this.mentorId = auth.user?.userId

    // user가 나중에 로딩되면 자동 반응하도록
    watch(
      () => auth.user,
      (newUser) => {
        if (newUser) {
          this.mentorId = newUser.userId
          this.fetchMentees()
        }
      },
      { immediate: true } // user가 이미 있다면 바로 실행
    )
  },

  methods: {
    async fetchMentees() {
      if (!this.mentorId) return

      try {
        const resp = await http.get(`/api/v1/mentors/${this.mentorId}/mentees`)

        this.mentees = resp.data.map((m) => ({
          userId: m.menteeId,
          name: m.name,
          email: m.email,
          phoneNumber: m.phoneNumber,
          department: m.department
        }))
      } catch (e) {
        console.error("멘티 목록 조회 실패", e)
      }
    }
  }
}
</script>
