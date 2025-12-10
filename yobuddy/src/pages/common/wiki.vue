<template>
	<div class="wiki-container">
		<div class="wiki-card">
			<div class="wiki-header">
				<h2 class="wiki-title">Wiki 트리</h2>
				<button class="add-root-btn" @click="openCreateRoot">＋ 새 문서</button>
			</div>
			<div class="wiki-tree">
				<ul class="tree-root" v-if="nodesToShow && nodesToShow.length">
					<wiki-tree-node
						v-for="node in nodesToShow"
						:key="node.wikiId"
						:node="node"
						@add-child="openAddChildModal"
						@delete="onDeleteNode"
						@edit="openEditModal"
					/>
				</ul>
				<div class="empty-state" v-else>
					등록된 문서가 없습니다.
				</div>
			</div>
			<div class="wiki-note">클릭하여 항목을 확장/축소하고 내용을 확인하세요.</div>
		</div>
	</div>
	<wikidetailpopup
			:visible="showAddModal"
			:parent="modalParent"
			:isNew="modalIsNew"
			:initial="modalInitial"
			@close="closeAddModal"
			@saved="onSavedChild"
	/>
</template>

<script>
import WikiTreeNode from '@/components/WikiTreeNode.vue'
import wikiService from '@/services/wikiService'
import WikiDetailPopup from './wikidetailpopup.vue'

export default {
	name: 'WikiTree',
	components: { 'wiki-tree-node': WikiTreeNode, 'wikidetailpopup': WikiDetailPopup },
	props: {
		nodes: { type: Array, default: null }
	},

    
	data() {
		return {
			fetchedNodes: null,
			showAddModal: false,
			modalParent: null,
			modalIsNew: true,
			modalInitial: null
		}
	},
	methods: {
		async loadNodes() {
			try {
				const resp = await wikiService.getAll()
				if (resp && resp.data) {
					const body = resp.data && resp.data.data ? resp.data.data : resp.data
					if (Array.isArray(body)) this.fetchedNodes = body
				}
			} catch (e) {
				console.error('Failed to load nodes', e)
			}
		},
		openAddChildModal(node) {
			this.modalParent = node || null
			this.modalIsNew = true
			this.modalInitial = null
			this.showAddModal = true
		},
		openCreateRoot() {
			this.modalParent = null
			this.modalIsNew = true
			this.modalInitial = null
			this.showAddModal = true
		},
		openEditModal(node) {
			// open modal in edit mode with initial data
			this.modalIsNew = false
			this.modalInitial = node || null
			// find parent by parentId so popup can display parent title
			const parentId = node?.parentId || null
			this.modalParent = parentId ? this.findNodeById(this.fetchedNodes || this.sample, parentId) : null
			this.showAddModal = true
		},
		findNodeById(list, id) {
			if (!Array.isArray(list) || !id) return null
			for (const n of list) {
				if (String(n.wikiId) === String(id)) return n
				if (n.children && n.children.length) {
					const found = this.findNodeById(n.children, id)
					if (found) return found
				}
			}
			return null
		},
		closeAddModal() {
			this.showAddModal = false
			this.modalParent = null
			this.modalIsNew = true
			this.modalInitial = null
		},
		async onSavedChild() {
			// after creating a child, reload from server to get updated tree
			try {
				await this.loadNodes()
			} catch (e) {
				console.error('Failed to reload after create', e)
			}
		}
		,
		// helper: remove node by id from nested list (mutates list)
		removeNodeFromList(list, id) {
			if (!Array.isArray(list)) return false
			for (let i = list.length - 1; i >= 0; i--) {
				const n = list[i]
				if (String(n.wikiId) === String(id)) {
					list.splice(i, 1)
					return true
				}
				if (n.children && n.children.length) {
					const removed = this.removeNodeFromList(n.children, id)
					// if child list becomes empty, keep it as empty array
					if (removed) return true
				}
			}
			return false
		},

		// helper: collect all ids in the subtree rooted at `id` (including id)
		getSubtreeIds(list, id) {
			const res = []
			function dfs(arr) {
				if (!Array.isArray(arr)) return false
				for (const n of arr) {
					if (String(n.wikiId) === String(id)) {
						// collect this node and all descendants
						collect(n)
						return true
					}
					if (n.children && n.children.length) {
						const found = dfs(n.children)
						if (found) return true
					}
				}
				return false
			}

			function collect(node) {
				res.push(node.wikiId)
				if (node.children && node.children.length) {
					for (const c of node.children) collect(c)
				}
			}

			dfs(list)
			return res
		},
		async onDeleteNode(wikiId) {
				if (!wikiId) return
				console.log('delete requested for', wikiId)
				const ok = window.confirm('정말 이 항목을 삭제하시겠습니까? 하위 문서들도 함께 삭제됩니다.')
				if (!ok) return

				// decide whether we're operating on sample (local) or fetched server data
				const showingSample = !(this.fetchedNodes && Array.isArray(this.fetchedNodes) && this.fetchedNodes.length)

				if (showingSample) {
					// remove locally from sample
					const removed = this.removeNodeFromList(this.sample, wikiId)
					if (removed) return
					alert('로컬 데이터에서 해당 항목을 찾을 수 없습니다.')
					return
				}

				// collect subtree ids (for multi-delete), then optimistic delete locally
				const idsToDelete = this.getSubtreeIds(this.fetchedNodes, wikiId)
				const backup = JSON.parse(JSON.stringify(this.fetchedNodes))
				const removed = this.removeNodeFromList(this.fetchedNodes, wikiId)
				if (!removed) {
					// if node not found locally, fall back to server delete attempt
					try {
						await wikiService.remove(wikiId)
						await this.loadNodes()
						return
					} catch (e) {
						console.error('Failed to delete node (fallback)', e)
						alert('삭제에 실패했습니다.')
						return
					}
				}

				// now call server to remove multiple ids; delete children first
				try {
					if (Array.isArray(idsToDelete) && idsToDelete.length) {
						const toCall = [...idsToDelete].reverse() // delete children before parent
						await Promise.all(toCall.map(id => wikiService.remove(id)))
					} else {
						// fallback to single delete
						await wikiService.remove(wikiId)
					}
					// success
				} catch (e) {
					console.error('Failed to delete node(s) on server, rolling back', e)
					this.fetchedNodes = backup
					if (e && e.response && e.response.data && e.response.data.message) {
						alert('삭제 실패: ' + e.response.data.message)
					} else {
						alert('삭제에 실패했습니다. 변경 사항을 되돌립니다.')
					}
				}
			}
	},
	mounted: async function() {
		// load nodes during mount
		if (!(this.nodes && Array.isArray(this.nodes) && this.nodes.length)) {
			await this.loadNodes()
		}
	},

	computed: {
			nodesToShow() {
				if (this.nodes && Array.isArray(this.nodes) && this.nodes.length) return this.nodes
				if (this.fetchedNodes && Array.isArray(this.fetchedNodes) && this.fetchedNodes.length) return this.fetchedNodes
				return []
			}
	}
}
</script>


