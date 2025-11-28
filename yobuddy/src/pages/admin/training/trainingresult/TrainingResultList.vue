<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">교육 평가</h2>
          <p class="card-sub">교육 평가 조회</p>
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
          <button class="page-nav" @click="setPage(page-1)" :disabled="page<=0" aria-label="이전 페이지">‹</button>
          <template v-for="p in pageList" :key="p.key">
            <button v-if="p.type==='page'" :class="['page-num', { active: p.num === page }]" @click="setPage(p.num)">{{ p.num + 1 }}</button>
            <span v-else class="ellipsis">···</span>
          </template>
          <button class="page-nav" @click="setPage(page+1)" :disabled="page>=totalPages-1" aria-label="다음 페이지">›</button>
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
      pageList: [],
      trainingresults: [],
      loading: false,
      totalPages: 0,
      error: null,
      isDeleteMode: false,
      selectedIds: [],
    }
  },

  created() {
    this.fetchTrainingResults();
  },

  methods: {
    // 리스트 조회
    async fetchTrainingResults() {
      this.loading = true;
      this.error = null;
      try {
        const pageData = await trainingResultService.getTrainingResultList({
          page: this.page,
          size: this.size,
        });

        // ⚠️ 백엔드 응답 형식에 따라 여기 필드 이름만 맞춰주면 됨
        // 예: Spring Data Page 기준
        this.trainingresults = pageData.content || [];
        this.totalPages = pageData.totalPages ?? 0;
        this.page = pageData.number ?? this.page;

        this.buildPageList();
      } catch (e) {
        console.error(e);
        this.error = '교육 평가 조회에 실패했습니다.';
      } finally {
        this.loading = false;
      }
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

    // 페이지네이션 버튼들 계산
    buildPageList() {
      const pages = [];
      const total = this.totalPages;
      const current = this.page;
      const maxButtons = 5; // 최대 페이지 버튼 수

      if (total <= maxButtons) {
        // 전체 페이지 수가 적은 경우: 그냥 다 보여줌
        for (let i = 0; i < total; i++) {
          pages.push({ type: 'page', num: i, key: `p-${i}` });
        }
      } else {
        // 많은 경우: 앞/뒤 ... 처리
        let start = Math.max(0, current - 2);
        let end = Math.min(total - 1, current + 2);

        if (start > 0) {
          pages.push({ type: 'page', num: 0, key: 'p-0' });
          if (start > 1) {
            pages.push({ type: 'ellipsis', key: 'e-start' });
          }
        }

        for (let i = start; i <= end; i++) {
          pages.push({ type: 'page', num: i, key: `p-${i}` });
        }

        if (end < total - 1) {
          if (end < total - 2) {
            pages.push({ type: 'ellipsis', key: 'e-end' });
          }
          pages.push({ type: 'page', num: total - 1, key: `p-${total - 1}` });
        }
      }

      this.pageList = pages;
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
  }
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
.btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.btn-danger {
  background: #e74c3c;
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