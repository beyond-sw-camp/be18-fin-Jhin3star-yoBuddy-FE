<template>
    <div class="page">

        <!-- Categories bar (cards) on top of a background block -->
        <section class="kpi-categories-block">
            <div class="kpi-categories-header">
                <h2 class="subtitle">KPI 카테고리 관리</h2>
                <button class="btn-add-category" @click="openCreateCategory">+ 카테고리 추가</button>
            </div>
            <div class="kpi-categories-wrap">
                <div class="kpi-categories">
                    <!-- dynamic categories from API -->
                    <template v-if="categories && categories.length">
                        <div v-for="cat in categories" :key="cat.id" class="category-card" @click="openCategory(cat)" role="button">
                            <div class="cat-title">{{ cat.name || cat.title || '카테고리' }}</div>
                            <div class="sub">{{ cat.description || cat.subtitle || '' }}</div>
                        </div>
                    </template>
                    <div v-else class="category-empty">카테고리가 없습니다.</div>
                </div>
            </div>
        </section>
    <section class="kpi-goals-block">
        <div class="kpi-goals-header">
            <h2 class="subtitle">KPI 목표 관리</h2>
            <button class="btn-add-goals" @click="openCreateGoal">+ 목표 추가</button>
        </div>
        <div class="kpi-goals-wrap">
            <div class="kpi-edit-content">
                <div class="cards-grid">
                <div class="content-card">
                    <div class="card-title">부서명</div>
                    <div class="card-body small-list">
                                    <ul>
                                        <li :class="{active: !selectedDepartmentId}" @click="selectDepartment(null)">전체</li>
                                        <li v-for="dept in departments" :key="dept.departmentId || dept.id || dept.name" :class="{ active: selectedDepartmentId === (dept.departmentId || dept.id || dept._id) }" @click="selectDepartment(dept)">
                                            {{ dept.name || dept.departmentName || dept.title }}
                                        </li>
                                    </ul>
                    </div>
                </div>

                <div class="content-card weight-card">
                    <div class="card-title">KPI목표</div>
                    <div class="card-body small-list">
                        <ul>
                            <li v-if="!filteredGoals || filteredGoals.length === 0">등록된 KPI 목표가 없습니다.</li>
                            <li v-for="goal in filteredGoals" :key="goal.id || goal.kpiGoalId || goal._id" @click="openGoal(goal)">
                                {{ goal.description || goal.title || goal.name || '무제' }}
                            </li>
                        </ul>
                                        <div class="weight-total">
                                            <div class="wt-row">
                                                <div class="wt-label">가중치 합계</div>
                                                <div class="wt-values">
                                                    <span class="wt-sum">{{ totalWeight.toFixed(3) }}</span>
                                                    <span :class="['wt-remaining', remainingClass]">남음 {{ Math.max(0, (1 - totalWeight)).toFixed(3) }}</span>
                                                </div>
                                            </div>
                                            <div class="wt-bar" aria-hidden>
                                                <div class="wt-fill" :style="{ width: Math.min(1, totalWeight) * 100 + '%' }"></div>
                                            </div>
                                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
        </section>

        <KpiCategoryDetailPopup
            :visible="showCategoryModal"
            :category="selectedCategory"
            :isNew="createMode"
            @close="closeCategory"
            @edit="handleEditCategory"
            @saved="onSavedCategory"
            @deleted="onDeletedCategory"
        />

        <KpiGoalsDetailPopup
            :visible="showGoalModal"
            :goal="selectedGoal"
            :isNew="createGoalMode"
            :departments="departments"
            :categories="categories"
            :goals="goals"
            :initial-department-id="selectedDepartmentId"
            @close="closeGoal"
            @saved="onSavedGoal"
            @deleted="onDeletedGoal"
        />

        </div>
</template>
<script>
import kpiService from '@/services/kpiService'
import { getDepartments } from '@/services/departmentService'
import KpiCategoryDetailPopup from './KpiCategoryDetailPopup.vue'
import KpiGoalsDetailPopup from './KpiGoalsDetailPopup.vue'

