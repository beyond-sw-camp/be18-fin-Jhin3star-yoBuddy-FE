<template>
  <div class="page">
    <div class="page-header">
      <h1>🏠 홈</h1>
      <p>YoBuddy에 오신 것을 환영합니다!</p>
    </div>
    <div class="content-grid">
      <div class="card">
        <h3>⏱️ KPI</h3>
        <p>성과 지표를 관리하세요</p>
      </div>
      <div class="card">
        <h3>👥 조직 관리</h3>
        <p>조직 구조를 관리하세요</p>
      </div>
      <div class="card">
        <h3>🎯 온보딩</h3>
        <p>신입 사원 온보딩 프로그램</p>
      </div>
      <div class="card">
        <h3>🤝 멘토링</h3>
        <p>멘토-멘티 매칭 관리</p>
      </div>
      <div class="card">
        <h3>📚 교육</h3>
        <p>직원 교육을 관리하세요</p>
      </div>
      <div class="card">
        <h3>📊 콘텐츠</h3>
        <p>콘텐츠를 관리하세요</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>

<style scoped>
.page {
  padding: 40px;
}

.page-header {
  margin-bottom: 40px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 10px 0;
  font-size: 32px;
  color: #2c3e50;
}

.page-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 16px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card h3 {
  margin: 0 0 10px 0;
  color: #1e3a5f;
  font-size: 18px;
}

.card p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.5;
}
</style>
