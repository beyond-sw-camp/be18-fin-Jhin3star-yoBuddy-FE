<template>
  <div
    class="chatbot-popup-card"
    :style="cardStyle"
  >
    <div
      class="chatbot-header"
      @mousedown.stop="startDrag"
    >
      <div class="chatbot-header-left">
        <img src="@/assets/logo_chatbot.svg" class="chatbot-avatar" alt="BuddyBot" />
        <div>
          <div class="chatbot-title">{{ title || 'BuddyBot' }}</div>
          <div class="chatbot-status">
            <span class="online-dot"></span>
            <span v-if="!loading">Online</span>
            <span v-else>답변 생성 중...</span>
          </div>
        </div>
      </div>
      <button class="chatbot-close" @click="$emit('close')">×</button>
    </div>

    <div class="chatbot-content">
      <div class="chatbot-section-title">
        회사 적응 꿀팁! ✨
        <br />
        <span class="chatbot-section-sub">가장 많이 찾는 질문 TOP 5</span>
      </div>

      <div class="chatbot-question-space" v-if="!hasStarted">
        <ul class="chatbot-question-list">
          <li v-for="(q, i) in questions" :key="i" @click="animateQuestion(q)">
            <img src="@/assets/logo_chatbot.svg" class="question-avatar" alt="Q" />
            <span class="question-text">{{ q }}</span>
          </li>
        </ul>
      </div>

      <transition name="fade">
        <div v-if="hasStarted" class="chatbot-chat-area" ref="chatArea">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            :class="['chatbot-bubble', msg.sender]"
          >
            <img
              v-if="msg.sender === 'bot'"
              src="@/assets/logo_chatbot.svg"
              class="bubble-avatar"
              alt="봇"
            />
            <span class="bubble-text">{{ msg.text }}</span>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="loading" class="chatbot-loading-text">
          <span class="loading-dots">
            <span></span><span></span><span></span>
          </span>
          <span>답변을 생성 중입니다...</span>
        </div>
      </transition>

      <div class="chatbot-input-row">
        <input
          class="chatbot-input"
          type="text"
          v-model="inputText"
          @keyup.enter="sendMessage"
          :disabled="loading"
          placeholder="메시지를 입력하세요."
        />
        <button
          class="chatbot-send-btn"
          @click="sendMessage"
          :disabled="loading || !(inputText && inputText.trim())"
          aria-label="send"
        >
          <span v-if="loading" class="loading-dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <svg v-else width="22" height="22" fill="none" viewBox="0 0 22 22">
            <path d="M3 19L19 11L3 3V8.5L14 11L3 13.5V19Z" fill="#fff" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { askChatbot } from '@/services/chatbotService'

export default {
  name: 'ChatbotPopupCard',
  props: {
    title: String
  },
  data() {
    return {
      inputText: '',
      loading: false,
      messages: [
        { sender: 'bot', text: '안녕하세요! 무엇을 도와드릴까요?' }
      ],
      questions: [
        '노트북을 처음 받으면 무엇을 설정해야 하나요?',
        '연차/반차 등 휴가를 쓰려면 어떻게 해야 하나요?',
        '무선 인터넷(Wi-Fi) 비밀번호는 어디서 확인하나요?',
        '점심시간은 몇 시부터 몇 시까지인가요?',
        '회사 복장 규정은 어떻게 되나요?'
      ],
      hasStarted: false,

      // 드래그용 상태: CSS top/right는 그대로 두고 translate만 바꿈
      dragOffset: { x: 0, y: 0 },
      isDragging: false,
      dragStartMouse: { x: 0, y: 0 },
      dragStartOffset: { x: 0, y: 0 }
    }
  },
  computed: {
    cardStyle() {
      return {
        transform: `translate(${this.dragOffset.x}px, ${this.dragOffset.y}px)`
      }
    }
  },
  mounted() {
    window.addEventListener('mousemove', this.onDragMove)
    window.addEventListener('mouseup', this.stopDrag)
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onDragMove)
    window.removeEventListener('mouseup', this.stopDrag)
  },
  methods: {
    async sendMessage() {
      const text = (this.inputText || '').trim()
      if (!text || this.loading) return

      this.messages.push({ sender: 'user', text })
      this.inputText = ''
      if (!this.hasStarted) this.hasStarted = true
      this.$nextTick(this.scrollToBottom)

      this.loading = true

      try {
        const res = await askChatbot(text)
        const answer = res?.data?.answer || '죄송합니다. 응답을 읽지 못했어요.'
        await this.typeBotMessage(answer)
      } catch (e) {
        console.error(e)
        this.messages.push({
          sender: 'bot',
          text: '죄송합니다. 서버와 통신 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.'
        })
        this.$nextTick(this.scrollToBottom)
      } finally {
        this.loading = false
      }
    },

    animateQuestion(q) {
      this.inputText = ''
      setTimeout(() => {
        this.inputText = q
        this.$nextTick(() => {
          this.sendMessage()
        })
      }, 120)
    },

    scrollToBottom() {
      const area = this.$refs.chatArea
      if (area) {
        area.scrollTop = area.scrollHeight
      }
    },
    
    typeBotMessage(text) {
      return new Promise((resolve) => {
        const index = this.messages.length
        this.messages.push({
          sender: 'bot',
          text: ''
        })
    
        let i = 0    
        const interval = setInterval(() => {      
          const msg = this.messages[index]      
          if (!msg) {        
            clearInterval(interval)        
            resolve()        
            return      
          }
    
          msg.text += text[i]
          this.$nextTick(this.scrollToBottom)
      
          i += 1 
          if (i >= text.length) {
            clearInterval(interval)
            resolve()
          }
        }, 40) 
      })
    },

    // === 드래그 관련 ===
    startDrag(e) {
      if (e.button !== 0) return // 왼쪽 버튼만
      this.isDragging = true
      this.dragStartMouse = { x: e.clientX, y: e.clientY }
      this.dragStartOffset = { ...this.dragOffset }
    },

    onDragMove(e) {
      if (!this.isDragging) return

      const dx = e.clientX - this.dragStartMouse.x
      const dy = e.clientY - this.dragStartMouse.y

      this.dragOffset = {
        x: this.dragStartOffset.x + dx,
        y: this.dragStartOffset.y + dy
      }
    },

    stopDrag() {
      this.isDragging = false
    }
  }
}
</script>

