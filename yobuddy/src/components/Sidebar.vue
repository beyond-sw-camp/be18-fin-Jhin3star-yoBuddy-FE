<template>
  <aside class="sidebar">
    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li class="nav-item" v-for="item in menuItems" :key="item.id">
          <div 
            class="nav-link-wrapper" 
            @mouseenter="showSubmenu(item.id)" 
            @mouseleave="hideSubmenu"
          >
            <router-link
              :to="item.path"
              :class="['nav-link', { active: isActive(item.path) || isSubmenuActive(item) }]"
              :title="item.label"
            >
              <span
                v-if="item.icon"
                class="nav-icon icon-mask"
                :style="{ '--icon-url': `url(${item.icon})` }"
                role="img"
                :aria-label="item.label + ' icon'"
              ></span>
              <span v-else class="nav-icon">-</span>

              <span class="nav-label">{{ item.label }}</span>
              <span v-if="item.subItems" class="chev">›</span>
            </router-link>

            <!-- Submenu -->
            <div 
              v-if="item.subItems" 
              :class="['submenu', { visible: shouldShowSubmenu(item) }]"
            >
              <ul>
                <li v-for="sub in item.subItems" :key="sub.id">
                  <router-link :to="sub.path" class="sub-link">{{ sub.label }}</router-link>
                </li>
              </ul>
            </div>

          </div>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer">
      <!-- User Detail Card -->
      <transition name="user-detail-slide">
        <div v-if="showUserDetail" class="user-detail-card glass-card">
          
          <div class="user-detail-avatar glass-avatar">
            <span class="avatar-ring">
              <img v-if="avatarUrl" :src="avatarUrl" alt="user avatar" />
              <span v-else>👤</span>
            </span>
          </div>

          <div class="user-detail-info glass-info">
            <p class="glass-name">{{ userName }}</p>
            <p class="glass-role">{{ userRole }}</p>

            <div class="glass-divider"></div>

            <div class="user-details-list">
              <div class="detail-row">
                <span class="detail-label">이메일</span><br/>
                <span class="detail-value">{{ userEmail }}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">부서</span><br/>
                <span class="detail-value">{{ userDept }}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">입사일</span><br/>
                <span class="detail-value">{{ joinDate }}</span>
              </div>
            </div>
          </div>

          <button class="user-detail-btn glass-btn" @click.stop="editProfile">
            <span class="edit-label">프로필 수정</span>
          </button>

        </div>
      </transition>
      
      <div class="user-section" @click="toggleUserDetail" style="cursor:pointer;">
        <div class="user-avatar">
          <img v-if="avatarUrl" :src="avatarUrl" alt="" />
          <span v-else>👤</span>
        </div>

        <div class="user-info">
          <p class="user-name">{{ userName }}</p>
          <p class="user-role">{{ userRole }}</p>
        </div>

        <button class="logout-btn action-btn" @click.stop="logout()" title="로그아웃">
          <span class="action-icon">
            <img src="@/assets/logo_logout.svg" width="80%" height="80%">
          </span>
        </button>
      </div>
    </div>
    <my-info-modal v-if="showMyInfoModal" @close="showMyInfoModal = false" />
  </aside>
</template>

<script>
import { useAuthStore } from "@/store/authStore"
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MyInfoModal from './popupcard/MyInfoModal.vue'

import assignmentIcon from '@/assets/icon_assigment.svg'
import dashboardIcon from '@/assets/icon_dashboard.svg'
import contentIcon from '@/assets/logo_content.svg'
import eduIcon from '@/assets/logo_edu.svg'
import kpiIcon from '@/assets/logo_kpi.svg'
import mentoringIcon from '@/assets/logo_mentoring.svg'
import onboadingIcon from '@/assets/logo_onboading.svg'
import orgIcon from '@/assets/logo_org.svg'

