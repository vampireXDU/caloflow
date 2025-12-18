import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      // 这一步非常关键：将构建时的 API_KEY 注入到前端代码中的 process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  }
})