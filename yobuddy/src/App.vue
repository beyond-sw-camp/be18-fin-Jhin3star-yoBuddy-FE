<template>
  <div id="app" :class="['app-container', appClass]">
    <div class="blue-panel"></div>

    <HeaderBar
      v-if="!hideHeader"
      class="app-header"
      @toggle-menu="toggleSidebar"
    />

    <div class="main-wrapper">
      <SidebarMenu
        v-if="!hideSidebar"
        class="app-sidebar"
      />
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import SidebarMenu from './components/Sidebar.vue'
import HeaderBar from './components/Header.vue'
import { useRoute } from 'vue-router'

export default {
  name: 'App',
  components: { SidebarMenu, HeaderBar },
  setup() {
    const route = useRoute()
    const isSidebarOpen = ref(false)

    const hideHeader = computed(() => !!route.meta?.hideHeader)
    const hideSidebar = computed(() => !!route.meta?.hideSidebar)

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
    }

    const isLoginView = computed(() => route.path === '/login')

    const appClass = computed(() => ({
      'is-login-view': isLoginView.value,
      'is-main-view': !isLoginView.value
    }))

    return {
      toggleSidebar,
      isSidebarOpen,
      hideHeader,
      hideSidebar,
      appClass
    }
  }
}
</script>


<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
}

#app {
  /* Primary project font: Apple SD Gothic Neo (AppleSDGothicNeo)
     Fallbacks provided for non-macOS platforms */
  font-family: "Apple SD Gothic Neo", AppleSDGothicNeo, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-container {
  position: relative;            /* 파란 패널 위치 기준 */
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #f2f6fe;           /* 기본 배경 (KPI 페이지 배경 느낌) */
}

/* 움직이는 파란 패널 공통 스타일 */
.blue-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 0 !important;
  background: #294594;
  transition: width 1.4s cubic-bezier(.25,.8,.25,1),
              left 1.4s cubic-bezier(.25,.8,.25,1),
              right 1.4s cubic-bezier(.25,.8,.25,1),
              box-shadow 1.4s cubic-bezier(.25,.8,.25,1);
  pointer-events: none;
}

/* 로그인 화면: 오른쪽에서 둥근 캡슐 모양으로 들어와 있는 상태 */
.app-container.is-login-view .blue-panel {
  width: 50vw;               /* 살짝 더 크게 */
  right: 0vw;               /* 화면 밖에서 조금 넘어와서 들어온 느낌 */
  left: auto;
  box-shadow: -40px 0 60px rgba(0, 0, 0, 0.25);
}

/* 메인 화면: 사이드바 영역으로 '쓱' 붙어서 정리되는 느낌 */
.app-container.is-main-view .blue-panel {
  width: 220px;              /* Sidebar.vue의 width 와 동일 */
  left: 0;
  right: auto;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
}

/* 파란 패널 위에 컨텐츠가 올라오도록 */
.app-header,
.main-wrapper {
  position: relative;
  z-index: 1;
}

/* 나머지는 기존 그대로 */
.main-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  /* 로그인 화면에서 파란 패널이 보이게 배경 제거 */
  background: transparent;
}

.app-container.is-main-view .app-header,
.app-container.is-main-view .main-wrapper {
  opacity: 0;
  transform: translateY(10px);
  filter: blur(3px);
  animation: main-enter 0.6s ease forwards 0.5s;
}

@keyframes main-enter {
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@media (max-width: 768px) {
  .main-wrapper {
    flex-direction: column;
  }

  .main-content {
    height: calc(100vh - 110px);
  }
}
</style>