<style scoped>
.chatbot-popup-card {
  min-width: 320px;
  max-width: 420px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  color: #213048;
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(21, 34, 80, 0.12);
  position: absolute;   /* 🔹원래대로 */
  top: 110%;            /* 🔹원래대로 */
  right: 0;             /* 🔹원래대로 */
  z-index: 999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', 'Helvetica Neue', Arial;
}

/* 드래그 가능 표시 */
.chatbot-header {
  background: linear-gradient(90deg, #294594 0%, #2b57a0 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: move;
}

/* 이하 스타일은 기존 그대로 */
.chatbot-header-left { display:flex; align-items:center; gap:12px }
.chatbot-avatar{ width:40px; height:40px; border-radius:8px; box-shadow:0 4px 12px rgba(33,48,72,0.12) }
.chatbot-title{ font-size:1.02rem; font-weight:700 }
.chatbot-status{ font-size:0.86rem; color: #bfe6b8 }
.online-dot{ display:inline-block; width:8px; height:8px; background:#2ecc71; border-radius:50%; margin-right:6px }
.chatbot-close{ background:transparent; border:none; color:#fff; font-size:1.25rem; cursor:pointer }

.chatbot-content{ padding:14px; display:flex; flex-direction:column; gap:12px }
.chatbot-section-title{ font-weight:700; color:#213048 }
.chatbot-section-sub{ font-weight:500; color:#6b7280; font-size:0.95rem }

.chatbot-question-space{ margin-bottom:6px }
.chatbot-question-list{ display:flex; flex-direction:column; gap:8px; margin:0; padding:0; list-style:none }
.chatbot-question-list li{
  display:flex; align-items:center; gap:10px; background:#ffffff; border-radius:14px; padding:10px 14px; color:#294594; font-weight:600; box-shadow:0 6px 14px rgba(41,69,148,0.04); transition:transform .12s ease, box-shadow .12s ease; cursor:pointer; border:1px solid rgba(41,69,148,0.06);
}
.chatbot-question-list li:hover{ transform:translateY(-3px); box-shadow:0 10px 22px rgba(41,69,148,0.07) }
.question-avatar{ width:20px; height:20px; border-radius:6px; }
.question-text{ font-size:0.95rem }

.chatbot-chat-area{
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-bottom:6px;
  min-height:160px;
  max-height:300px;
  overflow-y:auto;
  background:transparent;
  padding:8px;
}
.chatbot-bubble{ display:flex; align-items:flex-end; gap:8px; width:100% }
.chatbot-bubble.bot{ justify-content:flex-start }
.chatbot-bubble.user{ justify-content:flex-end }

.bubble-avatar{ width:28px; height:28px; border-radius:8px }
.bubble-text{
  display:inline-block;
  padding:10px 14px;
  border-radius:16px;
  max-width:78%;
  box-shadow:0 6px 18px rgba(33,48,72,0.06);
  color:#213048;
  background:#fff;
  word-break:break-word;
  white-space:pre-wrap;
}

.chatbot-bubble.bot .bubble-text{ margin-left:6px }
.chatbot-bubble.user .bubble-text{
  background:#294594;
  color:#fff;
  margin-right:6px;
  position:relative;
}
.chatbot-bubble.user .bubble-text::after{
  content:'';
  position:absolute;
  right:10px;
  bottom:6px;
  width:10px;
  height:10px;
  background:#294594;
  transform:rotate(45deg);
  border-bottom-right-radius:2px;
}

.chatbot-input-row{ display:flex; gap:8px; align-items:center }
.chatbot-input{
  flex:1;
  padding:10px 14px;
  border-radius:12px;
  border:1px solid rgba(33,48,72,0.06);
  background:#fbfdff;
}
.chatbot-send-btn{
  background:#294594;
  border:none;
  color:#fff;
  padding:8px 10px;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
}
.chatbot-send-btn:disabled{ opacity:0.5; cursor:default }
.chatbot-send-btn:hover:not(:disabled){ filter:brightness(0.98) }

.chatbot-loading-text{
  display:flex;
  align-items:center;
  gap:6px;
  font-size:0.85rem;
  color:#6b7280;
  padding:0 4px 4px;
}

.loading-dots{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:3px;
}
.loading-dots span{
  width:4px;
  height:4px;
  border-radius:50%;
  background:#ffffff;
  animation: loading-bounce 0.9s infinite;
}
.chatbot-loading-text .loading-dots span{
  background:#6b7280; 
}
.loading-dots span:nth-child(2){ animation-delay:0.15s }
.loading-dots span:nth-child(3){ animation-delay:0.3s }

@keyframes loading-bounce{
  0%, 80%, 100%{
    transform:scale(0.4);
    opacity:0.4;
  }
  40%{
    transform:scale(1);
    opacity:1;
  }
}

.fade-enter-active, .fade-leave-active{ transition:opacity 220ms ease, transform 220ms ease }
.fade-enter-from, .fade-leave-to{ opacity:0; transform:translateY(8px) }
.fade-enter-to, .fade-leave-from{ opacity:1; transform:translateY(0) }
</style>
