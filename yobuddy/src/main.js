import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Register ApexCharts globally so pages can use <VueApexCharts />
app.component('VueApexCharts', VueApexCharts)

app.mount('#app')
