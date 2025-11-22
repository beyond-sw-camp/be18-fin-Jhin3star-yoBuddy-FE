<template>
  <div class="announcement-write-page">
    <div class="write-container">
      <!-- 상단 타이틀 + 카테고리 콤보박스 -->
      <header class="write-header">
        <h1 class="write-title">
          {{ isEdit ? '게시물 수정' : '게시물 작성' }}
        </h1>

        <div class="category-select-wrap">
          <label for="category" class="category-label">카테고리</label>
          <select
            id="type"
            v-model="form.type"
            class="category-select"
          >
            <option value="NORMAL">공지</option>
            <option value="TRAINING">교육</option>
            <option value="MENTORING">멘토링</option>
            <option value="EVENT">이벤트</option>
            <option value="TASK">과제</option>
          </select>
        </div>
      </header>

      <!-- 본문 카드 -->
      <section class="form-card">
        <div class="form-row">
          <label for="title" class="field-label">제목</label>
          <input
            id="title"
            type="text"
            v-model="form.title"
            class="input-text"
            placeholder="제목을 입력하세요"
          />
        </div>

        <div class="form-row">
          <label for="content" class="field-label">내용</label>
          <textarea
            id="content"
            v-model="form.content"
            class="textarea"
            placeholder="내용을 입력하세요"
          ></textarea>
        </div>

        <div class="button-row">
          <button type="button" class="btn-cancel" @click="onCancel">
            취소
          </button>
          <button type="button" class="btn-submit" @click="onSubmit">
            {{ isEdit ? '수정' : '등록' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminAnnouncementComponent',
  props: {
    // 수정 페이지에서도 재사용할 수 있게 해둠 (필요 없으면 지워도 됨)
    isEdit: {
      type: Boolean,
      default: false,
    },
    initialData: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      form: {
        type: this.initialData.type || 'NORMAL',
        title: this.initialData.title || '',
        content: this.initialData.content || '',
      },
    };
  },
  methods: {
    onCancel() {
      // 부모 컴포넌트나 라우터에서 처리하도록 이벤트만 쏴줌
      this.$emit('cancel');
    },
    onSubmit() {
      this.$emit('submit', { ...this.form });
    },
  },
};
</script>

<style scoped>
.announcement-write-page {
  min-height: 100vh;
  background: #f3f6fb; /* 연한 파란 배경 */
  display: flex;
  justify-content: center;
  padding: 40px 16px;
  box-sizing: border-box;
}

.write-container {
  width: 100%;
  max-width: 960px;
}

/* 상단 영역 */
.write-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.write-title {
  font-size: 24px;
  font-weight: 600;
  color: #2b2b2b;
  margin: 0;
}

.category-select-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-label {
  font-size: 14px;
  color: #555;
}

.category-select {
  min-width: 140px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid #c8d2e9;
  background: #ffffff;
  font-size: 14px;
  outline: none;
}

/* 카드 영역 */
.form-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px 32px 32px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.field-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.input-text {
  height: 44px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #d0d5e5;
  font-size: 14px;
  outline: none;
}

.input-text:focus,
.textarea:focus,
.category-select:focus {
  border-color: #294594;
  box-shadow: 0 0 0 2px rgba(41, 69, 148, 0.1);
}

.textarea {
  min-height: 260px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #d0d5e5;
  font-size: 14px;
  resize: vertical;
  outline: none;
}

/* 버튼 영역 */
.button-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

.btn-cancel {
  min-width: 90px;
  height: 40px;
  padding: 0 18px;
  border-radius: 8px;
  border: 1px solid #d0d5e5;
  background: #ffffff;
  color: #000000;
  font-size: 14px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f1f1f1;
}

.btn-submit {
  min-width: 90px;
  height: 40px;
  padding: 0 18px;
  border-radius: 8px;
  border: none;
  background: #294594;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
}

.btn-submit:hover {
  opacity: 0.9;
}
</style>