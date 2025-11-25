<template>
  <AdminAnnouncementComponent
    v-if="announcement"
    :isEdit="true"
    :initialData="announcement"
    @submit="handleUpdate"
    @cancel="handleCancel"
  />
</template>

<script>
import AdminAnnouncementComponent from './AdminAnnouncementComponent.vue';
import announcementService from '@/services/announcementService';

export default {
  name: "AdminAnnouncementEditView",
  components: { AdminAnnouncementComponent },

  data() {
    return {
      announcement: null,   // initialData로 넘길 값
      loading: true,
    };
  },

  async created() {
    await this.fetchAnnouncement();
  },

  methods: {
    async fetchAnnouncement() {
      try {
        const id = this.$route.params.id;
        const resp = await announcementService.getAnnouncementDetail(id);
        this.announcement = resp; // ← 컴포넌트 initialData로 전달됨
        this.loading = false;
      } catch (e) {
        console.error("공지사항 조회 실패", e);
      }
    },

    async handleUpdate(formData) {
      try {
        const id = this.$route.params.id;
        await announcementService.updateAnnouncement(id, formData);

        alert("수정 완료!");
        this.$router.push(`/content/announcement/${id}`);
      } catch (e) {
        console.error("수정 실패", e);
      }
    },

    handleCancel() {
      this.$router.back();
    },
  },
};
</script>