<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">교육 평가</h2>
          <p class="card-sub">교육 평가 조회</p>
        </div>

        <div class="search-wrap">
          <select v-model="resultFilter" class="dept-select" @change="onFilterChange">
            <option value="ALL">전체</option>
            <option value="PASS">합격</option>
            <option value="FAIL">불합격</option>
          </select>

          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="검색어를 입력하세요"
            @keyup.enter="onSearch"
          />

          <button class="btn btn-primary" @click="onSearch">검색</button>
        </div>

        <div class="action-wrap">
          <button
            v-if="!isDeleteMode"
            class="btn btn-danger"
            :disabled="!trainingresults || trainingresults.length === 0"
            @click="enterDeleteMode"
          >
            삭제
          </button>

          <template v-else>
            <button class="btn btn-secondary" @click="cancelDeleteMode">취소</button>
            <button class="btn btn-danger" :disabled="selectedIds.length === 0" @click="confirmDelete">
              삭제
            </button>
          </template>
        </div>
      </div>

      <div class="card-body"> 
        <div v-if="isLoading" class="loading-state">
          <div class="loader" aria-label="불러오는 중">
            <div class="wrapper">
              <div class="catContainer">
                <svg
                class="catbody"
                viewBox="0 0 120 120"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                >
                <path
                d="M22 70c0-18 16-32 38-32s38 14 38 32-16 32-38 32-38-14-38-32z"
                fill="#294594"
                />
                <circle cx="48" cy="66" r="4" fill="#fff"/>
                <circle cx="72" cy="66" r="4" fill="#fff"/>
                <path d="M56 78c4 4 8 4 12 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M38 48l-10-10v18z" fill="#294594"/>
                <path d="M82 48l10-10v18z" fill="#294594"/>
              </svg>
              <svg
              class="tail"
              viewBox="0 0 30 120"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              >
              <path
              d="M15 5c-2 18-3 32-3 46 0 18 3 34 3 64"
              stroke="#294594"
              stroke-width="8"
              stroke-linecap="round"
              fill="none"
              />
            </svg>
            <svg
            class="wall"
            viewBox="0 0 320 120"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            >
            <rect x="0" y="70" width="320" height="14" fill="#e6eef8"/>
            <rect x="0" y="84" width="320" height="6" fill="#cbd5e1"/>
          </svg>

          
          <div class="text" aria-hidden="true">
            <span class="zzz">Z</span>
            <span class="bigzzz">Z</span>
            <span class="zzz">Z</span>
          </div>
        </div>

        <div class="loading-text">불러오는 중입니다…</div>
      </div>
    </div>
  </div>
        

        <div v-else-if="trainingresults && trainingresults.length" class="result-grid">
          <div
            class="result-card"
            v-for="tr in trainingresults"
            :key="tr.formResultId"
            :class="{
              'delete-mode': isDeleteMode,
              selected: isDeleteMode && isSelected(tr.formResultId)
            }"
            @click="onCardClick(tr.formResultId)"
          >
            <div
              v-if="isDeleteMode"
              class="select-indicator"
              :class="{ selected: isSelected(tr.formResultId) }"
              aria-hidden="true"
            >
              ✓
            </div>

            <div class="result-top">
              <div class="who">
                <div class="avatar">{{ (tr.userName || '?').slice(0, 1) }}</div>
                <div class="who-meta">
                  <div class="who-name">{{ tr.userName }}</div>
                  <div class="who-sub">제출: {{ formatDate(tr.submittedAt) }}</div>
                </div>
              </div>

              <div class="right-meta">
                <span :class="['tag', statusClass(tr.result)]">{{ statusLabel(tr.result) }}</span>
                <div class="score-pill">{{ tr.score }}점</div>
              </div>
            </div>

            <div class="result-mid">
              <div class="meta-row">
                <div class="meta-label">교육</div>
                <div class="meta-value" :title="tr.trainingName">{{ tr.trainingName }}</div>
              </div>
              <div class="meta-row">
                <div class="meta-label">프로그램</div>
                <div class="meta-value" :title="tr.programName">{{ tr.programName }}</div>
              </div>
            </div>

            <div class="result-bottom">
              <div class="bar-wrap">
                <div class="bar-label">점수</div>
                <div class="bar">
                  <div class="bar-fill" :style="{ width: Math.min(100, Math.max(0, tr.score)) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">교육 평가가 존재하지 않습니다.</div>
      </div>

      <div class="card-footer">
        <div class="pagination numeric">
          <button class="page-nav" @click="setPage(page - 1)" :disabled="page <= 0" aria-label="이전 페이지">
            &lt;
          </button>

          <button
            v-for="p in pageList"
            :key="p"
            :class="['page-num', { active: p === page }]"
            @click="setPage(p)"
          >
            {{ p + 1 }}
          </button>

          <button
            class="page-nav"
            @click="setPage(page + 1)"
            :disabled="page >= totalPages - 1"
            aria-label="다음 페이지"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import trainingResultService from '@/services/trainingResultService'

