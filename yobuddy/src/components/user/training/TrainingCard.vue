<template>
  <div class="training-card" @click="openDetail">
    <div class="hero" :style="bgStyle">
      <div class="badge" v-if="!training.hero">Yo!<br/>Buddy</div>
    </div>

    <div class="card-body">
      <div class="card-header-row">
        <div class="title">{{ training.title || '제목 없음' }}</div>
        <div class="status-box-inline">
          <div class="status-pill" :class="statusClass(training.status)">{{ statusLabel(training.status) }}</div>
        </div>
      </div>

      <div class="subtitle">{{ training.subtitle || training.description || '' }}</div>

      <div class="info-action-wrap">
        <div class="info-row">
          <div class="info-left">
            <div class="meta">
              <span class="date">📅 {{ getDisplayDate(training) }}</span>
              <span class="dot">·</span>
              <span class="mode">💻 {{ training.type === 'ONLINE' ? 'Online' : 'Offline' }}</span>
            </div>
          </div>
        </div>

          <div class="action-row">
            <button v-if="training?.type === 'ONLINE' && String(training.status||'').toUpperCase() !== 'COMPLETED'" class="btn-primary" @click.stop="openUrl">수강하기</button>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TrainingCard',
  props: { training: { type: Object, required: true } },
  computed: {
    bgStyle() {
      const url = this.training.hero || ''
      const fallback = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAEsCAYAAABo+xVRAAAACXBIWXMAAAsTAAALEwEAmpwYAAAgAElEQVR4nO3deZhdVZ3/8c+Zk0tpaKQgC0wCCEgl2AjaKIKICBJMFk0FY0OeUvhYmqEVpL0A5RQm1aogtX06gQaiNWHQPdCq6YpUxXKo16F1JQS1LYoGCLiECSmNhKmoF7m7O8//ZybnI58M9znXOe9s59957zvnOPXOu/3u/7e579n3Puq7tXd0xBEEEIIIYQQQgghhBBCiBDI3cA78FfgXy4K1m7nj2Zz2Mab3WbrV1PHlrGB1P1z9P0Qu6c4FVBMyAZ8B8bHWszAQsrN4Zk1+6Nm+5czZmo84zrXHo4Qp5zQ/7+Rf/4hfaXnSOby558wgjAdWC3bjE5mE6oXk1n3c0KgPQ/RJY6QdU0Yz8AfPj8+b83eXvbdJvKUoPPDiI48CQ1SAZ8Enm/vWt7s0lJf7BPuZgCzDjPvvcZJD8AwLkcxrK+YwD2f+FWtfEr4chGdGgTXeYLxDWl9fX57e3u1lzw2Nq6srCw8q8gLdFjuZrdjQ9vbm+vXrJ7Fhw4a0FDVgLdHPfLoELMPwhHchYEYpcDEY2giWssg5ngqzKHKYrM8AzRpo0TsVjnNUUNq/f79UZoLW6DuuANzGgmU1YHrSZsUzIHfrXH7jV+Lp332hL7zkQv5JvPPOO5v6+vq4mJgIAoihNGXCIaq62su8ty+7fv98p03OyskJOKnIqZZfFnnbY/H7/i4qLgnmPQk8gAKikAG6DmPz+K2seWWXVsqKuhKGhoa+oJJIU9PT/ty4UJtYW7duhXcz3/66Ve1wIMPPmjwb3/7W+9wzDHH1Pf399WSxZJBfAIwUpYkphgUx4A2YrmhEEqqDAaqlRqmqCbcUwJ3QY9/W/kFlk8/PzMAH3HRh/n8xhtvLBtXFsYGKioquJ49efLCjz/++KXfeeedGE3BRgsR+O6EGYwqZgvIByO5jV8JQSqv6J/61u+Fm7du6Y8//mjjwIEDbvtq1aqlTU1Nzpkz57p2u92kdoHKygp33777QnQ63ZalS5ee+fPnqWNjYwZaEX6cyOYJr2FViAjuhpBjgtPfffc13f/va30qNHj9TzTw8//DCzZ8+mAw88cMDl28nJyfTGG28EwuEYhx56aC1uu+2238/4+Pi43W7ru+++07hx4/K7dgO4lH3/6ieXFCvW/DREREfHNBQ0CaNe9f+21hV5eXu23siV3NzY2VhLPtGO1Z98OoJdBVDEQCjgY7l4aA0GdXuLzDUZBR5zAfdqhLC0t7R3k9/v5VfbzSg8mKiqr48OGDoMMW2Fz0yUVXKB4eFobY62tjdGjR+vo6Cg9evTwkyZNYlmWFBYWaoyMjM3V1VUVFRWZmJmoqKgo0T79y99/Nu3ayoqKHnvssbnk5ORwfHx8MMOsqybkLEzAI/zl1q1b079//7cZz+fznRQWFmbq6uqofYcPH5ZlWX3yySf6KQHrtM8//zy1t7eX2iywwgqapF+3nhb/AJCpNq7RdGuOWZFz0FVUVPS4oaElGI2KiAhTjBgxsF27dhZzqdZjE6tWraZDRoyAqqpL+2BoA8BjzF49+8jpnM8/mq1bt3z11VdBmKwYfqoWQwxAGacMwXJ3EUDGxp8bG1urq6mq70V3LyMgQ7zw8PIzs7Czfd999WXFYyE03AgFHMKblNQXAhVQ1ZnYhYW8vCwa8cbl1+6RmOr1T+x0mmurqABCLi9ujJvq0MU8lJX9//8Dt9/t+Pr6MjIyqKmpoRk2oP/y7C7H/QCY7XdH0ytLzxMAoMPqfffd5ybF7YXYGHWgviJf+ta35F+/xDpm56Ewppvf3r07r1y5smEYhoceeigcxOHh4sXuv/9+yWSywuzsLMuypKamk/F4nGEYfN9993XitX5+Plo2JKKiICxcuDCLwSvrzzjtjoFGsRkRFRWFEYsTLCpYTRGy8hl69vXnvvffq1avXHgNRVVVlS1XF445uWrFihTSbTZVZrFY/8nCx4sx48eOGxZo1a2rGMvPx8dEqldJkskj/OQzy34Ew6S3tJrk8zz/++HlvZrvd5OjoEKvVckYWFmjpb36rqalwIRFpqakZy7LrIkqq33nqrS/fjjz/OnDlz8FybzyJVchvX/Hjx4OEff/zx6urqUMOGDXXCxh07dujh3++/vzz1xIkTtywEzZ07V/K5hGEYrpw4ISUlRUdHR3Uejw3OOeec8o0bNzSZTCt33XXX4cwzzwCynWwr0ymGUuk7FYKqmhoaphk4cCAzZszo4YcfHh8cHHSdySfHA56bm9uNj4+3pgAwePDhN2O1uXS4or7z47HjAPDJycnHdgT55ptvXGNhYaHlpaWbPq8cxAAUYJvNZjQbDQ0NkxW0c6G3t9f8+eNHvnrrrbW2tw+wtYhRaGhoys/Pp7Ky8np4eFjn+++/PSUlpenooQLEdbtwddxzzz2ZPn06GzZsUEpKSmJiYqhUKiV9//nPjycnFZqam3b8yi0ZBPyo1NdXY2JjExERhOAxeuHBhWWYdHR1iY2PDJZdc4ne5UDue+HSKFJ+ePn2a4uJiKioqDAwM8Hq9mr/00kv+//6vf/2LEydOZPz48fHSSy/ZqlWrXihjVggQdujQweLFi6lqaqrevXv5/PPP6du3L8uXLyc3N5c9//rP57777sDJZF1ra1haRkXHbY1EU27///rWMYhQVZe/evTigp8uSJUvk8vlNlWV5eXmSrHT06NG9B1vFxcXAwECYTCbWrVsne3t7jxw5kjZs2HDNct5ss8+HDx9umj47O5vt27dfYcG1KlKAFtbw8PDzW9wfi7Tbb8HCxQtxudr3v//+J02aNLBo0aLre3t79+BDhw7VaJNJBhdffPHl82RlZdHd3T1qnKqqurRh0hXq6OhwNm7cmErLD5Vlp0uWLJ+STqezybKzVnZ2Nvbv32/6gvErkUymI7lczm0sLCx87DJ5nvXXnntw4cK+t7eXdXV1ZLNZWVlUV1f7ndu27dsEPaeiGJzspEmTVBUVFS62Wg16PZ0+fJjLL788wGNQWVnZeb3eXrBhQ2ZmZpabmxti0CwoqKiwP0zgYTDw3XffRX5PqwjQKVieSqWykydPnlu2bBlIS7B///675gxfvnz+p59+asYCxHI9MlrPZvP9+/fVUZfCCMG5/v37MzExgUwmE2iMt7e3W7hwYcp7PR4PyyD00nN7uVr+x7GY3B/bcsWLFx1vkoOHTkVmMhkADAbfY4KDg8NUVVWpmJiYl2gVXF1dDcR0qtRqt9ttvNx1a7KysqCqqsrEyy+/XJhiOI5p06YNRqMRi8VisNls9uCDD9ZJ2hUKCgpYrv9zuAgnJyfQ65EkRmVZmP5C5w8//LDZ2dm6//77QZCYly5dWp6enlaWEwg0NDT0Zbt06YIQyC6ejX87HA/H5/PvG4i46aLycxkMBm0ymcblcIlEoqKioqH6P+vLy0qR4cOH5Xa7XVJSUtHd3W1YeOhww451Z+vWrZpdpYezWazbNm0yCYGxsTGdOnXKWavz+ezYsYPDw8OuabjRoqWlpY0YMaJs7TfddNMXHx9kWZb+lwdjY2Orrq5u4chms1maNm2aRUVFTRhgNDY2am0tDh06FH3hhRceHF0DnM1mDTQ0NHR1dZWWloZgMK9duyZbbrkFBQVBpnGxcWlo+TgcWlntwW63W3+drt27a2tLTUt6z4+Hg0NDSwuLhoB64JP8m1tTWj0QikUqlkzNsul2/bikXX19fawFu7dGba9OnTw9XVFYfDEAeZnZ2trKwsad++vTdpb+nTp1t/8OBBXfZk4uPj503rFOva2lqcPn3ax44d07fffmvGgbDS0gJHjhwJtVqtZtevXw8kICkrx48f16gTRb2+vk7w8HC9bt3qIisr07QL66677urWrYAZGRnCrxVNj+3797f4+LjMSAkSsMyyVFKcn+cDPgRebzgWFqLNZqMkTEQYhnj++ef5wAMPmPc8m82mQYMG6dWrV3HNdfX8anFYS8HTt29XhYK/f/9+8q1bt2xuA7AGzGYzDQwMCAC8ffv2cjgcav3GIZrtdru4uLi2dDr169fEwWCxE3Py8lKu3btBkGOl18lkMmIYBgYGBs9tcXqF26tTJ05nK1GrXzJgxo50E6QMHomWTybKysgyFgiCze1NTU7v///8sFEqkknTlz5mKM+f333/N4PDQwsIGKiurac/j0zTffnFnr7rvvriq7FGYYP348e/fuzfr16+1052pSVCplH4lhmmk+l83Nzdnc3GwpTAflMBtaDofDGRkZt33bbNM5LS4vk+RuMEQxjGIb63XfffSmVxg0IuFwupUcffZQ1a9b4+uuvm3brPptLly7tTZs2EColEet8hEKhZGJiQn19PQCLFy9m+/btqampwOFwCsGxsbFZ8+bNuK9PTU1VZwlpMmLECBNFgnmsWrWKpqYmXXbZZWb6HDdWWV6yw8NDFotF6RZcFngSL3c53dfX18fW8rW1tQCfRSKRXS6XWnk8Zl76FD9/EkEmq1Wi4uLk9iOByOHXbYYeazZwO7e11dXdu+1tQ05vvz8/CvVymqpp+nsn//8ZyqVSnvv5s+fX+Xl5RnVQKNRQKPRpFXKn9vb26P9/f2svVZRVFOi0Wp3m81mO++8kzU1Nc7n80Ggl8tLdbvdLv331TqlUo15Yf+xYOZVKX7hwIUFBQYyNjd26LPBvf/9bCzVZHuh0upgyX/54i8k38vn8v/TRRw83Y8YMvXv3ZmJiwsWKFWWONl5TU9PZ2dnDQQDNJuVSSY6OjgpnTkz2yrWCEUEEAjDQM0s5xcXFZ44c8XScupLt379fJu2yifOc5z/m8OHDacYN9czMTMRiMWMMmB3AfzTOaLTau/d9+/bJnDlzvKaehr9emDRwoFZXV+vMmTO+/fZbm1E1Zrdbu7u70Wg0p512Wk2Y0Ww2H3zwAVqt1o9thmFQ+/fvd0zD8+MPP7RzwsDAQPp+0qgQPpmM2bNmbbfbk/dQIBCYZtfr8dzcHL/44gu1adOGU089Ne03HNp7770vVy6XR0lJSbNtXHnllbRwzc3NzLcLHjx4aEonDTaaoUMH5f8Pr3f69Ok8fvz45g0tLS1VYXBwMAoLC3XiiSfKp02bpldffVVNDLSzs4Msy1gsFkajkUlJSQxBEKVu3boqqar0OIkOfeLECUqlkvr6+vQOq9XMc889q4L++usvOyB6z58/9wK4MBiYJiUlJUpLSzNFCyifD2QHnE6nv0gnExMTUVVVZWVlRVmWqK2tpddee02Kx2QyS65cudLcnSsrK/rRRx9YZ8mXlJQ4w3xiyTPde++9Dh8+3BVvzFO++OILv/71r5WZmSmTSQybzbb55puPhoaGUpGRoVevXpJGZmZsZgLGjRs3btzITQwjPx65cuXqwoIAZX19XqXq9fi9evMnt7+9rHbt28kkk5GDgsbGxlNm3ePHh+3btzP//5z6mjGxsYyg9GvXz9dhh3KcdLquvTo0crLy3uRUkOg0+nSpUtdn56eTnavD/FXlGJm7dq10Xr06OGiiy5yXo0qCSxHQwmm/bp165g4cSKpVEr5fL47evTokchqN09zfc+fuIbyzWazM3Ge7du1qaZj+oBl8vXr14NBQtXn/99SXzZKSK+JCgoCCkiYrH42+//eb77rvvXEnXzc1NXb9+HaVSya233srY2JiMMX78+KxXr14jvvfee7YsuLi46Lt69ep7KXREhCCF8NKnHLusJ4PBPry8vLrKysosBKiqqsqrV68mEAig0+lsu7fOHcaMGZPoy8vLeuONN7oeHk43b95sMYr16aefrK6ujvy8pml6MrHyq69+8+STT5xoNgDxW3Wnz99v3rz0mjVrM4Dvpe3ta8B0dXVVQeCpLVu2TP2l0WjgwYMHAwXN1NRUk2g0GMMwRjQajY7e1NyHk5mAm6PRaLRq/d3p6aLvaj19fTdu3Bi5XC73wjrEcqT3YDCgubnZkiVLtGXLFiPdcXFxUVVVpefPn+vtt9+2Hz9+ZLFYrXEjPj4+K67S5cuHTz/9lL6+PlpXVxeRZFMoFIZBrDHG6Qky7bi4ON2yZYtKefvtt+nll1/WlpYWnDx5kmk0iiCK7h/p6vOv3/9+e/bs6ffdd3n++efNZZddiKzbbbtN169fdzgY6+qwfn/44QcVFRVpaGioU6dObdOnT0+I/dl169YNwzCy1u9vbJkc5efn04YNG6jo6NDPP/+c+/fvJ507d1rbmEwm9EMwcvOBVqvVORwOjBs3zr17772s6Xl5eSxfvnzIYDAYdVVVlxgfH89MJsMsW+Rkynt9hIfh3h1hDzkHkWVZWnKUpmXc2raoqKCurq5WlpaEkUnF+7du+9YhQk8L+XlZbZthWg0yrAMHPXu3StbW1tx5coV7dbu7u4EArp06ZLbt2+3oUOHstvt9Omnn2aS30wGAw8++GAZGRk4nU4sy9Kktra2qJ1AbxxfXVy4cEHOzs65du1a8u/tAEiopqamdu/eXVtr7u5u1qxZY8Ri8ezZs4FGo4NNmzYx/6fx4vkGkvb19bVy5UrXzNvbW/YeFxeXnD17tjGNsbW1ZdGiRbnGAt1ixYqaNm2aDev2KRRi7W3btpYv6aO68cUX1cxKZgFVX19vMplaXr16WnDw4EEj4kOHIiIC6TdzQ0DDMOLR0dF07NhR++23X7Lwiy++0L59e+ba2lpWrlxJF6zU1NSZQkFCNBxlypQxB2Aymf0a2j965yFJSUkPr9dcc03eAAA/9BMVSNGt6jcsAAAAAElFTkSuQmCC')"
      return { backgroundImage: url ? `url(${url})` : fallback, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
  },
  methods: {
    openDetail() { this.$emit('open', this.training) },
    formatDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('ko-KR') } catch(e){ return '' } },
    isUrl(v){ if(!v || typeof v !== 'string') return false; return /^https?:\/\//i.test(v.trim()) },
    openUrl(){
      const t = this.training || {}
      const url = t.onlineUrl || t.link || (this.isUrl(t.subtitle) ? t.subtitle : (this.isUrl(t.description) ? t.description : null))
      if (url) { window.open(url, '_blank') }
      else { alert('이 교육의 온라인 URL이 없습니다.') }
    },
    statusLabel(s){ if(!s) return '상태 없음'; const up=String(s).toUpperCase(); if(up==='PENDING') return '예정'; if(up==='IN_PROGRESS') return '진행 중'; if(up==='COMPLETED') return '완료'; if(up==='MISSED') return '미이수'; return s },
    statusClass(s){ const up=String(s||'').toUpperCase(); if(up==='PENDING') return 'pill-pending'; if(up==='COMPLETED') return 'pill-complete'; if(up==='IN_PROGRESS') return 'pill-active'; if(up==='MISSED') return 'pill-missed'; return 'pill-default' },
    getDisplayDate(t){
      if(!t) return ''
      const st = String(t.status||'').toUpperCase()
      if(st === 'COMPLETED' && t.completedAt) return this.formatDate(t.completedAt)
      if(st === 'ACTIVE' || st === 'IN_PROGRESS'){
        if(t.type === 'ONLINE') return this.formatDate(t.endDate || t.startDate)
        return this.formatDate(t.scheduledAt || t.startDate)
      }
      // fallback: prefer endDate, scheduledAt, startDate
      return this.formatDate(t.endDate || t.scheduledAt || t.startDate)
    }
  }
}
</script>

