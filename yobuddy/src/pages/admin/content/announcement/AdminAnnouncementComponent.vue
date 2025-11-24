<template>
  <div class="announcement-write-page">
    <div class="write-container">
      <!-- 상단 타이틀 + 카테고리 콤보박스 -->
      <header class="write-header">
        <h1 class="write-title">
          {{ isEdit ? '게시물 수정' : '게시물 작성' }}
        </h1>

        <div class="category-select-wrap">
            <label for="type" class="category-label"></label>

            <div class="category-dropdown" @click="toggleDropdown">
                <span class="label-text">{{ categoryLabel(form.type) }}</span>
                <span :class="['arrow', { open: dropdownOpen }]"></span>

                <ul v-if="dropdownOpen" class="dropdown-menu">
                <li
                    v-for="(item, i) in categories"
                    :key="i"
                    class="dropdown-item"
                    @click.stop="selectCategory(item)"
                >
                    <span class="item-text">{{ categoryLabel(item) }}</span>
                </li>
                </ul>
            </div>
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
    const init = this.initialData || {};

    return {
      form: {
        type: init.type || 'NORMAL',
        title: init.title || '',
        content: init.content || '',
      },
      dropdownOpen: false,
      categories: ['NORMAL', 'TRAINING', 'MENTORING', 'EVENT', 'TASK'],
    };
  },
  watch: {
    initialData: {
      immediate: true,
      handler(newVal) {
        if (!newVal) return;
        this.form.type = newVal.type || 'NORMAL';
        this.form.title = newVal.title || '';
        this.form.content = newVal.content || '';
      },
    },
  },
  methods: {
    onCancel() {
      // 부모 컴포넌트나 라우터에서 처리하도록 이벤트만 쏴줌
      this.$emit('cancel');
    },
    onSubmit() {
      this.$emit('submit', { ...this.form });
    },
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },
    selectCategory(item) {
      this.form.type = item;
      this.dropdownOpen = false;
    },
    categoryLabel(type) {
      switch (type) {
        case 'TRAINING':
          return '교육';
        case 'MENTORING':
          return '멘토링';
        case 'EVENT':
          return '이벤트';
        case 'TASK':
          return '과제';
        case 'NORMAL':
          return '공지';
        default:
          return type;
      }
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

.category-dropdown {
  position: relative;
  min-width: 120px;          
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #c8d2e9;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: flex-start;    
  gap: 6px;
  cursor: pointer;
  box-sizing: border-box;
}

.label-text {
  font-size: 14px;
  color: #000000;
  text-align: center;
  flex-grow: 1;
  transform: translateX(-10px);
}

/* 화살표 아이콘 */
.arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #000000;
}

.arrow.open {
  transform: rotate(180deg);
}

/* 드롭다운 리스트 */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);  /* 박스 바로 아래 */
  left: 0;
  right: 0;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
  padding: 4px 0;
  z-index: 20;
  max-height: 220px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 8px 12px;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.item-text {
  display: inline-block;
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
  height: 600px;
  width: 895px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #d0d5e5;
  font-size: 14px;
  resize: none;
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