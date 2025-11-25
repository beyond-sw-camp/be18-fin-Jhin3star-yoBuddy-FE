<template>
  <AdminAnnouncementComponent
    @submit="handleSubmit"
    @form-cancel="handleCancel"
  />
</template>

<script>
import AdminAnnouncementComponent from './AdminAnnouncementComponent.vue';
import announcementService from '@/services/announcementService';

export default {
  name: "AdminAnnouncementCreateView",
  components: { AdminAnnouncementComponent },

  methods: {
    async handleSubmit(form) {
      try {
        // 1) 공지 생성
        const created = await announcementService.createAnnouncement({
          title: form.title,
          type: form.type,
          content: form.content,
          attachments: form.attachments,
        });

        const id = created.announcementId;
        alert('공지사항 등록 완료');
        this.$router.push(`/content/announcement/${id}`);
      } catch (e) {
        console.error('등록 실패', e);
        alert('공지사항 등록에 실패했습니다.');
      }
    },

    handleCancel() {
      this.$router.push('/content/announcement');
    },
  },
};
</script>