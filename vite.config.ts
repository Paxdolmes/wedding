import react from '@vitejs/plugin-react'
import { copyFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type Connect, type Plugin } from 'vite'

/** The wedding party's own links (see `weddingParty` in src/wedding.ts). Each is the save-the-date page at its own address. */
const partyPages = ['bridesmaid', 'groomsman']

function weddingPartyPages(): Plugin {
  // While developing or previewing, /bridesmaid and /groomsman serve the save-the-date page.
  const rewrite: Connect.NextHandleFunction = (request, _response, next) => {
    const match = request.url?.match(/^\/([a-z]+)\/?(\?.*)?$/)
    if (match && partyPages.includes(match[1])) request.url = `/${match[2] ?? ''}`
    next()
  }
  return {
    name: 'wedding-party-pages',
    configureServer: server => { server.middlewares.use(rewrite) },
    configurePreviewServer: server => { server.middlewares.use(rewrite) },
    // In the build, each gets a copy of the page, so Cloudflare serves it at /bridesmaid/ and /groomsman/.
    async writeBundle(options) {
      const dir = options.dir ?? resolve(import.meta.dirname, 'dist')
      for (const page of partyPages) {
        await mkdir(resolve(dir, page), { recursive: true })
        await copyFile(resolve(dir, 'index.html'), resolve(dir, page, 'index.html'))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), weddingPartyPages()],
  build: {
    rollupOptions: {
      // The invitation at / and the guest app at /app/.
      input: { main: resolve(import.meta.dirname, 'index.html'), app: resolve(import.meta.dirname, 'app/index.html') },
    },
  },
  // In development the guest app's backend runs under `wrangler dev` on port 8787.
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
})
