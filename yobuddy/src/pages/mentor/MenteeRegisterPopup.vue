<template>
  <div v-if="show" class="popup-backdrop">
    <div class="popup">
      <div class="popup-header">
        <h3>멘티 신규 등록</h3>
      </div>

      <div class="popup-body">

        <div v-if="loading" class="loading">불러오는 중...</div>

        <div v-if="!loading">
          <div v-if="candidates.length === 0" class="empty">
            등록 가능한 신입이 없습니다.
          </div>

          <div v-else class="candidate-list">
            <label 
              v-for="c in candidates"
              :key="c.userId"
              class="row"
            >
              <input 
                type="checkbox" 
                :value="c.userId" 
                v-model="selectedIds"
              />
              <div class="info">
                <div class="name">{{ c.name }}</div>
                <div class="email">{{ c.email }}</div>
                <div class="dept">{{ c.department }}</div>
              </div>
            </label>
          </div>
        </div>

      </div>

      <div class="popup-footer">
        <button class="btn-ghost" @click="$emit('close')">닫기</button>
        <button class="btn-primary" :disabled="selectedIds.length===0" @click="registerMentees">
          등록하기
        </button>
      </div>
    </div>
  </div>
</template>


<script>
import http from "@/services/http"

export default {
  props: {
    show: Boolean,
    mentorId: Number
  },

  data() {
    return {
      candidates: [],
      selectedIds: [],
      loading: false
    }
  },

  watch: {
    show(val) {
      if (val) {
        this.loadCandidates()
      }
    }
  },

  methods: {
    async loadCandidates() {
      this.loading = true
      try {
        const resp = await http.get(`/api/v1/mentors/${this.mentorId}/department-newbies`)
        this.candidates = resp.data
      } catch (e) {
        console.error("부서 신입 조회 실패", e)
      } finally {
        this.loading = false
      }
    },

    async registerMentees() {
      try {
        await http.post(`/api/v1/mentors/${this.mentorId}/mentees`, {
          menteeIds: this.selectedIds
        })

        this.$emit("registered")
        this.$emit("close")

      } catch (e) {
        console.error("멘티 등록 실패", e)
      }
    }
  }
}
</script>


<style scoped>
.popup-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup {
  width: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  overflow: hidden;
}

.popup-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}

.popup-body {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f2f2;
}

.info { display: flex; flex-direction: column; }
.name { font-weight: 700; color: #10243b; }
.email { color: #7d93ad; font-size: 13px; }
.dept { color: #294594; font-size: 13px; }

.popup-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #eee;
}

.btn-primary {
  background: #294594;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
}

.btn-ghost {
  background: #f8faff;
  border: 1px solid #e6eef8;
  padding: 8px 16px;
  border-radius: 8px;
}
</style>
