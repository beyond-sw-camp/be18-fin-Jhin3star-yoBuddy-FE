<template>
  <div id="app" class="app-container">
    <!-- Header Bar -->
    <HeaderBar v-if="!hideHeader" @toggle-menu="toggleSidebar" />
    <div class="main-wrapper">
      <!-- Sidebar -->
      <SidebarMenu v-if="!hideSidebar" />
      <!-- Main Content -->
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
  components: {
    SidebarMenu,
    HeaderBar
  },
  setup() {
    const isSidebarOpen = ref(false)
    const route = useRoute()

    const hideHeader = computed(() => !!(route.meta && route.meta.hideHeader))
    const hideSidebar = computed(() => !!(route.meta && route.meta.hideSidebar))

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
    }

    return {
      toggleSidebar,
      isSidebarOpen
      , hideHeader, hideSidebar
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.main-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f2f6fe;
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
