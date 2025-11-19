<template>
  <div class="mentee-card" @click="$emit('select', mentee)">
    <div class="left">
      <div class="avatar">{{ mentee.name.substring(0,1) }}</div>

      <div class="info">
        <div class="name">{{ mentee.name }}</div>
        <div class="email">{{ mentee.email }}</div>
        <div class="dept">{{ mentee.department }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: { mentee: Object }
}
</script>

<style scoped>
.mentee-card {
  display: flex;
  align-items: center;
  gap: 18px;

  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef2f7;
  padding: 18px 22px;

  transition: 0.15s ease;
}

.mentee-card:hover {
  background: #f8fbff;
  box-shadow: 0 4px 14px rgba(9,30,66,0.07);
}

.left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 52px;
  height: 52px;
  background: #294594;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 700;
  font-size: 16px;
}

.info {
  display: flex;
  flex-direction: column;
}

.name {
  font-size: 16px;
  font-weight: 700;
  color: #10243b;
}

.email {
  font-size: 13px;
  color: #7d93ad;
}

.dept {
  font-size: 14px;
  font-weight: 600;
  color: #6d859a;
  margin-top: 2px;
}
</style>
