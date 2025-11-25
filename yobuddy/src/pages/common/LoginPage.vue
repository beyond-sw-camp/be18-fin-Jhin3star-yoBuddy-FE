<template>
  <div class="login-page">
    <div class="split-bg">
      <div class="left"></div>
      <div class="right"></div>
    </div>

    <router-link class="home-link" to="/">← Home</router-link> 

    <div class="login-card">
      <div class="logo-wrap">
        <img src='@/assets/logo.svg' alt="logo"/>
      </div>

      <h2 class="login-title">로그인</h2>

      <form class="login-form" @submit.prevent="onSubmit">
        <label class="field">
          <span class="label-text">아이디 (이메일) </span>
          <input type="email" v-model.trim="email" required placeholder="example@company.com" />
        </label>

        <label class="field">
          <span class="label-text">비밀번호</span>
          <input :type="showPassword ? 'text' : 'password'" v-model="password" required placeholder="비밀번호를 입력하세요" />
        </label>

        <div class="form-row">
          <label class="remember">
            <input type="checkbox" v-model="remember" /> 기억하기
          </label>
          <a class="forgot" href="/">비밀번호 찾기</a>
        </div>

        <button class="btn-submit" type="submit" :disabled="loading">
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

const router = useRouter()
const auth = useAuthStore()

async function onSubmit() {
  try {
    loading.value = true
    errorMsg.value = ''

    await auth.login(email.value, password.value)

    if (auth.isMentor) router.push('/mentor/dashboard')
    else if (auth.isAdmin) router.push('/kpi')
    else if (auth.isUser) router.push('/user/trainings')
    else router.push('/')

  } catch {
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
  --accent-start: #2f55b8;
  --accent-end: #1f3fa6;
  --text-main: #213048;
}

/* Page layout */
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f5f9;
  padding: 24px;
}

.split-bg { position: absolute; inset: 0; display: flex; }
.split-bg .left { flex: 1; background: var(--bg-left); }
.split-bg .right { flex: 1; background: var(--bg-right); }

.home-link { position: absolute; left: 18px; bottom: 18px; color: var(--text-main); text-decoration: none; font-weight: 700 }

/* Card - centered, compact, pronounced shadow like screenshot */
.login-card {
  position: relative;
  width: 420px;
  max-width: calc(100% - 48px);
  background: var(--card-bg);
  border-radius: 14px;
  padding: 42px 36px 30px 36px;
  box-shadow: 0 28px 60px rgba(21,34,80,0.18), 0 6px 18px rgba(21,34,80,0.06);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform .18s ease;
}

