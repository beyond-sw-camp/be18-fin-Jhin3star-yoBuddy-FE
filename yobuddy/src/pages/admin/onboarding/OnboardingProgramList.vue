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
      />
    </div>
    <div v-else class="empty-state">
      등록된 온보딩 프로그램이 없습니다.
    </div>
  </div>
</template>

<script>
import onboardingService from '@/services/onboardingService';
import OnboardingProgramCard from '@/components/admin/onboarding/OnboardingProgramCard.vue';

export default {
  name: "OnboardingProgramList",
  components: {
    OnboardingProgramCard,
  },
  data() {
    return {
      programs: [],
      loading: false,
      error: null,
    };
  },
  async mounted() {
    this.loading = true;
    try {
      this.programs = await onboardingService.getAdminOnboardingPrograms();
    } catch (e) {
      this.error = "프로그램 목록을 불러오는 데 실패했습니다.";
    } finally {
      this.loading = false;
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
