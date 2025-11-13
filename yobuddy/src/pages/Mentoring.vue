<template>
  <div class="page">
    <div class="page-header">
      <h1>🤝 멘토링</h1>
      <p>멘토-멘티 매칭 및 관리</p>
    </div>
    <div class="empty-state">
      <p>멘토링 콘텐츠가 여기에 표시됩니다.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MentoringPage'
}
</script>

<style scoped>
.page { padding: 40px; }
.page-header { margin-bottom: 40px; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; }
.page-header h1 { margin: 0 0 10px 0; font-size: 32px; color: #2c3e50; }
.page-header p { margin: 0; color: #7f8c8d; font-size: 16px; }
.empty-state { text-align: center; padding: 60px 20px; color: #999; font-size: 18px; }
</style>
