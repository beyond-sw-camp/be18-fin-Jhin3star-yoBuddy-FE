<template>
  <div class="org-page">
    <div class="content-card">
      <div class="card-header">
        <div class="title-wrap">
          <h2 class="card-title">유저 수정</h2>
          <p class="card-sub">사용자 정보를 수정합니다</p>
        </div>
        <div>
          <button class="btn-ghost" @click="onCancel">취소</button>
          <button class="btn-primary" @click="onSave">저장</button>
        </div>
      </div>

      <div class="card-body edit-body">
        <div v-if="loading" class="loading">로딩 중...</div>
        <div v-else>
          <div class="form-layout">
            <div class="avatar-edit">
              <div class="avatar-large">
                <img v-if="user && (user.avatarUrl || user.avatar)" :src="user.avatarUrl || user.avatar" alt="avatar" />
                <span v-else class="avatar-fallback-large">👤</span>
              </div>
              <div class="center-name">{{ user?.name || '알 수 없음' }}</div>
            </div>

            <div class="fields">
              <label>이메일</label>
              <input v-model="form.email" type="text" />

              <label>전화 번호</label>
              <input v-model="form.phone" type="text" />

              <div class="row-3">
                <div>
                  <label>역할</label>
                  <select v-model="form.role">
                    <option value="ADMIN">관리자</option>
                    <option value="MENTOR">멘토</option>
                    <option value="USER">뉴비</option>
                  </select>
                </div>
                <div>
                  <label>부서</label>
                  <input v-model="form.department" type="text" />
                </div>
                <div>
                  <label>입사일</label>
                  <input v-model="form.joinDate" type="date" />
                </div>
              </div>

              <div class="mentor-section">
                <label>배정된 멘토 (읽기 전용)</label>
                <div v-if="mentors && mentors.length" class="mentor-list">
                  <div v-for="(m, idx) in mentors" :key="idx" class="mentor-card-small">
                    <div class="m-left"><img v-if="m.avatarUrl||m.avatar" :src="m.avatarUrl||m.avatar" /></div>
                    <div class="m-right">
                      <div class="m-name">{{ m.name || m.userName }}</div>
                      <div class="m-email">{{ m.email || '' }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="mentor-empty">배정된 멘토가 없습니다.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/services/http'

export default {
  name: 'UserEditPage',
  data() {
    return {
      user: null,
      mentors: [],
      form: { email: '', phone: '', role: 'USER', department: '', joinDate: '' },
      loading: false,
      error: null
    }
  },
  mounted() {
    const id = this.$route.params.id
    const stored = sessionStorage.getItem('yb_edit_user')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (String(parsed.id) === String(id)) {
          this.user = parsed
          this.mentors = parsed.mentors || []
          this.fillForm(parsed)
          return
        }
      } catch (e) {
        // ignore parsing errors
      }
    }
    this.fetchUser(id)
  },
  methods: {
    fillForm(u) {
      this.form.email = u.email || ''
      this.form.phone = u.phone || u.phoneNumber || ''
      this.form.role = u.role || u.userRole || 'USER'
      this.form.department = u.department || u.departmentName || ''
      const d = u.joinedAt || u.joinDate || u.hireDate || ''
      if (d) {
        const dt = new Date(d)
        if (!Number.isNaN(dt.getTime())) this.form.joinDate = dt.toISOString().slice(0,10)
      }
    },
    async fetchUser(id) {
      this.loading = true
      try {
        const resp = await http.get(`/api/v1/admin/users/${id}`)
        const data = resp && resp.data ? resp.data : null
        if (data) {
          this.user = data
          this.mentors = data.mentors || []
          this.fillForm(this.user)
        }
      } catch (e) {
        console.error(e)
        this.error = '사용자 정보를 불러오지 못했습니다.'
      } finally {
        this.loading = false
      }
    },
    onCancel() {
      sessionStorage.removeItem('yb_edit_user')
      this.$router.back()
    },
    async onSave() {
      if (!this.user || !this.user.id) return
      this.loading = true
      try {
        const payload = {
          email: this.form.email,
          phoneNumber: this.form.phone,
          role: this.form.role,
          departmentName: this.form.department,
          joinDate: this.form.joinDate
        }
        await http.put(`/api/v1/admin/users/${this.user.id}`, payload)
        sessionStorage.removeItem('yb_edit_user')
        this.$router.push({ path: '/organization/usermanagement' })
      } catch (e) {
        console.error(e)
        this.error = '저장 중 오류가 발생했습니다.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.org-page { padding: 28px 40px; display:flex; justify-content:center; }
.content-card { width: 820px; background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(9,30,66,0.08); overflow: hidden; }
.card-header { display:flex; justify-content:space-between; align-items:center; padding: 20px 28px; border-bottom: 1px solid #eef2f7; }
.card-title { margin:0; font-size:20px }
.card-sub { color:#7d93ad; margin:6px 0 0 }
.edit-body { padding: 22px; }
.form-layout { display:flex; gap:20px }
.avatar-edit { width:220px; display:flex; flex-direction:column; align-items:center }
.avatar-large img { width:110px; height:110px; border-radius:50%; }
.fields { flex:1 }
.fields label { display:block; margin-top:12px; color:#7d93ad }
.fields input, .fields select { width:100%; padding:8px; margin-top:6px; border-radius:6px; border:1px solid #e6eef8 }
.row-3 { display:flex; gap:12px; margin-top:8px }
.row-3 > div { flex:1 }
.mentor-section { margin-top:14px }
.mentor-card-small { display:flex; gap:12px; padding:8px; border:1px solid #eef2f7; border-radius:8px }
.m-left img { width:48px; height:48px; border-radius:50% }
.actions { display:flex; justify-content:flex-end; gap:12px; margin-top:18px }
.btn-ghost { background:transparent; border:1px solid #294594; color:#294594; padding:8px 18px; border-radius:8px }
.btn-primary { background:#294594; color:#fff; padding:8px 18px; border-radius:8px; border:none }
</style>
