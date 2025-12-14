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
          />

          <div class="score-guide">
            <span>부족</span>
            <span>보통</span>
            <span>우수</span>
          </div>
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
      default: 'edit', // 'edit' | 'view'
    }
  },
  data() {
    return {
      /* 입력용 */
      items: [
        { key: 'understanding', label: '업무 이해도' },
        { key: 'problemSolving', label: '문제 해결 능력' },
        { key: 'communication', label: '소통 능력' },
        { key: 'responsibility', label: '책임감' },
        { key: 'growth', label: '성장 가능성' },
      ],
      scores: {
        understanding: 0,
        problemSolving: 0,
        communication: 0,
        responsibility: 0,
        growth: 0,
      },

      /* 결과용 */
      resultScore: 0,
      loading: false,
    }
  },
  computed: {
    isViewMode() {
      return this.mode === 'view'
    },
    totalScore() {
      return Object.values(this.scores).reduce((a, b) => a + b, 0)
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
    visible(val) {
      if (val && this.isViewMode) {
        this.fetchResult()
      }
    }
  },
  methods: {
    scoreClass(value) {
      if (value >= 16) return 'high'
      if (value >= 11) return 'mid'
      return 'low'
    },

    /* ✅ 결과 조회 GET */
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

        if (res && res.data) {
          this.resultScore = res.data.score
        } else {
          this.resultScore = 0
        }
      } catch (e) {
        console.error('직무 수행 능력 평가 결과 조회 실패', e)
        this.resultScore = 0
      } finally {
        this.loading = false
      }
    },

    /* 저장 */
    async submit() {
      if (!this.departmentId) {
        alert('부서 정보가 없습니다.')
        return
      }

      await http.post('/api/v1/admin/kpi/job-performance', {
        userId: this.user.userId || this.user.id,
        departmentId: this.departmentId,
        understanding: this.scores.understanding,
        problemSolving: this.scores.problemSolving,
        communication: this.scores.communication,
        responsibility: this.scores.responsibility,
        growth: this.scores.growth,
      })

      this.$emit('saved')
      this.$emit('close')
    }
  }
}
</script>
<style scoped> 
    /* BACKDROP */ .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); 
    display: flex; align-items: center; justify-content: center; z-index: 2000; } 
    /* MODAL */ 
    .modal { width: 520px; max-width: 90vw; max-height: 75vh; overflow-y: auto; background: #fff; border-radius: 12px; padding: 20px 22px; } 
    /* HEADER */ 
    .modal-header { display: flex; justify-content: space-between; } 
    .modal-title { font-size: 18px; font-weight: 800; } 
    .user-sub { font-size: 13px; color: #64748b; } 
    .close-btn { background: transparent; border: none; font-size: 18px; cursor: pointer; } 
    /* SCORE */ 
    .score-item { margin-bottom: 14px } 
    .score-header { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 6px; } 
    .score-guide { display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; } 
    input[type="range"] { width: 100% } 
    input.low::-webkit-slider-thumb { background: #ef4444 } 
    input.mid::-webkit-slider-thumb { background: #f59e0b } 
    input.high::-webkit-slider-thumb { background: #10b981 } 
    /* RESULT VIEW */ 
    .result-view { text-align: center; padding: 24px 0; } 
    .result-score { font-size: 42px; font-weight: 800; color: #294594; } 
    .result-score span { font-size: 14px; color: #64748b; } 
    .result-level { margin-top: 8px; font-size: 18px; font-weight: 700; } 
    .result-level.good { color: #059669 } 
    .result-level.mid { color: #f59e0b } 
    .result-level.low { color: #dc2626 } 
    .result-hint { margin-top: 12px; font-size: 13px; color: #6b7280; } 
    /* ACTIONS */ 
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; } 
    .btn-primary { background: #294594; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; } 
    .btn-outline { background: transparent; border: 1px solid #d1d5db; padding: 8px 14px; border-radius: 8px; } 
    </style>