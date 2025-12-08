import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Local dev server
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Production preview server (Render)
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173,

    // Production domains
    allowedHosts: ["connectafrica.store", "www.connectafrica.store", "localhost"],
  },
})
