<template>
  <li class="tree-node" :style="{ marginLeft: (node.depth || 0) * 12 + 'px' }">
    <div class="notion-item" :class="{ open: open }">
      <div class="left">
        <button v-if="node.children && node.children.length" class="toggle-btn" @click="toggle" :aria-expanded="open" aria-label="toggle child">
          <span :class="['chev', open ? 'open' : '']">▾</span>
        </button>
        <div class="bullet" aria-hidden></div>
      </div>
      <div class="body">
        <div class="row">
          <div class="title" @click="toggleContent">{{ node.title }}</div>
          <div class="actions">
            <button class="add-btn" aria-label="Add child" @click.stop="onAddChild">+</button>
            <button class="edit-btn" aria-label="Edit node" @click.stop="onEdit">✎</button>
            <button
              class="del-btn"
              aria-label="Delete node"
              @click.stop="onDelete"
            >
              🗑
            </button>
          </div>
        </div>
        <div class="meta">{{ fmt(node.createAt) }}</div>
        <div v-if="showContent" class="node-content">{{ node.content }}</div>
      </div>
    </div>

    <ul v-show="open" class="children-list" v-if="node.children && node.children.length">
      <wiki-tree-node
        v-for="c in node.children"
        :key="c.wikiId"
        :node="c"
        @add-child="$emit('add-child', $event)"
        @delete="$emit('delete', $event)"
        @edit="$emit('edit', $event)"
      />
    </ul>
  </li>
</template>

<script>
export default {
  name: 'WikiTreeNode',
  props: { node: { type: Object, required: true } },
  data() {
    return { open: this.node.depth === 0, showContent: false }
  },
  methods: {
    toggle() { this.open = !this.open },
    toggleContent() { this.showContent = !this.showContent },
    fmt(d) {
      if (!d) return '-'
      try { return String(d).slice(0,19).replace('T',' ') } catch(e) { return String(d) }
    }
    ,
    onAddChild() {
      // emit event so parent component can open a create-child UI
      this.$emit('add-child', this.node)
    }
    ,
    onDelete() {
      // emit delete event with this node id
      this.$emit('delete', this.node.wikiId)
    }
    ,
    onEdit() {
      // emit edit event with the whole node so parent can open edit modal
      this.$emit('edit', this.node)
    }
  },
  components: {
    // recursive reference to itself
    'wiki-tree-node': null
  },
  beforeCreate() {
    // set recursive component reference to itself
    // avoid circular reference issues by assigning here
    this.$options.components['wiki-tree-node'] = this.$options
  }
}
</script>

<style scoped>
.tree-node{ list-style:none }
.notion-item{ display:flex; gap:14px; align-items:flex-start; padding:14px 16px; border-radius:12px; background:#ffffff; border:1px solid rgba(15,23,36,0.04); transition:transform .12s ease, box-shadow .14s ease, background .12s ease; }
.notion-item:hover{ transform:translateY(-3px); box-shadow: 0 10px 30px rgba(16,36,59,0.08); background: #ffffff }
.notion-item.open{ background: #fffaf0 }
.notion-item .left{ display:flex; align-items:center; gap:10px; width:48px; flex:0 0 48px }
.toggle-btn{ background:transparent; border:none; cursor:pointer; color:#2b6cb0; font-size:20px; line-height:1; padding:6px; border-radius:8px }
.toggle-btn:focus{ outline:2px solid rgba(43,108,176,0.12) }
.chev{ display:inline-block; transform: rotate(0deg); transition: transform .18s ease; font-size:20px; font-weight:800; color:#1e293b }
.chev.open{ transform: rotate(180deg) }
.bullet{ width:6px; height:6px; border-radius:2px; background:transparent; border:1px solid rgba(41,69,148,0.06); }
.body{ flex:1 }
.row{ display:flex; justify-content:space-between; align-items:center; gap:10px }
.title{ font-weight:700; color:#0b1220; cursor:pointer; font-size:16px; line-height:1.35 }
.actions{ color:#94a3b8; font-size:18px; cursor:default }
.add-btn{ display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:8px; border:none; background:linear-gradient(180deg,#ffffff,#f3f6ff); color:#0b1220; font-weight:700; font-size:20px; box-shadow: 0 1px 2px rgba(16,36,59,0.04); cursor:pointer; opacity:0; transform: translateX(6px) scale(0.92); transition: opacity .28s cubic-bezier(.2,.9,.2,1), transform .28s cubic-bezier(.2,.9,.2,1), box-shadow .18s ease; pointer-events:none }
.notion-item:hover .add-btn{ opacity:1; transform: translateX(0) scale(1); pointer-events:auto; box-shadow: 0 6px 14px rgba(16,36,59,0.08) }
.add-btn:active{ transform: scale(0.98) }
.meta{ font-size:13px; color:#64748b; margin-top:8px }
.node-content{ margin-top:12px; background:#fbfdff; padding:14px; border-left:4px solid #dbeafe; border-radius:8px; color:#0f1724; font-size:14px; line-height:1.7 }
.children-list{ margin:12px 0 0 0; padding-left:18px }
.del-btn{ display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:none; background:transparent; color:#9b1b1b; font-weight:700; font-size:15px; box-shadow:none; cursor:pointer; margin-left:8px; opacity:0; transform: translateX(6px) scale(0.96); transition: opacity .22s cubic-bezier(.2,.9,.2,1), transform .22s cubic-bezier(.2,.9,.2,1), box-shadow .12s ease; pointer-events:none }
.notion-item:hover .del-btn{ opacity:1; transform: translateX(0) scale(1); pointer-events:auto; background:linear-gradient(180deg,#fff6f6,#fff1f1); box-shadow: 0 6px 14px rgba(16,36,59,0.06) }
.del-btn.visible{ opacity:1; transform: translateX(0) scale(1); pointer-events:auto }
.del-btn:active{ transform: scale(0.97) }

.edit-btn{ display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:none; background:transparent; color:#1e40af; font-weight:700; font-size:14px; box-shadow:none; cursor:pointer; margin-left:8px; opacity:0; transform: translateX(6px) scale(0.96); transition: opacity .22s cubic-bezier(.2,.9,.2,1), transform .22s cubic-bezier(.2,.9,.2,1), box-shadow .12s ease; pointer-events:none }
.notion-item:hover .edit-btn{ opacity:1; transform: translateX(0) scale(1); pointer-events:auto; background:linear-gradient(180deg,#ffffff,#f3f6ff); box-shadow: 0 6px 14px rgba(16,36,59,0.06) }
.edit-btn:active{ transform: scale(0.97) }
</style>
