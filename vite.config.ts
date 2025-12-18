import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量，第二个参数是 root 目录，第三个参数 '' 表示加载所有前缀的变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      // 关键修复：
      // 直接定义 'process.env' 对象。
      // 1. 解决浏览器中 "process is not defined" 的崩溃问题。
      // 2. 将需要的 Key 显式注入进去。
      'process.env': {
        API_KEY: env.API_KEY,
        // 允许通过 process.env 读取 DeepSeek Key，作为 import.meta.env 的补充
        VITE_DEEPSEEK_API_KEY: env.VITE_DEEPSEEK_API_KEY,
        NODE_ENV: JSON.stringify(mode),
      }
    }
  }
})