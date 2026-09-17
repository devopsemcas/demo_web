<template>
  <main class="page">
    <header><h1>Quét thông tin Căn cước</h1><p>Vue 3 · Camera · QR · Tự động điền biểu mẫu</p></header>
    <section class="grid single">
      <QrScanner @detected="onDetected" @error="onError" />
    </section>
    <p v-if="error" class="hint warn">{{ error }}</p>
  </main>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import QrScanner from '../components/QrScanner.vue'
import { parseCCCD } from '../utils/cccdParser'
import { setScanResult } from '../scanStore'

const router = useRouter()
const error = ref('')

function onDetected(raw) {
  setScanResult(parseCCCD(raw))
  router.push({ name: 'result' })
}

function onError() {
  error.value = 'Không mở được camera. Hãy kiểm tra quyền Camera và thử Chrome/Edge.'
}
</script>
