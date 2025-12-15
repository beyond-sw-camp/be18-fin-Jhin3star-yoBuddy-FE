<template>
  <header class="header-bar">
    <div class="header-left">
      <div class="logo-section">
          <div class="logo" @click="goHome" style="cursor:pointer;">
            <img
              src="@/assets/logo_main.svg"
              alt="YoBuddy Logo"
              class="logo-icon"
              width="126em"
              height="100em"
            />
          </div>
        </div>
      <div class="breadcrumb">
        <span class="chevron">
          <img src="@/assets/logo_anglebrackets.svg" alt=">" class="logo-icon" sizes="100%">
        </span>
        <template v-for="(item, idx) in breadcrumbItems" :key="idx">
          <span class="chevron" v-if="idx > 0">
            <img src="@/assets/logo_anglebrackets.svg" alt=">" class="logo-icon" sizes="100%">
          </span>

          <router-link
          :to="item.to"
          class="page-name"
          style="cursor:pointer; text-decoration:none; color:inherit;"
          >
          {{ item.label }}
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
            :notices="notificationStore.notifications"
            @close="showNotificationCard = false"
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
import { useRoute, useRouter } from 'vue-router'
import ChatbotPopupCard from '@/components/popupcard/ChatbotPopupCard.vue'
import NoiticePopupCard from '@/components/popupcard/NoiticePopupCard.vue'
import { useNotificationStore } from '@/store/notificationStore'
import { useAuthStore } from '@/store/authStore'

export default {
  name: 'HeaderBar',
  components: {
    NoiticePopupCard,
    ChatbotPopupCard
  },
  setup(props, { emit }) {
    const route = useRoute()
    const router = useRouter() 
    const notificationStore = useNotificationStore()
     const auth = useAuthStore()
    const showNotificationCard = ref(false)
    const showChatbotCard = ref(false)
    
    const notificationCount = computed(() => notificationStore.unreadCount)

    const pageTitleMap = {
      '/kpi': 'KPI',
      '/kpi/kpisetting': 'KPI 설정',
      '/organization': '조직 관리',
      '/onboarding': '온보딩',
      '/onboarding/programs': '온보딩 프로그램 관리',
      '/mentoring': '멘토링',
      '/education': '교육',
      '/dashboard': '대시보드',
      '/content': '콘텐츠',
      '/tasks': '과제',
      '/trainings': '교육',
      '/trainings/results': '교육 평가',
      '/trainings/create': '교육 생성',
      '/content/announcement': '공지사항',
      '/content/announcement/create': '공지사항 생성',
      '/content/wiki': '위키',
      '/organization/usermanagement': '유저 관리',
      '/organization/department': '부서 관리',
      '/sessions': '세션 목록',
      '/sessions/create': '세션 생성',
      '/onboarding/programs/new': '프로그램 생성'
    }

    const pageTitle = computed(() => pageTitleMap[route.path] || 'YoBuddy')

const breadcrumbItems = computed(() => {
  const roleSegments = ['admin', 'mentor', 'user']
  const renameMap = { edit: '수정', create: '생성', new: '생성' }

  const segments = route.path.split('/').filter(Boolean)

  const items = []
  let realPath = ''
  let labelPath = ''

  segments.forEach(seg => {
    realPath += '/' + seg

    // label용 path에서는 role prefix 제거
    if (!roleSegments.includes(seg)) {
      labelPath += '/' + seg
    }

    // role 자체는 breadcrumb에 표시 안 함
    if (roleSegments.includes(seg)) return

    // 숫자 ID
    if (/^\d+$/.test(seg)) {
      items.push({ label: '상세보기', to: realPath })
      return
    }

    // edit / create / new
    if (renameMap[seg]) {
      items.push({ label: renameMap[seg], to: realPath })
      return
    }

    // 한글 타이틀 매핑 (labelPath 기준!)
    if (pageTitleMap[labelPath]) {
      items.push({ label: pageTitleMap[labelPath], to: realPath })
      return
    }

    // fallback
    items.push({ label: seg, to: realPath })
  })

  return items
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

    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-wrapper')) {
        showNotificationCard.value = false
      }
    }

    onMounted(() => {
      notificationStore.fetchNotifications()
      notificationStore.connectSSE()
      window.addEventListener('click', handleClickOutside)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('click', handleClickOutside)
    })

    const goHome = () => {
    if (auth.isAdmin) {
      router.push('/kpi')
    } else if (auth.isMentor) {
      router.push('/mentor/dashboard')
    } else if (auth.isUser) {
      router.push('/user/dashboard')
    } else {
      router.push('/login')
    }
  }

    return {
      pageTitle,
      notificationCount,
      toggleMenu,
      toggleNotifications,
      breadcrumbItems,
      showNotificationCard,
      showChatbotCard,
      notificationStore,
      goHome
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
