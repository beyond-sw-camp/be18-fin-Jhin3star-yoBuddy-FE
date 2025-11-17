<!-- DepartmentManagementView.vue -->
<template>
  <div class="department-page">
    <div class="department-content">
      <!-- 검색 영역 -->
      <div class="search-area">
        <input
          class="search-input"
          type="text"
          placeholder="검색"
          v-model="store.searchName"
          @input="store.setSearchName(search)"
        />
      </div>

      <!-- 카드 2컬럼 영역 -->
      <div class="card-row">
        <!-- 조직도 패널 -->
        <section class="card org-card">
          <h2 class="card-title">조직도</h2>

          <ul class="org-tree">
            <li
              v-for="d in store.departments" :key="d.departmentId"
              class="org-tree-item"
              @click="selectDepartment(d)"
              :class="{
                'org-tree-item--active':
                  store.selectedDepartment &&
                  store.selectedDepartment.departmentId === d.departmentId
                }"
            >
              <div class="org-tree-line"></div>
              <span class="org-tree-label">{{ d.name }}</span>
            </li>
          </ul>
        </section>

        <!-- 구성원 패널 -->
        <section class="card member-card">
          <div class="card-header">
            <h2 class="card-title">
              {{ store.selectedDepartment
                ? store.selectedDepartment.name + ' 구성원'
                : '구성원' }}
            </h2>


          <!-- 역할 콤보박스 -->
            <div class="filter-row">
              <select
                v-model="store.roleFilter"
                class="header-select"
              >
                <option value="all">전체</option>
                <option value="ADMIN">관리자</option>
                <option value="MENTOR">멘토</option>
                <option value="USER">신입</option>
              </select>
            </div>
          </div>

          <div class="member-table">
            <div class="member-table-header">
              <span class="col-name">이름</span>
              <span class="col-email">이메일</span>
              <span
                v-if="store.roleFilter === 'all'"
                class="col-role"
              >
                역할
              </span>
            </div>

            <div v-if="filteredMembers.length" class="member-table-body">
              <div
                v-for="m in filteredMembers"
                :key="m.userId"
                class="member-row"
              >
                <span class="col-name">{{ m.name }}</span>
                <span class="col-email">{{ m.email }}</span>
                <span
                  v-if="store.roleFilter === 'all'"
                  class="col-role"
                >
                  {{ roleLabel(m.role) }}
                </span>
              </div>
            </div>

            <div v-else class="member-empty">
              구성원이 없습니다.
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useDepartmentStore } from '@/store/modules/department';

const store = useDepartmentStore()
const search = computed({
  get: () => store.searchName,
  set: (value) => store.setSearchName(value),
})

onMounted(() => {
  store.fetchDepartments() // 초기 전체 조회
})

const filteredMembers = computed(() => {
  const list = store.members || []

  if (store.roleFilter === 'all') {
    return list
  }

  return list.filter(m => m.role === store.roleFilter)
})

const roleLabel = (role) => {
  switch (role) {
    case 'ADMIN':
      return '관리자'
    case 'MENTOR':
      return '멘토'
    case 'USER':
      return '신입'
    default:
      return role
  }
}

const selectDepartment = (department) => {
  store.fetchDepartmentById(department.departmentId)
}
</script>

<style scoped>
.department-page {
  /* 헤더/사이드바 제외한 나머지 영역이 꽉 차도록 */
  height: 100%;
  background-color: #f4f7ff;
}

.department-content {
  padding: 24px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 50px;
}

/* 검색 영역 */
.search-area {
  width: 100%;
}

.search-input {
  width: 100%;
  max-width: 760px;
  height: 40px;
  padding: 0 14px;
  border-radius: 20px;
  border: 1px solid #e0e5f2;
  background-color: #ffffff;
  font-size: 14px;
  outline: none;
  box-shadow: 0 2px 4px rgba(15, 35, 95, 0.05);
}

.search-input::placeholder {
  color: #b9c3dd;
}

/* 카드 2컬럼 */
.card-row {
  display: flex;
  gap: 24px;
  align-items: stretch;
}

/* 공통 카드 스타일 */
.card {
  flex: 1;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(15, 35, 95, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 450px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #253053;
  margin: 0 0 18px;
}

/* 조직도 스타일 */
.org-tree {
  list-style: none;
  margin: 0;
  padding: 8px 0 0 8px;
}

.org-tree-item {
  position: relative;
  padding-left: 18px;
  margin-bottom: 8px;
  font-size: 16px;
  color: #4b5674;
}

.org-tree-item--active {
  background-color: #eef3ff;     /* 연한 파란 배경 */
  font-weight: 600; 
}

.org-tree-line {
  position: absolute;
  left: 0;
  top: 0;
  bottom: -6px;
  width: 10px;
  border-left: 1px solid #d6ddeb;
}

.org-tree-line::after {
  content: "";
  position: absolute;
  top: 10px;
  left: 0;
  width: 10px;
  border-top: 1px solid #d6ddeb;
}

.org-tree-item:last-child .org-tree-line {
  bottom: 10px;
}

.org-tree-label {
  position: relative;
}

/* 구성원 카드 상단 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-select-wrapper {
  position: relative;
}

.header-filter {
  display: flex;
  align-items: center;
}

.header-select {
  min-width: 80px;
  padding: 6px 24px 6px 10px;
  border-radius: 999px;
  border: 1px solid #d0d4e0;
  background-color: #f8f9ff;
  font-size: 14px;
  cursor: pointer;
  /* 기본 셀렉트 화살표 살리거나, 커스텀 하고 싶으면 여기에 background-image 등 추가 */
}

/* 간단한 화살표 */
.filter-select-wrapper::after {
  content: "▾";
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-52%);
  font-size: 10px;
  color: #7b86a8;
  pointer-events: none;
}

/* 테이블 */
.member-table {
  margin-top: 12px;
}

.member-table-header {
  display: flex;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  padding: 4px 0;
  border-bottom: 1px solid #ddd;
}

.member-table-body {
  margin-top: 4px;
}

.member-row {
  display: flex;
  font-size: 14px;
  padding: 6px 0;
  border-bottom: 1px solid #f3f3f3;
}

.member-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;   /* 원하는 높이로 조절 가능 */
  font-size: 15px;
  color: #888;
}

.col-name {
  flex: 1;
}

.col-email {
  flex: 2;
  color: #555;
}

.col-role {
  flex: 1;
  color: #333;
}

/* 반응형: 좁아지면 세로 배치 */
@media (max-width: 1024px) {
  .card-row {
    flex-direction: column;
  }
}
</style>