/* Logo circle overlapping the top of the card */
.logo-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display:flex; align-items:center; justify-content:center;
  margin-top: -64px; margin-bottom: 8px; overflow: hidden;
  background: linear-gradient(180deg,var(--accent-start), var(--accent-end));
  box-shadow: 0 8px 20px rgba(31,63,166,0.24);
  border: 4px solid rgba(255,255,255,0.9);
}
.logo-wrap img { width: 54%; height:54%; object-fit:contain; filter: invert(1) brightness(1.1); color:#294594; }

.login-title { margin: 6px 0 10px; color: var(--text-main); font-weight: 800; font-size: 1.15rem; letter-spacing:.02em; text-align:center }

.login-form { width: 100%; display:flex; flex-direction:column; gap:12px }
.field { display:flex; flex-direction:column; gap:6px }
.label-text { font-size: 0.9rem; color:#60708a; font-weight:700 }
.field input { width:100%; padding:12px 14px; border-radius:10px; border:1px solid rgba(33,48,72,0.06); background:#fbfdff; font-size:1rem; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6) }

.form-row { display:flex; justify-content:space-between; align-items:center; margin-top:6px }
.remember { display:flex; align-items:center; gap:10px; color:#4360a8; font-weight:700 }
.forgot { color:#4360a8; font-size:0.95rem; text-decoration:none }

.btn-submit { margin-top:8px; width:100%; height:46px; border-radius:24px; border:none; color:#fff; background: #294594; background-image: linear-gradient(90deg,#294594,#294594); font-weight:800; cursor:pointer; box-shadow: 0 12px 30px rgba(31,63,166,0.18); font-size:1rem; }
.btn-submit:active{ transform:translateY(1px) }
.btn-submit[disabled]{ opacity:0.7; cursor:not-allowed; }

.error-msg { color: #b00020; font-weight:700; margin-top:8px; text-align:center }

/* Large screens: slightly lift the card */
@media (min-width:1400px){
  .login-card { transform: translateY(-6%); }
  .home-link { left: 32px; bottom: 32px }
}

@media(max-width:900px){
  .split-bg { display:none }
  .login-page { background: linear-gradient(180deg,#fff,#f6f8fb) }
  .home-link { left: 12px; bottom: 12px }
  .login-card { padding:24px }
  .logo-wrap { margin-top: -48px }
}

/* Focus styles */
.field input:focus { outline: none; box-shadow: 0 6px 20px rgba(41,69,148,0.08); border-color: rgba(47,85,184,0.9) }

</style>
<style scoped>
:root{
  --bg-left: #ffffff;
  --bg-right: #294594;
  --card-bg: #fff;
  --accent-start: #2f55b8;
  --accent-end: #1f3fa6;
  --text-main: #213048;
}

/* Page layout */
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f5f9;
  padding: 24px;
}

.split-bg { position: absolute; inset: 0; display: flex; }
.split-bg .left { flex: 1; background: var(--bg-left); }
.split-bg .right { flex: 1; background: var(--bg-right); }

.home-link { position: absolute; left: 18px; bottom: 18px; color: var(--text-main); text-decoration: none; font-weight: 700 }

/* Card - centered, compact, pronounced shadow like screenshot */
.login-card {
  position: relative;
  width: 420px;
  max-width: calc(100% - 48px);
  background: var(--card-bg);
  border-radius: 14px;
  padding: 42px 36px 30px 36px;
  box-shadow: 0 28px 60px rgba(21,34,80,0.18), 0 6px 18px rgba(21,34,80,0.06);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform .18s ease;
}

/* Logo circle overlapping the top of the card */
.logo-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display:flex; align-items:center; justify-content:center;
  margin-top: -64px; margin-bottom: 8px; overflow: hidden;
  background: linear-gradient(180deg,var(--accent-start), var(--accent-end));
  box-shadow: 0 8px 20px rgba(31,63,166,0.24);
  border: 4px solid rgba(255,255,255,0.9);
}
.logo-wrap img { width: 54%; height:54%; object-fit:contain; filter: none }
/* Ensure inline SVGs or icon fonts inside the login card use the main brand color */
.login-card .logo-wrap svg,
.login-card .logo-wrap .icon {
  fill: #294594;
  color: #294594;
}

.login-title { margin: 6px 0 10px; color: var(--text-main); font-weight: 800; font-size: 1.15rem; letter-spacing:.02em; text-align:center }

.login-form { width: 100%; display:flex; flex-direction:column; gap:12px }
.field { display:flex; flex-direction:column; gap:6px }
.label-text { font-size: 0.9rem; color:#60708a; font-weight:700 }
.field input { width:100%; padding:12px 14px; border-radius:10px; border:1px solid rgba(33,48,72,0.06); background:#fbfdff; font-size:1rem; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6) }

.form-row { display:flex; justify-content:space-between; align-items:center; margin-top:6px }
.remember { display:flex; align-items:center; gap:10px; color:#4360a8; font-weight:700 }
.forgot { color:#4360a8; font-size:0.95rem; text-decoration:none }

.btn-submit { margin-top:8px; width:100%; height:46px; border-radius:24px; border:none; color:#fff; background: #294594; background-image: linear-gradient(90deg,#294594,#294594); font-weight:800; cursor:pointer; box-shadow: 0 12px 30px rgba(31,63,166,0.18); font-size:1rem }
.btn-submit:active{ transform:translateY(1px) }
.btn-submit[disabled]{ opacity:0.7; cursor:not-allowed }

.error-msg { color: #b00020; font-weight:700; margin-top:8px; text-align:center }

/* Large screens: slightly lift the card */
@media (min-width:1400px){
  .login-card { transform: translateY(-6%); }
  .home-link { left: 32px; bottom: 32px }
}

@media(max-width:900px){
  .split-bg { display:none }
  .login-page { background: linear-gradient(180deg,#fff,#f6f8fb) }
  .home-link { left: 12px; bottom: 12px }
  .login-card { padding:24px }
  .logo-wrap { margin-top: -48px }
}

/* Focus styles */
.field input:focus { outline: none; box-shadow: 0 6px 20px rgba(41,69,148,0.08); border-color: rgba(47,85,184,0.9) }
:root{
  --bg-left: #ffffff;
  --bg-right: #294594;
  --card-bg: #fff;
  --accent-start: #294594;
  --accent-end: #2b57a0;
  --text-main: #213048;
}

/* Page layout */
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f5f9;
  padding: 24px;
}
.left { background: transparent; }
.right { background-color: #294594; }

.split-bg { position: absolute; inset: 0; display: flex; z-index: 0; }
.split-bg .left { flex: 1; background: transparent; }
.split-bg .right { flex: 1; background: #294594; }

.home-link { position: absolute; left: 22px; bottom: 22px; color: var(--text-main); text-decoration: none; font-weight: 700 }

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
  transition: transform .18s ease;
  isolation: isolate;
}

.logo-wrap {
  width: clamp(70px, 6vw, 110px);
  height: clamp(70px, 6vw, 110px);
  border-radius: var(--radius-lg, 14px);
  display:flex; align-items:center; justify-content:center; margin-bottom: 18px; box-shadow: var(--shadow-md,0 8px 22px rgba(33,48,72,0.08)); overflow: hidden;
  background:#fff;
}
.logo-wrap img { width: 66%; height:66%; object-fit:contain; filter: none }

.login-title { margin: 2px 0 22px; color: var(--text-main); font-weight: 800; font-size: clamp(1.15rem, 1.7vw, 1.55rem); letter-spacing:.02em }

.login-form { width: 100%; display:flex; flex-direction:column; gap:14px }
.field { display:flex; flex-direction:column; gap:8px }
.label-text { font-size: 0.95rem; color:#5b6a83; font-weight:700 }
.field input { width:100%; padding:14px 16px; border-radius:10px; border:1px solid rgba(33,48,72,0.1); background:#fbfdff; font-size:clamp(.95rem, .9vw, 1.05rem) }

.form-row { display:flex; justify-content:space-between; align-items:center; margin-top:6px }
.remember { display:flex; align-items:center; gap:10px; color:#4360a8; font-weight:700 }
.forgot { color:#4360a8; font-size:0.95rem; text-decoration:none }

.btn-submit { margin-top:10px; width:100%; padding:16px 20px; border-radius:12px; border:none; color:#fff; background: #294594; background-image: linear-gradient(90deg,#294594,#294594); font-weight:800; cursor:pointer; box-shadow: 0 14px 32px rgba(41,69,148,0.16); font-size:clamp(1rem, .95vw, 1.1rem) }
.btn-submit:active{ transform:translateY(1px) }

.btn-submit[disabled]{ opacity:0.7; cursor:not-allowed }
.error-msg { color: #b00020; font-weight:700; margin-top:8px; text-align:center }

/* Large screens: position card overlapping the split, larger spacing for 1920 @125% scale */
@media (min-width:1400px){
  .login-card { transform: translateY(-14%); }
  .home-link { left: 32px; bottom: 32px }
}

@media (min-width:1800px){
  .login-card { transform: translateY(-18%); }
  .login-title { font-size: 1.75rem }
  .field input { font-size:1.08rem; }
  .btn-submit { padding:18px 22px; font-size:1.12rem }
}

/* On smaller screens stack the split and center card */
@media(max-width:900px){
  .split-bg { display:none }
  .login-page { background: linear-gradient(180deg,#fff,#f6f8fb) }
  .home-link { left: 12px; bottom: 12px }
  .login-card { padding:18px }
}

/* Ensure good keyboard focus styles */
.field input:focus { outline: 2px solid rgba(41,69,148,0.12); box-shadow: 0 4px 14px rgba(41,69,148,0.06) }

</style>
