import { useCallback, useEffect, useState } from 'react'
import { Monogram } from '../Monogram'
import { api, session, type Config, type Me } from './api'
import { refreshPush } from './push'
import { Home } from './screens/Home'
import { SeatScreen } from './screens/Seat'
import { CameraScreen } from './screens/Camera'
import { MusicScreen } from './screens/Music'
import { GamesScreen } from './screens/Games'
import { HostScreen } from './screens/Host'

const tabs = [
  { id: 'home', label: 'Home', icon: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z' },
  { id: 'seat', label: 'My seat', icon: 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c0-4 3.6-7 8-7s8 3 8 7' },
  { id: 'camera', label: 'Camera', icon: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z' },
  { id: 'music', label: 'Music', icon: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  { id: 'games', label: 'Predictions', icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4' },
] as const
export type Tab = typeof tabs[number]['id'] | 'host'

const readTab = (): Tab => {
  const hash = location.hash.replace('#', '')
  return hash === 'host' || tabs.some(tab => tab.id === hash) ? hash as Tab : 'home'
}

export function GuestApp() {
  const [tab, setTab] = useState<Tab>(readTab)
  const [config, setConfig] = useState<Config | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [ready, setReady] = useState(false)

  const loadMe = useCallback(async () => {
    if (!session.guestToken) { setMe(null); return }
    try { setMe(await api<Me>('me')) } catch (e) { if ((e as { status?: number }).status === 401) { session.guestToken = null; setMe(null) } }
  }, [])

  useEffect(() => {
    Promise.all([api<Config>('config').then(setConfig).catch(() => {}), loadMe()]).finally(() => setReady(true))
    refreshPush()
    const onHash = () => { setTab(readTab()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [loadMe])

  const go = (next: Tab) => { if (location.hash !== `#${next}`) location.hash = next; else setTab(next) }

  if (!ready) return <div className="app-loading"><Monogram size={120} /></div>
  if (tab === 'host') return <HostScreen config={config} onExit={() => go('home')} />
  if (!me) return <Join config={config} onJoined={me => { setMe(me); go('home') }} onHost={() => go('host')} />

  return <div className="app-shell">
    <main className="app-main" key={tab}>
      {tab === 'home' && <Home me={me} config={config} go={go} />}
      {tab === 'seat' && <SeatScreen me={me} onLinked={setMe} />}
      {tab === 'camera' && <CameraScreen me={me} onShot={loadMe} />}
      {tab === 'music' && <MusicScreen config={config} />}
      {tab === 'games' && <GamesScreen />}
    </main>
    <nav className="tab-bar" aria-label="Guest app">
      {tabs.map(item => <a key={item.id} href={`#${item.id}`} aria-current={tab === item.id ? 'page' : undefined}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} /></svg>
        <span>{item.label}</span>
      </a>)}
    </nav>
  </div>
}

function Join({ config, onJoined, onHost }: { config: Config | null; onJoined: (me: Me) => void; onHost: () => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      const result = await api<{ token: string; me: Me }>('join', { body: { name, code } })
      session.guestToken = result.token
      onJoined(result.me)
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <div className="join">
    <Monogram size={190} className="join-mark" />
    <p className="eyebrow">24 August 2028 · Caswell House</p>
    <h1>Welcome to our <em>wedding weekend</em></h1>
    <p className="lede">Your seat, a disposable camera, song requests and a little friendly competition, all in one place. We’ll send you the odd notification too, so you never miss the important bits.</p>
    <form onSubmit={submit} className="card join-form">
      <label>Your name<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="First and last name" required minLength={2} /></label>
      {config?.joinCodeRequired && <label>Guest code<input value={code} onChange={e => setCode(e.target.value)} placeholder="From your invitation" required autoCapitalize="characters" /></label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary" disabled={busy}>{busy ? 'Joining…' : 'Join the weekend'}</button>
      <p className="hint">Use the name on your invitation so we can find your seat.</p>
    </form>
    <button className="link-button" onClick={onHost}>Imogen, Dan, best man or maid of honour? Sign in here</button>
  </div>
}
