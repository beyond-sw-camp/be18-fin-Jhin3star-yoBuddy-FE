<template>
  <div class="mentee-card" @click="$emit('select', mentee)">
    <div class="left">
      <div class="avatar">
        <img v-if="fullProfileImageUrl" :src="fullProfileImageUrl" alt="Profile" class="profile-image"/>
        <span v-else>{{ mentee.name ? mentee.name.substring(0,1) : '' }}</span>
      </div>

      <div class="info">
        <div class="name">{{ mentee.name }}</div>
        <div class="email">{{ mentee.email }}</div>
        <div class="dept">{{ mentee.department }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/services/http';

export default {
  props: { 
    mentee: Object 
  },
  computed: {
    fullProfileImageUrl() {
      if (this.mentee?.profileImageUrl) {
        const base = http.defaults.baseURL.replace(/\/$/, '');
        const path = this.mentee.profileImageUrl.replace(/^\//, '');
        return `${base}/${path}`;
      }
      return null;
    }
  }
}
</script>

<style scoped>
.mentee-card {
  display: flex;
  align-items: center;
  gap: 18px;

  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef2f7;
  padding: 18px 22px;

  transition: 0.15s ease;
  cursor: pointer;
}

.mentee-card:hover {
  background: #f8fbff;
  box-shadow: 0 4px 14px rgba(9,30,66,0.07);
}

.left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 52px;
  height: 52px;
  background: #294594;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  font-size: 16px;
  overflow: hidden; /* Ensures the image stays within the circle */
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 16px;
  font-weight: 700;
  color: #10243b;
}

.email {
  font-size: 13px;
  color: #7d93ad;
}

.dept {
  font-size: 14px;
  font-weight: 600;
  color: #6d859a;
  margin-top: 2px;
}
</style>