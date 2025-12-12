<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">교육 평가</h2>
          <p class="card-sub">교육 평가 조회</p>
        </div>

          <!-- 🔍 검색 영역 -->
        <div class="search-wrap">
          <select v-model="searchFilter" class="search-select">
            <option value="ALL">전체</option>
            <option value="USER">사원명</option>
            <option value="TRAINING">교육명</option>
            <option value="PROGRAM">프로그램명</option>
          </select>

          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="검색어를 입력하세요"
            @keyup.enter="onSearch"
          />

          <button class="btn btn-primary" @click="onSearch">
            검색
          </button>
        </div>

        <div class="action-wrap">
          <!-- 삭제 모드가 아닐 때 -->
          <button
            v-if="!isDeleteMode"
            class="btn btn-danger"
            :disabled="!trainingresults || trainingresults.length === 0"
            @click="enterDeleteMode"
          >
            삭제
          </button>

          <!-- 삭제 모드일 때 -->
          <template v-else>
            <button class="btn btn-secondary" @click="cancelDeleteMode">
              취소
            </button>
            <button
              class="btn btn-danger"
              :disabled="selectedIds.length === 0"
              @click="confirmDelete"
            >
              삭제
            </button>
          </template>
        </div>
      </div>

      <div class="card-body">
        <table class="user-table" v-if="trainingresults && trainingresults.length">
          <thead>
            <tr>
              <th>이름</th>
              <th>교육</th>
              <th>프로그램</th>
              <th>점수</th>
              <th>결과</th>
              <th>제출일</th>
              <th v-if="isDeleteMode">선택</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tr in trainingresults" :key="tr.id">
              <td class="name-col">
                <div class="meta">
                  <div class="name">{{ tr.userName }}</div>
                </div>
              </td>
              <td>{{ tr.trainingName }}</td>
              <td>{{ tr.programName }}</td>
              <td>{{ tr.score }}</td>
              <td>
                <span :class="['tag', statusClass(tr.result)]">{{ statusLabel(tr.result) }}</span>
              </td>
              <td>{{ formatDate(tr.submittedAt) }}</td>
              <td v-if="isDeleteMode">
                <input
                  type="checkbox"
                  :value="tr.formResultId"
                  v-model="selectedIds"
                  @click.stop
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">교육 평가가 존재하지 않습니다.</div>
      </div>

      <div class="card-footer">
        <div class="pagination numeric">
          <button class="page-nav" @click="setPage(page-1)" :disabled="page<=0" aria-label="이전 페이지">&lt;</button>
          <button
            v-for="p in pageList"
            :key="p"
            :class="['page-num', { active: p === page }]"
            @click="setPage(p)"
          >
            {{ p + 1 }}
          </button>
          <button class="page-nav" @click="setPage(page+1)" :disabled="page>=totalPages-1" aria-label="다음 페이지">&gt;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import trainingResultService from '@/services/trainingResultService';

