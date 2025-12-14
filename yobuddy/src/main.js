import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import VueApexCharts from 'vue3-apexcharts'
import { useAuthStore } from '@/store/authStore'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  console.log = () => {}
  console.debug = () => {}
  console.info = () => {}
  console.warn = () => {}
}

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Register ApexCharts globally
app.component('VueApexCharts', VueApexCharts)

const auth = useAuthStore()
auth.loadUser()

router.isReady().then(() => {
	app.mount('#app')
})

// Vue runtime error
app.config.errorHandler = (err, vm, info) => {
	if (isProd) {
		console.error(err)
		return
	}

	try {
		const compName =
			vm && vm.type
				? vm.type.name || vm.type.__name || 'AnonymousComponent'
				: 'unknown'

		console.error('Vue global errorHandler:', {
			err,
			compName,
			info,
			vm
		})
	} catch (e) {
		console.error('Vue global errorHandler failed:', e)
	}
}

// Promise rejection
window.addEventListener('unhandledrejection', (ev) => {
	if (isProd) {
		console.error(ev.reason)
		return
	}
	console.error('Unhandled promise rejection:', ev)
})

// Router async error
router.onError((err) => {
	console.error('Router error loading async component:', err)
})