export default {
  name: 'TrainingResultList',
  data() {
    return {
      page: 0,
      size: 10,
      backendSize: 100,

      searchKeyword: '',
      resultFilter: 'ALL',

      allResults: [],

      isLoading: false,

      isDeleteMode: false,
      selectedIds: []
    }
  },

  created() {
    this.fetchAllResults()
  },

  computed: {
    filteredResults() {
      if (this.resultFilter === 'ALL') return this.allResults
      return this.allResults.filter((x) => x.result === this.resultFilter)
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredResults.length / this.size))
    },

    trainingresults() {
      const start = this.page * this.size
      return this.filteredResults.slice(start, start + this.size)
    },

    pageList() {
      const total = this.totalPages
      const current = this.page
      const maxVisible = 5
      const pages = []

      if (total <= maxVisible) {
        for (let i = 0; i < total; i++) pages.push(i)
        return pages
      }

      const half = Math.floor(maxVisible / 2)
      let start = current - half
      let end = current + half + 1

      if (start < 0) {
        start = 0
        end = maxVisible
      }

      if (end > total) {
        end = total
        start = total - maxVisible
      }

      for (let i = start; i < end; i++) pages.push(i)
      return pages
    }
  },

  methods: {
    sortLatest(items) {
      return [...items].sort((a, b) => {
        const av = new Date(a.submittedAt || 0).getTime()
        const bv = new Date(b.submittedAt || 0).getTime()
        if (av === bv) return (b.formResultId ?? 0) - (a.formResultId ?? 0)
        return bv - av
      })
    },

    ensureValidPage() {
      const last = this.totalPages - 1
      if (this.page > last) this.page = Math.max(0, last)
      if (this.page < 0) this.page = 0
    },

    async fetchAllResults(preservePage = false) {
      const keep = preservePage ? this.page : 0

      this.isLoading = true

      try {
        const items = []
        const MAX_PAGES = 300
        let p = 0

        for (let i = 0; i < MAX_PAGES; i++) {
          const payload = {
            page: p,
            size: this.backendSize,
            sort: 'submittedAt,desc'
          }

          const k = (this.searchKeyword || '').trim()
          if (k) {
            payload.userName = k
            payload.trainingName = k
            payload.onboardingName = k
          }

          const pageData = await trainingResultService.getTrainingResultList(payload)
          const content = pageData.content || []
          if (content.length) items.push(...content)

          const total = pageData.totalPages ?? 0
          const last =
            pageData.last === true ||
            (total ? p >= total - 1 : content.length < this.backendSize)

          if (last) break
          p += 1
        }

        this.allResults = this.sortLatest(items)
        this.page = keep
        this.ensureValidPage()
      } catch (e) {
        console.error(e)
        alert('교육 평가 조회에 실패했습니다.')
        this.allResults = []
        this.page = 0
      }finally {
        this.isLoading = false
      }
    },

    onFilterChange() {
      this.page = 0
      if (this.isDeleteMode) this.selectedIds = []
    },

    onSearch() {
      this.page = 0
      if (this.isDeleteMode) this.selectedIds = []
      this.fetchAllResults(false)
    },

    setPage(newPage) {
      if (newPage < 0 || newPage >= this.totalPages || newPage === this.page) return
      this.page = newPage
      if (this.isDeleteMode) this.selectedIds = []
    },

    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      const hh = String(date.getHours()).padStart(2, '0')
      const min = String(date.getMinutes()).padStart(2, '0')
      return `${yyyy}년 ${mm}월 ${dd}일 ${hh}시 ${min}분`
    },

    statusClass(status) {
      if (status === 'PASS') return 'tag-success'
      if (status === 'FAIL') return 'tag-danger'
      return ''
    },

    statusLabel(status) {
      if (status === 'PASS') return '합격'
      if (status === 'FAIL') return '불합격'
      return status
    },

    enterDeleteMode() {
      this.isDeleteMode = true
      this.selectedIds = []
    },

    cancelDeleteMode() {
      this.isDeleteMode = false
      this.selectedIds = []
    },

    isSelected(id) {
      return this.selectedIds.includes(id)
    },

    onCardClick(id) {
      if (!this.isDeleteMode) return
      const idx = this.selectedIds.indexOf(id)
      if (idx >= 0) this.selectedIds.splice(idx, 1)
      else this.selectedIds.push(id)
    },

    async confirmDelete() {
      if (this.selectedIds.length === 0) return
      if (!confirm(`선택한 ${this.selectedIds.length}개의 교육 평가를 삭제하시겠습니까?`)) return

      try {
        for (const id of this.selectedIds) {
          await trainingResultService.deleteTrainingResult(id)
        }
        this.cancelDeleteMode()
        await this.fetchAllResults(true)
      } catch (e) {
        console.error(e)
        alert('삭제 중 오류가 발생했습니다.')
      }
    }
  }
}
</script>