export default {
    name: 'KPIEditPage',
    components: {
        KpiCategoryDetailPopup,
        KpiGoalsDetailPopup
    },
    data() {
        return {
            categories: [],
            departments: [],
            goals: [],
            selectedDepartmentId: null,
            createGoalMode: false,
            loadingCategories: false,
            categoriesError: null
            ,
            // modal state
            showCategoryModal: false,
            selectedCategory: null
            ,
            // goal detail modal
            showGoalModal: false,
            selectedGoal: null,
            createMode: false
        }
    },
    mounted() {
        this.loadCategories()
        this.loadDepartments()
        this.loadGoals()
    },
    methods: {
        async loadGoals() {
            try {
                const resp = await kpiService.getGoals()
                let arr = []
                if (Array.isArray(resp.data)) arr = resp.data
                else if (resp.data && Array.isArray(resp.data.items)) arr = resp.data.items
                else arr = resp.data && resp.data.data ? resp.data.data : []

                // normalize id field if present
                this.goals = arr.map(g => {
                    const id = g.id || g.kpiGoalId || g.goalId || g._id || null
                    return { ...g, id }
                })
                console.debug('KPI goals loaded:', this.goals.slice ? this.goals.slice(0,20) : this.goals)
            } catch (e) {
                console.error('Failed to load KPI goals', e)
                this.goals = []
            }
            console.log('Loaded goals:', this.goals)
        },
        async loadDepartments() {
            try {
                const resp = await getDepartments()
                // response could be { data: [...] } or { data: { data: [...] } }
                let arr = []
                if (resp && resp.data && Array.isArray(resp.data)) arr = resp.data
                else if (resp && resp.data && resp.data.data && Array.isArray(resp.data.data)) arr = resp.data.data
                else arr = []
                this.departments = arr
            } catch (e) {
                console.error('Failed to load departments', e)
                this.departments = []
            }
        },
        async loadCategories() {
            this.loadingCategories = true
            this.categoriesError = null
            try {
                const resp = await kpiService.getCategories()
                // expect resp.data to be an array or an object with data
                let categoriesArr = []
                if (Array.isArray(resp.data)) categoriesArr = resp.data
                else if (resp.data && Array.isArray(resp.data.items)) categoriesArr = resp.data.items
                else categoriesArr = resp.data && resp.data.data ? resp.data.data : []

                // normalize id field (backend may return kpiCategoryId / categoryId / _id)
                this.categories = categoriesArr.map(item => {
                    const id = item.id || item.kpiCategoryId || item.categoryId || item._id || null
                    return { ...item, id }
                })
            } catch (e) {
                console.error('Failed to load KPI categories', e)
                this.categoriesError = e && e.response && e.response.data ? e.response.data.message : (e.message || '로드 실패')
                this.categories = []
            } finally {
                this.loadingCategories = false
            }

        }
        ,
        openCategory(cat) {
            this.createMode = false
            this.selectedCategory = cat || {}
            this.showCategoryModal = true
        },
        openCreateCategory() {
            this.createMode = true
            this.selectedCategory = { name: '', description: '' }
            this.showCategoryModal = true
        },
        openCreateGoal() {
            this.createGoalMode = true
            this.selectedGoal = { }
            this.showGoalModal = true
        },
        openGoal(goal) {
            this.selectedGoal = goal || {}
            this.showGoalModal = true
        },
        closeGoal() {
            this.showGoalModal = false
            this.selectedGoal = null
            this.createGoalMode = false
        },
        closeCategory() {
            this.showCategoryModal = false
            this.selectedCategory = null
        },
        // called when popup emits 'saved' after successful create/update
        async onSavedCategory() {
            try {
                await this.loadCategories()
            } catch (e) {
                console.error('failed reloading after save', e)
            }
        },
        handleEditCategory(cat) {
            // proxy edit event (if popup's edit button used)
            this.$emit('edit-category', cat)
            this.closeCategory()
        },
        async onDeletedCategory() {
            try {
                await this.loadCategories()
            } catch (e) {
                console.error('failed reloading after delete', e)
            }
        }
        ,
        async onSavedGoal() {
            try {
                await this.loadGoals()
            } catch (e) {
                console.error('failed reloading goals after save', e)
            }
        },
        async onDeletedGoal() {
            try {
                await this.loadGoals()
            } catch (e) {
                console.error('failed reloading goals after delete', e)
            }
        }
        ,
        selectDepartment(dept) {
            if (!dept) {
                this.selectedDepartmentId = null
                return
            }
            // department id may be departmentId or id or _id
            const id = dept.departmentId || dept.id || dept._id || null
            console.debug('selectDepartment selected id:', id, 'dept raw:', dept)
            this.selectedDepartmentId = id
        }
    }

    ,
    computed: {
        filteredGoals() {
            if (!this.selectedDepartmentId) return this.goals || []
            return (this.goals || []).filter(g => {
                // goal may have departmentId or department or deptId etc.
                const goalDept = g.departmentId || g.deptId || (g.department && (g.department.id || g.department.departmentId)) || g.departmentIdList || null
                if (!goalDept) return false
                // if goalDept is array
                if (Array.isArray(goalDept)) return goalDept.includes(this.selectedDepartmentId)
                return String(goalDept) === String(this.selectedDepartmentId)
            })
        }
                ,totalWeight() {
                        const arr = this.filteredGoals || []
                        let sum = 0
                        arr.forEach(g => {
                                const w = Number(g.weight ?? g.weightValue ?? g.score ?? 0)
                                if (!Number.isNaN(w)) sum += w
                        })
                        return sum
                },
                weightPercent() {
                    return Math.min(1, this.totalWeight) * 100
                },
                remainingWeight() {
                    return 1 - this.totalWeight
                },
                remainingClass() {
                    if (this.totalWeight > 1) return 'over'
                    if (this.totalWeight === 1) return 'full'
                    return 'normal'
                }
    }
}
</script>
<style scoped>
.page { padding: 40px; }
.page-header { margin-bottom: 40px; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; }
.page-header h1 { margin: 0 0 10px 0; font-size: 32px; color: #2c3e50; }
.page-header p { margin: 0; color: #7f8c8d; font-size: 16px; }
.empty-state { text-align: center; padding: 60px 20px; color: #999; font-size: 18px; }
.subtitle { font-size: 29px; font-weight: 700; color: #294594; margin-bottom: 12px }

/* KPI categories bar */
.kpi-categories-block{ background: linear-gradient(180deg, #ffffff, #fbfdff); border:1px solid rgba(35,93,199,0.06); padding:18px; border-radius:12px; box-shadow:0 8px 20px rgba(16,36,59,0.04); margin-bottom:18px }
.kpi-categories-header{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:12px }
.kpi-categories-header h2{ margin:0; font-size:18px; color:#294594 }
.kpi-categories-wrap{ display:flex; align-items:stretch; gap:16px }
.kpi-categories{ display:flex; gap:12px; overflow:auto; padding:8px 4px; background:transparent; flex:1  }
.category-card{ min-width:285px; background:#fff; border:1px solid #c7cbd2; border-radius:10px; padding:16px; box-shadow:0 6px 12px rgba(16,36,59,0.04); font-weight:600; color:#10243b; display:flex; flex-direction:column; justify-content:center }
.category-card .sub{ display:block; margin-top:8px; font-weight:400; color:#7f8c8d; font-size:13px }
.category-card .cat-title{ font-size:16px; color:#10243b; margin-bottom:6px }
.btn-add-category{ white-space:nowrap; background:linear-gradient(90deg,#294594,#2b57a0); color:#fff; border:none; padding:10px 16px; border-radius:10px; cursor:pointer }
.btn-add-category:hover{ opacity:0.95 }

.kpi-edit-content{ margin-top:12px }

.kpi-goals-block{ background: linear-gradient(180deg, #ffffff, #fbfdff); border:1px solid rgba(35,93,199,0.06); padding:18px; border-radius:12px; box-shadow:0 8px 20px rgba(16,36,59,0.04); margin-bottom:18px }
.kpi-goals-header{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:12px }
.kpi-goals-header h2{ margin:0; font-size:18px; color:#294594 }
.kpi-goals-wrap{ display:block }
.btn-add-goals{ white-space:nowrap; background:linear-gradient(90deg,#294594,#2b57a0); color:#fff; border:none; padding:10px 16px; border-radius:10px; cursor:pointer }
.btn-add-goals:hover{ opacity:0.95 }
/* content cards under categories */
.cards-grid{ display:flex; gap:20px; margin-top:18px }
.content-card{ background:#fff; border-radius:10px; padding:18px; flex:1; min-height:300px; border:1px solid #eef3fb; box-shadow:0 6px 14px rgba(16,36,59,0.04) }
.card-title{ font-weight:700; color:#294594; display:flex; justify-content:space-between; align-items:center; gap:12px }
.card-title .role-filter{ margin-left:12px; padding:6px 10px; border-radius:8px; border:1px solid #e6eefb; background:#fff }
.card-body{ margin-top:14px }
.card-body{ flex:1 }
.small-list ul{ list-style:none; padding-left:18px; color:#10243b }
.small-list li{ padding:6px 0; cursor:pointer }
.small-list li.active{ font-weight:700; color:#294594 }
.small-list li:hover{ background: rgba(41,69,148,0.06); color: #294594; padding-left:10px; border-radius:6px; transition: background .12s ease, transform .08s ease; transform: translateX(4px); }
.weight-total{ margin-top:12px; padding-top:12px; border-top:1px dashed #eef3fb; color:#10243b }
.weight-card .card-body{ position:relative; padding-bottom:96px }
.weight-card .weight-total{ position:absolute; bottom:16px; left:18px; right:18px; background:linear-gradient(180deg, #ffffff, #fbfdff); padding:12px; border-radius:8px; box-shadow:0 6px 12px rgba(16,36,59,0.04) }
.wt-row{ display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px }
.wt-label{ color:#6b7aa3; font-size:13px; font-weight:700 }
.wt-values{ display:flex; gap:8px; align-items:center }
.wt-sum{ font-weight:800; color:#10243b; background:#f3f6ff; padding:4px 8px; border-radius:6px }
.wt-remaining{ font-size:13px; padding:4px 8px; border-radius:6px; color:#fff }
.wt-remaining.normal{ background:#3fb37f }
.wt-remaining.full{ background:#2b7dd7 }
.wt-remaining.over{ background:#d64545 }
.wt-bar{ height:8px; background:#eef6ff; border-radius:999px; overflow:hidden }
.wt-fill{ height:100%; background: linear-gradient(90deg,#2b57a0,#3b82f6); width:0%; transition: width .3s ease }
.member-list table{ width:100%; border-collapse:collapse }
.member-list th, .member-list td{ text-align:left; padding:10px 8px; border-bottom:1px solid #f3f6ff }

@media (max-width:900px){ .cards-grid{ flex-direction:column } }
</style>