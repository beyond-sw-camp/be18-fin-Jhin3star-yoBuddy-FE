<template>
  <div class="create-page">
    <div class="create-header">
      <h2>온보딩 과정 등록</h2>
      <button class="btn ghost-btn" @click="goBack">목록으로</button>
    </div>

    <div class="stepper">
      <div
        v-for="s in 2"
        :key="s"
        class="step"
        :class="{ active: step === s, done: step > s }"
      >
        <div class="step-circle">{{ s }}</div>
        <div class="step-label">
          <span v-if="s === 1">기본 정보</span>
          <span v-else>멘티 선택</span>
        </div>
      </div>
    </div>

    <div class="card">
      <form v-if="step === 1" @submit.prevent="goNextFromStep1">
        <div class="form-row">
          <label>과정명 <span class="required">*</span></label>
          <input
            v-model="form.name"
            type="text"
            placeholder="예) 2026 상반기 개발3팀"
          />
          <p v-if="errors.name" class="error-msg">{{ errors.name }}</p>
        </div>

        <div class="form-row">
          <label>부서 선택 <span class="required">*</span></label>
          <select v-model="form.departmentId">
            <option disabled value="">부서를 선택하세요</option>
            <option
              v-for="dept in departments"
              :key="dept.departmentId"
              :value="dept.departmentId"
            >
              {{ dept.name }}
            </option>
          </select>
          <p v-if="errors.departmentId" class="error-msg">
            {{ errors.departmentId }}
          </p>
        </div>

        <div class="form-row">
          <label>설명 (선택)</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="과정에 대한 간단한 설명을 입력하세요."
          ></textarea>
        </div>

        <div class="form-row two-columns">
          <div>
            <label>시작일</label>
            <div class="date-input-wrapper">
              <span class="date-icon">📅</span>
              <input
                v-model="form.startDate"
                type="date"
                class="date-input"
                @change="onStartDateChange"
              />
            </div>
            <p v-if="errors.startDate" class="error-msg">
              {{ errors.startDate }}
            </p>
          </div>

          <div>
            <label>종료일</label>
            <div class="date-input-wrapper">
              <span class="date-icon">📅</span>
              <input
                v-model="form.endDate"
                type="date"
                class="date-input"
                :min="form.startDate || undefined"
                @change="onEndDateChange"
              />
            </div>
            <p v-if="errors.endDate" class="error-msg">
              {{ errors.endDate }}
            </p>
          </div>
        </div>

        <div class="footer-actions">
          <button type="button" class="btn ghost-btn" @click="goBack">
            취소
          </button>
          <button type="submit" class="btn primary-btn">
            다음
          </button>
        </div>
      </form>

      <div v-else-if="step === 2" class="mentee-step">
        <div class="set-grid">
          <section class="left">
            <h4>선택된 멘티</h4>
            <div v-if="!selectedMentees.length" class="empty">
              선택된 멘티가 없습니다.
            </div>
            <ul class="item-list">
              <li
                v-for="(u, idx) in selectedMentees"
                :key="u.id || u.userId || idx"
                class="item-row"
              >
                <div class="item-left">
                  <div class="item-title">
                    {{ u.name || u.displayName || u.username || u.email }}
                  </div>
                  <div class="item-time">
                    {{ u.email || "" }}
                  </div>
                </div>
                <div class="item-actions">
                  <button
                    class="btn-outline btn-small"
                    @click="removeSelectedMentee(u)"
                  >
                    삭제
                  </button>
                </div>
              </li>
            </ul>
          </section>

          <section class="right">
            <h4>유저 목록</h4>
            <div class="field">
              <input
                v-model="searchQuery"
                placeholder="이름/이메일/ID로 검색"
                @input="debouncedSearch"
              />
            </div>
            <div v-if="loadingUsers">로딩 중...</div>
            <div v-else>
              <ul class="training-list">
                <li
                  v-for="(u, i) in users"
                  :key="u.id || u.userId || i"
                  class="training-row"
                >
                  <div class="training-left">
                    <div class="training-title">
                      {{ u.name || u.displayName || u.username || u.email || u.id }}
                    </div>
                    <div class="training-meta">{{ u.email || "" }}</div>
                  </div>
                  <div class="training-actions">
                    <button class="btn-add" @click="addUserFromList(u)">
                      추가
                    </button>
                  </div>
                </li>
                <li v-if="users.length === 0" class="empty">
                  사용자 결과가 없습니다.
                </li>
              </ul>
            </div>
          </section>
        </div>

        <div class="footer-actions">
          <button class="btn ghost-btn" @click="step--">이전</button>
          <button
            class="btn primary-btn"
            @click="submitCreate"
            :disabled="submitting"
          >
            {{ submitting ? "등록 중..." : "완료" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import onboardingService from "@/services/onboardingService";
import { getDepartments } from "@/services/departmentService";
import userService from "@/services/user";

export default {
  name: "OnboardingProgramCreate",
  data() {
    return {
      step: 1,
      submitting: false,
      form: {
        name: "",
        description: "",
        departmentId: "",
        startDate: "",
        endDate: "",
      },
      errors: {},
      departments: [],
      selectedMentees: [],
      users: [],
      loadingUsers: false,
      searchQuery: "",
    };
  },
  async mounted() {
    await this.fetchDepartments();
  },
  created() {
    this._searchTimer = null;
  },
  methods: {
    async fetchDepartments() {
      try {
        const resp = await getDepartments();
        this.departments = resp.data || [];
      } catch (e) {
        this.departments = [];
      }
    },

    goBack() {
      this.$router.push("/admin/onboarding/programs");
    },

    validateStep1() {
      const errors = {};

      if (!this.form.name.trim()) {
        errors.name = "프로그램명은 필수입니다.";
      }
      if (!this.form.departmentId) {
        errors.departmentId = "부서를 선택해주세요.";
      }

      if (this.form.startDate && this.form.endDate) {
        if (this.form.endDate < this.form.startDate) {
          errors.endDate = "종료일은 시작일 이후여야 합니다.";
        }
      }

      this.errors = errors;
      return Object.keys(errors).length === 0;
    },

    goNextFromStep1() {
      if (!this.validateStep1()) return;
      this.step = 2;
      this.searchUsers();
    },

    onStartDateChange() {
      if (
        this.form.startDate &&
        this.form.endDate &&
        this.form.endDate < this.form.startDate
      ) {
        this.form.endDate = "";
      }
      if (this.errors.endDate) {
        this.validateStep1();
      }
    },

    onEndDateChange() {
      if (
        this.form.startDate &&
        this.form.endDate &&
        this.form.endDate < this.form.startDate
      ) {
        this.form.endDate = "";
        this.errors.endDate = "종료일은 시작일 이후로만 선택할 수 있습니다.";
      } else if (this.errors.endDate) {
        this.errors.endDate = null;
      }
    },

    async searchUsers() {
      if (!this.form.departmentId) {
        this.users = [];
        return;
      }

      this.loadingUsers = true;
      try {
        const params = {};
        if (this.searchQuery) params.q = this.searchQuery;
        params.departmentId = this.form.departmentId;
        params.page = 0;
        params.size = 1000;

        const resp = await userService.searchUsers(params);
        const payload = resp && resp.data ? resp.data : resp;

        let list;
        if (Array.isArray(payload)) {
          list = payload;
        } else if (Array.isArray(payload.content)) {
          list = payload.content;
        } else if (Array.isArray(payload.items)) {
          list = payload.items;
        } else if (Array.isArray(payload.data)) {
          list = payload.data;
        } else {
          list = [];
        }

        const selectedDeptId = String(this.form.departmentId);

        list = (list || []).filter((u) => {
          const deptId =
            u.departmentId ??
            u.deptId ??
            u.department?.departmentId ??
            u.department?.id ??
            u.departmentIdFk ??
            u.dept_id;

          if (deptId == null) return false;
          return String(deptId) === selectedDeptId;
        });

        list = list.filter((u) => {
          const singleRole =
            u.role ||
            u.userRole ||
            u.roleName ||
            u.type ||
            u.user_type;

          let roleUpper = singleRole
            ? singleRole.toString().toUpperCase()
            : "";

          const rolesArr =
            u.roles ||
            u.authorities ||
            u.roleList ||
            u.userRoles ||
            [];

          if (!roleUpper && Array.isArray(rolesArr) && rolesArr.length > 0) {
            const names = rolesArr.map((r) =>
              (r.name || r.role || r.authority || r).toString().toUpperCase()
            );
            const hasUser = names.some(
              (n) =>
                n.includes("USER") || n === "USER" || n === "ROLE_USER"
            );
            return hasUser;
          }

          return (
            roleUpper.includes("USER") ||
            roleUpper === "USER" ||
            roleUpper === "ROLE_USER"
          );
        });

        const excluded = new Set(
          (this.selectedMentees || [])
            .map((x) => String(x.id || x.userId))
            .filter(Boolean)
        );

        this.users = (list || []).filter(
          (u) => !excluded.has(String(u.id || u.userId))
        );
      } catch (err) {
        this.users = [];
      } finally {
        this.loadingUsers = false;
      }
    },

    debouncedSearch() {
      if (this._searchTimer) clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => {
        this.searchUsers();
      }, 450);
    },

    addUserFromList(u) {
      if (!u) return;
      const exists = this.selectedMentees.some(
        (s) => String(s.id || s.userId) === String(u.id || u.userId)
      );
      if (!exists) {
        this.selectedMentees.push(u);
      }
      this.users = (this.users || []).filter(
        (x) => String(x.id || x.userId) !== String(u.id || u.userId)
      );
    },

    removeSelectedMentee(u) {
      this.selectedMentees = (this.selectedMentees || []).filter(
        (x) => String(x.id || x.userId) !== String(u.id || u.userId)
      );
      if (!this.searchQuery) {
        this.users = this.users || [];
        this.users.unshift(u);
      } else {
        this.searchUsers();
      }
    },

    async submitCreate() {
      this.submitting = true;
      try {
        const payload = {
          name: this.form.name,
          description: this.form.description || null,
          departmentId: this.form.departmentId
            ? Number(this.form.departmentId)
            : null,
          startDate: this.form.startDate || null,
          endDate: this.form.endDate || null,
        };

        const resp = await onboardingService.createAdminOnboardingProgram(
          payload
        );

        let programId = null;

        const location = resp?.headers?.location || resp?.headers?.Location;
        if (location) {
          const parts = location.split("/");
          const last = parts[parts.length - 1];
          const parsed = Number(last);
          if (!Number.isNaN(parsed)) {
            programId = parsed;
          }
        }

        if (!programId && resp.data) {
          const d = resp.data;
          const cand =
            d.programId ||
            d.id ||
            d.onboardingProgramId ||
            (d.data && d.data.programId);
          if (cand && !Number.isNaN(Number(cand))) {
            programId = Number(cand);
          }
        }

        let enrollFailed = false;

        if (programId && this.selectedMentees.length > 0) {
          const userIds = this.selectedMentees
            .map((u) =>
              Number(
                u.userId ||
                  u.id ||
                  (u.meta && (u.meta.userId || u.meta.id))
              )
            )
            .filter((id) => !Number.isNaN(id));
          if (userIds.length > 0) {
            try {
              await onboardingService.enrollMentees(programId, userIds);
            } catch (enrollErr) {
              enrollFailed = true;
              const msg =
                enrollErr?.response?.data?.message ||
                enrollErr?.response?.data?.error ||
                enrollErr.message ||
                String(enrollErr);
              alert(
                "프로그램은 생성되었지만 멘티 등록에 실패했습니다.\n\n" + msg
              )
              console.error('Mentee enrollment failed', msg);
            }
          }
        }

        if (!enrollFailed) {
          alert("온보딩 과정이 등록되었습니다.");
        }

        this.$router.push("/admin/onboarding/programs");
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e.message ||
          String(e);
        alert("온보딩 등록 과정에 실패했습니다.\n\n" + msg);
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
.create-page {
  padding: 28px 40px;
  max-width: 1040px;
  margin: 0 auto;
}

.create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.create-header h2 {
  margin: 0;
  font-size: 24px;
  color: #10243b;
}

.stepper {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 14px;
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.step.active .step-circle {
  border-color: #294594;
  background: #294594;
  color: #fff;
}

.step.done .step-circle {
  border-color: #22c55e;
  background: #22c55e;
  color: #fff;
}

.step.active .step-label,
.step.done .step-label {
  color: #111827;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 28px 32px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-row.two-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

label {
  font-size: 14px;
  color: #374151;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
}

input,
select,
textarea {
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
  background-color: #ffffff;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #294594;
  box-shadow: 0 0 0 1px rgba(41, 69, 148, 0.15);
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-icon {
  position: absolute;
  left: 10px;
  font-size: 14px;
  color: #9ca3af;
  pointer-events: none;
}

.date-input {
  width: 100%;
  padding-left: 30px;
  padding-right: 10px;
}

.error-msg {
  margin-top: 4px;
  font-size: 12px;
  color: #b91c1c;
}

.footer-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  border-radius: 10px;
  cursor: pointer;
  border: none;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  font-size: 14px;
}

.primary-btn {
  background: #294594;
  color: #ffffff;
}

.ghost-btn {
  background: #ffffff;
  color: #294594;
  border: 1px solid #d1d5db;
}

.mentee-step {
  display: flex;
  flex-direction: column;
}

.set-grid {
  display: flex;
  gap: 18px;
  margin-bottom: 12px;
}

.set-grid .left {
  flex: 1.2;
  max-height: 360px;
  overflow: auto;
  background: #fbfdff;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #eef3fb;
}

.set-grid .right {
  flex: 1;
  max-height: 360px;
  overflow: auto;
  background: #fbfdff;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #eef3fb;
}

.set-grid h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.field {
  margin-bottom: 12px;
}

.field input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border: 1px solid #dfe6f0;
  border-radius: 6px;
}

.item-list,
.training-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item-row,
.training-row {
  padding: 8px;
  border-bottom: 1px dashed #e6eef8;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-row:last-child,
.training-row:last-child {
  border-bottom: none;
}

.item-left {
  flex: 1;
}

.item-title,
.training-title {
  font-weight: 600;
}

.item-time,
.training-meta {
  font-size: 12px;
  color: #6b7280;
}

.btn-add {
  background: #2b8af6;
  color: #fff;
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.btn-outline {
  background: transparent;
  border: 1px solid #d0d7e2;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-small {
  padding: 6px 8px;
  font-size: 13px;
  border-radius: 8px;
}

.empty {
  font-size: 13px;
  color: #6b7280;
  padding: 8px 0;
}
</style>
