<template>
  <div class="session-page">
    <div class="session-card">
      <div class="card-header">
        <h2 class="card-title">멘토링 세션 생성</h2>
        <p class="card-sub">담당 멘티와의 새로운 멘토링 세션을 계획합니다.</p>
      </div>

      <div class="form">
        <div class="form-row">
          <label for="mentee-select">멘티 선택</label>
          <select id="mentee-select" v-model="selectedMenteeId">
            <option disabled value="">-- 멘티를 선택하세요 --</option>
            <option v-for="mentee in mentees" :key="mentee.menteeId" :value="mentee.menteeId">
              {{ mentee.name }} ({{ mentee.email }})
            </option>
          </select>
        </div>

        <div class="form-row">
          <label for="session-datetime">멘토링 일정</label>
          <input id="session-datetime" type="datetime-local" v-model="scheduledAt" :min="minDateTime" />
        </div>

        <div class="form-row">
          <label for="session-description">세션 설명</label>
          <textarea id="session-description" v-model="description" rows="5" placeholder="세션에서 다룰 주요 내용이나 설명을 입력하세요."></textarea>
        </div>

        <button class="btn-primary" @click="createSession" :disabled="!isFormValid">
          생성하기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import mentoringService from "@/services/mentoringService";
import { useAuthStore } from "@/store/authStore";

export default {
  name: "MentoringSessionCreatePage",
  data() {
    return {
      mentees: [],
      mentorId: null,
      selectedMenteeId: "",
      scheduledAt: "",
      description: "",
    };
  },
  computed: {
  isFormValid() {
    return this.selectedMenteeId && this.scheduledAt && this.description;
  },
  minDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }
},
  async mounted() {
    const auth = useAuthStore();
    this.mentorId = auth.user?.userId;

    const queryMenteeId = this.$route.query.menteeId;
    if (queryMenteeId) {
      this.selectedMenteeId = queryMenteeId;
    }

    await this.fetchMenteesForMentor();
  },
  methods: {
    async fetchMenteesForMentor() {
      if (!this.mentorId) return;
      try {
        this.mentees = await mentoringService.getMenteesForMentor(this.mentorId);
      } catch (e) {
        console.error("담당 멘티 목록 조회 실패", e);
        alert("담당 멘티 목록을 불러오는 데 실패했습니다.");
      }
    },
    async createSession() {
      if (!this.isFormValid) {
        alert("필수 항목(멘티, 일정, 설명)을 모두 입력해주세요.");
        return;
      }
      try {
        const sessionData = {
          mentorId: Number(this.mentorId),
          menteeId: Number(this.selectedMenteeId),
          description: this.description,
          scheduledAt: this.scheduledAt,
        };

        await mentoringService.createMentoringSession(sessionData);

        alert("멘토링 세션이 생성되었습니다.");
        this.$router.push("/mentor/sessions");
      } catch (e) {
        console.error("세션 생성 실패", e);
        alert("세션 생성에 실패했습니다.");
      }
    },
  },
};
</script>

<style scoped>
.session-page { display: flex; justify-content: center; padding: 40px; }
.session-card { width: 600px; background: white; border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.05); }
.card-header { padding: 25px 30px; border-bottom: 1px solid #eef2f7; }
.card-title { margin:0; font-size:20px; color:#10243b }
.card-sub { margin: 4px 0 0; color:#7d93ad; font-size:13px }
.form { padding: 30px; }
.form-row { margin-bottom: 22px; display: flex; flex-direction: column; }
label { font-size: 14px; color: #6d859a; margin-bottom: 8px; font-weight: 600; }
input, select, textarea {
  padding: 12px 14px;
  border: 1px solid #dde4ee;
  border-radius: 8px;
  font-size: 15px;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #294594;
  box-shadow: 0 0 0 3px rgba(41, 69, 148, 0.1);
}
textarea { resize: vertical; }
.btn-primary {
  width: 100%;
  background: #294594;
  color: #fff;
  padding: 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  margin-top: 10px;
  transition: background 0.2s;
}
.btn-primary:hover { background: #223b7b; }
.btn-primary:disabled { background: #a9b8d9; cursor: not-allowed; }
</style>
