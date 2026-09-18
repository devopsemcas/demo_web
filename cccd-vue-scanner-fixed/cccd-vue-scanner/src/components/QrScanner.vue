<template>
  <div class="scanner">
    <div class="camera-wrap" @click="tapToFocus">
      <video ref="video" class="camera" muted playsinline></video>
      <div class="scan-frame"><span></span></div>
      <div v-if="focusRing" class="focus-ring" :style="focusRingStyle"></div>
      <div v-if="loading" class="overlay">Đang mở camera...</div>
      <div v-if="error" class="overlay error">{{ error }}</div>
    </div>
    <div class="controls">
      <button @click="start" :disabled="running">{{ running ? 'Đang quét...' : 'Bật camera' }}</button>
      <button @click="stop" :disabled="!running">Dừng</button>
      <label v-if="cameras.length > 1" class="cam-select">Ống kính
        <select v-model="selectedCameraId" @change="switchCamera">
          <option v-for="c in cameras" :key="c.id" :value="c.id">{{ c.label || c.id }}</option>
        </select>
      </label>
      <label v-if="zoomMax > 1" class="zoom">Zoom
        <input type="range" :min="1" :max="zoomMax" step="0.1" v-model.number="zoom" @input="applyZoom" />
        {{ zoom.toFixed(1) }}x
      </label>
    </div>
    <p class="hint">Đưa QR CCCD vào khung. Camera sẽ ưu tiên autofocus và zoom nếu webcam hỗ trợ.</p>
    <p v-if="cameras.length > 1" class="hint">Nếu ảnh mờ không lấy nét được: thử đổi "Ống kính" — nhiều điện thoại mặc định chọn camera góc siêu rộng (ultra-wide), loại này lấy nét gần rất kém. Hãy chọn camera "Back Camera" chính (không phải "Ultra Wide").</p>
    <p v-if="running && !focusSupported" class="hint warn">Thiết bị/trình duyệt này không hỗ trợ ép autofocus qua web (thường gặp trên iPhone/Safari hoặc webcam laptop). Hãy chạm vào khung hình hoặc lùi/tiến máy để lấy nét thủ công.</p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import QrScanner from 'qr-scanner'

const emit = defineEmits(['detected', 'error'])
const video = ref(null)
const running = ref(false)
const loading = ref(false)
const error = ref('')
const zoom = ref(1)
const zoomMax = ref(1)
const focusSupported = ref(false)
const focusRing = ref(false)
const focusRingStyle = ref({})
let scanner = null
let track = null
let refocusTimer = null

// Một số trình duyệt (đặc biệt Chrome/Android) trả getCapabilities() rỗng
// ngay sau khi getUserMedia() resolve vì driver camera chưa kịp cập nhật.
// Nên thử lại vài lần thay vì chỉ set 1 lần duy nhất.
async function applyCameraCapabilities(attempt = 0) {
  track = video.value?.srcObject?.getVideoTracks?.()[0]
  if (!track) return
  const caps = track.getCapabilities?.() || {}
  // Bật debug này lên để xem trong DevTools (chrome://inspect khi nối USB)
  // caps thực sự trả về gì trên máy bạn — nếu focusMode là undefined thì
  // đó là do driver camera của máy không expose ra, không phải lỗi code.
  console.log('[QrScanner] capabilities:', caps)

  const wanted = { width: { ideal: 1920 }, height: { ideal: 1080 } }
  if (caps.focusMode?.includes?.('continuous')) {
    wanted.focusMode = 'continuous'
    focusSupported.value = true
  }
  if (caps.focusDistance) wanted.focusDistance = caps.focusDistance.min
  if (caps.resizeMode?.includes?.('crop-and-scale')) wanted.resizeMode = 'crop-and-scale'

  // QUAN TRỌNG: nhiều bản Chrome/Android âm thầm bỏ qua constraint kiểu
  // "advanced" (không lỗi, nhưng không áp dụng). Nên thử set ở cấp "basic"
  // (top-level) trước — cấp này được tôn trọng tốt hơn nhiều. Chỉ fallback
  // sang "advanced" (best-effort) nếu basic bị từ chối (OverconstrainedError).
  try {
    await track.applyConstraints(wanted)
  } catch (e) {
    console.warn('[QrScanner] basic constraints rejected, fallback to advanced', e)
    try { await track.applyConstraints({ advanced: [wanted] }) } catch {}
  }

  if (caps.zoom) {
    zoomMax.value = Number(caps.zoom.max || 1)
    zoom.value = Math.max(Number(caps.zoom.min || 1), 1)
    await applyZoom()
  }

  // Nếu chưa lấy được capabilities (object rỗng), thử lại vài lần trong 1.5s đầu
  if (!Object.keys(caps).length && attempt < 5) {
    refocusTimer = setTimeout(() => applyCameraCapabilities(attempt + 1), 300)
  }
}

