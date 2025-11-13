<template>
  <div class="notice-popup-card">
    <div class="notice-header">
      <div class="notice-header-left">
        <img v-if="icon" :src="icon" class="notice-avatar" alt="icon" />
        <div>
          <div class="notice-title">알림</div>
        </div>
      </div>
      <button class="notice-close" @click="$emit('close')">×</button>
    </div>
    <div class="notice-content">
      <div class="notice-section-title">전체 알림</div>
      <ul class="notice-list">
        <template v-for="(item, idx) in noticesToShow" :key="idx">
          <transition name="expand-card">
            <li
              :class="['notice-item', item.read ? 'read' : 'unread', selectedNotice.includes(idx) ? 'expanded' : '']"
              @click="toggleNotice(idx)"
            >
              <div class="notice-main-row">
                <span class="notice-message">{{ item.message }}</span>
                <span v-if="item.time" class="notice-time">{{ item.time }}</span>
              </div>
              <div v-if="selectedNotice.includes(idx)" class="notice-detail-row">
                <div class="detail-title">상세 알림</div>
                <div class="detail-message">{{ item.message }}</div>
                <div v-if="item.time" class="detail-time">{{ item.time }}</div>
                <button class="detail-close" @click.stop="toggleNotice(idx)">닫기</button>
              </div>
            </li>
          </transition>
        </template>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NoiticePopupCard',
  props: {
    notices: {
      type: Array,
      default: () => []
    },
    icon: String
  },
  data() {
    return {
      selectedNotice: []
    }
  },
  computed: {
    noticesToShow() {
      // props로 전달된 notices가 있으면 사용, 없으면 더미데이터 사용
      if (this.notices && this.notices.length > 0) {
        return this.notices;
      }
      return [
        { message: '새로운 공지사항이 있습니다.', time: '10:32', read: false },
        { message: '팀 미팅이 곧 시작됩니다.', time: '09:50', read: true },
        { message: '점심시간 안내', time: '08:30', read: false },
        { message: '사내 이벤트가 있습니다.', time: '어제', read: true },
        { message: '연차 신청이 승인되었습니다.', time: '2일 전', read: false },
        { message: '보안 업데이트 안내', time: '3일 전', read: true }
      ];
    }
  },
  methods: {
    toggleNotice(idx) {
      const i = this.selectedNotice.indexOf(idx);
      if (i === -1) {
        this.selectedNotice.push(idx);
        // 읽음 이벤트 emit
        this.$emit('read', idx);
      } else {
        this.selectedNotice.splice(i, 1);
      }
    }
  }
}
</script>

<style scoped>
/* 알림 리스트 스크롤 처리 */
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
.expand-card-enter-active, .expand-card-leave-active {
  transition: all 0.32s cubic-bezier(.4,0,.2,1);
}
.expand-card-enter-from, .expand-card-leave-to {
  max-height: 56px;
  background: #f5f7fa;
  box-shadow: none;
  border-radius: 8px;
}
.expand-card-enter-to, .expand-card-leave-from {
  max-height: 220px;
}
/* 알림 아이템 크기 및 스타일 조정 */
/* 알림 아이템 크기 및 확장 스타일 개선 */
/* 알림 아이템 슬림하게 */
.notice-item {
  flex-shrink: 0;
  position: relative;
  transition: all 0.32s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
  min-height: 28px;
  font-size: 0.97em;
  background: #fcfdff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 2px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0;
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
.notice-message {
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
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
.detail-close {
  background: #294594;
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 5px 14px;
  font-size: 0.97em;
  cursor: pointer;
  margin-top: 4px;
  align-self: flex-end;
  box-shadow: 0 2px 8px rgba(41,69,148,0.08);
}
.detail-close:hover {
  background: #3a5ad9;
}
/* fade 트랜지션 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.notice-popup-card {
  min-width: 300px;
  max-width: 340px;
  max-height: 500px;
  background: #fff;
  color: #23263a;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.22);
  position: absolute;
  top: 60px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 0.5%;
  margin-top: 2%;
}
.notice-header {
  background: #294594;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  max-height: 450px;
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
  padding: 10px 14px;
  color: #23263a;
  font-size: 1em;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  transition: background 0.15s;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.notice-message {
  color: inherit;
}
.notice-time {
  color: #888;
  font-size: 0.95em;
  margin-left: 12px;
}
</style>
