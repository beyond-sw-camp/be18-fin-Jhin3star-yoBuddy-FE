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
        <div class="training-stats">
          <span class="stat-item completed">완료: {{ mentee.completedTrainings }}</span>
          <span class="stat-item pending">예정: {{ mentee.pendingTrainings }}</span>
        </div>
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
  const url = this.mentee?.profileImageUrl;

  // 1) 값이 없으면 null 반환 → v-else fallback으로 이니셜 표시
  if (!url) return null;

  const base = http.defaults.baseURL?.replace(/\/$/, '') || '';

  // "/api/v1/files/80" 같은 형태일 때 prefix 붙임
  if (url.startsWith('/')) {
    return `${base}${url}`;
  }

  // 이미 절대 URL인 경우 그대로 반환
  return url;
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
  min-height: 140px; /* Height: ~140–150px */

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

.training-stats {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
}

.stat-item {
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.stat-item.completed {
  background-color: #d1fae5; /* Light green */
  color: #059669; /* Darker green */
}

.stat-item.pending {
  background-color: #fef3c7; /* Light yellow */
  color: #92400e; /* Darker yellow */
}
</style>