export default {
  name: "SidebarMenu",
  components: {
    MyInfoModal
  },

  setup() {
    const route = useRoute()
    const router = useRouter()
    const auth = useAuthStore()

    const user = computed(() => auth.user)

    /* User Info */
    const userName = computed(() => user.value?.name || "")
    const userRole = computed(() => user.value?.role || "")
    const avatarUrl = computed(() => user.value?.profileImageUrl || null)
    const userEmail = computed(() => user.value?.email || "")
    const userDept = computed(() => user.value?.departmentName || "")
    const joinDate = computed(() =>
      user.value?.joinedAt ? user.value.joinedAt.split("T")[0] : ""
    )

    

    const menuItems = computed(() => {
      const role = user.value?.role

      if (role === "ADMIN") {
        return [
          {
            id: 1,
            icon: kpiIcon,
            label: "KPI",
            path: "/kpi",
            subItems: [
              { id: "1-1", label: "KPI 성과 지표", path: "/kpi" },
              { id: '1-2', label: 'KPI 설정', path: '/kpi/kpisetting' }
            ]
          },
          {
            id: 2,
            icon: orgIcon,
            label: "조직 관리",
            path: "/organization/usermanagement",
            subItems: [
              { id: "2-1", label: "유저 관리", path: "/organization/usermanagement" },
              { id: "2-2", label: "부서 관리", path: "/organization/department" }
            ]
          },
          {
            id: 3,
            icon: onboadingIcon,
            label: "온보딩 관리",
            path: "/admin/onboarding/programs",
          },
          {
            id: 4,
            icon: mentoringIcon,
            label: "멘토링 관리",
            path: "/admin/sessions",
          },
          { id: 5, 
            icon: assignmentIcon, 
            label: "과제", 
            path: "/admin/tasks" },
          { 
            id: 6, 
            icon: eduIcon, 
            label: "교육", 
            path: '/admin/trainings' },
          {
            id: 7,
            icon: contentIcon,
            label: "콘텐츠",
            path: "/content/announcement",
            subItems: [
              { id: "7-1", label: "공지사항", path: "/content/announcement" },
              { id: "7-2", label: "위키 ", path: "/content/wiki" }
            ]
          }
        ]
      }

      if (role === "MENTOR") {
        return [
          { id: 1, icon: dashboardIcon, label: "대시보드", path: "/mentor/dashboard" },
          { id: 2, icon: mentoringIcon, label: "멘토링", path: "/mentor/sessions" },
          { id: 3, icon: assignmentIcon, label: "과제", path: "/mentor/tasks" },
          { id: 4, icon: contentIcon, label: "콘텐츠", path: "/content/announcement", 
            subItems: [
              { id: "4-1", label: "공지사항", path: "/content/announcement" },
              { id: "4-2", label: "위키", path: "/content/wiki" }
            ]
          }
        ]
      }

      // regular user menu
      if (userRole.value === 'USER') {
        return [
          { id: 'u-1', icon: dashboardIcon, label: '대시보드', path: '/user/dashboard' },
          { id: 'u-2', icon: assignmentIcon, label: '과제', path: '/user/tasks' },
          { id: 'u-3', icon: eduIcon, label: '교육', path: '/user/trainings' },
          { id: 4, icon: contentIcon, label: "콘텐츠", path: "/content/announcement", 
            subItems: [
              { id: "4-1", label: "공지사항", path: "/content/announcement" },
              { id: "4-2", label: "위키", path: "/content/wiki" }
            ]
          }
        ]
      }

      return []
    })

    /* submenu behaviors */
    const activeSubmenu = ref(null)
    const showSubmenu = id => (activeSubmenu.value = id)
    const hideSubmenu = () => (activeSubmenu.value = null)
    const isActive = path => route.path === path
    const isSubmenuActive = item =>
      item.subItems?.some(sub => route.path.startsWith(sub.path))

    const shouldShowSubmenu = item =>
      activeSubmenu.value === item.id || isSubmenuActive(item)

    /* user detail panel */
    const showUserDetail = ref(false)
    const toggleUserDetail = () => (showUserDetail.value = !showUserDetail.value)

    const showMyInfoModal = ref(false);
    const editProfile = () => {
      showMyInfoModal.value = true;
    }

    /* logout */
    const logout = () => {
      auth.logout()
      router.push("/login")
    }

    return {
      user,
      userName, userRole, avatarUrl,
      userEmail, userDept, joinDate,

      menuItems,

      isActive,
      isSubmenuActive,
      shouldShowSubmenu,
      showSubmenu,
      hideSubmenu,

      showUserDetail,
      toggleUserDetail,
      logout,
      editProfile,
      showMyInfoModal
    }
  }
}
</script>

