import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { qrcode } from 'vite-plugin-qrcode';

export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  // 安全获取环境变量并设置默认值
  const getEnv = (key) => env[key] || ''

  // 处理API基础地址 - 优先使用特定环境的配置
  const baseApi = (() => {
    // 优先使用模式特定的环境变量
    const modeSpecificApi = getEnv(`VITE_${mode.toUpperCase()}_BASE_API`)
    if (modeSpecificApi) return modeSpecificApi
    
    // 回退到通用配置
    const apiUrl = getEnv('VITE_BASE_API') || 'http://localhost:3000'

    // 自动补全协议（如果未包含）
    if (!apiUrl.startsWith('http')) {
      return command === 'serve' ? `http://${apiUrl}` : `https://${apiUrl}`
    }
    return apiUrl
  })()

  return {
    plugins: [
      vue(),
      // 只在开发模式下启用二维码插件
      mode === 'development' ? qrcode() : null
    ].filter(Boolean),
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
      host: '0.0.0.0', // 允许局域网访问
      port: 5173, // 指定端口
      proxy: {
  '/api': {
    target: baseApi,
    changeOrigin: true,
    secure: false,
    // 关键修改：不移除 /api，因为Apifox接口路径本身就包含 /api
    // rewrite: (path) => path.replace(/^\/api/, ''), // 注释掉或删除这行
    configure: (proxy) => {
      proxy.on('error', (err) => {
        console.error('Proxy Error:', err)
      })
    }
  }
},
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