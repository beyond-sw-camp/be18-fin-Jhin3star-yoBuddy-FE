<template>
  <AdminAnnouncementComponent
    v-if="announcement"
    :isEdit="true"
    :initialData="announcement"
    @submit="handleUpdate"
    @form-cancel="handleCancel"
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
        this.loading = false;
      }
    },

    async handleUpdate(formPayload) {
      try {
        const id = this.$route.params.id;

        // formPayload 안에 뭐가 들어오는지에 따라 매핑
        // 예: { title, type, content, attachments, removeFileIds } 형태라고 가정
        const updateDto = {
          title: formPayload.title,
          type: formPayload.type,
          content: formPayload.content,
          // 컴포넌트에서 삭제 체크한 파일 ID 배열
          removeFileIds: formPayload.removeFileIds || [],
          // 새로 업로드한 파일들 (attachments 또는 files 로 올 수도 있으니 둘 다 방어적으로 처리)
          files: formPayload.attachments || formPayload.files || [],
        };

        await announcementService.updateAnnouncement(id, updateDto);

        alert("수정 완료!");
        this.$router.push(`/content/announcement/${id}`);
      } catch (e) {
        console.error("수정 실패", e);
        alert('공지사항 수정에 실패했습니다.');
      }
    },

    handleCancel() {
      this.$router.back();
    },
  },
};
</script>