<style scoped>
.user-details-list {
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  margin-top: 0;
  margin-bottom: 0;
  /* compact padding to fit narrow sidebar */
  padding: 10px 12px;
  color: #fff;
  font-size: 0.98em;
  box-shadow: 0 4px 12px rgba(41,69,148,0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 10px;
  box-shadow: none;
}
.detail-label {
  color: #FFEA7E;
  font-weight: 500;
  margin-right: 16px;
  min-width: 56px;
  font-size: 1.08em;
}
.detail-value {
  color: #fff;
  font-weight: 400;
  word-break: break-all;
  font-size: 1.01em;
}
/* 내정보 카드 슬라이드 애니메이션 */
.user-detail-slide-enter-active, .user-detail-slide-leave-active {
  transition: max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.25s;
}
.user-detail-slide-enter-from, .user-detail-slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.user-detail-slide-enter-to, .user-detail-slide-leave-from {
  max-height: 320px;
  opacity: 1;
}

/* 내정보 카드 디자인 개선 */

/* Modern profile card styles */

/* Glassmorphism profile card styles */
.glass-card {
  /* make glass-card visually harmonize with dark sidebar */
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border-radius: 10px;
  margin: 0;
  padding: 12px 14px;
  color: #ffffff;
  font-size: 0.95em;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  border: 1px solid rgba(255,255,255,0.06);
  width: 100%;
  max-width: 220px;
  box-sizing: border-box;
}
.glass-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  position: relative;
  margin-bottom: 8px;
}
.avatar-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 20%, rgba(255,234,126,0.18), rgba(41,69,148,0.85));
  padding: 3px;
  box-shadow: 0 4px 14px rgba(41,69,148,0.18);
}
.avatar-ring img, .avatar-ring span {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #294594;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #FFEA7E;
}
.glass-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.glass-name {
  font-size: 17px;
  font-weight: 700;
  color: #FFEA7E;
  margin: 0;
  letter-spacing: 0.06em;
  text-shadow: none;
}
.glass-role {
  font-size: 12px;
  color: rgba(255,255,255,0.92);
  margin: 2px 0 0;
  letter-spacing: 0.04em;
}
.glass-divider {
  width: 70%;
  height: 2px;
  background: linear-gradient(90deg, rgba(255,234,126,0.95) 0%, rgba(41,69,148,0.9) 100%);
  border-radius: 2px;
  margin: 10px 0 8px 0;
  opacity: 0.85;
}
.glass-labels {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.glass-label {
  display: flex;
  align-items: center;
  font-size: 0.95em;
  color: rgba(255,255,255,0.95);
  font-weight: 400;
  background: rgba(255,255,255,0.02);
  border-radius: 6px;
  padding: 6px 10px;
  min-width: 0;
  box-shadow: none;
}
.label-value {
  color: #222;
  font-weight: 400;
  margin-left: 8px;
  letter-spacing: normal;
  word-break: break-all;
  white-space: normal;
  font-size: 1em;
  background: none;
  border-radius: 0;
  padding: 0;
  text-align: left;
  box-shadow: none;
  max-width: 100%;
}
.label-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
.label-title {
  font-weight: 700;
  font-size: 1.08em;
  color: #FFEA7E;
  margin-right: 6px;
  letter-spacing: 0.11em;
}
.label-value {
  color: #F6F7FA;
  font-weight: 600;
  margin-left: 10px;
  letter-spacing: 0.03em;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: anywhere;
  font-size: 0.98em;
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  padding: 6px 8px;
  text-align: left;
  box-shadow: none;
}
.glass-btn {
  margin-top: 14px;
  padding: 8px 18px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(90deg, #FFEA7E 60%, #294594 100%);
  color: #294594;
  font-size: 0.98em;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 12px rgba(41,69,148,0.14);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: 0.12em;
  border: 2px solid #FFEA7E;
  position: relative;
  z-index: 1;
}
.glass-btn:hover {
  background: linear-gradient(90deg, #294594 60%, #FFEA7E 100%);
  color: #FFEA7E;
  box-shadow: 0 8px 32px rgba(41,69,148,0.28);
}
.glass-btn .edit-label {
  letter-spacing: 0.18em;
  font-weight: 700;
}
.sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* Narrower sidebar to improve content space */
  width: 220px;
  height: 100%;
  background: #294594;
  color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.15);
  /* Allow submenus to overflow outside the sidebar so they aren't clipped */
  overflow: visible;
  position: relative;
}

.sidebar-nav {
  flex: 1 1 auto;
  padding: 12px 0;
  overflow-y: auto;
  padding-bottom: 100px;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  /* slightly tighter padding for compact sidebar */
  padding: 6px 10px;
  margin: 2px 8px 2px 0.1em;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  border-radius: 6px;
  font-weight: 500;
  margin-top: 0.6em;
  margin-left: 0.15em;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.15);
  color: #FFEA7E;
  font-weight: 600;
}

.nav-link.active .nav-icon {
  opacity: 1;
}


.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* smaller icons to match narrower sidebar */
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background: transparent center/contain no-repeat;
}

