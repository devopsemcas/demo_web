import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
  // Đọc VITE_API_URL từ .env để làm target cho proxy (chạy phía server của Vite,
  // không phải trong trình duyệt, nên KHÔNG bị chặn mixed-content dù target là http://)
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || 'http://localhost:3000'

  return {
    plugins: [
      vue(),
      basicSsl() // Trang chạy HTTPS để camera hoạt động khi truy cập qua IP LAN
    ],
    server: {
      host: true, // Cho phép truy cập qua địa chỉ IP trong mạng LAN (0.0.0.0)
      port: 5173,
      proxy: {
        // Trình duyệt chỉ gọi cùng-origin "/api/..." (https://<ip>:5173/api/...),
        // Vite sẽ chuyển tiếp (server-side) sang API thật (http://<ip>:3000).
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})