
<template>
	<transition name="fade">
		<div v-if="show" class="detail-overlay" @click.self="close">
			<div class="detail-modal layout-vertical">
				<header class="modal-top">
					<button class="back-btn" @click="close" aria-label="뒤로가기">← 뒤로 가기</button>
				</header>

				<section class="center-area">
					<div class="avatar-large">
						<img v-if="user && (user.avatarUrl || user.avatar)" :src="user.avatarUrl || user.avatar" alt="avatar" />
						<span v-else class="avatar-fallback-large">👤</span>
					</div>
					<div class="center-name">{{ user?.name || user?.userName || '알 수 없음' }}</div>
				</section>

				<section class="two-cols">
					<div class="col">
						<div class="label">이메일</div>
						<div class="val">{{ user?.email || '—' }}</div>
					</div>
					<div class="col">
						<div class="label">전화 번호</div>
						<div class="val">{{ user?.phone || user?.phoneNumber || '—' }}</div>
					</div>
				</section>

				<section class="info-row">
					<div class="info-block">
						<div class="info-label">역할</div>
						<div class="info-val">{{ user?.roleLabel || user?.role || user?.userRole || '—' }}</div>
					</div>
					<div class="info-block">
						<div class="info-label">부서</div>
						<div class="info-val">{{ user?.department || user?.departmentName || '—' }}</div>
					</div>
					<div class="info-block">
						<div class="info-label">입사일</div>
						<div class="info-val">{{ formattedJoinDate }}</div>
					</div>
				</section>

				<section class="mentors-area">
					<div class="mentors-title">배정된 멘토</div>
					<div class="mentor-list">
						<div v-if="!(mentors && mentors.length)" class="mentor-empty">배정된 멘토가 없습니다.</div>
						<div v-for="(m, idx) in mentors || []" :key="idx" class="mentor-card">
							<div class="mentor-left">
								<img v-if="m.avatarUrl || m.avatar" :src="m.avatarUrl || m.avatar" alt="mentor avatar" />
								<span v-else class="avatar-fallback-sm">👤</span>
							</div>
							<div class="mentor-right">
								<div class="m-name">{{ m.name || m.userName || '—' }}</div>
								<div class="m-email">{{ m.email || m.userEmail || '' }}</div>
								<div class="m-dept">{{ m.department || m.departmentName || '' }}</div>
								<div class="m-period">기간: {{ m.period || m.allocatedPeriod || '—' }}</div>
							</div>
						</div>
					</div>
				</section>

				<footer class="modal-actions">
					<button class="btn-outline" @click="$emit('edit', user)">수정</button>
					<button class="btn-primary" @click="$emit('delete', user)">삭제</button>
				</footer>
			</div>
		</div>
	</transition>
</template>



<script>
export default {
	name: 'UserDetailpopup',
	props: {
		show: { type: Boolean, default: false },
		user: { type: Object, default: () => ({}) },
		mentors: { type: Array, default: () => [] }
	},
	emits: ['close','edit','delete'],
	methods: {
		close() {
			this.$emit('close')
		}
	},
	computed: {
		formattedJoinDate() {
			const d = this.user?.joinedAt || this.user?.joinDate || this.user?.hireDate || ''
			if (!d) return '—'
			try {
				const dt = new Date(d)
				return dt.toLocaleDateString()
			} catch (e) {
				return d
			}
		}
	}
}
</script>

<style scoped>
.detail-overlay { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.45); z-index:1200 }
.detail-modal { width: min(720px, 96%); background: #fff; border-radius:12px; padding:20px 24px 28px; box-shadow: 0 12px 40px rgba(3,10,18,0.12); position:relative; max-height:90vh; overflow:auto }
.modal-top { display:flex; align-items:center; padding-bottom:6px }
.back-btn { background:transparent; border:none; color:#10243b; font-weight:600; cursor:pointer; padding:6px 0 }
.center-area { display:flex; flex-direction:column; align-items:center; gap:8px; padding-top:6px }
.avatar-large img { width:110px; height:110px; border-radius:50%; object-fit:cover; box-shadow: 0 6px 20px rgba(9,36,73,0.08); border:6px solid #fff }
.avatar-fallback-large { display:inline-flex; width:110px; height:110px; align-items:center; justify-content:center; border-radius:50%; background:#f0f4fb; font-size:36px }
.center-name { font-weight:700; margin-top:6px; color:#10243b }
.two-cols { display:flex; gap:28px; justify-content:space-between; padding:18px 6px 18px 5%; margin-left:5% }
.two-cols .col { flex:1 }
.two-cols .label { color:#7d93ad; font-size:13px }
.two-cols .val { font-weight:600; margin-top:6px }
.info-row { display:flex; gap:20px; padding:12px 6px 12px 5% ; margin-left:5%}
.info-block { flex:1; text-align:left }
.info-label { color:#7d93ad; font-size:13px }
.info-val { font-weight:600; margin-top:6px }
.mentors-area { padding:10px 6px 6px 5%; margin-left:5% }
.mentors-title { font-weight:700; color:#10243b; margin-bottom:8px }
.mentor-list { display:flex; flex-direction:column; gap:12px }
.mentor-card { display:flex; gap:12px; align-items:flex-start; padding:12px; border-radius:10px; border:1px solid #e6eef8; background: #fff }
.mentor-left img { width:56px; height:56px; border-radius:50%; object-fit:cover }
.avatar-fallback-sm { display:inline-flex; width:56px; height:56px; align-items:center; justify-content:center; border-radius:50%; background:#f0f4fb }
.mentor-right .m-name { font-weight:700; margin-bottom:4px }
.mentor-right .m-email { color:#6d859a; font-size:13px; margin-bottom:6px }
.mentor-right .m-dept { font-size:13px; color:#6d859a }
.mentor-right .m-period { margin-top:8px; color:#556574; font-size:13px }
.mentor-empty { color:#8b98a9; padding:12px }
.modal-actions { display:flex; justify-content:center; gap:12px; padding:18px 6px 6px 40px }
.btn-outline { background:transparent; border:1px solid #294594; color:#294594; padding:8px 22px; border-radius:8px; cursor:pointer }
.btn-primary { background:#294594; color:#fff; padding:8px 22px; border-radius:8px; border:none; cursor:pointer }

@media (max-width:720px) {
    .detail-modal { width: calc(100% - 32px); padding:16px }
    .two-cols { flex-direction:column; gap:8px; padding-left:16px }
    .info-row { flex-direction:column; padding-left:16px }
    .mentors-area { padding-left:16px }
    .modal-actions { padding-left:16px }
    .mentor-card { padding:10px }
}
</style>

