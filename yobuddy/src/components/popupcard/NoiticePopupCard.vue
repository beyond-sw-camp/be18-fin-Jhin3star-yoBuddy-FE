<template>
  <div class="notice-popup-card">
    <div class="notice-header">
      <div class="notice-header-left">
        <img v-if="props.icon" :src="props.icon" class="notice-avatar" alt="icon" />
        <div>
          <div class="notice-title">알림</div>
        </div>
      </div>
      <button class="notice-close" @click="$emit('close')">×</button>
    </div>

    <div class="notice-content">
      <div class="notice-section-title">전체 알림</div>

      <ul class="notice-list">
        <template v-if="noticesToShow.length > 0">
          <transition-group name="notice-list-transition" tag="div">
            <li
              v-for="item in noticesToShow"
              :key="item.id"
              :class="[
                'notice-item',
                item.read ? 'read' : 'unread',
                selectedNotice.includes(item.id) ? 'expanded' : ''
              ]"
              @click="toggleNotice(item.id)"
            >
              <div class="notice-main-row">
                <span class="notice-message">{{ item.title }}</span>
                <span class="notice-time">{{ formatTime(item.createdAt) }}</span>
              </div>

              <div
                v-if="selectedNotice.includes(item.id)"
                class="notice-detail-row"
              >
                <div class="detail-title">{{ item.title }}</div>
                <div class="detail-message">{{ item.message }}</div>
                <div class="detail-time">{{ formatTime(item.createdAt) }}</div>
                <div class="detail-actions">
                  <button class="detail-delete" @click.stop="deleteNotification(item.id)">삭제</button>
                  <button class="detail-close" @click.stop="toggleNotice(item.id)">닫기</button>
                </div>
              </div>
            </li>
          </transition-group>
        </template>
        <template v-else>
          <li class="no-notices">새로운 알림이 없습니다.</li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNotificationStore } from '@/store/notificationStore'

// eslint-disable-next-line no-undef
const props = defineProps({ icon: String })

const notificationStore = useNotificationStore()
const selectedNotice = ref([])

const noticesToShow = computed(() => notificationStore.notifications)

const toggleNotice = (notificationId) => {
  const i = selectedNotice.value.indexOf(notificationId)
  if (i === -1) {
    selectedNotice.value.push(notificationId)
    const notification = notificationStore.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notificationStore.markNotificationAsRead(notificationId);
    }
  } else {
    selectedNotice.value.splice(i, 1)
  }
}

const deleteNotification = async (notificationId) => {
  await notificationStore.deleteNotification(notificationId);
  const i = selectedNotice.value.indexOf(notificationId);
  if (i !== -1) {
    selectedNotice.value.splice(i, 1);
  }
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.floor((now - date) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}초 전`;
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
/* 알림 리스트 스크롤 처리 */
.notice-list {
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  display: flex;
  flex-direction: column;
}
.notice-list::-webkit-scrollbar {
  width: 6px;
}
.notice-list::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 3px;
}
.notice-list::-webkit-scrollbar-track {
  background: transparent;
}
/* 상세 알림 카드 스타일 */
/* 확장 애니메이션 */
.notice-list-transition-enter-active,
.notice-list-transition-leave-active {
  transition: all 0.32s cubic-bezier(.4,0,.2,1);
}
.notice-list-transition-enter-from,
.notice-list-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.notice-list-transition-move {
  transition: transform 0.32s cubic-bezier(.4,0,.2,1);
}

.notice-item.expanded {
  background: #fff;
  box-shadow: 0 4px 16px rgba(41,69,148,0.13);
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  z-index: 2;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
}
/* 아이템 내부 패딩 및 높이 축소 */
/* 확장 카드 배경색 통일 */
/* 확장 카드 배경색 통일 및 슬림하게 */
.notice-detail-row {
  padding: 6px 9px 4px 9px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-top: 1px solid #e0e0e0;
  animation: fadeIn 0.18s;
  background: #f5f7fa;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}
.notice-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  width: 100%;
}
.notice-message {
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%; /* Adjusted to give more space for time */
}
.notice-time {
  color: #888;
  font-size: 0.93em;
  margin-left: 10px;
  white-space: nowrap;
}
/* 확장 카드 내부도 슬림하게 */
.notice-detail-row {
  padding: 6px 9px 4px 9px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-top: 1px solid #e0e0e0;
  animation: fadeIn 0.18s;
  background: #f5f7fa;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
/* 상세 카드 내부 텍스트 스타일 */
/* 상세 카드 내부 텍스트 및 버튼 크기 조정 */
.detail-title {
  font-size: 1em;
  font-weight: 600;
  color: #294594;
  margin-bottom: 2px;
}
.detail-message {
  font-size: 0.97em;
  color: #23263a;
  margin-bottom: 2px;
  line-height: 1.5;
}
.detail-time {
  font-size: 0.93em;
  color: #888;
  margin-bottom: 4px;
}
.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.detail-close, .detail-delete {
  background: #294594;
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 5px 14px;
  font-size: 0.97em;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(41,69,148,0.08);
}
.detail-close:hover, .detail-delete:hover {
  background: #3a5ad9;
}
.detail-delete {
  background: #dc3545; /* Red color for delete */
}
.detail-delete:hover {
  background: #c82333;
}

/* fade 트랜지션 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.notice-popup-card {
  min-width: 280px;
  max-width: 300px;
  max-height: 400px; /* Keep max-height for overall card size */
  background: #fff;
  color: #23263a;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.22);
  position: absolute;
  top: 60px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: visible; /* Allow content to overflow, scroll handled by .notice-list */
  margin-right: 0.5%;
  margin-top: 2%;
}
.notice-header {
  background: #294594;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  padding: 18px 22px 12px 22px;
}
.notice-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.notice-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.notice-title {
  font-size: 1.18em;
  font-weight: 700;
  margin-bottom: 2px;
}
.notice-status {
  font-size: 0.98em;
  color: #b0e6a5;
  display: flex;
  align-items: center;
  gap: 4px;
}
.online-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #2ecc71;
  border-radius: 50%;
  margin-right: 2px;
}
.notice-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 2em;
  cursor: pointer;
  margin-left: 8px;
  line-height: 1;
}
.notice-content {
  padding: 18px 22px 16px 22px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}
.notice-section-title {
  font-size: 1.08em;
  font-weight: 600;
  color: #294594;
  margin-bottom: 6px;
}
/* 알림 리스트 스크롤 처리 */
.notice-list {
  list-style: none;
  margin: 0 0 8px 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
}
/* 크롬 등 웹킷 브라우저용 스크롤바 스타일 */
.notice-list::-webkit-scrollbar {
  width: 6px;
}
.notice-list::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 3px;
}
.notice-list::-webkit-scrollbar-track {
  background: transparent;
}
.notice-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 0; /* Removed padding here, moved to notice-main-row */
  color: #23263a;
  font-size: 1em;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  transition: background 0.15s;
  display: flex;
  flex-direction: column; /* Changed to column for expanded view */
  justify-content: space-between;
  align-items: flex-start; /* Align items to start */
  min-height: 48px;
}
.notice-item.unread {
  background: #fcfdff;
  font-weight: 700;
  border-left: 4px solid #294594;
  font-style: bold;
}
.notice-item.read {
  background: #fafcff;
  font-weight: 700;
  border-left: 4px solid #ced8ff;
  color: #888;
}
.no-notices {
  text-align: center;
  color: #888;
  padding: 20px;
}
</style>
