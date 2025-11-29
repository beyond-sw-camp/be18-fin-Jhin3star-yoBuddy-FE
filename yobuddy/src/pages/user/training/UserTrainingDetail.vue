<template>
  <div>
    <TrainingDetailPopup
      v-if="training"
      :visible="true"
      :training="training"
      @close="$router.back()"
    />
  </div>
</template>

<script>
import TrainingDetailPopup from '@/components/user/training/TrainingDetailPopup.vue';
import userTrainingService from '@/services/userTrainingService';
import { useAuthStore } from '@/store/authStore';
export default {
  name:'UserTrainingDetailPage',
  components:{ TrainingDetailPopup },
  data(){ return { training:null } },
  async mounted(){
    const id = this.$route.params.id
    if (id) {
      const auth = useAuthStore()
      if (!auth.user) await auth.loadUser()
      const userId = auth.user && (auth.user.id || auth.user.userId || auth.user.user_id)
      if (!userId) { console.error('user id not available'); return }
      const res = await userTrainingService.detail(userId, id)
      this.training = res && res.data ? res.data : null
    }
  }
}
</script>
