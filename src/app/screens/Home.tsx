import { useEffect, useState } from 'react'
import { Monogram } from '../../Monogram'
import type { Config, InboxItem, Me } from '../api'
import type { Tab } from '../GuestApp'
import { timeAgo, useApi, useNow } from '../hooks'
import { enablePush, iosNeedsInstall, pushState, type PushState } from '../push'

const CEREMONY = Date.parse('2028-08-24T14:00:00+01:00')
const CARRIAGES = Date.parse('2028-08-25T01:00:00+01:00')

export function Home({ me, config, go }: { me: Me; config: Config | null; go: (tab: Tab) => void }) {
  const inbox = useApi<InboxItem[]>('inbox', 30_000)
  const now = useNow(1000)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (event: MessageEvent) => { if (event.data?.type === 'notification') inbox.reload() }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [inbox])

  const firstName = me.name.split(' ')[0]
  return <div className="screen home">
    <header className="home-head">
      <Monogram size={132} />
      <p className="eyebrow">Hello, {firstName}</p>
    </header>

    <Countdown now={now} />
    <PushCard config={config} />

    <section className="card inbox" aria-labelledby="inbox-title">
      <div className="card-head"><h2 id="inbox-title">From Imogen &amp; Dan</h2>{inbox.data && inbox.data.length > 0 && <span className="pill">{inbox.data.length}</span>}</div>
      {inbox.data?.length ? <ol className="inbox-list">{inbox.data.map(item => <li key={item.id}>
        <a href={item.url.startsWith('/app/') ? item.url.slice(5) : '#home'}>
          <strong>{item.title}</strong>
          <span>{item.body}</span>
          <small>{item.sent_by} · {timeAgo(item.send_at, now)}</small>
        </a>
      </li>)}</ol> : <p className="muted">Nothing yet. Over the weekend we’ll let you know when the bar opens, when to find your seat and when the dancefloor needs you.</p>}
    </section>

    <section className="tiles" aria-label="Things to do">
      <button className="tile" onClick={() => go('seat')}><span className="tile-kicker">On the day</span><strong>Find my seat</strong><span>Your table and who you’re sitting beside</span></button>
      <button className="tile" onClick={() => go('camera')}><span className="tile-kicker">{me.shots - me.shotsUsed} of {me.shots} shots left</span><strong>Disposable camera</strong><span>Developed the morning after</span></button>
      <button className="tile" onClick={() => go('music')}><span className="tile-kicker">Before &amp; during</span><strong>Song requests</strong><span>And the Battle of the Bangers</span></button>
      <button className="tile" onClick={() => go('games')}><span className="tile-kicker">Win bragging rights</span><strong>Predictions</strong><span>Who cries first? How long are the speeches?</span></button>
    </section>

    <footer className="app-foot">
      <a href="/">Our invitation &amp; the day’s details</a>
      <a href="#host">Couple &amp; helpers</a>
    </footer>
  </div>
}

function Countdown({ now }: { now: number }) {
  if (now >= CARRIAGES) return <section className="countdown card"><p className="script">Thank you</p><p>For dancing, laughing and celebrating with us. The photos from everyone’s cameras are in the gallery.</p></section>
  if (now >= CEREMONY - 10 * 3600_000) return <section className="countdown card"><p className="script">Today’s the day</p><p>{now < CEREMONY ? 'The ceremony begins at 2pm.' : 'We’re married! Now, to the bar.'}</p></section>
  const left = CEREMONY - now
  const parts = [
    { value: Math.floor(left / 86400_000), unit: 'days' },
    { value: Math.floor(left / 3600_000) % 24, unit: 'hours' },
    { value: Math.floor(left / 60_000) % 60, unit: 'mins' },
    { value: Math.floor(left / 1000) % 60, unit: 'secs' },
  ]
  return <section className="countdown card" aria-label={`${parts[0].value} days until the wedding`}>
    <p className="eyebrow">Until we say “I do”</p>
    <div className="countdown-row">{parts.map(part => <div key={part.unit}><strong>{part.value}</strong><span>{part.unit}</span></div>)}</div>
    <p className="muted">Thursday 24 August 2028 · 2pm · Caswell House</p>
  </section>
}

function PushCard({ config }: { config: Config | null }) {
  const [state, setState] = useState<PushState>(pushState)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (state === 'granted') return null
  if (state === 'needs-install' || iosNeedsInstall()) return <section className="card push-card">
    <h2>Get our notifications</h2>
    <p>On iPhone, add this app to your Home Screen first:</p>
    <ol className="steps"><li>Tap <strong>Share</strong> <span aria-hidden="true">(the square with an arrow)</span> at the bottom of Safari.</li><li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li><li>Open <strong>I &amp; D</strong> from your Home Screen and tap “Turn on notifications”.</li></ol>
  </section>
  if (state === 'unsupported') return <section className="card push-card"><h2>Notifications</h2><p className="muted">This browser can’t show notifications, so keep an eye on the messages below instead.</p></section>
  if (state === 'denied') return <section className="card push-card"><h2>Notifications are off</h2><p className="muted">You’ve blocked notifications for this app. You can turn them back on in your phone’s settings, or just check the messages below.</p></section>
  return <section className="card push-card">
    <h2>Don’t miss a thing</h2>
    <p>We’ll only send the good stuff: when the bar opens, when dinner’s served and when the dancefloor needs you.</p>
    {error && <p className="form-error">{error}</p>}
    <button className="button primary" disabled={busy || !config} onClick={async () => {
      setBusy(true); setError('')
      try { setState(await enablePush(config!.vapidPublicKey)) } catch (e) { setError((e as Error).message || 'Couldn’t turn on notifications.') } finally { setBusy(false) }
    }}>{busy ? 'One moment…' : 'Turn on notifications'}</button>
  </section>
}