export default {
  name: 'TrainingResultList',
  data() {
    return {
      page: 0,
      size: 10,
      searchFilter: 'ALL',
      searchKeyword: '',
      trainingresults: [],
      loading: false,
      totalPages: 1,
      error: null,
      isDeleteMode: false,
      selectedIds: [],
    }
  },

  created() {
    this.fetchTrainingResults();
  },

  computed: {
    pageList() {
      const total = this.totalPages || 0;
      const current = this.page || 0;       // 0-based
      const maxVisible = 5;
      const pages = [];

      if (total <= 0) {
        return pages;
      }

      if (total <= maxVisible) {
        for (let i = 0; i < total; i++) {
          pages.push(i);
        }
        return pages;
      }

      const half = Math.floor(maxVisible / 2); // 5 → 2

      let start = current - half;
      let end = current + half + 1; // end는 미포함

      if (start < 0) {
        start = 0;
        end = maxVisible;
      }

      if (end > total) {
        end = total;
        start = total - maxVisible;
      }

      for (let i = start; i < end; i++) {
        pages.push(i);
      }

      return pages;
    },
  },

  methods: {
    // 리스트 조회
    async fetchTrainingResults() {
      this.loading = true;
      this.error = null;
      try {
        const payload = {
          page: this.page,
          size: this.size,
        };

        if (this.searchKeyword) {
          if (this.searchFilter === 'ALL') {
            // 🔥 ALL일 때는 3가지 필드를 모두 검색
            payload.userName = this.searchKeyword;
            payload.trainingName = this.searchKeyword;
            payload.onboardingName = this.searchKeyword;
          } 
          else if (this.searchFilter === 'USER') {
            payload.userName = this.searchKeyword;
          } 
          else if (this.searchFilter === 'TRAINING') {
            payload.trainingName = this.searchKeyword;
          } 
          else if (this.searchFilter === 'PROGRAM') {
            payload.onboardingName = this.searchKeyword;
          }
        }

        const pageData = await trainingResultService.getTrainingResultList(payload);

        // ⚠️ 백엔드 응답 형식에 따라 여기 필드 이름만 맞춰주면 됨
        // 예: Spring Data Page 기준
        this.trainingresults = pageData.content || [];
        this.totalPages = Math.max(1, pageData.totalPages ?? 0);
        this.page = pageData.number ?? this.page;
      } catch (e) {
        console.error(e);
        this.error = '교육 평가 조회에 실패했습니다.';
      } finally {
        this.loading = false;
      }
    },

    onSearch() {
      // 검색할 때는 항상 첫 페이지부터
      this.page = 0; 
      this.fetchTrainingResults();
    },

    formatDate(dateStr) {
      if (!dateStr) return "-";

      const date = new Date(dateStr);

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");

      return `${yyyy}년 ${mm}월 ${dd}일 ${hh}시 ${min}분`;
    },

    // 페이지 변경
    setPage(newPage) {
      if (newPage < 0 || newPage >= this.totalPages || newPage === this.page) return;
      this.page = newPage;
      this.fetchTrainingResults();
    },

    statusClass(status) {
      switch (status) {
        case 'PASS':
          return 'tag-success';
        case 'FAIL':
          return 'tag-danger';
      }
    },

    statusLabel(status) {
      switch (status) {
        case 'PASS':
          return '합격';
        case 'FAIL':
          return '불합격';
      }
    },

    onRowClick(trainingResult) {
      if (this.isDeleteMode) {
        // 삭제 모드일 때는 선택 토글
        const id = trainingResult.id;
        const idx = this.selectedIds.indexOf(id);
        if (idx === -1) {
          this.selectedIds.push(id);
        } else {
          this.selectedIds.splice(idx, 1);
        }
      }
    },

    enterDeleteMode() {
      this.isDeleteMode = true;
      this.selectedIds = [];
    },

    // 🔽 삭제 모드 취소
    cancelDeleteMode() {
      this.isDeleteMode = false;
      this.selectedIds = [];
    },

    // 🔽 선택된 항목 삭제
    async confirmDelete() {
      if (this.selectedIds.length === 0) return;

      if (!confirm(`선택한 ${this.selectedIds.length}개의 교육 평가를 삭제하시겠습니까?`)) {
        return;
      }

      try {
        // 개별 삭제 API만 있으므로 반복 호출
        for (const id of this.selectedIds) {
          await trainingResultService.deleteTrainingResult(id);
        }

        // 삭제 후 목록 새로고침 + 삭제 모드 종료
        await this.fetchTrainingResults();
        this.cancelDeleteMode();
      } catch (e) {
        alert('삭제 중 오류가 발생했습니다.');
        console.error(e);
      }
    },
  },
};
</script>

