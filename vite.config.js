import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ command, mode }) => {
  // 加载环境变量（process.cwd() 表示项目根目录）
  const env = loadEnv(mode, process.cwd(), '')

  // 安全获取环境变量并设置默认值
  const getEnv = (key) => env[key] || ''

  // 处理API基础地址（确保包含协议）
  const baseApi = (() => {
    const apiUrl = getEnv(`VITE_${mode.toUpperCase()}_BASE_API`) ||
                  getEnv('VITE_BASE_API') ||
                  'http://localhost:3000'

    // 自动补全协议（如果未包含）
    if (!apiUrl.startsWith('http')) {
      return command === 'serve' ? `http://${apiUrl}` : `https://${apiUrl}`
    }
    return apiUrl
  })()

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    define: {
      'process.env': {},
      __APP_ENV__: JSON.stringify(mode)
    },
    server: {
      proxy: {
        '/api': {
          target: baseApi,
          changeOrigin: true,
          secure: false,  // 如果是https需要证书验证
          rewrite: (path) => path.replace(/^\/api/, ''),
          // 添加协议验证保护
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('Proxy Error:', err)
            })
          }
        }
      },
      // 防止HMR断开
      hmr: {
        protocol: 'ws',
        host: 'localhost'
      }
    },
    build: {
      outDir: `dist-${mode}`,
      emptyOutDir: true
    }
  }
})