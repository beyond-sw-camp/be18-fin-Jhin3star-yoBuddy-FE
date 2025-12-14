<template>
  <div v-if="visible" class="modal-backdrop">
    <div class="modal">

      <!-- HEADER -->
      <header class="modal-header">
        <div>
          <h2 class="modal-title">
            {{ isViewMode ? '직무 수행 능력 평가 결과' : '직무 수행 능력 평가' }}
          </h2>
          <div class="user-sub">
            {{ user?.name }} · {{ user?.department }}
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </header>

      <!-- ================= 입력 모드 ================= -->
      <div v-if="!isViewMode" class="score-list">
        <div
          v-for="item in items"
          :key="item.key"
          class="score-item"
        >
          <div class="score-header">
            <label>{{ item.label }}</label>
            <span class="score-value">
              {{ scores[item.key] }} / 20
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="20"
            step="1"
            v-model.number="scores[item.key]"
            :class="scoreClass(scores[item.key])"
            :style="{ '--val': scores[item.key] * 5 }"
          />

          <div class="score-guide">
            <span>부족</span>
            <span>보통</span>
            <span>우수</span>
          </div>
        </div>

        <div class="total-score">
          <span>총점</span>
          <strong>{{ totalScore }} / 100</strong>
        </div>
      </div>

      <!-- ================= 결과 모드 ================= -->
      <div v-else class="result-view">
        <div v-if="loading">불러오는 중...</div>

        <template v-else>
          <div class="result-score">
            {{ resultScore }} <span>/ 100</span>
          </div>

          <div class="result-level" :class="levelClass">
            {{ levelText }}
          </div>

          <p class="result-hint">
            직무 수행 능력 평가는 최종 점수만 저장되며<br />
            재평가는 불가능합니다.
          </p>
        </template>
      </div>

      <!-- FOOTER -->
      <footer class="modal-actions">
        <button class="btn-outline" @click="$emit('close')">
          닫기
        </button>

        <button
          v-if="!isViewMode"
          class="btn-primary"
          :disabled="!canSubmit"
          @click="submit"
        >
          저장
        </button>
      </footer>

    </div>
  </div>
</template>

<script>
import http from '@/services/http'

export default {
  name: 'JobPerformanceEvaluateModal',
  props: {
    visible: Boolean,
    user: Object,
    departmentId: Number,
    mode: {
      type: String,
      default: 'edit', // edit | view
    }
  },
  data() {
    return {
      items: [
        { key: 'understanding', label: '업무 이해도' },
        { key: 'problemSolving', label: '문제 해결 능력' },
        { key: 'communication', label: '소통 능력' },
        { key: 'responsibility', label: '책임감' },
        { key: 'growth', label: '성장 가능성' },
      ],
      scores: this.getEmptyScores(),
      resultScore: 0,
      loading: false,
    }
  },
  computed: {
    isViewMode() {
      return this.mode === 'view'
    },
    totalScore() {
      return Object.values(this.scores).reduce((a, b) => a + (Number(b) || 0), 0)
    },
    canSubmit() {
      return this.totalScore > 0
    },
    levelText() {
      if (this.resultScore >= 85) return '우수'
      if (this.resultScore >= 70) return '보통'
      return '개선 필요'
    },
    levelClass() {
      if (this.resultScore >= 85) return 'good'
      if (this.resultScore >= 70) return 'mid'
      return 'low'
    }
  },
  watch: {
    user: {
      immediate: true,
      handler() {
        this.resetScores()
        this.resultScore = 0
      }
    },
    visible(val) {
      if (val && this.isViewMode) {
        this.fetchResult()
      }
    }
  },
  methods: {
    getEmptyScores() {
      return {
        understanding: 0,
        problemSolving: 0,
        communication: 0,
        responsibility: 0,
        growth: 0,
      }
    },
    resetScores() {
      this.scores = this.getEmptyScores()
    },
    scoreClass(value) {
      if (value >= 16) return 'high'
      if (value >= 11) return 'mid'
      return 'low'
    },
    async fetchResult() {
      if (!this.user || !this.departmentId) return
      this.loading = true
      try {
        const res = await http.get('/api/v1/admin/kpi/job-performance', {
          params: {
            userId: this.user.userId || this.user.id,
            departmentId: this.departmentId,
          }
        })
        this.resultScore = res?.data?.score ?? 0
      } catch (e) {
        this.resultScore = 0
      } finally {
        this.loading = false
      }
    },
    async submit() {
      try {
        await http.post('/api/v1/admin/kpi/job-performance', {
          userId: this.user.userId || this.user.id,
          departmentId: this.departmentId,
          ...this.scores
        })
        alert('직무 수행 능력 평가가 기록되었습니다.')
        this.$emit('saved')
        this.$emit('close')
      } catch (e) {
        alert('평가 저장 중 오류가 발생했습니다.')
      }
    }
  }
}
</script>

<style scoped>
/* ===== Modal ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal {
  width: 520px;
  max-width: 90vw;
  max-height: 82vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  padding: 20px 22px;
}

/* ===== Header ===== */
.modal-header {
  display: flex;
  justify-content: space-between;
}
.modal-title {
  font-size: 18px;
  font-weight: 800;
}
.user-sub {
  font-size: 13px;
  color: #64748b;
}
.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

/* ===== Score Slider ===== */
.score-item {
  margin-bottom: 16px;
}
.score-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 6px;
}
.score-guide {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

/* 기본 슬라이더 */
input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  cursor: pointer;
}

/* 채워진 트랙 */
input.low {
  background: linear-gradient(to right,#ef4444 0%,#ef4444 calc(var(--val)*1%),#e5e7eb calc(var(--val)*1%),#e5e7eb 100%);
}
input.mid {
  background: linear-gradient(to right,#f59e0b 0%,#f59e0b calc(var(--val)*1%),#e5e7eb calc(var(--val)*1%),#e5e7eb 100%);
}
input.high {
  background: linear-gradient(to right,#10b981 0%,#10b981 calc(var(--val)*1%),#e5e7eb calc(var(--val)*1%),#e5e7eb 100%);
}

/* Thumb */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #294594;
  box-shadow: 0 2px 6px rgba(0,0,0,.15);
  transition: transform .15s ease, box-shadow .15s ease;
}
input[type="range"]:hover::-webkit-slider-thumb {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(41,69,148,.35);
}

/* ===== Total ===== */
.total-score {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  color: #294594;
}

/* ===== Result ===== */
.result-view {
  text-align: center;
  padding: 24px 0;
}
.result-score {
  font-size: 42px;
  font-weight: 800;
  color: #294594;
}
.result-level.good { color: #059669 }
.result-level.mid { color: #f59e0b }
.result-level.low { color: #dc2626 }

/* ===== Buttons ===== */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.btn-primary {
  background: #294594;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
}
.btn-primary:hover { background: #1f3a73; }
.btn-outline {
  background: transparent;
  border: 1px solid #d1d5db;
  padding: 8px 14px;
  border-radius: 8px;
}
.btn-outline:hover {
  background: rgba(41,69,148,.08);
  border-color: #294594;
  color: #294594;
}
</style>
