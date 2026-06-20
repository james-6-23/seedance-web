import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedState from 'pinia-plugin-persistedstate'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useUiStore } from '@/store/ui'

const pinia = createPinia().use(piniaPersistedState)
const app = createApp(App).use(pinia).use(router)

useUiStore(pinia).applyDark()

app.mount('#app')
