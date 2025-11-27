import http from '@/services/http'

/**
 * User service
 * - 중앙에서 사용자 관련 HTTP 호출을 관리합니다.
 * - 컴포넌트에서 직접 axios 호출을 하지 않고 이 모듈을 사용하세요.
 */
const extractArray = resp => {
	// Normalize various backend shapes safely to an array
	// resp may be undefined/null or a full axios response
	if (!resp) return []
	const payload = resp && resp.data ? resp.data : resp
	if (Array.isArray(payload)) return payload
	if (payload && Array.isArray(payload.data)) return payload.data
	if (payload && Array.isArray(payload.content)) return payload.content
	return []
}

const userService = {
	async getDepartments() {
		const r = await http.get('/api/v1/admin/departments')
		return extractArray(r)
	},

	async createUsers(users) {
		const body = Array.isArray(users) ? users : [users]
		const resp = await http.post('/api/v1/admin/users', body)
		return resp && resp.data ? resp.data : resp
	},

	async createUser(user) {
		const res = await this.createUsers(user)
		if (Array.isArray(res)) return res[0] || null
		return res
	},

	async updateUser(id, payload) {
		const resp = await http.patch(`/api/v1/admin/users/${id}`, payload)
		return resp && resp.data ? resp.data : resp
	},

	async deleteUser(id) {
		try {
			const resp = await http.delete(`/api/v1/admin/ausers/${id}`)
			return resp && resp.data ? resp.data : resp
		} catch (e) {
			// 일부 백엔드는 /api/v1/users/{id}를 사용함 -> 폴백
			if (e && e.response) {
				const resp = await http.delete(`/api/v1/users/${id}`)
				return resp && resp.data ? resp.data : resp
			}
			throw e
		}
	},

	async searchUsers(params) {
		const resp = await http.get('/api/v1/admin/users', { params })
		// Many endpoints return paginated shapes; normalize to either array or full payload
		// If caller expects an array, they can use extractArray(resp).
		return resp && resp.data ? resp.data : resp
	},

	async getUserById(userId) {
		const resp = await http.get(`/api/v1/admin/users/${userId}`)
		return resp && resp.data ? resp.data : resp
	},

	async updateMyInfo(formData) {
	const resp = await http.patch('/api/v1/account/me', formData, {
		headers: {
		'Content-Type': 'multipart/form-data'
		}
	})
	return resp && resp.data ? resp.data : resp
	}
}

export default userService
