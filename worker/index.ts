import type { Env } from './hub'
export { WeddingHub } from './hub'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) return env.HUB.get(env.HUB.idFromName('weekend')).fetch(request)
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
