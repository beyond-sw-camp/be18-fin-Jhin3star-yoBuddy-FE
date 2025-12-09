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

const auth = useAuthStore()
auth.loadUser()

// Wait for the router to be ready before mounting to avoid hydration/async-route timing issues
router.isReady().then(() => {
	app.mount('#app')
})

// Global Vue error handler to capture component info
app.config.errorHandler = (err, vm, info) => {
	try {
		const compName = vm && vm.type ? (vm.type.name || vm.type.__name || vm.type) : 'unknown'
		console.error('Vue global errorHandler:', { err, compName, info, vm })
	} catch (e) {
		console.error('Vue global errorHandler failed to log:', e)
	}
}

window.addEventListener('unhandledrejection', (ev) => {
	console.error('Unhandled promise rejection:', ev.reason)
})

router.onError((err) => {
	console.error('Router error loading async component:', err)
})
