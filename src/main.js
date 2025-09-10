// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import '@/styles/dialog.css'
// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 导入 PWA 注册
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

app.use(ElementPlus, {
  locale: zhCn,
})
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册 Service Worker（PWA）
registerSW({
  onNeedRefresh() {
    console.log('新内容可用，请刷新页面')
  },
  onOfflineReady() {
    console.log('应用已准备好离线使用')
  }
})

app.mount('#app')

console.log('🌐 环境变量:', import.meta.env)
console.log('🔍 VITE_DEVELOPMENT_BASE_API:', import.meta.env.VITE_DEVELOPMENT_BASE_API)
console.log('🔍 VITE_DEV_BASE_API:', import.meta.env.VITE_DEV_BASE_API)
console.log('🚀 当前模式:', import.meta.env.MODE)