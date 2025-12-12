<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-header-main">
        <h2 class="page-title">온보딩 프로그램 관리</h2>
        <p class="page-subtitle">
          진행중이거나 예정된 온보딩 프로그램을 관리합니다.
        </p>
      </div>

      <button class="btn new-btn" type="button" @click="goToCreateProgram">
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
        v-for="program in paginatedPrograms"
        :key="program.programId"
        :program="program"
        @open="openProgramDetail"
      />
    </div>

    <div v-else class="empty-state">
      등록된 온보딩 프로그램이 없습니다.
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
          v-for="page in visiblePages"
          :key="page"
          class="page-num"
          :class="{ active: page === currentPage }"
          @click="goToPage(page)"
        >
          {{ page }}
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
</template>


<script>
import onboardingService from '@/services/onboardingService';
import OnboardingProgramCard from '@/components/admin/onboarding/OnboardingProgramCard.vue';

export default {
  name: "OnboardingProgramList",
  components: { OnboardingProgramCard },
  data() {
    return {
      programs: [],
      loading: false,
      error: null,

      currentPage: 1,
      pageSize: 6,
      MAX_VISIBLE_PAGES: 5,
    };
  },
  async mounted() {
    this.loading = true;
    try {
      this.programs = await onboardingService.getAdminOnboardingPrograms();
      this.currentPage = 1; 
      console.log('loaded programs', this.programs);
    } catch (e) {
      this.error = "프로그램 목록을 불러오는 데 실패했습니다.";
    } finally {
      this.loading = false;
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.programs.length / this.pageSize);
    },
    paginatedPrograms() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.programs.slice(start, start + this.pageSize);
    },
    visiblePages() {
      const total = this.totalPages;
      const current = this.currentPage;
      if (!total) return [];

      const start = Math.max(1, Math.min(current, total - this.MAX_VISIBLE_PAGES + 1));
      const end = Math.min(total, start + this.MAX_VISIBLE_PAGES - 1);

      const pages = [];
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    },
  },
  methods: {
    goToPage(page) {
      const total = this.totalPages;
      if (total < 1) return;
      const next = Math.min(Math.max(page, 1), total);
      if (next !== this.currentPage) this.currentPage = next;
    },

    openProgramDetail(program) {
      console.log('openProgramDetail called with', program)
      const id = program ? (program.programId || program.id) : null
      if (id) this.$router.push({ name: 'OnboardingProgramDetail', params: { programId: id } })
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

.pagination.numeric { display:flex; gap:10px; align-items:center; justify-content:center }
.page-nav { background:transparent; border:none; color:#4b5563; font-size:18px; padding:8px; cursor:pointer; transition: color 0.15s ease, opacity 0.15s ease }
.page-nav:disabled { color: #c5c9d6; opacity: 0.7; cursor: default }
.page-num { width:36px; height:36px; border-radius:50%; border:none; background:transparent; color:#4b5563; font-weight:700; cursor:pointer }
.page-num.active { background:#3b4aa0; color:#fff; box-shadow: 0 6px 18px rgba(59,74,160,0.18) }
.card-footer { padding: 16px 0; display:flex; justify-content:center }


.error-state {
  color: #b91c1c;
}
</style>
