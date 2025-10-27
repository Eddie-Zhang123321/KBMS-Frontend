import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createHtmlPlugin } from 'vite-plugin-html'
import viteCompression from 'vite-plugin-compression'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => {
  // 加载环境变量（process.cwd() 表示项目根目录）
  const env = loadEnv(mode, process.cwd(), '')

  // 安全获取环境变量并设置默认值
  const getEnv = (key) => env[key] || ''

  // 处理API基础地址（确保包含协议）
  const baseApi = (() => {
    const apiUrl = getEnv(`VITE_${mode.toUpperCase()}_BASE_API`) ||
      getEnv('VITE_DEV_BASE_API') ||
      getEnv('VITE_BASE_API') ||
      'http://localhost:3000'

    // 自动补全协议（如果未包含）
    if (!apiUrl.startsWith('http')) {
      return command === 'serve' ? `http://${apiUrl}` : `https://${apiUrl}`
    }
    return apiUrl
  })()

  // 根据环境变量决定是否启用分析
  const isAnalyze = env.VITE_BUNDLE_ANALYZE === 'true'

  return {
    plugins: [
      vue(),
      // HTML 压缩和变量注入
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            title: 'InsightFlow - 金融知识管理系统',
            injectScript: mode === 'development' 
              ? '<script>console.log("Development Mode")</script>' 
              : ''
          }
        }
      }),
      // Gzip/Brotli 压缩
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240, // 10kb
        algorithm: 'gzip',
        ext: '.gz',
        deleteOriginFile: false
      }),
      // 可选：Brotli 压缩（更高效）
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br'
      }),
      // 图片优化
      ViteImageOptimizer({
        // 图片质量配置
        png: {
          quality: 70,
        },
        jpeg: {
          quality: 70,
        },
        jpg: {
          quality: 70,
        },
        webp: {
          lossless: false,
          quality: 75,
        },
        avif: {
          lossless: false,
          quality: 70,
        },
        // 公共配置
        includePublic: true,
        logStats: true,
      }),
      // 包分析插件（仅在生产环境启用）
      isAnalyze && visualizer({
        filename: 'bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
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
      proxy: {
        '/api': {
          target: baseApi,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
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
    
    // 构建优化配置
    build: {
      outDir: `dist-${mode}`,
      emptyOutDir: true,
      
      // 代码压缩配置
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // 生产环境移除 console
          drop_debugger: true, // 始终移除 debugger
          pure_funcs: ['console.log', 'console.info'] // 移除特定函数
        },
        mangle: {
          safari10: true, // 兼容 Safari 10
        },
      },
      
      // Rollup 打包配置
      rollupOptions: {
        output: {
          // 文件命名和分类
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name.split('.')[1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return 'static/images/[name]-[hash][extname]'
            }
            if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
              return 'static/fonts/[name]-[hash][extname]'
            }
            return 'static/[ext]/[name]-[hash][extname]'
          },
          
          // 手动代码分割
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              // 将 node_modules 中的依赖分组
              if (id.includes('vue')) {
                return 'vue-vendor'
              }
              if (id.includes('echarts')) {
                return 'charts-vendor'
              }
              if (id.includes('axios')) {
                return 'network-vendor'
              }
              // 其他依赖按包名分组
              return 'vendor'
            }
          }
        }
      },
      
      // CSS 代码分割
      cssCodeSplit: true,
      cssMinify: true,
      
      // chunk 大小警告限制
      chunkSizeWarningLimit: 2000,
      
      // 源映射配置
      sourcemap: mode === 'development', // 仅开发环境开启
      
      // 资源内联阈值
      assetsInlineLimit: 4096, // 4kb 以下资源转为 base64
    },
    
    // 预览服务器配置
    preview: {
      port: 4173,
      host: true
    }
  }
})