import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { WaxSeal } from '../../WaxSeal'
import { api, type Me, type Seat } from '../api'
import { useApi } from '../hooks'

export function SeatScreen({ me, onLinked }: { me: Me; onLinked: (me: Me) => void }) {
  const seat = useApi<Seat>('seat')
  const [opened, setOpened] = useState(false)

  if (!seat.data) return <div className="screen"><Title /><p className="muted">{seat.error || 'Finding your place card…'}</p></div>
  const s = seat.data
  if (!s.linked) return <div className="screen"><Title /><FindMe onLinked={next => { onLinked(next); seat.reload() }} name={me.name} /></div>
  if (!s.revealed) return <div className="screen"><Title />
    <div className="card sealed-card">
      <div className="sealed-envelope" aria-hidden="true"><WaxSeal /></div>
      <h2>Your place card is sealed</h2>
      <p className="muted">We’re still playing table Tetris. Your seat will be revealed on the day, and we’ll send you a notification when it is.</p>
    </div>
  </div>
  if (!s.table) return <div className="screen"><Title /><div className="card"><h2>Almost there, {s.name?.split(' ')[0]}</h2><p className="muted">We haven’t put you at a table yet. Come and find us!</p></div></div>

  return <div className="screen seat-screen"><Title />
    <AnimatePresence mode="wait">
      {!opened ? <motion.div key="closed" className="place-card closed" exit={{ rotateX: 90, opacity: 0, transition: { duration: .45, ease: [.5, 0, .75, 0] } }}>
        <p className="eyebrow">A place has been set for</p>
        <p className="script big">{s.name}</p>
        <button className="button primary" onClick={() => { navigator.vibrate?.(30); setOpened(true) }}>Find my seat</button>
      </motion.div> : <Reveal key="open" seat={s} />}
    </AnimatePresence>
  </div>
}

const Title = () => <header className="screen-head"><p className="eyebrow">Wedding breakfast</p><h1>Find my seat</h1></header>

function Reveal({ seat }: { seat: Seat }) {
  const mates = seat.tablemates ?? []
  const radius = 108
  return <motion.div className="reveal" initial="hidden" animate="shown" variants={{ shown: { transition: { staggerChildren: .12 } } }}>
    <motion.div className="place-card open" initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: .7, ease: [.22, .61, .36, 1] }}>
      <p className="eyebrow">You’re on</p>
      <p className="script big">{seat.table}</p>
      {seat.seat ? <p className="muted">Seat {seat.seat}</p> : null}
    </motion.div>

    <div className="table-plan" aria-label={`${seat.table}: ${mates.map(m => m.name).join(', ')}`}>
      <svg viewBox="-150 -150 300 300" aria-hidden="true">
        <motion.circle r="64" className="table-top" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: .5, type: 'spring', stiffness: 120, damping: 14 }} />
        <motion.text y="6" textAnchor="middle" className="table-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .9 }}>{seat.table}</motion.text>
        {mates.map((mate, index) => {
          const angle = (index / mates.length) * Math.PI * 2 - Math.PI / 2
          const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius
          return <motion.g key={mate.id} initial={{ opacity: 0, x: 0, y: 0, scale: .4 }} animate={{ opacity: 1, x, y, scale: 1 }} transition={{ delay: .8 + index * .07, type: 'spring', stiffness: 140, damping: 16 }}>
            <circle r={mate.me ? 17 : 13} className={mate.me ? 'chair me' : 'chair'} />
            <text y="4" textAnchor="middle" className="chair-initial">{mate.name.split(' ').map(word => word[0]).slice(0, 2).join('')}</text>
            {mate.me && <motion.circle r="24" className="chair-halo" initial={{ scale: .6, opacity: 0 }} animate={{ scale: [1, 1.25, 1], opacity: [.8, .2, .8] }} transition={{ delay: 1.6, duration: 2.2, repeat: Infinity }} />}
          </motion.g>
        })}
      </svg>
    </div>

    {!!seat.neighbours?.length && <motion.section className="neighbours" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 + mates.length * .07 }}>
      <h2>Sitting beside you</h2>
      {seat.neighbours.map((n, index) => <motion.article key={n.id} className="card neighbour" initial={{ opacity: 0, x: index ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.9 + mates.length * .07 + index * .2 }}>
        <span className="avatar" aria-hidden="true">{n.name.split(' ').map(word => word[0]).slice(0, 2).join('')}</span>
        <div><h3>{n.name}</h3><p>{n.intro || 'Ask them how they know us!'}</p></div>
      </motion.article>)}
    </motion.section>}

    {mates.length > 3 && <motion.details className="card everyone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }}>
      <summary>Everyone on {seat.table}</summary>
      <ul>{mates.map(m => <li key={m.id} className={m.me ? 'me' : undefined}>{m.name}{m.me ? ' (you)' : ''}</li>)}</ul>
    </motion.details>}
  </motion.div>
}

function FindMe({ name, onLinked }: { name: string; onLinked: (me: Me) => void }) {
  const [query, setQuery] = useState(name)
  const [results, setResults] = useState<{ id: number; name: string }[] | null>(null)
  const [error, setError] = useState('')
  const search = async (event?: React.FormEvent) => {
    event?.preventDefault()
    try { setResults(await api(`people?q=${encodeURIComponent(query)}`)); setError('') } catch (e) { setError((e as Error).message) }
  }
  return <div className="card">
    <h2>Which name is yours?</h2>
    <p className="muted">We couldn’t match “{name}” to the guest list. Search for the name on your invitation.</p>
    <form onSubmit={search} className="inline-form"><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Your name" /><button className="button">Search</button></form>
    {error && <p className="form-error">{error}</p>}
    {results && (results.length ? <ul className="pick-list">{results.map(r => <li key={r.id}><button className="button ghost" onClick={async () => {
      try { onLinked(await api<Me>('me/link', { body: { personId: r.id } })) } catch (e) { setError((e as Error).message) }
    }}>{r.name}</button></li>)}</ul> : <p className="muted">No one by that name yet. The seating plan may not be up, so check back closer to the day.</p>)}
  </div>
}
