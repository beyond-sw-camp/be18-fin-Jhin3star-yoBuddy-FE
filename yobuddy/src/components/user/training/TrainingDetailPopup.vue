<template>
  <transition name="fade">
    <div class="detail-overlay" v-if="visible">
      <div class="detail-modal layout-vertical">
        <header class="modal-top">
          <button class="back-btn" @click="$emit('close')">X</button>
          <div class="modal-title">{{ training?.title || '교육 상세' }}</div>
        </header>

        <section class="content section">
          <!-- 기본 정보: 설명, 유형, 상태, 최대 점수, 패스 점수 -->
          <div class="desc-row">
            <div class="desc-box">{{ training?.description || training?.summary || training?.subtitle || training?.content || '—' }}</div>
          </div>

          <div class="row">
            <div class="label">유형</div>
            <div class="val">{{ training?.type === 'ONLINE' ? '온라인' : '오프라인' }}</div>
          </div>

          <div class="row">
            <div class="label">상태</div>
            <div class="val"><div class="status-box-detail">{{ statusLabel(training?.status) }}</div></div>
          </div>

          <div class="row">
            <div class="label">최대 점수</div>
            <div class="val">{{ training?.maxScore != null ? training.maxScore : '—' }}</div>
          </div>

          <div class="row">
            <div class="label">합격 기준</div>
            <div class="val">{{ training?.passingScore != null ? training.passingScore : '—' }}</div>
          </div>

          <!-- 온라인/오프라인 조건부 정보 -->
          <div v-if="training?.type === 'ONLINE'" class="row">
            <div class="label">수강 시작일</div>
            <div class="val">{{ formatDate(training?.startDate) }}</div>
          </div>
          <div v-if="training?.type === 'ONLINE'" class="row">
            <div class="label">수강 종료일</div>
            <div class="val">{{ formatDate(training?.endDate) }}</div>
          </div>
          <div v-if="training?.type === 'ONLINE'" class="row">
            <div class="label">온라인 URL</div>
            <div class="val"><a :href="training.onlineUrl || training.link" target="_blank">{{ training.onlineUrl || training.link }}</a></div>
          </div>

          <div v-if="training?.type === 'OFFLINE'" class="row">
            <div class="label">교육 일시</div>
            <div class="val">{{ formatDate(training?.scheduledAt) }}</div>
          </div>

          <!-- 완료 시 추가 정보 -->
          <div v-if="String(training?.status||'').toUpperCase() === 'COMPLETED'" class="row">
            <div class="label">점수</div>
            <div class="val">{{ training?.score != null ? training.score : '—' }}</div>
          </div>
          <div v-if="String(training?.status||'').toUpperCase() === 'COMPLETED'" class="row">
            <div class="label">결과</div>
            <div class="val">{{ training?.result || '—' }}</div>
          </div>
          <div v-if="String(training?.status||'').toUpperCase() === 'COMPLETED'" class="row">
            <div class="label">제출일</div>
            <div class="val">{{ formatDateTime(training?.submittedAt) }}</div>
          </div>

        </section>

        <footer class="modal-actions">
          <button class="btn-outline" @click="$emit('edit', training)">수정</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
import trainingService from '@/services/trainingService';
export default {
  name: 'TrainingDetailPopup',
  props: { training: { type: Object, default: null }, visible: { type: Boolean, default: false } },
  data(){ return { certFile: null } },
  methods: {
    formatDate(d){ if(!d) return '—'; try{ return new Date(d).toLocaleDateString('ko-KR') }catch(e){return d} },
    formatDateTime(d){ if(!d) return '—'; try{ return new Date(d).toLocaleString('ko-KR') }catch(e){return d} },
    statusLabel(s){ if(!s) return '할당 전'; const up=String(s).toUpperCase(); if(up==='ACTIVE') return '진행 중'; if(up==='COMPLETED') return '완료'; return s },
    onFileChange(e){ const f=e.target.files && e.target.files[0]; if(f && f.type==='application/pdf') this.certFile=f; else { this.certFile=null; alert('PDF 파일만 업로드 가능합니다.') } },
    async uploadCert(){ if(!this.certFile) return; try{ const form=new FormData(); form.append('file', this.certFile); // endpoint unknown - stub
        alert('이수증 업로드는 백엔드 엔드포인트 연동 필요합니다.');
      }catch(e){ console.error(e); alert('업로드 실패') } },
    async onDelete(){ if(!confirm('이 교육을 삭제하시겠습니까?')) return; try{ await trainingService.delete(this.training.id); this.$emit('deleted', this.training); }catch(e){ console.error(e); alert('삭제 실패') } }
  }
}
</script>

<style scoped>
.detail-overlay{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(3,10,18,0.48); padding:20px; z-index:1400 }
.detail-modal{ width:720px; max-height:90vh; overflow:auto; background:#fff; border-radius:12px; padding:18px; display:flex; flex-direction:column }
.modal-top{ display:flex; align-items:center; justify-content:center; position:relative; height:48px }
.back-btn{ position:absolute; left:8px; top:8px; background:transparent; border:none }
.content{ display:flex; flex-direction:column; gap:12px; padding:6px 0; align-items:center }
.row, .desc-row{ display:flex; gap:12px; align-items:center; width:100%; max-width:640px; margin:0 auto; justify-content:center }
.label{ width:120px; color:#64748b; font-weight:700; text-align:right }
.val{ width:380px; max-width:100% }
.materials-list{ max-height:160px; overflow:auto }
.materials-scroll{ display:flex; flex-direction:column; gap:8px }
.materials-list::-webkit-scrollbar{ width:6px }
.materials-list::-webkit-scrollbar-thumb{ background:rgba(0,0,0,0.12); border-radius:6px }
.desc-row { grid-column: 1 / -1 }
.desc-box { background:#f8fbff; border:1px solid #eef3fb; padding:12px; border-radius:8px; max-height:140px; overflow:auto; color:#10243b }
.desc-box::-webkit-scrollbar{ width:6px }
.desc-box::-webkit-scrollbar-thumb{ background:rgba(0,0,0,0.08); border-radius:6px }
.modal-actions{ display:flex; justify-content:flex-end; gap:12px; margin-top:8px }
.btn-primary{ background:#294594; color:#fff; padding:8px 12px; border-radius:8px; border:none }
.btn-outline{ background:transparent; border:1px solid rgba(41,69,148,0.12); padding:8px 12px; border-radius:8px }
.btn-primary.danger{ background:#c94242 }
.content { align-items: flex-end; }               /* 섹션 안의 행 전체를 오른쪽으로 */
.row, .desc-row { justify-content: flex-end; }    /* 각 행을 오른쪽 끝으로 붙이기 */

.label {
  width: 120px;             /* 라벨 고정 너비 */
  text-align: right;
  margin-right: 12px;
}

.val {
  flex: 0 0 420px;          /* 입력/값 영역 고정 너비 */
  max-width: 100%;          /* 필요 시 부모 한도 내에서 */
}

/* status box in detail */
.status-box-detail{ display:inline-block; background:#fff; padding:8px 12px; border-radius:12px; border:1px solid rgba(41,69,148,0.08); color:#294594; font-weight:700 }

</style>
