<template>
  <header class="header-bar">
    <div class="header-left">
      <!-- Logo -->
      <div class="logo-section">
        <div class="logo">
            <img src="@/assets/logo_main.svg" alt="YoBuddy Logo" class="logo-icon" width="126em" height="100em" />
        </div>
      </div>
      <div class="breadcrumb">
        <span class="chevron">
          <img src="@/assets/logo_anglebrackets.svg" alt=">" class="logo-icon" sizes="100%">
        </span>
        <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
          <span class="chevron" v-if="idx > 0">
            <img src="@/assets/logo_anglebrackets.svg" alt=">" class="logo-icon" sizes="100%">
          </span>
          <router-link
            :to="breadcrumbLinks[idx]"
            class="page-name"
            style="cursor:pointer; text-decoration:none; color:inherit;"
          >
            {{ crumb }}
          </router-link>
        </template>
      </div>
    </div>
    <div class="header-right">
      <div class="dropdown-wrapper">
        <button class="notification-btn" @click="toggleNotifications" title="알림" style="border-radius:50%; padding:0;">
          <span class="icon">
            <img src="@/assets/logo_notice.svg" alt="알림 아이콘" />
          </span>
          <span v-if="notificationCount > 0" class="badge">{{ notificationCount }}</span>
        </button>
        <NoiticePopupCard
          v-if="showNotificationCard"
          :notices="notices"
          @close="showNotificationCard = false"
          @read="markNoticeRead"
        />
      </div>
      <div class="dropdown-wrapper">
        <button class="menu-btn" @click="toggleMenu" title="쳇봇" style="border-radius:50%; padding:0;">
          <span class="icon">
            <img src="@/assets/logo_chatbot.svg" alt="쳇봇 아이콘" />
          </span>
        </button>
        <ChatbotPopupCard
          v-if="showChatbotCard"
          title="YoBuddy 챗봇"
          subtitle="무엇을 도와드릴까요?"
          icon="/default-profile.png"
          @close="showChatbotCard = false"
        >
          <template #default>
            <div style="margin-bottom:10px;">챗봇 기능은 여기에 구현됩니다.</div>
            <button style="background:#294594;color:#fff;border:none;border-radius:6px;padding:8px 18px;font-size:1em;cursor:pointer;">챗봇 시작</button>
          </template>
        </ChatbotPopupCard>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import ChatbotPopupCard from '@/components/popupcard/ChatbotPopupCard.vue'
import NoiticePopupCard from '@/components/popupcard/NoiticePopupCard.vue'

