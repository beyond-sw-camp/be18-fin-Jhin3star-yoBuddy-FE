<template>
  <div class="announcement-container">
    <!-- 카테고리 드롭다운 -->
    <div class="top-bar">
      <div class="category-dropdown" @click="toggleDropdown">
        <span class="label-text">{{ categoryLabel(selectedCategory) }}</span>
        <span :class="['arrow', { open: dropdownOpen }]"></span>
        
        <ul v-if="dropdownOpen" class="dropdown-menu">
          <li 
            v-for="(item, i) in categories" 
            :key="i"
            @click.stop="selectCategory(item)"
            class="dropdown-item"
          >
            <span class="item-text">{{ categoryLabel(item) }}</span>
          </li>
        </ul>
      </div>

      <!-- 검색창 -->
      <div class="search-box">
        <input 
          type="text" 
          placeholder="검색어를 입력해주세요"
          v-model="keyword"
        />
        <img :src="search" alt="search" class="search-icon" />
      </div>
    </div>

    <!-- 공지 리스트 -->
    <div class="announcement-list">
      <div 
        v-for="a in announcements" 
        :key="a.announcementId"
        class="announcement-item"
        @click="goDetail(a.announcementId)"
      >
        <div class="badge-area">
          <span class="badge">{{ categoryLabel(a.type) }}</span>
        </div>
        <div class="text-area">
          <p class="title">{{ a.title }}</p>
        </div>
        <p class="date">{{ a.createdAt?.slice(2, 10) }} {{ a.createdAt?.slice(11, 16) }}</p>
      </div>

      <div v-if="announcements.length === 0" class="empty">
        조회된 공지사항이 없습니다.
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination" v-if="totalPages > 1">
      <button @click="changePage(currentPage - 1)">&lt;</button>

      <button
        v-for="page in totalPages"
        :key="page"
        :class="{ active: currentPage === page }"
        @click="changePage(page)"
      >
        {{ page }}
      </button>

      <button @click="changePage(currentPage + 1)">&gt;</button>
    </div>
  </div>
</template>

<script>
import announcementService from '@/services/announcementService';
import search from '@/assets/search.svg';

export default {
  name: 'AnnouncementList',
  data() {
    return {
      dropdownOpen: false,
      selectedCategory: 'ALL',
      categories: ['ALL', 'TRAINING', 'EVENT', 'TASK', 'MENTORING', 'NORMAL'],

      keyword: '',         // 검색어
      announcements: [],   // 백엔드에서 받아온 목록

      // 페이지네이션 관련
      currentPage: 1,      // 화면에 보이는 페이지 번호 (1부터)
      pageSize: 10,
      totalPages: 0,

      search,
    };
  },

  watch: {
    keyword() {
      this.debounce(() => {
        this.currentPage = 1;
        this.fetchAnnouncements();
      }, 300);   // 300ms 동안 입력이 멈추면 자동 검색
    }
  },
  created() {
    this.fetchAnnouncements();
  },
  methods: {
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },
    selectCategory(item) {
      this.selectedCategory = item;
      this.dropdownOpen = false;

      this.currentPage = 1;
      this.fetchAnnouncements();
    },

    goDetail(id) {
      this.$router.push(`/content/announcement/${id}`);
    },

    categoryLabel(type) {
      switch (type) {
        case 'ALL':
          return '전체';
        case 'TRAINING':
          return '교육';
        case 'EVENT':
          return '이벤트';
        case 'TASK':
          return '과제';
        case 'MENTORING':
          return '멘토링';
        case 'NORMAL':
          return '공지';
        default:
          return type;
      }
    },

    debounce(fn, delay = 300) {
      clearTimeout(this._timer);
      this._timer = setTimeout(fn, delay);
    },

    async fetchAnnouncements() {
      try {
        const pageData = await announcementService.getAnnouncementLists({
          page: this.currentPage - 1, // 백엔드는 0부터 시작
          size: this.pageSize,
          title: this.keyword,
          type: this.selectedCategory !== 'ALL' ? this.selectedCategory : null
        });

        this.announcements = pageData.content || [];
        this.totalPages = pageData.totalPages || 0;
      } catch (e) {
        console.error('공지사항 목록 호출 중 에러', e);
      }
    },

    // 페이지 번호 클릭
    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.fetchAnnouncements();
    },

    // 검색창에서 엔터 눌렀을 때 검색
    onSearchEnter(e) {
      if (e.key === 'Enter') {
        this.currentPage = 1;
        this.fetchAnnouncements();
      }
    },
  },
};
</script>

