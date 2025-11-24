<template>
  <AdminAnnouncementComponent
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>

<script>
import AdminAnnouncementComponent from './AdminAnnouncementComponent.vue';
import announcementService from '@/services/announcementService';


export default {
  name: "AdminAnnouncementCreateView",
  components: { AdminAnnouncementComponent },

  methods: {
    async handleSubmit(formData) {
      try {
        const created = await announcementService.createAnnouncement(formData);
        const id = created.announcementId;
        alert('등록 완료!');
        this.$router.push(`/content/announcement/${id}`);
      } catch (e) {
        console.error('등록 실패', e);
      }
    },

    handleCancel() {
      this.$router.back();
    },
  },
};
</script>