/* When using the icon-mask span, set the image as mask/background so we can recolor it */
.icon-mask {
  background-image: var(--icon-url);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  /* default: show white-tinted icon */
  filter: brightness(0) invert(1) opacity(0.9);
}

/* Active state: color the masked icon with the exact accent color */
.nav-link.active .icon-mask {
  /* set background-color to desired color and use mask to show shape */
  background-image: none;
  background-color: #FFEA7E;
  -webkit-mask-image: var(--icon-url);
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
  mask-image: var(--icon-url);
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  filter: none;
  opacity: 1;
  /* Make active icon visually brighter and more prominent */
  /* box-shadow: 0 0 8px rgba(251, 191, 36, 0.35); */
  transform: scale(1.05);
  border-radius: 4px;
}

/* Icon color treatment: for monochrome SVGs this filter makes the icon appear as the active accent color */
.nav-link .nav-icon {
  transition: filter 0.18s ease, opacity 0.18s ease;
  opacity: 0.95;
  filter: none;
}


.nav-label {
  font-size: 1em;
  font-weight: 500;
}

/* Submenu styles */
.nav-item {
  position: relative;
}

.nav-link-wrapper {
  position: relative;
}

.chev {
  margin-left: auto;
  opacity: 0.5;
  transition: transform 0.2s ease;
  font-size: 1.2em;
}

.nav-link-wrapper:hover .chev {
  opacity: 0.8;
}

.nav-link-wrapper .submenu.visible ~ .nav-link .chev {
  transform: rotate(90deg);
}

.submenu {
  overflow: hidden;
  max-height: 0;
  background: transparent;
  transition: max-height 0.25s ease;
  padding: 0;
  margin: 0 8px 4px 8px;
}

.submenu.visible {
  max-height: 500px;
}

.submenu ul {
  list-style: none;
  margin: 0;
  padding: 4px 0 4px 18px;
  position: relative;
}

.submenu ul::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.submenu .sub-link {
  display: block;
  /* tighter vertical spacing and slightly smaller text for compact submenu */
  padding: 4px 10px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 0.95em;
  transition: all 0.15s ease;
  border-radius: 4px;
  margin: 1px 0;
  position: relative;
  font-weight: 500;
}

.submenu .sub-link::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transition: all 0.15s ease;
}

.submenu .sub-link:hover {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.95);
  padding-left: 16px;
}

.submenu .sub-link:hover::before {
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-50%) scale(1.2);
}

.submenu .sub-link.router-link-active {
  background: rgba(255,255,255,0.12);
  color: #FFEA7E;
  font-weight: 600;
}

.submenu .sub-link.router-link-active::before {
  background: #FFEA7E;
  transform: translateY(-50%) scale(1.3);
}

.sidebar-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18px 18px 14px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  background: rgba(41,69,148,0.98);
  z-index: 6;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  min-height: unset;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  /* scaled down for compact sidebar */
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 50%;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  border: 2px solid rgba(255,255,255,0.12);
  overflow: hidden;
  margin-right: 8px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.03em;
}

.user-role {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255,255,255,0.85);
  opacity: 0.98;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.18s ease;
  flex-shrink: 0;
  margin-top: 0;
}

.settings-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.28);
}

.action-btn {
  background: #294594;
  color: #1e3a5f;
}

.action-icon {
  font-size: 18px;
  margin-top: 30%;
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* user-section 상세정보 아코디언 애니메이션 */
.user-detail-slide-enter-active, .user-detail-slide-leave-active {
  transition: max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.25s;
}
.user-detail-slide-enter-from, .user-detail-slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.user-detail-slide-enter-to, .user-detail-slide-leave-from {
  max-height: 320px;
  opacity: 1;
}
.user-detail-card {
  background: rgba(255,255,255,0.08);
  border-radius: 10px;
  margin-top: 0;
  margin-bottom: 0;
  padding: 24px 18px 18px 18px;
  color: #fff;
  font-size: 1.08em;
  box-shadow: 0 2px 8px rgba(41,69,148,0.10);
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.user-detail-label {
  font-size: 1.08em;
  margin: 0;
  color: #FFEA7E;
}
.user-detail-label span {
  color: #fff;
  font-weight: 400;
}
.user-detail-btn {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: #294594;
  color: #fff;
  font-size: 0.95em;
  cursor: pointer;
  transition: background 0.18s;
}
.user-detail-btn:hover {
  background: #3a5ad9;
}

@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }

  .nav-label,
  .user-name,
  .user-role {
    display: none;
  }

  .nav-link {
    justify-content: center;
    gap: 0;
    padding: 14px 12px;
  }
}
</style>