<style scoped>
.announcement-container {
  padding: 30px 40px;
  background-color: #f3f6fb;
  min-height: calc(100vh - 80px);
}

/* 상단 영역 */
.top-bar {
  display: flex;
  align-items: center;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
  gap: 20px;
  margin-bottom: 25px;
}

/* 카테고리 드롭다운 */
.arrow {
  position: absolute;
  right: 12px;
  top: 40%;

  display: inline-block;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #000000; /* 화살표 색상 */
  margin-left: 6px;
  vertical-align: middle;
}

/* 드롭다운 열렸을 때 뒤집기 */
.arrow.open {
  transform: rotate(180deg);
}

.category-dropdown {
  position: relative;
  width: 130px;
  height: 40px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 16px;
  cursor: pointer;
}
.category-dropdown .label-text {
  position: absolute;

  /* 💡 여기만 조절하면 어디든 보낼 수 있음 */
  left: 40%;       /* ← 수평 위치 */
  top: 50%;        /* ← 수직 위치 */
  transform: translate(-50%, -50%);
}

.category-dropdown .arrow {
  float: right;
  width: 12px;
}

.dropdown-menu {
  position: absolute;
  top: 45px;
  left: 0;
  width: 130px;
  background: white;
  border: 1px solid #ddd;
  list-style: none;
  border-radius: 10px;
  padding: 5px 0;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  z-index: 9999;
}

.dropdown-menu li {
  padding: 10px 12px;
  cursor: pointer;
}

.dropdown-item {
  position: relative;      
  padding: 0;      
  height: 40px;            
  cursor: pointer;
}

.dropdown-item .item-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%); 
}

.dropdown-menu li:hover {
  background: #f3f6fb;
}

/* 검색창 */
.search-box {
  position: relative;
  flex: 1;
}

.search-box input {
  width: 950px;
  height: 42px;
  padding: 0 15px 0 38px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 11px;
  width: 18px;
  opacity: 0.5;
}

/* 공지 리스트 */
.announcement-list {
  background: white;
  height: 620px;
  width: 1100px;
  margin: 0 auto;
  overflow-x: hidden;
  border-radius: 10px;
  padding: 20px 25px;
  border: 1px solid #e3e6ed;

  position: relative;
}

.announcement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #f1f2f5;
  cursor: pointer;
}

.empty {
  position: absolute;        /* 부모(.announcement-list)를 기준으로 위치 */
  top: 50%;                  /* 세로 중앙 */
  left: 50%;                 /* 가로 중앙 */
  transform: translate(-50%, -50%); /* 정확한 중앙 보정 */

  font-size: 15px;
  color: #999;
  text-align: center;
  width: 100%;
  pointer-events: none;
}

.announcement-item:last-child {
  border-bottom: none;
}

.announcement-item:hover {
  background: #f7f9fc;
}

.text-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  display: inline-block;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 10px;
  background: #e8edf7;
  color: #294594;
  font-weight: 400;
  min-width: 50px;
  text-align: center;
}

.title {
  font-size: 15px;
  color: #000000;
}

.date {
  font-size: 13px;
  color: #000000;
  white-space: nowrap;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 25px;
}

.pagination button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: white;
  border: 1px solid #ddd;
  cursor: pointer;
  font-size: 14px;
}

.pagination button.active {
  background: #2a62f4;
  color: white;
  border: none;
}

.pagination span {
  padding: 0 5px;
  color: #888;
}
</style>