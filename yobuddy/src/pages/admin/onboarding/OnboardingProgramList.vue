<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">온보딩 프로그램 관리</h2>
      <p class="page-subtitle">진행중이거나 예정된 온보딩 프로그램을 관리합니다.</p>
    </div>
    <div v-if="loading" class="loading-state">
      프로그램 목록을 불러오는 중...
    </div>
    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>
    <div v-else-if="programs.length > 0" class="program-grid">
      <OnboardingProgramCard
        v-for="program in programs"
        :key="program.programId"
        :program="program"
        @open="openProgramDetail"
      />
    </div>
    <div v-else-if="programs.length === 0" class="empty-state">
      등록된 온보딩 프로그램이 없습니다.
    </div>
    <OnboardingProgramDetailPopup
      :programId="selectedProgram ? (selectedProgram.programId || selectedProgram.id) : null"
      :program="selectedProgram"
      :visible="showDetailModal"
      @close="closeProgramDetail"
    />
  </div>
</template>

<script>
import onboardingService from '@/services/onboardingService';
import OnboardingProgramCard from '@/components/admin/onboarding/OnboardingProgramCard.vue';
import OnboardingProgramDetailPopup from '@/pages/admin/onboarding/OnboardingProgramDetailPopup.vue';

export default {
  name: "OnboardingProgramList",
  components: {
    OnboardingProgramCard,
    OnboardingProgramDetailPopup,
  },
  data() {
    return {
      programs: [],
      loading: false,
      error: null,
      showDetailModal: false,
        selectedProgram: null,
    };
  },
  async mounted() {
    this.loading = true;
    try {
      this.programs = await onboardingService.getAdminOnboardingPrograms();
      console.log('loaded programs', this.programs)
    } catch (e) {
      this.error = "프로그램 목록을 불러오는 데 실패했습니다.";
    } finally {
      this.loading = false;
    }
  },
  methods: {
    openProgramDetail(program) {
      console.log('openProgramDetail called with', program)
      this.selectedProgram = program || null
      this.showDetailModal = true
    },
    // removed openSample helper
    closeProgramDetail() {
      this.showDetailModal = false
      this.selectedProgram = null
    }
  },
};
</script>

<style scoped>
.page-container {
  padding: 28px 40px;
}
.page-header {
  margin-bottom: 24px;
}
.page-title {
  margin: 0;
  font-size: 24px;
  color: #10243b;
}
.page-subtitle {
  margin: 4px 0 0;
  color: #7d93ad;
  font-size: 14px;
}
.program-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}
/* debug banner */
.debug-banner {
  margin: 12px 0;
  padding: 10px 14px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  color: #613400;
  display:flex;
  align-items:center;
  gap:12px;
}
.btn.small { padding:6px 10px; font-size:13px }
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 5rem 0;
  color: #7d93ad;
  font-size: 16px;
}
.error-state {
  color: #b91c1c;
}
</style>
