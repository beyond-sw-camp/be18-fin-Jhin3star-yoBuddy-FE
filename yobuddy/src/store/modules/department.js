import { defineStore } from 'pinia'
import { getDepartments, getDepartmentById } from '@/services/departmentService'

export const useDepartmentStore = defineStore('department', {
  state: () => ({
    departments: [],
    searchName: '',
  }),

  actions: {
    async fetchDepartments() {
      const { data } = await getDepartments(this.searchName)
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
    },
})