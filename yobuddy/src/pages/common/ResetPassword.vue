<template>
  <div class="reset-password-page">
    <div class="reset-card">
      <h2 class="reset-title">비밀번호 재설정</h2>

      <form v-if="!isDone" class="reset-form" @submit.prevent="onSubmit">
        <p v-if="!token" class="error-msg">
          유효하지 않은 접근입니다. 이메일로 받은 링크를 통해 접속해주세요.
        </p>
        <template v-else>
          <label class="field">
            <span class="label-text">새 비밀번호</span>
            <input type="password" v-model="password" required placeholder="새 비밀번호를 입력하세요" />
          </label>
          <label class="field">
            <span class="label-text">새 비밀번호 확인</span>
            <input type="password" v-model="passwordConfirm" required placeholder="비밀번호를 다시 입력하세요" />
          </label>

          <p v-if="passwordMismatch" class="error-msg">비밀번호가 일치하지 않습니다.</p>

          <button class="btn-submit" type="submit" :disabled="loading || passwordMismatch">
            <span v-if="loading">변경 중...</span>
            <span v-else>비밀번호 변경</span>
          </button>
          <p class="error-msg" v-if="errorMsg">{{ errorMsg }}</p>
        </template>
      </form>

      <div v-if="isDone" class="success-message">
        <p>비밀번호가 성공적으로 변경되었습니다.</p>
        <router-link to="/login" class="btn-login">로그인 페이지로 이동</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import userService from '@/services/user'

const route = useRoute()

const token = ref(null)
const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const errorMsg = ref('')
const isDone = ref(false)

const passwordMismatch = computed(() => {
  return password.value && passwordConfirm.value && password.value !== passwordConfirm.value
})

onMounted(() => {
  token.value = route.query.token
})

async function onSubmit() {
  if (passwordMismatch.value || !token.value) return

  loading.value = true
  errorMsg.value = ''
  try {
    await userService.resetPassword(token.value, password.value)
    isDone.value = true
  } catch (e) {
    console.error(e)
    errorMsg.value = '비밀번호 변경에 실패했습니다. 링크가 만료되었거나 올바르지 않을 수 있습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  padding: 24px;
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
  margin: 0 0 24px;
  color: #213048;
  font-weight: 800;
  font-size: clamp(1.15rem, 1.7vw, 1.5rem);
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

.btn-login {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 20px;
  background-color: #294594;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 700;
}
</style>
