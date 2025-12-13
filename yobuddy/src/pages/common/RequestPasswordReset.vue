<template>
  <div class="request-password-reset-page">
    <router-link class="home-link" to="/login">← 로그인으로 돌아가기</router-link>

    <div class="reset-card">
      <h2 class="reset-title">비밀번호 찾기</h2>
      <p class="reset-description">
        가입 시 사용한 이메일 주소를 입력하시면, 비밀번호 재설정 링크를 보내드립니다.
      </p>

      <form v-if="!isSent" class="reset-form" @submit.prevent="onSubmit">
        <label class="field">
          <span class="label-text">이메일 주소</span>
          <input type="email" v-model.trim="email" required placeholder="example@company.com" />
        </label>

        <button class="btn-submit" type="submit" :disabled="loading">
          <span v-if="loading">전송 중...</span>
          <span v-else>재설정 링크 받기</span>
        </button>
        <p class="error-msg" v-if="errorMsg">{{ errorMsg }}</p>
      </form>

      <div v-if="isSent" class="success-message">
        <p>
          <strong>{{ email }}</strong> (으)로 비밀번호 재설정 링크를 성공적으로 보냈습니다.
        </p>
        <p>이메일을 확인해주세요.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import userService from '@/services/user'

const email = ref('')
const loading = ref(false)
const errorMsg = ref('')
const isSent = ref(false)

async function onSubmit() {
  loading.value = true
  errorMsg.value = ''
  try {
    await userService.requestPasswordReset(email.value)
    isSent.value = true
  } catch (e) {
    console.error(e)
    errorMsg.value = '오류가 발생했습니다. 이메일 주소를 확인하시거나 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.request-password-reset-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  padding: 24px;
}

.home-link {
  position: absolute;
  left: 22px;
  top: 22px;
  color: #5b6a83;
  text-decoration: none;
  font-weight: 700;
}

.reset-card {
  width: clamp(360px, 30vw, 480px);
  background: #fff;
  border-radius: 14px;
  padding: clamp(24px, 2.8vw, 48px);
  box-shadow: 0 18px 48px rgba(21, 34, 80, 0.1);
  text-align: center;
}

.reset-title {
  margin: 0 0 12px;
  color: #213048;
  font-weight: 800;
  font-size: clamp(1.15rem, 1.7vw, 1.5rem);
}

.reset-description {
  color: #5b6a83;
  margin-bottom: 24px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.label-text {
  font-size: 0.95rem;
  color: #5b6a83;
  font-weight: 700;
}

.field input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(33, 48, 72, 0.1);
  background: #fbfdff;
  font-size: clamp(0.95rem, 0.9vw, 1.05rem);
}

.btn-submit {
  margin-top: 10px;
  padding: 16px 20px;
  border-radius: 12px;
  border: none;
  color: #fff;
  background: #294594;
  font-weight: 800;
  cursor: pointer;
  font-size: clamp(1rem, 0.95vw, 1.1rem);
}

.error-msg {
  color: #b00020;
  font-weight: 700;
  margin-top: 8px;
}

.success-message {
  padding: 20px;
  background-color: #e8f5e9;
  color: #1e4620;
  border-radius: 10px;
  line-height: 1.6;
}
</style>
