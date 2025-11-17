<template>
  <transition name="dialog-fade">
    <div v-if="show" class="confirm-overlay" @click.self="onCancel" role="dialog" aria-modal="true">
      <div class="confirm-modal" :class="{ 'confirm-danger': danger }">
        <header class="confirm-header">
          <h3 class="confirm-title">{{ title }}</h3>
          <button class="confirm-close" @click="onCancel" aria-label="close">×</button>
        </header>

        <div class="confirm-body">
          <slot name="icon"></slot>
          <p class="confirm-message">{{ message }}</p>
        </div>

        <footer class="confirm-actions">
          <button class="btn-outline" @click="onCancel">{{ cancelText }}</button>
          <button
            :class="['btn-primary', danger ? 'btn-danger' : '']"
            @click="onConfirm"
            :disabled="loading"
          >
            {{ confirmText }}
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    show: { type: Boolean, default: false },
    title: { type: String, default: '확인' },
    message: { type: String, default: '' },
    confirmText: { type: String, default: '확인' },
    cancelText: { type: String, default: '취소' },
    loading: { type: Boolean, default: false },
    danger: { type: Boolean, default: false }
  },
  emits: ['confirm', 'cancel'],
  methods: {
    onConfirm() { this.$emit('confirm') },
    onCancel() { this.$emit('cancel') }
  }
}
</script>

<style scoped>
/* Overlay and centering */
.confirm-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 10, 18, 0.48);
  z-index: 1300;
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
}

.confirm-modal {
  width: 440px;
  max-width: 94%;
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 14px 40px rgba(3, 10, 18, 0.12);
  display: flex;
  flex-direction: column;
  transform-origin: center;
}

.confirm-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px }
.confirm-title { font-weight:700; color:#10243b; margin:0; font-size:16px }
.confirm-close { background:transparent; border:none; font-size:20px; line-height:1; cursor:pointer; color:#8a98a8 }
.confirm-close:focus { outline:2px solid rgba(41,69,148,0.18); border-radius:6px }

.confirm-body { display:flex; align-items:flex-start; gap:12px; padding:8px 2px }
.confirm-body ::v-deep svg { width:40px; height:40px }
.confirm-message { color:#33475b; margin:0; font-size:14px; line-height:1.5 }

.confirm-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:14px }
.btn-outline { background:transparent; border:1px solid #294594; color:#294594; padding:8px 16px; border-radius:8px; cursor:pointer; min-width:84px }
.btn-outline:hover { background: rgba(41,69,148,0.06) }
.btn-primary { background:#294594; color:#fff; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; min-width:84px }
.btn-primary:disabled { opacity:0.6; cursor:not-allowed }
.btn-danger { background:#d64545; border-color:#d64545 }

/* Danger variant slightly adjusts overlay and header color */
.confirm-modal.confirm-danger .confirm-title { color:#7a1f1f }
.confirm-modal.confirm-danger .btn-primary { background:#d64545 }

/* Simple dialog appear animation */
.dialog-fade-enter-active,
.dialog-fade-leave-active { transition: all 180ms ease; }
.dialog-fade-enter-from { opacity:0; transform: scale(0.98); }
.dialog-fade-enter-to { opacity:1; transform: scale(1); }
.dialog-fade-leave-from { opacity:1; transform: scale(1); }
.dialog-fade-leave-to { opacity:0; transform: scale(0.98); }

@media (max-width: 480px) {
  .confirm-modal { width: 92%; padding: 14px }
  .confirm-title { font-size:15px }
  .confirm-message { font-size:13px }
  .btn-outline, .btn-primary { padding:8px 12px }
}
</style>