<style scoped>
.wiki-container{ max-width:1100px; margin:28px auto; font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; font-size:15px; color:#0b1220 }
.wiki-card { background: #ffffff; border: 1px solid #e6eef8; border-radius: 12px; padding: 22px 24px 26px; box-shadow: 0 6px 18px rgba(16, 36, 59, 0.06); max-width: 1100px; margin: 0 auto 20px; box-sizing: border-box; }
.wiki-title{ color:#0b1220; margin:0 0 16px 0; font-size:22px; font-weight:700 }
.wiki-tree{ border-radius:10px; margin-top: 12px; }
.tree-root{ list-style:none; padding-left:6px; margin:0 }
.tree-node{ margin:10px 0; }
.wiki-note{ margin-top:14px; font-size:13px; color:#64748b }

.empty-state{ padding:36px 18px; text-align:center; color:#94a3b8; background:transparent; border-radius:10px }
.empty-state strong{ color:#0b1220; font-weight:700 }

.wiki-header{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px }
.add-root-btn{ background:linear-gradient(180deg,#1e40af,#1746b0); color:#fff; border:none; padding:8px 12px; border-radius:10px; font-weight:700; cursor:pointer; box-shadow:0 6px 18px rgba(30,64,175,0.12); transition: transform .12s ease, box-shadow .12s ease }
.add-root-btn:hover{ transform: translateY(-2px); box-shadow:0 10px 22px rgba(30,64,175,0.14) }
.add-root-btn:active{ transform: translateY(0) }

@media (max-width:640px){ .wiki-container{ padding:12px } }
</style>
