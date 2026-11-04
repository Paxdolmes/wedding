import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // The invitation at / and the guest app at /app/.
      input: { main: resolve(import.meta.dirname, 'index.html'), app: resolve(import.meta.dirname, 'app/index.html') },
    },
  },
  // In development the guest app's backend runs under `wrangler dev` on port 8787.
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
})
