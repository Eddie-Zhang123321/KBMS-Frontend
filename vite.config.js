// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { qrcode } from 'vite-plugin-qrcode';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const getEnv = (key) => env[key] || ''

    const baseApi = (() => {
        const modeSpecificApi = getEnv(`VITE_${mode.toUpperCase()}_BASE_API`)
        if (modeSpecificApi) return modeSpecificApi
        
        const apiUrl = getEnv('VITE_BASE_API') || 'http://localhost:3000'
        if (!apiUrl.startsWith('http')) {
            return command === 'serve' ? `http://${apiUrl}` : `https://${apiUrl}`
        }
        return apiUrl
    })()

    return {
        plugins: [
            vue(),
            mode === 'development' ? qrcode() : null,
            VitePWA({
                registerType: 'autoUpdate',
                manifest: {
                    name: 'KBMS Mobile',
                    short_name: 'KBMS',
                    theme_color: '#4DBA87',
                    display: 'standalone', 
                    icons: [
                        {
                            src: 'pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ]
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
                }
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
            host: '0.0.0.0',
            port: 5173,
            proxy: {
                '/api': {
                    target: baseApi,
                    changeOrigin: true,
                    secure: false,
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
            },
            // Add this section to allow the ngrok host
            allowedHosts: ['a3d280dc1ea0.ngrok-free.app'] 
        },
        build: {
            outDir: `dist-${mode}`,
            emptyOutDir: true
        }
    }
})