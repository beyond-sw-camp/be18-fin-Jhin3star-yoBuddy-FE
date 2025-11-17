import { defineStore } from 'pinia'
import { getDepartments, getDepartmentById, 
  createDepartment as apiCreateDepartment,
  updateDepartment as apiUpdateDepartment,
  deleteDepartment as apiDeleteDepartment } from '@/services/departmentService'

export const useDepartmentStore = defineStore('department', {
  state: () => ({
    departments: [],
    searchName: '',
  }),

  actions: {
    async fetchDepartments() {
      const { data } = await getDepartments(this.searchName || undefined)
      this.departments = data
    },

    setSearchName(name) {
      this.searchName = name
      this.fetchDepartments()
    },

    async fetchDepartmentById(departmentId) {
        const { data } = await getDepartmentById(departmentId)
        this.selectedDepartment = data
        this.members = data.users || []
        this.roleFilter = 'all'
        },

        setRoleFilter(role) {
        this.roleFilter = role
        },
    
    async createDepartment(departmentRequest) {
      await apiCreateDepartment(departmentRequest)
      // 생성 후 목록 새로고침
      await this.fetchDepartments()
    },
    
    async updateDepartment(departmentId, departmentRequest) {
      await apiUpdateDepartment(departmentId, departmentRequest)
      // 수정 후 목록/선택 부서 갱신
      await this.fetchDepartments()
      // 선택된 부서가 수정된 부서면 다시 상세 조회
      if (this.selectedDepartment && this.selectedDepartment.departmentId === departmentId) {
        await this.fetchDepartmentById(departmentId)
      }
    },

    // ✅ 부서 삭제(소프트/하드 어떤 방식이든)
    async deleteDepartment(departmentId) {
      await apiDeleteDepartment(departmentId)
      // 삭제 후 목록 새로고침
      await this.fetchDepartments()
      // 현재 선택된 부서를 삭제했다면 선택 해제
      if (this.selectedDepartment && this.selectedDepartment.departmentId === departmentId) {
        this.selectedDepartment = null
        this.members = []
      }
    },
  },
})