<style scoped>
.training-card{ width:330px; border-radius:12px; overflow:hidden; background:#fff; box-shadow:0 10px 24px rgba(16,36,59,0.10); cursor:pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; border:1px solid rgba(17,24,39,0.04); }
.training-card:hover{ transform: translateY(-4px); box-shadow:0 18px 36px rgba(16,36,59,0.16); }
.hero{ height:160px; position:relative; display:flex; align-items:flex-start; justify-content:flex-end; padding:10px; background:#dfe9f6; }
.badge{ position:absolute; left:130px; top:60px; background:#0c0c0c; color:#fff; padding:6px 10px; border-radius:16px; font-weight:800; font-size:13px; line-height:1.2; text-align:center; }
.status-pill{ padding:6px 12px; border-radius:20px; font-weight:700; font-size:13px; background:#eef3ff; color:#294594; position:absolute; right:12px; bottom:12px; box-shadow:0 6px 16px rgba(0,0,0,0.08); }
.pill-complete{ background:#e3f7e9; color:#0a9a52 }
.pill-active{ background:#e9f0ff; color:#294594 }
.pill-pending{ background:#f6f8d1; color:#b0b900 }
.pill-default{ background:#f6f8d1; color:#b0b900 }
.pill-missed{ background:#F8E3E2; color:#AE5E62 }
.card-body{ padding:16px 16px 14px 16px }
.title{ font-weight:800; color:#10243b; font-size:15px; margin-bottom:4px; max-width: 200px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical }
.subtitle{ color:#6d859a; font-size:13px; margin:6px 0 10px; line-height:1.3; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical }
.card-header-row{ display:flex; justify-content:space-between; align-items:center; gap:12px }
.status-box-inline{ display:flex; align-items:center }
.info-action-wrap{ display:flex; align-items:center; justify-content:space-between }
.info-row{ display:flex; align-items:center; gap:12px; min-height:44px }
.info-left{ display:flex; flex-direction:column; gap:8px }
.meta{ color:#4b5563; font-size:13px; display:flex; align-items:center; gap:8px; flex-wrap:wrap }
.meta .dot{ color:#cbd5e1; }
.program{ color:#123; font-weight:700; margin-top:2px }
.action-row{ display:flex; justify-content:flex-start; margin-top:0; min-height:44px }
.btn-primary{ background:#294594; color:#fff; padding:12px 20px; border-radius:12px; border:none; font-weight:800; box-shadow:0 10px 22px rgba(41,69,148,0.18); cursor:pointer; transition: transform 0.12s ease; white-space:nowrap }
.btn-primary:hover{ transform: translateY(-1px); }
.btn-primary.wide{ min-width:140px }

/* white box wrapper for status */
.status-box{ position:absolute; right:12px; bottom:12px; background:#fff; padding:6px; border-radius:10px; box-shadow:0 6px 18px rgba(16,36,59,0.06); }
.status-box .status-pill{ position:static; box-shadow:none }
.status-box-inline .status-pill{ position:static; box-shadow:none }
</style>
