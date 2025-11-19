<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>내 정보 수정</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <form @submit.prevent="updateProfile">
        <div class="form-group">
          <label for="email">이메일</label>
          <input type="email" id="email" :value="userEmail" disabled />
        </div>
        <div class="form-group">
          <label for="phoneNumber">전화번호</label>
          <input type="text" id="phoneNumber" v-model="form.phoneNumber" />
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
import { ref, computed } from 'vue'
import { useAuthStore } from '@/store/authStore'
import userService from '@/services/user'

export default {
  name: 'MyInfoModal',
  emits: ['close'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const user = authStore.user

    const form = ref({
      phoneNumber: user ? user.phoneNumber : '',
      currentPassword: '',
      newPassword: '',
    })

    const userEmail = computed(() => (user ? user.email : ''))

    const updateProfile = async () => {
      try {
        const payload = {
          phoneNumber: form.value.phoneNumber,
        }
        if (form.value.currentPassword && form.value.newPassword) {
            payload.currentPassword = form.value.currentPassword;
            payload.newPassword = form.value.newPassword;
        }

        await userService.updateMyInfo(payload)
        alert('정보가 성공적으로 수정되었습니다.')
        await authStore.fetchMe()
        emit('close');
      } catch (error) {
        console.error('Failed to update profile:', error)
        alert('정보 수정에 실패했습니다.')
      }
    }

    return {
      form,
      userEmail,
      updateProfile,
    }
  },
}
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
</style>