export default {
  name: 'HeaderBar',
  components: {
    NoiticePopupCard,
    ChatbotPopupCard
  },
  setup(props, { emit }) {
    // ...existing code...
    function markNoticeRead(idx) {
      if (notices.value[idx]) {
        notices.value[idx].read = true;
      }
    }
    const route = useRoute()
    const showNotificationCard = ref(false)
    const showChatbotCard = ref(false)
    const notices = ref([
      { message: '새로운 공지사항이 있습니다.', time: '10:32', read: false },
      { message: '팀 미팅이 곧 시작됩니다.', time: '09:50', read: true },
      { message: '점심시간 안내', time: '08:30', read: false },
      { message: '사내 이벤트가 있습니다.', time: '어제', read: true },
      { message: '연차 신청이 승인되었습니다.', time: '2일 전', read: false },
      { message: '보안 업데이트 안내', time: '3일 전', read: true }
    ])
    const notificationCount = computed(() => notices.value.filter(notice => !notice.read).length)

    const pageTitleMap = {
      '/': 'KPI',
      '/kpi': 'KPI',
      '/organization': '조직 관리',
      '/onboarding': '온보딩',
      '/mentoring': '멘토링',
      '/education': '교육',
      '/content': '콘텐츠'
    }

    const pageTitle = computed(() => {
      return pageTitleMap[route.path] || 'YoBuddy'
    })

    // breadcrumb depth 표현
    const breadcrumbs = computed(() => {
      // route.path 예시: /organization/submenu1/submenu2
      const segments = route.path.split('/').filter(Boolean)
      // 첫 depth는 항상 pageTitleMap에서 가져옴
      const crumbs = []
      if (segments.length === 0) {
        crumbs.push(pageTitleMap['/'])
      } else {
        // 첫 depth
        const first = '/' + segments[0]
        crumbs.push(pageTitleMap[first] || segments[0])
        // 그 이후 depth는 그대로 표시
        for (let i = 1; i < segments.length; i++) {
          crumbs.push(segments[i])
        }
      }
      return crumbs
    })

    const toggleMenu = () => {
      showChatbotCard.value = !showChatbotCard.value
      showNotificationCard.value = false
      emit('toggle-menu')
    }
    const toggleNotifications = () => {
      showNotificationCard.value = !showNotificationCard.value
      showChatbotCard.value = false
    }
    // 외부 클릭 시 카드 닫기
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-wrapper')) {
        showNotificationCard.value = false
        showChatbotCard.value = false
      }
    }
    onMounted(() => {
      window.addEventListener('click', handleClickOutside)
    })
    onBeforeUnmount(() => {
      window.removeEventListener('click', handleClickOutside)
    })

    // 각 breadcrumb depth별 링크 경로 생성
    const breadcrumbLinks = computed(() => {
      const segments = route.path.split('/').filter(Boolean)
      const links = []
      if (segments.length === 0) {
        links.push('/')
      } else {
        let path = ''
        for (let i = 0; i < segments.length; i++) {
          path += '/' + segments[i]
          links.push(path)
        }
      }
      return links
    })

    return {
  pageTitle,
  notificationCount,
  toggleMenu,
  toggleNotifications,
  breadcrumbs,
  breadcrumbLinks,
  showNotificationCard,
  showChatbotCard,
  notices,
  markNoticeRead
    }
  }
}
</script>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  /* use theme header height for consistent sizing */
  height: var(--header-height, 72px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  /* border-right: 1px solid #e0e0e0; */
  padding-right: 1.2em;
  margin-left: 2.1%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.logo:hover {
  transform: scale(1.02);
}

.logo-icon {
  display: inline-block;
  font-size: 20px;
  /* Move logo slightly to the left as requested */
  transform: translateX(-0.25em);
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #1e3a5f;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 1%;
}

.chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* enlarge only the chevron box for better visibility */
  width: 30px;
  height: 30px;
  color: #999;
  margin-right: -0.06em;
}

/* override logo-icon only when used as breadcrumb chevron image */
.chevron .logo-icon {
  width: 20px;
  height: 20px;
  display: block;
  object-fit: contain;
  transform: none;
}

.page-name {
  font-size: 16px;
  font-weight: 600;
  margin-top: 0;
  color: #333;
  white-space: nowrap;
  line-height: 1.1;
  display: inline-flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.notification-btn,
.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  /* make buttons size relative to header height so they fill the header vertically */
  width: calc(var(--header-height, 72px) - 18px);
  height: calc(var(--header-height, 72px) - 18px);
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  font-size: 14px;
  color: #333;
  margin-left: 12px;
}

.notification-btn:hover,
.menu-btn:hover {
  background: #f5f7fa;
  border-color: #d0d0d0;
}

.notification-btn .icon,
.menu-btn .icon {
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.notification-btn .icon img,
.menu-btn .icon img {
  width: 60%;
  height: 60%;
  object-fit: contain;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 25px;
  height: 25px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid white;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header-bar {
    padding: 8px 12px;
    height: 50px;
  }

  .logo-section {
    padding-right: 12px;
    gap: 8px;
  }

  .logo-icon {
    font-size: 20px;
  }

  .logo-text {
    font-size: 14px;
  }

  .page-name {
    font-size: 12px;
  }

  .notification-btn,
  .menu-btn {
    width: 32px;
    height: 32px;
  }
}

@media (max-width: 480px) {
  .header-bar {
    padding: 6px 8px;
  }

  .logo-section {
    padding-right: 8px;
    gap: 6px;
  }

  .breadcrumb {
    gap: 4px;
  }

  .chevron {
    font-size: 16px;
  }

  .page-name {
    display: none;
  }

  .header-right {
    gap: 8px;
  }
}
</style>
