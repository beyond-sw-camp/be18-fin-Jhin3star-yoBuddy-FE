<template>
  <div class="home-root" ref="root">
    <section class="home-hero">
      <div class="hero-inner">
        <h1 class="hero-title">Yo! Buddy</h1>
        <div class="hero-icon" aria-hidden>
          <img src="@/assets/logo.svg" alt="YoBuddy Logo" width="180em" height="140em" />
        </div>
        <h3 class="hero-main">새로운 여정을 환영합니다!</h3>
        <p class="hero-sub">멘토와 함께 연결하고, 배우고, 성장하세요. <br/>여러분의 온보딩 경험을 멋지게 만들어 봅시다!</p>
        <div class="hero-actions">
          <router-link v-if="!isAuth" to="/login" class="btn-primary">로그인</router-link>
        </div>
      </div>
      <div class="scroll-hint" aria-hidden="true">
        <div class="scroll-text">Scroll to explore</div>
        <div class="scroll-arrow">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 6v12M6 12l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </section>

    <section class="home-features" ref="features">
      <div class="features-inner">
        <h2 class="features-title">사람이 곧 우리의 성과</h2>
        <p class="features-desc">사람에 대한 투자가 성공을 위한 가장 강력한 기반을 만든다고 믿습니다. 모든 팀원은 우리의 공동의 성취에 기여합니다.</p>
        <div class="feature-cards">
          <div class="feature-card" data-anim>
            <div class="feature-icon">🔗</div>
            <h3>연결</h3>
            <p>멘토와 팀원들과 의미 있는 관계를 만드세요.</p>
          </div>
          <div class="feature-card" data-anim>
            <div class="feature-icon">🎓</div>
            <h3>배움</h3>
            <p>체계적인 온보딩과 가이드를 통해 역량을 키우세요.</p>
          </div>
          <div class="feature-card" data-anim>
            <div class="feature-icon">👑</div>
            <h3>성공</h3>
            <p>모든 단계에서 지원을 받아 목표를 달성하세요.</p>
          </div>
        </div>
      </div>
      <footer class="home-footer">© 2025 Yo! Buddy, all rights reserved.</footer>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useAuthStore } from '@/store/authStore'

export default {
  name: 'HomePage',
  setup() {
    const authStore = useAuthStore()
    const isAuth = computed(() => authStore.isAuthenticated)
    const root = ref(null)

    let _onWheel = null
    let _onTouchStart = null
    let _onTouchEnd = null
    let _featuresObserver = null
    let touchStartY = 0

    const sections = () => Array.from(root.value ? root.value.querySelectorAll('section') : document.querySelectorAll('section'))

    const scrollToIndex = (idx) => {
      const secs = sections()
      if (!secs || !secs[idx]) return
      secs[idx].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const scrollToNextPrev = (deltaY) => {
      const secs = sections()
      if (!secs.length) return
      const scrollTop = root.value ? root.value.scrollTop : window.scrollY
      let current = 0
      for (let i = 0; i < secs.length; i++) {
        const elTop = secs[i].offsetTop
        if (elTop <= scrollTop + 2) current = i
      }
      if (deltaY > 0 && current < secs.length - 1) scrollToIndex(current + 1)
      else if (deltaY < 0 && current > 0) scrollToIndex(current - 1)
    }

    onMounted(() => {
      // wheel: make small scrolls jump to next/prev section
      _onWheel = (e) => {
        const threshold = 6
        if (Math.abs(e.deltaY) < threshold) return
        e.preventDefault()
        scrollToNextPrev(e.deltaY)
      }
      if (root.value) root.value.addEventListener('wheel', _onWheel, { passive: false })

      // touch: detect swipe up/down
      _onTouchStart = (e) => { touchStartY = e.touches ? e.touches[0].clientY : e.clientY }
      _onTouchEnd = (e) => {
        const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : (e.clientY || 0)
        const diff = touchStartY - endY
        if (Math.abs(diff) < 30) return
        scrollToNextPrev(diff)
      }
      if (root.value) {
        root.value.addEventListener('touchstart', _onTouchStart, { passive: true })
        root.value.addEventListener('touchend', _onTouchEnd, { passive: true })
      }

      // click on scroll hint also scrolls
      const hint = root.value ? root.value.querySelector('.scroll-hint') : document.querySelector('.scroll-hint')
      if (hint) hint.addEventListener('click', () => scrollToNextPrev(1))

      // IntersectionObserver for animating cards inside features
      const cards = root.value ? Array.from(root.value.querySelectorAll('[data-anim]')) : Array.from(document.querySelectorAll('[data-anim]'))
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const el = entry.target
          if (entry.isIntersecting) el.classList.add('visible')
          else el.classList.remove('visible')
        })
      }, { threshold: 0.18 })
      cards.forEach(c => io.observe(c))
      _featuresObserver = io
    })

    onBeforeUnmount(() => {
      if (root.value && _onWheel) root.value.removeEventListener('wheel', _onWheel)
      if (root.value && _onTouchStart) root.value.removeEventListener('touchstart', _onTouchStart)
      if (root.value && _onTouchEnd) root.value.removeEventListener('touchend', _onTouchEnd)
      const hint = root.value ? root.value.querySelector('.scroll-hint') : document.querySelector('.scroll-hint')
      if (hint) hint.removeEventListener('click', () => scrollToNextPrev(1))
      if (_featuresObserver) _featuresObserver.disconnect()
    })

    return { isAuth, root }
  }
}
</script>

