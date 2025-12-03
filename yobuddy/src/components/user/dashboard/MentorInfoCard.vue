<template>
  <div class="content-card mentor-info-card">
    <div v-if="mentor" class="mentor-profile">
      <!-- 이미지 또는 이모지 fallback -->
      <div class="profile-image-wrapper">
        
        <template v-if="mentor.profileImageUrl">
          <img :src="mentor.profileImageUrl" class="profile-image" />
        </template>
        <template v-else>
          <div class="default-avatar">👤</div>
        </template>
      </div>
      
      <div class="mentor-details">
              나의 멘토
        <p class="mentor-name">
          {{ mentor.name }}
          <span class="mentor-department">({{ mentor.department }})</span>
        </p>
        <p class="mentor-contact">{{ mentor.email }}</p>
        <p class="mentor-contact">{{ mentor.phoneNumber }}</p>
      </div>
    </div>

    <div v-else class="loading-state">
      <p>멘토 정보를 불러오는 중입니다...</p>
    </div>
  </div>
</template>

<script>

export default {
  name: "MentorInfoCard",
  props: {
    mentor: {
      type: Object,
      default: null,
    },
  },
};
</script>

<style scoped>
.content-card {
  width: 1100px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(9,30,66,0.08);
  overflow: hidden;
}

.mentor-info-card {
  padding: 24px 28px;
}

.mentor-profile {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-image {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #eef2f7;
}

.mentor-details {
  flex-grow: 1;
}

.mentor-name {
  font-size: 18px;
  font-weight: 700;
  color: #10243b;
  margin: 0 0 8px 0;
}

.mentor-department {
  font-weight: 500;
  color: #5a6e85;
}

.mentor-contact {
  font-size: 14px;
  color: #7d93ad;
  margin: 4px 0;
}

.btn-contact:hover {
  background-color: #e6efff;
}

.loading-state {
  text-align: center;
  padding: 40px 0;
  color: #7d93ad;
}

.profile-image-wrapper {
  width: 72px;
  height: 72px;
}

.default-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #eef2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}
</style>