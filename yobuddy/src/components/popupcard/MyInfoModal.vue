<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>내 정보 수정</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="profile-preview">
        <img
          v-if="previewImage || currentProfileImage"
          :src="previewImage || currentProfileImage"
          alt="프로필"
        />

        <div v-else class="default-avatar">
          👤
        </div>

        <div class="profile-actions">
          <label class="btn-upload">
            이미지 변경
            <input type="file" @change="onFileSelect" accept="image/*" hidden />
          </label>

          <button 
            v-if="currentProfileImage && !previewImage"
            class="btn-delete"
            @click="deleteProfileImage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>삭제</span>
          </button>
        </div>
      </div>
      
      <form @submit.prevent="updateProfile">
        <div class="form-group">
          <label for="email">이메일</label>
          <input type="email" id="email" :value="userEmail" disabled />
        </div>
        <div class="form-group">
          <label for="phoneNumber">전화번호</label>
          <input
          type="text"
          id="phoneNumber"
          v-model="form.phoneNumber"
          @input="onPhoneInput"
          maxlength="13"
        />
        </div>
        

        <div class="form-group">
          <label for="currentPassword">현재 비밀번호</label>
          <input type="password" id="currentPassword" v-model="form.currentPassword" placeholder="변경 시에만 입력" />
        </div>

        <div class="form-group">
          <label for="newPassword">새 비밀번호</label>
          <input type="password" id="newPassword" v-model="form.newPassword" placeholder="변경 시에만 입력" />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" @click="$emit('close')">취소</button>
          <button type="submit" class="btn-save">저장</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { useAuthStore } from "@/store/authStore";
import userService from "@/services/user";
import http from "@/services/http"

export default {
  name: "MyInfoModal",
  emits: ["close"],
setup(props, { emit }) {
  const authStore = useAuthStore();
  const user = computed(() => authStore.user);

  const currentProfileImage = computed(() => {
  const url = user.value?.profileImageUrl;

  // URL이 null/undefined/빈문자/문자 아니면 모두 안전하게 null 반환
  if (!url || typeof url !== "string") return null;

  // baseURL이 없으면 "" 처리해서 replace() 오류 방지
  const base = (http.defaults.baseURL || "").replace(/\/$/, "");

  // 절대 URL이면 그대로 반환
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // 상대 경로면 baseURL + 슬래시 자동 처리
  return `${base}${url.startsWith("/") ? url : "/" + url}`;
});

  const form = ref({
    phoneNumber: user.value ? user.value.phoneNumber : "",
    currentPassword: "",
    newPassword: "",
  });

  const profileImage = ref(null);
  const previewImage = ref(null);

  const userEmail = computed(() => user.value?.email || "");

  const onFileSelect = (e) => {
    const file = e.target.files[0];
    profileImage.value = file;

    if (file) {
      previewImage.value = URL.createObjectURL(file);
    }
  };

  const updateProfile = async () => {
    try {
      const formData = new FormData();

      const json = {
        phoneNumber: form.value.phoneNumber,
        currentPassword: form.value.currentPassword || null,
        newPassword: form.value.newPassword || null,
      };

      formData.append("data",
        new Blob([JSON.stringify(json)], { type: "application/json" })
      );

      if (profileImage.value) {
        formData.append("profileImage", profileImage.value);
      }

      await userService.updateMyInfo(formData);

      alert("정보가 성공적으로 수정되었습니다.");
      await authStore.fetchMe();
      emit("close");

    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("정보 수정에 실패했습니다.");
    }
  };

  const deleteProfileImage = async () => {
    try {
      await http.delete('/api/v1/account/me/profile-image');

      alert("프로필이 삭제되었습니다.");

      previewImage.value = null;

      await authStore.fetchMe();

    } catch (err) {
      console.error(err);
      alert("프로필 삭제에 실패했습니다.");
    }
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "");

    if (digits.length < 4) return digits;
    if (digits.length < 8) return digits.replace(/(\d{3})(\d+)/, "$1-$2");
    return digits.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3");
  };

  const onPhoneInput = (e) => {
    form.value.phoneNumber = formatPhone(e.target.value);
  };

  return {
    form,
    userEmail,
    currentProfileImage,
    previewImage,
    onFileSelect,
    updateProfile,
    deleteProfileImage,
    onPhoneInput,
  };
}

};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 14px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 12px 30px rgba(21,34,80,0.12);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #294594;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #213048;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(33,48,72,0.1);
  background:#fbfdff;
  box-sizing: border-box;
}

.form-group input[disabled] {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel, .btn-save {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #4b5563;
}

.btn-save {
  background-color: #294594;
  color: white;
}
.profile-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.profile-preview img {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  margin-bottom: 16px;
}

.profile-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-upload {
  background: #3b4aa0;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background-color 0.2s;
}
.btn-upload:hover {
  background: #294594;
}

.default-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #6b7280;
  margin-bottom: 16px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.btn-delete {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: #ef4444;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #ef4444;
  transition: all 0.2s;
}
.btn-delete:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: #dc2626;
  color: #dc2626;
}
</style>