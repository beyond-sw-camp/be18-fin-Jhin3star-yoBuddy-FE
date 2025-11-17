<template>
  <div class="mentee-card">
    <h1>멘토 대시보드 테스트</h1>
    <h4>{{ mentee.name }}</h4>
    <p>{{ mentee.email }}</p>
    <p>{{ mentee.phoneNumber }}</p>
    <p>{{ mentee.departmentName }}</p>
  </div>
</template>

<script>
export default {
  props: {
    mentee: Object
  }
}
</script>
