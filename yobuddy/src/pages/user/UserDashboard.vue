<template>
  <div>

    <notice-popup-card
      v-if="popupOpen"
      :notices="notifications"
      icon="/assets/notification-icon.png"
      @read="handleRead"
      @close="popupOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import NoticePopupCard from '@/components/popupcard/NoiticePopupCard.vue'

const auth = useAuthStore()
const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)
const popupOpen = ref(false)

onMounted(() => {
  if (auth.isAuthenticated) {
    notificationStore.connectSSE()
  }
})

onUnmounted(() => {
  notificationStore.disconnectSSE()
})

function handleRead(idx) {
  notificationStore.markAsRead(idx)
}
</script>
