<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-main">
        <h2 class="page-title">온보딩 프로그램 관리</h2>
        <p class="page-subtitle">
          진행중이거나 예정된 온보딩 프로그램을 관리합니다.
        </p>
      </div>

      <!-- 우측 상단 버튼 -->
      <button
        class="btn new-btn"
        type="button"
        @click="goToCreateProgram"
      >
        + 과정 등록
      </button>
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
      const id = program ? (program.programId || program.id) : null
      if (id) this.$router.push({ name: 'OnboardingProgramDetail', params: { programId: id } })
    },
    debugOpenFirst() {
      if (this.programs && this.programs.length > 0) {
        this.openProgramDetail(this.programs[0])
      } else {
        this.openProgramDetail({
          name: '샘플 프로그램',
          department: '샘플 부서',
          startDate: '—',
          endDate: '—',
          participantCount: 0,
          progress: 0,
          status: 'UPCOMING'
        })
      }
    },
    goToCreateProgram() {
      this.$router.push({ name: 'OnboardingProgramCreate' });
    },
  },
};
</script>

<style scoped>
.page-container {
  padding: 28px 40px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-header-main {
  display: flex;
  flex-direction: column;
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

.btn {
  border-radius: 10px;
  cursor: pointer;
  border: none;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.new-btn {
  width: 110px;
  height: 40px;
  padding: 8px 12px;
  background: #294594;
  color: white;
  font-weight: 400;
  border-radius: 10px;
  box-sizing: border-box;
}

.debug-banner {
  margin: 12px 0;
  padding: 10px 14px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  color: #613400;
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn.small {
  padding: 6px 10px;
  font-size: 13px;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 5rem 0;
  color: #7d93ad;
  font-size: 16px;
}

.error-state {
  color: #b91c1c;
}
</style>
