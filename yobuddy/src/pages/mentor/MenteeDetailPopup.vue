<template>
  <transition name="fade">
    <div v-if="show" class="detail-overlay" @click.self="close">
      <div class="detail-modal">

        <header class="modal-top">
          <div class="modal-title">멘티 정보</div>
        </header>

        <section class="center-area">
          <div class="avatar-large">
            <span class="avatar-fallback-large">{{ initials }}</span>
          </div>
          <div class="center-name">{{ user?.name }}</div>
        </section>

        <section class="info-grid">
          <div class="info-item">
            <div class="label">이메일</div>
            <div class="val">{{ user?.email }}</div>
          </div>

          <div class="info-item">
            <div class="label">전화번호</div>
            <div class="val">{{ user?.phoneNumber }}</div>
          </div>

          <div class="info-item">
            <div class="label">부서</div>
            <div class="val">{{ user?.department }}</div>
          </div>

          <div class="info-item">
            <div class="label">입사일</div>
            <div class="val">{{ formattedJoinDate }}</div>
          </div>
        </section>

        <footer class="modal-actions">
          <button class="btn-primary" @click="goCreateSession">
            + 멘토링 세션 생성
          </button>

          <button class="btn-outline" @click="close">
            닫기
          </button>

          <button 
            v-if="allowUnassign"
            class="btn-danger"
            @click="unassign"
          >
            배정 해제
          </button>
        </footer>

      </div>
    </div>
  </transition>
</template>

<script>
import { useAuthStore } from "@/store/authStore";

export default {
  name: "MenteeDetailPopup",
  props: {
    show: Boolean,
    user: Object,
    allowUnassign: { type: Boolean, default: false }
  },
  emits: ["close", "unassign"],

  computed: {
    initials() {
      return this.user?.name?.substring(0, 1) ?? "?"
    },
    formattedJoinDate() {
      if (!this.user?.joinedAt) return "—"
      return this.user.joinedAt.slice(0, 10)
    }
  },

  methods: {
    goCreateSession() {
      const auth = useAuthStore()
      const mentorId = auth.user.userId
      const menteeId = this.user?.menteeId
      const menteeName = this.user.name

      this.$emit("close")

      this.$router.push({
        path: "/mentor/sessions/create",
        query: { mentorId, menteeId, menteeName }
      })
    },

    close() {
      this.$emit("close")
    },

    unassign() {
      this.$emit("unassign", this.user)
    }
  }
}
</script>


<style scoped>
/* 기존 스타일 대부분 그대로 활용 */
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 10, 18, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1400;
}

.detail-modal {
  width: 480px;
  background: white;
  padding: 22px;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.2);
}

.modal-top {
  text-align: center;
  position: relative;
  margin-bottom: 16px;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
}

.avatar-large {
  text-align: center;
}

.avatar-fallback-large {
  display: inline-flex;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #eef4ff;
  font-size: 40px;
  align-items: center;
  justify-content: center;
}

.center-name {
  margin-top: 10px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}

.info-grid {
  margin-top: 20px;
  display: grid;
  gap: 16px;
}

.label {
  font-size: 12px;
  color: #6b7280;
}

.val {
  font-size: 15px;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-outline {
  background: transparent;
  border: 1px solid #d0d7e2;
  padding: 8px 14px;
  border-radius: 8px;
}

.btn-danger {
  background: #dc3545;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
}

.btn-primary {
  background: #294594;
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}
</style>