<style scoped>
/* CSS 그대로 */
.org-page {
  padding: 28px 40px;
  display: flex;
  justify-content: center;
}

.content-card {
  width: 1100px;
  max-width: 100%;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(9, 30, 66, 0.08);
  overflow: hidden;
}

.card-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 28px;
  border-bottom: 1px solid #eef2f7;
  flex-wrap: wrap;
}

.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  margin: 0;
  font-size: 20px;
  color: #10243b;
}

.card-sub {
  margin: 4px 0 0;
  color: #7d93ad;
  font-size: 13px;
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
  flex: 1;
  justify-content: flex-end;
}

.search-input {
  min-width: 220px;
  border-radius: 10px;
  padding: 10px 16px;
}

.btn {
  padding: 6px 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #294594;
  color: #fff;
  padding: 10px 16px;
}

.btn-danger {
  background: #e74c3c;
  padding: 10px 16px;
  color: #fff;
}

.btn-secondary {
  background: #bdc3c7;
  color: #333;
  padding: 10px 16px;
}

.card-body {
  padding: 22px 28px;
  display: block;
}

.empty-state {
  padding: 32px 0;
  text-align: center;
  color: #7d93ad;
  font-weight: 600;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.result-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 16px 16px;
  box-shadow: 0 6px 18px rgba(9, 30, 66, 0.06);
}

.result-card.delete-mode {
  cursor: pointer;
  user-select: none;
}

.result-card.selected {
  border-color: rgba(41, 69, 148, 0.45);
  box-shadow: 0 10px 26px rgba(41, 69, 148, 0.14);
}

.select-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  color: transparent;
  background: #fff;
  transition: all 0.12s ease;
}

.select-indicator.selected {
  border-color: #294594;
  background: #294594;
  color: #fff;
}

