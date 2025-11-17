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

        <div class="search-actions">
          <button
            class="btn btn-primary"
            @click="openCreateModal"
          >
            + 부서 등록
          </button>

          <button
            v-if="store.selectedDepartment"
            class="btn btn-secondary"
            @click="openEditModal"
          >
            수정
          </button>

          <button
            v-if="store.selectedDepartment"
            class="btn btn-danger"
            @click="handleDeleteDepartment"
          >
            삭제
          </button>
        </div>
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
                @click="openUserDetail(m)"
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
        <!-- 부서 생성/수정 모달 -->
        <div v-if="isModalOpen" class="modal-backdrop">
          <div class="modal">
            <div class="modal-header">
              <h3 class="modal-title">
                {{ modalMode === 'create' ? '부서 등록' : '부서 수정' }}
              </h3>
            </div>

            <div class="modal-body">
              <label class="modal-label">부서명</label>
              <input
                v-model="formName"
                type="text"
                class="modal-input"
                placeholder="부서 이름을 입력하세요"
              />
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeModal">
                취소
              </button>
              <button
                class="btn btn-primary"
                @click="handleSubmit"
                :disabled="!formName.trim()"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <UserDetailpopup
    :show="showUserDetail"
    :user="selectedUser"
    @close="showUserDetail = false"
  />
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useDepartmentStore } from '@/store/modules/department';
import UserDetailpopup from '@/pages/admin/organization/User/UserDetailpopup.vue';
import userService from '@/services/user';

const store = useDepartmentStore()
const search = computed({
  get: () => store.searchName,
  set: (value) => store.setSearchName(value),
})
const showUserDetail = ref(false)
const selectedUser = ref(null)

onMounted(() => {
  store.resetState()
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

const openUserDetail = async (member) => {
try {
    const data = await userService.getUserById(member.userId);
    const withLabel = {
      ...data,
      roleLabel: roleLabel(data.role)
    };
    selectedUser.value = withLabel;
    showUserDetail.value = true;
  } catch (e) {
    console.error('유저 상세 조회 실패', e);
  }
}

/* 🔹 모달 상태 */
const isModalOpen = ref(false)
const modalMode = ref('create') // 'create' | 'edit'
const formName = ref('')

// 🔹 모달 열기 - 등록
const openCreateModal = () => {
  modalMode.value = 'create'
  formName.value = ''
  isModalOpen.value = true
}

// 🔹 모달 열기 - 수정
const openEditModal = () => {
  if (!store.selectedDepartment) return
  modalMode.value = 'edit'
  formName.value = store.selectedDepartment.name || ''
  isModalOpen.value = true
}

// 🔹 모달 닫기
const closeModal = () => {
  isModalOpen.value = false
}

// 🔹 저장 버튼 클릭
const handleSubmit = async () => {
  const name = formName.value.trim()
  if (!name) return

  if (modalMode.value === 'create') {
    await store.createDepartment({ name })
  } else {
    // edit 모드
    if (!store.selectedDepartment) return
    await store.updateDepartment(store.selectedDepartment.departmentId, { name })
  }

  isModalOpen.value = false
}

// 🔹 삭제 버튼
const handleDeleteDepartment = async () => {
  if (!store.selectedDepartment) return
  const confirmed = window.confirm('선택된 부서를 삭제하시겠습니까?')
  if (!confirmed) return

  await store.deleteDepartment(store.selectedDepartment.departmentId)
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
  width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  flex: 1;
  width: 100%;
  max-width: 800px;
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

.search-actions {
  display: flex;
  gap: 20px;
}

.btn {
  padding: 9px 20px;
  border-radius: 10px;
  font-size: 14px;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}

/* 등록(파란색 버튼) */
.btn-primary {
  background-color: #294594;
  color: #fff;
}

/* 수정(연한 회색 버튼) */
.btn-secondary {
  background-color: #ffffff;
  color: #333;
  border-color: #d0d4e0;
}

/* 삭제(연한 빨강 버튼) */
.btn-danger {
  background-color: #ffecec;
  color: #d64545;
  border-color: #f0b4b4;
}

/* 카드 2컬럼 */
.card-row {
  width: 1100px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  align-items: stretch;
}

/* 공통 카드 스타일 */
.card {
  flex: 1;
  background-color: #ffffff;
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(15, 35, 95, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 450px;
}

.org-card {
  width: 538px;
  flex: none;
}

.member-card {
  flex: 1;     
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

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  width: 360px;
  max-width: 90%;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 35, 95, 0.25);
  padding: 20px 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #253053;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-label {
  font-size: 13px;
  color: #6b7280;
}

.modal-input {
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>