// Liệt kê camera thật của máy và cho người dùng tự chọn đúng ống kính
// (camera chính, KHÔNG phải ultra-wide) — vì facingMode:'environment' trên
// điện thoại nhiều camera sau có thể tự chọn nhầm ống ultra-wide, loại này
// gần như không lấy nét macro được nên nhìn giống "không autofocus".
const cameras = ref([])
const selectedCameraId = ref('')
async function loadCameras() {
  try {
    cameras.value = await QrScanner.listCameras(true)
  } catch { cameras.value = [] }
}
async function switchCamera() {
  if (!scanner || !selectedCameraId.value) return
  await scanner.setCamera(selectedCameraId.value)
  await applyCameraCapabilities()
}

// Ép lấy nét thủ công (single-shot) tại điểm người dùng chạm vào —
// bù cho continuous focus không lấy nét tốt ở cự ly gần (macro).
async function tapToFocus(evt) {
  if (!track || !track.getCapabilities) return
  const caps = track.getCapabilities()
  const rect = evt.currentTarget.getBoundingClientRect()
  const x = (evt.clientX - rect.left) / rect.width
  const y = (evt.clientY - rect.top) / rect.height

  focusRingStyle.value = { left: `${x * 100}%`, top: `${y * 100}%` }
  focusRing.value = true
  setTimeout(() => { focusRing.value = false }, 600)

  const constraints = {}
  if (caps.pointsOfInterest) constraints.pointsOfInterest = [{ x, y }]
  if (caps.focusMode?.includes?.('single-shot')) constraints.focusMode = 'single-shot'
  if (!Object.keys(constraints).length) return

  try {
    await track.applyConstraints({ advanced: [constraints] })
    // Sau khi lấy nét 1 lần, quay lại continuous để tiếp tục theo dõi
    if (caps.focusMode?.includes?.('continuous')) {
      setTimeout(() => {
        track?.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {})
      }, 1500)
    }
  } catch {}
}

async function applyZoom() {
  if (!track || !track.getCapabilities) return
  const caps = track.getCapabilities()
  if (!caps.zoom) return
  try { await track.applyConstraints({ advanced: [{ zoom: Number(zoom.value) }] }) } catch {}
}

async function start() {
  error.value = ''
  loading.value = true
  try {
    if (!scanner) {
      scanner = new QrScanner(video.value, result => {
        const text = typeof result === 'string' ? result : result.data
        if (!text) return
        emit('detected', text)
        stop()
      }, { preferredCamera: 'environment', maxScansPerSecond: 12, returnDetailedScanResult: true })
    }
    await scanner.start()
    running.value = true
    await loadCameras()
    await applyCameraCapabilities()
  } catch (e) {
    error.value = 'Không mở được camera. Hãy kiểm tra quyền Camera và thử Chrome/Edge.'
    emit('error', e)
  } finally { loading.value = false }
}

function stop() {
  scanner?.stop()
  running.value = false
  clearTimeout(refocusTimer)
  if (video.value?.srcObject) {
    video.value.srcObject.getTracks().forEach(t => t.stop())
    video.value.srcObject = null
  }
  track = null
  focusSupported.value = false
}

watch(zoom, applyZoom)
onMounted(start)
onBeforeUnmount(stop)
defineExpose({ start, stop })
</script>
