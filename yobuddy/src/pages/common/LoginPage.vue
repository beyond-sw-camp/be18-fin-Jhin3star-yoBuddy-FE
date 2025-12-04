<template>
  <div class="login-page">
    
    
    <router-link class="home-link" to="/">← Home</router-link>

    <div class="login-card">
      <div class="logo-wrap">
        <img src='@/assets/logo.svg' alt="logo"/>
      </div>

      <h2 class="login-title">로그인</h2>

      <form class="login-form" @submit.prevent="onSubmit">
        <label class="field">
          <span class="label-text">아이디 (이메일)</span>
          <input type="email" v-model.trim="email" required placeholder="example@company.com" />
        </label>

        <label class="field">
          <span class="label-text">비밀번호</span>
          <div class="password-field">
            <input :type="showPassword ? 'text' : 'password'" v-model="password" required placeholder="비밀번호를 입력하세요" />
            <img :src="showPassword ? '/eye-off.svg' : '/eye-off.svg'" @click="showPassword = !showPassword" class="eye-icon" alt="toggle password visibility" />
          </div>
        </label>

        <div class="form-row">
          <label class="remember">
            <input type="checkbox" v-model="remember" /> 기억하기
          </label>
          <a class="forgot" href="/">비밀번호 찾기</a>
        </div>

        <button class="btn-submit" type="submit" :disabled="loading" :class="{ pressed: loading }">
          <span v-if="loading">로그인 중...</span>
          <span v-else>로그인</span>
        </button>
        <p class="error-msg" v-if="errorMsg">{{ errorMsg }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/store/authStore'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const remember = ref(false)
const showPassword = ref(false)

const router = useRouter()
const auth = useAuthStore()

async function onSubmit() {
  loading.value = true
  errorMsg.value = ''

  try {
    await auth.login(email.value, password.value)

    if (auth.isMentor) router.push('/mentor/dashboard')
    else if (auth.isAdmin) router.push('/kpi')
    else if (auth.isUser) router.push('/user/dashboard')
    else router.push('/')

  } catch (e) {
    console.error(e)
    errorMsg.value = '로그인 실패'
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
:root{
  --bg-left: #ffffff;
  --bg-right: #294594;
  --card-bg: #fff;
  --accent-start: #294594;
  --accent-end: #2b57a0;
  --text-main: #213048;
}

.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
  backdrop-filter: none;
  padding: 24px;
}

.left { background: transparent; }
.right { background-color: #294594; }

.split-bg {
  position: absolute;
  inset: 0;
  display: flex;
  z-index: 0;
}
.split-bg .left {
  flex: 1;
  background: transparent;
}
.split-bg .right {
  flex: 1;
  background: #294594;
}

.home-link {
  position: absolute;
  left: 22px;
  bottom: 22px;
  color: var(--text-main);
  text-decoration: none;
  font-weight: 700;
}

/* Card sizing: responsive using clamp for wide monitors and high-DPI scaling */
.login-card {
  position: relative;
  width: clamp(360px, 28vw, 640px);
  max-width: calc(100% - 48px);
  background: #ffffff !important;
  border-radius: var(--radius-lg, 14px);
  padding: clamp(24px, 2.8vw, 48px);
  box-shadow: var(--shadow-lg, 0 18px 48px rgba(21,34,80,0.14));
  z-index: 999 !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.35s cubic-bezier(.4,0,.2,1),
              opacity 0.35s cubic-bezier(.4,0,.2,1),
              filter 0.35s cubic-bezier(.4,0,.2,1);
  isolation: isolate;
}

.login-card.leaving {
  transform: translateY(-8px) scale(0.97);
  opacity: 0;
  filter: blur(1.5px);
}

/* Logo */
.logo-wrap {
  width: clamp(70px, 6vw, 110px);
  height: clamp(70px, 6vw, 110px);
  border-radius: var(--radius-lg, 14px);
  display:flex;
  align-items:center;
  justify-content:center;
  margin-bottom: 18px;
  box-shadow: var(--shadow-md,0 8px 22px rgba(33,48,72,0.08));
  overflow: hidden;
  background:#fff;
}
.logo-wrap img {
  width: 66%;
  height:66%;
  object-fit:contain;
  filter: none;
}

/* Title */
.login-title {
  margin: 2px 0 22px;
  color: var(--text-main);
  font-weight: 800;
  font-size: clamp(1.15rem, 1.7vw, 1.55rem);
  letter-spacing:.02em;
}

/* Form */
.login-form {
  width: 100%;
  display:flex;
  flex-direction:column;
  gap:14px;
}
.field {
  display:flex;
  flex-direction:column;
  gap:8px;
}
.label-text {
  font-size: 0.95rem;
  color:#5b6a83;
  font-weight:700;
}
.field input {
  width:100%;
  padding:14px 16px;
  border-radius:10px;
  border:1px solid rgba(33,48,72,0.1);
  background:#fbfdff;
  font-size:clamp(.95rem, .9vw, 1.05rem);
}

/* Row / remember / forgot */
.form-row {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top:6px;
}
.remember {
  display:flex;
  align-items:center;
  gap:10px;
  color:#4360a8;
  font-weight:700;
}
.forgot {
  color:#4360a8;
  font-size:0.95rem;
  text-decoration:none;
}

/* Submit button */
.btn-submit {
  margin-top:10px;
  width:100%;
  padding:16px 20px;
  border-radius:12px;
  border:none;
  color:#fff;
  background: #294594;
  background-image: linear-gradient(90deg,#294594,#294594);
  font-weight:800;
  cursor:pointer;
  box-shadow: 0 14px 32px rgba(41,69,148,0.16);
  font-size:clamp(1rem, .95vw, 1.1rem);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-submit:active {
  transform: scale(0.97);
}

.btn-submit.pressed {
  transform: scale(0.97);
  box-shadow: 0 6px 18px rgba(41,69,148,0.25);
}

.btn-submit[disabled]{
  opacity:0.7;
  cursor:not-allowed;
}

.error-msg {
  color: #b00020;
  font-weight:700;
  margin-top:8px;
  text-align:center;
}

/* Large screens: position card overlapping the split */
@media (min-width:1400px){
  .home-link { left: 32px; bottom: 32px; }
}

@media (min-width:1800px){
  .login-title { font-size: 1.75rem; }
  .field input { font-size:1.08rem; }
  .btn-submit { padding:18px 22px; font-size:1.12rem; }
}

/* On smaller screens stack the split and center card */
@media(max-width:900px){
  .split-bg { display:none; }
  .login-page { background: linear-gradient(180deg,#fff,#f6f8fb); }
  .home-link { left: 12px; bottom: 12px; }
  .login-card { padding:18px; }
}

/* Focus styles */
.field input:focus {
  outline: 2px solid rgba(41,69,148,0.12);
  box-shadow: 0 4px 14px rgba(41,69,148,0.06);
}

/* Password field + eye icon */
.password-field {
  position: relative;
  display: flex;
  align-items: center;
}

.password-field input {
  flex: 1;
  padding-right: 40px; /* Space for the icon */
}

.eye-icon {
  position: absolute;
  right: 12px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.eye-icon:hover {
  opacity: 1;
}
</style>