.result-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.who {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #294594;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.who-meta {
  min-width: 0;
}

.who-name {
  font-weight: 800;
  color: #10243b;
  font-size: 14px;
  line-height: 1.2;
}

.who-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #7d93ad;
}

.right-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.score-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f6ff;
  color: #294594;
  font-weight: 800;
  font-size: 12px;
  border: 1px solid #e6eef8;
}

.result-mid {
  padding: 12px 0;
  display: grid;
  gap: 8px;
}

.meta-row {
  display: grid;
  grid-template-columns: 64px 1fr;
  align-items: center;
  gap: 10px;
}

.meta-label {
  font-size: 12px;
  color: #7d93ad;
  font-weight: 700;
}

.meta-value {
  font-size: 13px;
  color: #334155;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.bar-wrap {
  flex: 1;
  min-width: 0;
}

.bar-label {
  font-size: 12px;
  color: #7d93ad;
  font-weight: 700;
  margin-bottom: 6px;
}

.bar {
  height: 10px;
  background: #eef2f7;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: #294594;
}

.tag {
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.tag-success {
  background-color: #e6f7ec;
  color: #1f7a3a;
  border: 1px solid #b2e2c4;
}

.tag-danger {
  background-color: #fdeaea;
  color: #c0392b;
  border: 1px solid #f5b7b1;
}

.pagination.numeric {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.page-nav {
  background: transparent;
  border: none;
  color: #4b5563;
  font-size: 18px;
  padding: 8px;
  cursor: pointer;
  transition: color 0.15s ease, opacity 0.15s ease;
}

.page-nav:disabled {
  color: #c5c9d6;
  opacity: 0.7;
  cursor: default;
}

.page-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #4b5563;
  font-weight: 700;
  cursor: pointer;
}

.page-num.active {
  background: #3b4aa0;
  color: #fff;
  box-shadow: 0 6px 18px rgba(59, 74, 160, 0.18);
}

.card-footer {
  padding: 16px 28px;
  border-top: 1px solid #eef2f7;
  display: flex;
  justify-content: center;
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

.loading-state {
  padding: 34px 0;
  display: flex;
  justify-content: center;
}

.loading-text {
  margin-top: 10px;
  color: #7d93ad;
  font-weight: 800;
  font-size: 14px;
}

.loader {
  width: fit-content;
  height: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wrapper {
  width: fit-content;
  height: fit-content;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.catContainer {
  width: 100%;
  height: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.catbody {
  width: 80px;
  z-index: 2;
}
.tail {
  position: absolute;
  width: 17px;
  top: 50%;
  left: 50%;
  margin-left: 42px;
  z-index: 1;
  animation: tail 0.5s ease-in infinite alternate-reverse;
  transform-origin: top;
}
@keyframes tail {
  0% { transform: rotateZ(60deg); }
  50% { transform: rotateZ(0deg); }
  100% { transform: rotateZ(-20deg); }
}
.wall {
  width: 300px;
  position: absolute;
  bottom: -6px;
  z-index: 0;
}
.text {
  display: flex;
  flex-direction: column;
  width: 50px;
  position: absolute;
  margin: 0px 0px 100px 120px;
}
.zzz {
  color: black;
  font-weight: 700;
  font-size: 15px;
  animation: zzz 2s linear infinite;
}
.bigzzz {
  color: black;
  font-weight: 700;
  font-size: 25px;
  margin-left: 10px;
  animation: zzz 2.3s linear infinite;
}
@keyframes zzz {
  0% { color: transparent; }
  50% { color: black; }
  100% { color: transparent; }
}


@media (max-width: 980px) {
  .result-grid {
    grid-template-columns: 1fr;
  }
  .search-wrap {
    width: 100%;
    justify-content: flex-start;
  }
  .search-input {
    min-width: 160px;
    width: 100%;
    max-width: 260px;
  }
}
</style>