<style scoped>
.org-page { 
  padding: 28px 40px; 
  display:flex; 
  justify-content:center; 
}
.content-card { 
  width: 1100px; 
  max-width: 100%; 
  margin: 0 auto; 
  background: #fff; 
  border-radius: 12px; 
  box-shadow: 0 8px 30px rgba(9,30,66,0.08); 
  overflow: hidden; 
}
.card-header { 
  display:flex; 
  flex-direction:row; 
  align-items:center; 
  justify-content:space-between; 
  gap:16px; 
  padding: 20px 28px; 
  border-bottom: 1px solid #eef2f7; 
  flex-wrap:wrap; 
}
.title-wrap { 
  display:flex; 
  flex-direction:column; 
  gap:4px; 
}
.action-wrap {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.search-wrap {
  display: flex;
  align-items: center;
  border-radius: 10px;
  gap: 8px;
  flex: 1;              /* 가운데 영역 좀 넓게 */
  justify-content: flex-end; /* 필요에 따라 변경 */
}

.search-select {
  min-width: 120px;
  border-radius: 10px;
  padding:10px 16px;
}

.search-input {
  min-width: 220px;
  border-radius: 10px;
  padding:10px 16px;
}

.btn {
  padding: 6px 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}

.btn-danger {
  background: #e74c3c;
  padding:10px 16px;
  color: #fff;
}

.btn-secondary {
  background: #bdc3c7;
  color: #333;
}
.card-title { 
  margin:0; 
  font-size:20px; 
  color:#10243b 
}
.card-sub { 
  margin: 4px 0 0; 
  color:#7d93ad; 
  font-size:13px 
}
.controls { 
  display:flex; 
  gap:12px; 
  align-items:center; 
  justify-content:flex-end; 
  flex:1; 
  flex-wrap:wrap 
}
.btn-primary { 
  background:#294594; 
  color:#fff; 
  padding:10px 16px; 
  border-radius:10px; 
  border:none; 
  cursor:pointer 
}
.btn-ghost { 
  background: transparent; 
  border: 1px solid #e6eef8; 
  color: #294594; 
  padding:8px 12px; 
  border-radius:8px; 
  cursor:pointer 
}
.card-body { 
  padding: 22px 28px; 
  display:flex; 
  justify-content:center 
}
.user-table { 
  width:100%; 
  max-width:900px; 
  margin:0 auto; 
  border-collapse: collapse; 
}
.user-table td {
  text-align: center;
}
.user-table thead th { 
  text-align:center; 
  color:#7c96b3; 
  font-weight:700; 
  padding:12px 10px; 
  font-size:13px 
}
.user-table .name-col {
  display: flex;
  justify-content: center;
  align-items: center;
}
.user-table tbody tr { 
  border-top:1px solid #f0f4fb 
}
.user-table tbody td:nth-child(2) { 
  max-width: 150px; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}
.user-table tbody td:nth-child(3) { 
  max-width: 150px; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}
.tag { 
  padding:6px 10px; 
  border-radius:10px; 
  font-size:12px; 
  font-weight:700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px; 
}
.tag-success {
  background-color: #e6f7ec; /* 연한 초록 배경 */
  color: #1f7a3a;            /* 진한 초록 글자 */
  border: 1px solid #b2e2c4;
}
/* 불합격 */
.tag-danger {
  background-color: #fdeaea; /* 연한 빨강 배경 */
  color: #c0392b;            /* 진한 빨강 글자 */
  border: 1px solid #f5b7b1;
}  
.user-table tbody td { 
  padding:16px 10px; 
  vertical-align:middle; 
  color:#123 
}
.name-col { 
  display:flex; 
  gap:12px; 
  align-items:center 
}
.meta .name { 
  font-weight:700; 
  color:#10243b 
}
.meta .email { 
  font-size:13px; 
  color:#6d859a 
}
.pagination.numeric { 
  display:flex; 
  gap:10px; 
  align-items:center 
}
.page-nav { 
  background:transparent; 
  border:none; 
  color:#4b5563; 
  font-size:18px; 
  padding:8px; 
  cursor:pointer; 
  transition: color 0.15s ease, 
  opacity 0.15s ease 
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
.ellipsis { 
  color:#64748b; 
  padding:0 6px 
}
.card-footer { 
  padding: 16px 28px; 
  border-top: 1px solid #eef2f7; 
  display:flex; 
  justify-content:center 
  }
</style>