<style scoped>
.home-root {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}
.home-hero, .home-features {
  min-height: 100vh;
  scroll-snap-align: start;
}
.home-hero {
  min-height: calc(100vh - 0px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f6fb;
  /* subtle checker background */
  background-image: linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  position: relative;
}
.hero-inner {
  text-align: center;
  max-width: 860px;
  padding: 48px 28px;
}
.hero-title {
  font-size: 72px;
  margin: 0 0 18px 0;
  color: #294594;
  letter-spacing: -1px;
  text-shadow: 0 6px 20px rgba(41,69,148,0.12);
}
.hero-icon {
  margin: 8px auto 16px auto;
}
.hero-sub {
  color: #31405a;
  font-size: 18px;
  margin: 14px 0 20px 0;
}
.hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 8px;
}
.btn-primary {
  display: inline-block;
  background: #294594;
  color: #fff;
  padding: 12px 28px;
  border-radius: 28px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(41,69,148,0.12);
}
.btn-ghost {
  display: inline-block;
  background: rgba(41,69,148,0.06);
  color: #294594;
  padding: 12px 22px;
  border-radius: 22px;
  text-decoration: none;
  font-weight: 600;
  border: 1px solid rgba(41,69,148,0.08);
}

@media (max-width: 720px) {
  .hero-title { font-size: 40px; }
  .hero-inner { padding: 28px 16px; }
}

/* Scroll hint at bottom center */
.scroll-hint {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
  cursor: pointer;
}
.scroll-hint .scroll-text {
  color: #294594;
  font-size: 15px;
  letter-spacing: 0.02em;
}
.scroll-hint .scroll-arrow svg {
  width: 28px;
  height: 28px;
  stroke: #294594;
  stroke-width: 3;
  fill: none;
  animation: hint-bounce 1.6s infinite;
}
@keyframes hint-bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(8px); }
  60% { transform: translateY(4px); }
}

/* Features section */
.home-features {
  margin-top: 0;
  background: linear-gradient(180deg, rgba(243,246,251,1) 0%, rgba(246,249,253,1) 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 68px 0 0 0;
}
.features-inner { max-width: 1100px; margin: 0 auto; text-align: center; flex: 1 1 auto; display:flex; flex-direction:column; justify-content:center; margin-bottom: 8%;}
.features-title { color: #294594; font-weight:700; margin: 0 0 8px; }
.features-desc { color: #41506a; margin: 0 0 28px; }
.feature-cards { display:flex; gap:28px; justify-content:center; align-items:start; flex-wrap:wrap; }
.feature-card { background:#fff; width:280px; padding:26px; border-radius:12px; box-shadow: 0 12px 36px rgba(9,30,66,0.06); transform: translateY(18px); opacity:0; transition: all 520ms cubic-bezier(.2,.9,.2,1); }
.feature-card.visible { transform: translateY(0); opacity:1; }
.feature-icon { font-size:36px; margin-bottom:8px; }
.feature-card h3 { margin: 6px 0 10px; color:#294594 }
.feature-card p { color:#606b81; margin:0 }
.home-footer {
  background: #294594;
  color: #fff;
  padding: 18px 0;
  text-align: center;
  margin-top: 0;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}
</style>
