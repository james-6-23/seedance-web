import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedState from 'pinia-plugin-persistedstate'
// 命令式调用的组件（ElMessage / ElNotification / ElMessageBox / ElLoading）由 JS 手动 import，
// unplugin 的按需样式不会覆盖它们，需在此显式引入样式，否则弹层无样式且定位错乱。
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-notification.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-overlay.css'
import 'element-plus/theme-chalk/el-loading.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useUiStore } from '@/store/ui'

const pinia = createPinia().use(piniaPersistedState)
const app = createApp(App).use(pinia).use(router)

useUiStore(pinia).applyDark()

app.mount('#app')
