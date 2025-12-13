<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="visible" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <header class="modal-header">
            <h2>프로그램 정보 수정</h2>
            <button @click="close" class="close-button">&times;</button>
          </header>
          <div class="modal-body">
            <form @submit.prevent="handleSave" class="edit-form">
              <div class="form-group">
                <label for="program-name">프로그램명</label>
                <input id="program-name" type="text" v-model="editableProgram.name" required />
              </div>
              <div class="form-group">
                <label for="program-description">설명</label>
                <textarea id="program-description" v-model="editableProgram.description"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="program-start-date">시작일</label>
                  <input id="program-start-date" type="date" v-model="editableProgram.startDate" />
                </div>
                <div class="form-group">
                  <label for="program-end-date">종료일</label>
                  <input id="program-end-date" type="date" v-model="editableProgram.endDate" />
                </div>
              </div>
              <div class="form-group">
                <label for="program-status">상태</label>
                <select id="program-status" v-model="editableProgram.status">
                  <option value="UPCOMING">예정</option>
                  <option value="ACTIVE">진행중</option>
                  <option value="COMPLETED">완료</option>
                </select>
              </div>
              <footer class="modal-footer">
                <button type="button" class="btn-outline" @click="close">취소</button>
                <button type="submit" class="btn-primary">저장</button>
              </footer>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
  name: 'OnboardingProgramEditModal',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    program: {
      type: Object,
      required: true,
    },
  },
  emits: ['close', 'save'],
  data() {
    return {
      editableProgram: null,
    };
  },
  watch: {
    program: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.editableProgram = JSON.parse(JSON.stringify(newVal));
        } else {
          this.editableProgram = null;
        }
      },
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },
    handleSave() {
      this.$emit('save', this.editableProgram);
    },
  },
};
</script>

<style scoped>
/* Using variables from theme.css for consistency */
:root {
  --color-bg: #f2f6fe;
  --color-surface: #ffffff;
  --color-border: #e2e6ee;
  --color-text: #213048;
  --color-text-muted: #5b6a83;
  --color-primary: #294594;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-lg: 0 12px 34px rgba(41,69,148, 0.14);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(10, 20, 40, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-surface, white);
  padding: 28px;
  border-radius: var(--radius-lg, 14px);
  width: 540px;
  max-width: 95%;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border, #eee);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border, #eee);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #213048);
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.8rem;
  line-height: 1;
  color: var(--color-text-muted, #5b6a83);
  cursor: pointer;
  transition: color 0.2s;
}
.close-button:hover {
  color: var(--color-text, #213048);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-muted, #5b6a83);
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 12px 14px;
  border: 1px solid var(--color-border, #ccc);
  border-radius: var(--radius-md, 10px);
  background-color: var(--color-bg, #f2f6fe);
  color: var(--color-text, #213048);
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary, #294594);
  box-shadow: 0 0 0 3px rgba(41, 69, 148, 0.15);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border, #eee);
}

.btn-primary, .btn-outline {
  padding: 12px 24px;
  border-radius: var(--radius-md, 10px);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--color-primary, #294594);
  color: white;
  border: none;
}
.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(41, 69, 148, 0.2);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-text-muted, #5b6a83);
  border: 1px solid var(--color-border, #ccc);
}
.btn-outline:hover {
  border-color: var(--color-text-muted, #5b6a83);
  background-color: var(--color-bg, #f2f6fe);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
