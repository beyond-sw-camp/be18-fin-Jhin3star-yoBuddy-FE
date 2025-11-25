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

        <div class="form-row attach-file-row">
          <label class="field-label">첨부파일</label>
            <div class="attachments-header">
              <button
                type="button"
                class="file-button"
                @click="$refs.fileInput.click()"
              >
                파일 선택
              </button>

              <input
                ref="fileInput"
                type="file"
                class="file-hidden"
                multiple
                @change="onFileChange"
              />
            </div>

          <div class="file-box">
            <!-- 파일 선택 버튼 + 숨겨진 input -->

            <!-- (수정 모드일 때) 기존 첨부파일 리스트 -->
            <div
              v-if="isEdit && existingFiles && existingFiles.length"
              class="existing-file-section"
            >
              <div class="file-section-title"></div>
              <ul class="file-list">
                <li
                  v-for="file in existingFiles"
                  :key="file.fileId || file.id"
                  class="file-item"
                >
                  <span class="file-name">
                    {{ file.filename || file.originalName || file.originalFilename || ('파일 #' + (file.fileId || file.id)) }}
                  </span>

                  <!-- 삭제 체크박스 -->
                  <button
                    type="button"
                    class="file-remove-btn"
                    @click.stop="removeExistingFile(file, index)"
                  >
                    ✕
                  </button>
                </li>
              </ul>
            </div>

            <!-- 새로 선택된 파일 리스트 -->
            <div v-if="attachments && attachments.length" class="new-file-section">
              <div class="file-section-title"></div>
              <ul class="file-list">
                <li
                  v-for="(file, index) in attachments"
                  :key="file.name + '-' + index"
                  class="file-item"
                >
                  <span class="file-name">{{ file.name }}</span>
                  <button
                    type="button"
                    class="file-remove-btn"
                    @click.stop="removeAttachment(index)"
                  >
                    ✕
                  </button>
                </li>
              </ul>
            </div>

            <!-- 아무 파일도 없을 때 안내 문구 -->
            <div
              v-if="!(isEdit && existingFiles && existingFiles.length) && !attachments.length"
              class="file-empty-text"
            >
              첨부된 파일이 없습니다.
            </div>
          </div>
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
      attachments: [],
      existingFiles: init.files || [],
      removeFileIds: [],
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
        this.existingFiles = newVal.files || [];
        this.removeFileIds = [];
      },
    },
  },
  methods: {
    onCancel() {
      this.$emit('form-cancel');
    },

    onFileChange(event) {
      const files = Array.from(event.target.files || []);
      this.attachments.push(...files);
      event.target.value = '';
    },

    removeExistingFile(file, index) {
      const id = file.fileId || file.id;
      if (id) {
        // 중복 방지
        if (!this.removeFileIds.includes(id)) {
          this.removeFileIds.push(id);
        }
      }
      // 화면에서 제거 (UI 상으로만)
      this.existingFiles.splice(index, 1);
    },
    // ✅ X 버튼 클릭 시 해당 파일 제거
    removeAttachment(index) {
      this.attachments.splice(index, 1);
    },
    async onSubmit() {
      this.$emit('submit', {
        ...this.form,          // { type, title, content }
        attachments: this.attachments,  // File 객체 배열
        removeFileIds: this.removeFileIds,
        isEdit: this.isEdit,
        announcementId: this.initialData?.announcementId || null
      });
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
  color: #000000;
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

.form-row.attach-file-row {
  display: flex;
  flex-direction: row;       /* 라벨 + 버튼 한 라인 */
  align-items: bottom;       /* 수직 정렬 */
  justify-content: space-between;
  flex-wrap: wrap;           /* 다음 줄로 file-box 내려가게 */
}

/* 라벨은 왼쪽 */
.form-row.attach-file-row .field-label {
  margin-bottom: 0;
  margin-top: 16px;
}

/* 버튼은 오른쪽 */
.form-row.attach-file-row .attachments-header {
  margin-bottom: 0;
}

/* file-box는 다음 줄에서 전체 영역 차지 */
.form-row.attach-file-row .file-box {
  width: 100%;
  margin-top: 10px;
}

.file-box {
  border: 1px solid #d0d5e5;
  border-radius: 6px;
  padding: 12px;
  background-color: #fff;
}

.file-hidden {
  display: none; /* 진짜 input 숨김 */
}

.attachments-header {
  display: flex;
  justify-content: flex-end; /* 오른쪽 정렬 */
  margin-bottom: 8px;
}

/* 커스텀 버튼 */
.file-button {
  display: inline-block;
  background: #294594;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s;
}

.file-button:hover {
  background: #234fcf;
}

/* 파일 선택 영역 */
.file-list {
  margin-top: 8px;
  font-size: 14px;
  color: #444;
}


/* 파일 리스트 스타일 */
.file-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 파일 한 줄 스타일 */
.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-size: 14px;
  margin-bottom: 4px;
}

/* 파일 이름 */
.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px; /* 필요에 맞게 조정 */
}

/* X 버튼 스타일 */
.file-remove-btn {
  border: none;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.file-remove-btn:hover {
  font-weight: bold;
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