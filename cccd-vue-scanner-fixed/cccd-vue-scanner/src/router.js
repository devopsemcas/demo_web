import { createRouter, createWebHistory } from 'vue-router'
import ScanView from './views/ScanView.vue'
import ResultView from './views/ResultView.vue'
import { scanResult } from './scanStore'

const routes = [
  { path: '/', name: 'scan', component: ScanView },
  {
    path: '/result',
    name: 'result',
    component: ResultView,
    // Nếu vào thẳng /result mà chưa có dữ liệu quét (vd. F5 lại trang) thì
    // đá về lại trang quét, tránh hiển thị form trống gây khó hiểu.
    beforeEnter: () => {
      if (!scanResult.citizenId && !scanResult.raw) return { name: 'scan' }
      return true
    }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
