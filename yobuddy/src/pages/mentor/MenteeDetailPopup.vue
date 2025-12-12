<template>
  <transition name="fade">
    <div v-if="show" class="detail-overlay" @click.self="close">
      <div class="detail-modal">

        <header class="modal-top">
          <div class="modal-title">멘티 정보</div>

          <button class="close-btn" type="button" @click="close" aria-label="닫기">
            ×
          </button>
        </header>

        <section class="center-area">
          <div class="avatar-large">
            <img v-if="fullProfileImageUrl" :src="fullProfileImageUrl" alt="Profile" class="profile-image-large"/>
            <span v-else class="avatar-fallback-large">{{ initials }}</span>
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
import http from '@/services/http';

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
    },
    fullProfileImageUrl() {
      const url = this.user?.profileImageUrl;
      if (!url || typeof url !== "string") return null;

      const base = (http.defaults.baseURL || "").replace(/\/$/, "");

      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }

      return `${base}${url.startsWith("/") ? url : "/" + url}`;
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

.close-btn {
  position: absolute;
  right: 0;
  top: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #334155;
}

.close-btn:hover {
  background: #f1f5f9;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
}

.avatar-large {
  text-align: center;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  margin: 0 auto;
  overflow: hidden;
  background: #eef4ff;
}

.profile-image-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback-large {
  display: inline-flex;
  width: 100%;
  height: 100%;
  font-size: 40px;
  align-items: center;
  justify-content: center;
  color: #294594;
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
  grid-template-columns: repeat(2, 1fr);
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

.btn-danger {
  background: #dc3545;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #b02a37;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
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
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #1e3a8a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(41, 69, 148, 0.3);
}
</style>
