import { useState } from 'react'
import { Monogram } from '../../Monogram'
import { api, session, type Battle, type Config, type Predictions, type Role, type Song, type StaffSession } from '../api'
import { formatWhen, timeAgo, useApi } from '../hooks'
import { presets } from '../presets'

type Overview = { guests: number; subscribed: number; people: number; photos: number; songs: number; tables: string[]; groups: string[]; hostPasscodeSet: boolean }
type Sent = { id: number; title: string; body: string; audience: { kind: string; values?: string[] }; sent_by: string; send_at: number; status: string; delivered: number; failed: number }
type Person = { id: number; name: string; table_name: string; seat: number; intro: string; groups: string }
type Settings = Record<string, string>
type Code = { code: string; role: Role; label: string }

const sectionsFor = (role: Role) => role === 'host' ? ['Send', 'DJ', 'Guests', 'Games', 'Settings'] as const : role === 'helper' ? ['Send'] as const : ['DJ'] as const
type Section = 'Send' | 'DJ' | 'Guests' | 'Games' | 'Settings'

export function HostScreen({ config, onExit }: { config: Config | null; onExit: () => void }) {
  const [staff, setStaff] = useState<StaffSession | null>(session.staff)
  const [section, setSection] = useState<Section>(() => staff ? sectionsFor(staff.role)[0] : 'Send')
  if (!staff) return <Login onIn={next => { session.staff = next; setStaff(next); setSection(sectionsFor(next.role)[0]) }} onExit={onExit} />
  const sections = sectionsFor(staff.role)
  return <div className="host">
    <header className="host-head">
      <Monogram size={56} ring={false} />
      <div><p className="eyebrow">{staff.role === 'host' ? 'Host' : staff.role === 'dj' ? 'DJ booth' : 'Helper'}</p><h1>{staff.label}</h1></div>
      <button className="link-button" onClick={onExit}>Guest view</button>
    </header>
    {sections.length > 1 && <nav className="segmented host-tabs">{sections.map(s => <button key={s} aria-selected={section === s} onClick={() => setSection(s)}>{s}</button>)}</nav>}
    {section === 'Send' && <Send />}
    {section === 'DJ' && <DjBoard />}
    {section === 'Guests' && <Guests />}
    {section === 'Games' && <GamesAdmin config={config} />}
    {section === 'Settings' && <SettingsAdmin onSignOut={async () => { await api('staff/logout', { method: 'POST' }).catch(() => {}); session.staff = null; setStaff(null) }} />}
  </div>
}

function Login({ onIn, onExit }: { onIn: (staff: StaffSession) => void; onExit: () => void }) {
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  return <div className="join">
    <Monogram size={150} />
    <h1>Couple &amp; <em>helpers</em></h1>
    <p className="lede">Imogen and Dan sign in with their passcode. The best man, maid of honour and DJ use the code Imogen and Dan gave them.</p>
    <form className="card join-form" onSubmit={async e => {
      e.preventDefault(); setError('')
      try { onIn(await api<StaffSession>('staff/login', { body: { code, label } })) } catch (err) { setError((err as Error).message) }
    }}>
      <label>Passcode or helper code<input value={code} onChange={e => setCode(e.target.value)} autoComplete="current-password" type="password" required /></label>
      <label>Your name, shown on notifications <small>(couple only)</small><input value={label} onChange={e => setLabel(e.target.value)} placeholder="Imogen & Dan" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary">Sign in</button>
    </form>
    <button className="link-button" onClick={onExit}>Back to the guest app</button>
  </div>
}

function Send() {
  const overview = useApi<Overview>('staff/overview', 30_000)
  const sent = useApi<Sent[]>('staff/notifications', 10_000)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/app/#home')
  const [kind, setKind] = useState<'all' | 'tables' | 'groups'>('all')
  const [values, setValues] = useState<string[]>([])
  const [later, setLater] = useState(false)
  const [sendAt, setSendAt] = useState('')
  const [status, setStatus] = useState('')
  const toggle = (value: string) => setValues(v => v.includes(value) ? v.filter(x => x !== value) : [...v, value])
  const o = overview.data
  const options = kind === 'tables' ? o?.tables ?? [] : kind === 'groups' ? o?.groups ?? [] : []
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setStatus('')
    if (!later && !confirm(`Send “${title}” to ${kind === 'all' ? 'everyone' : values.join(', ')} now?`)) return
    try {
      const result = await api<{ scheduled: boolean; recipients: number | null }>('staff/notifications', { body: { title, body, url, audience: kind === 'all' ? { kind } : { kind, values }, sendAt: later && sendAt ? new Date(sendAt).toISOString() : undefined } })
      setStatus(result.scheduled ? 'Scheduled.' : `Sending to ${result.recipients} ${result.recipients === 1 ? 'phone' : 'phones'}.`)
      setTitle(''); setBody(''); sent.reload()
    } catch (err) { setStatus((err as Error).message) }
  }
  return <div className="host-section">
    {o && <p className="stat-line"><strong>{o.subscribed}</strong> of {o.guests} guests have notifications on</p>}
    <div className="presets" aria-label="Ready-made messages">{presets.map(p => <button key={p.title} className="chip" onClick={() => { setTitle(p.title); setBody(p.body); setUrl(p.url) }}>{p.title}</button>)}</div>
    <form className="card" onSubmit={submit}>
      <label>Title<input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} required placeholder="🍸 The bar is open" /></label>
      <label>Message<textarea value={body} onChange={e => setBody(e.target.value)} maxLength={240} required rows={3} placeholder="Your first drink is on us." /></label>
      <fieldset><legend>Send to</legend>
        <div className="choices">{(['all', 'tables', 'groups'] as const).map(k => <button type="button" key={k} className={`chip${kind === k ? ' on' : ''}`} onClick={() => { setKind(k); setValues([]) }}>{k === 'all' ? 'Everyone' : k === 'tables' ? 'Tables' : 'Groups'}</button>)}</div>
        {kind !== 'all' && (options.length ? <div className="choices">{options.map(v => <button type="button" key={v} className={`chip small${values.includes(v) ? ' on' : ''}`} onClick={() => toggle(v)}>{v}</button>)}</div>
          : <p className="hint">Add {kind} to the guest list first (Guests tab).</p>)}
      </fieldset>
      <label className="check"><input type="checkbox" checked={later} onChange={e => setLater(e.target.checked)} /> Schedule for later</label>
      {later && <label>Send at<input type="datetime-local" value={sendAt} onChange={e => setSendAt(e.target.value)} required /></label>}
      <button className="button primary">{later ? 'Schedule' : 'Send now'}</button>
      {status && <p className="hint" role="status">{status}</p>}
    </form>
    <h2 className="section-title">Sent &amp; scheduled</h2>
    <ul className="sent-list">{sent.data?.map(n => <li key={n.id} className="card">
      <strong>{n.title}</strong><span>{n.body}</span>
      <small>{n.status === 'scheduled' ? `Scheduled for ${formatWhen(n.send_at)}` : `${timeAgo(n.send_at)} · ${n.delivered} delivered${n.failed ? `, ${n.failed} failed` : ''}`} · {n.audience.kind === 'all' ? 'Everyone' : n.audience.values?.join(', ')} · {n.sent_by}</small>
      {n.status === 'scheduled' && <button className="link-button" onClick={async () => { await api(`staff/notifications/${n.id}`, { method: 'DELETE' }); sent.reload() }}>Cancel</button>}
    </li>)}</ul>
  </div>
}

function DjBoard() {
  const songs = useApi<Song[]>('songs', 5000)
  const update = async (id: number, change: Partial<{ played: boolean; hidden: boolean }>) => { await api(`staff/songs/${id}`, { method: 'PATCH', body: change }); songs.reload() }
  const list = songs.data ?? []
  return <div className="host-section dj">
    <p className="stat-line">Live requests, most votes first. Refreshes every few seconds.</p>
    <ol className="chart dj-chart">{list.filter(s => !s.played).map((s, i) => <li key={s.id}>
      <span className="rank">{i + 1}</span>
      <div className="song"><strong>{s.title}</strong><span>{s.artist} · {s.votes} {s.votes === 1 ? 'vote' : 'votes'}</span></div>
      <button className="button small" onClick={() => update(s.id, { played: true })}>Played</button>
      <button className="link-button" onClick={() => update(s.id, { hidden: true })} aria-label={`Hide ${s.title}`}>Hide</button>
    </li>)}</ol>
    {list.some(s => s.played) && <details className="card"><summary>Already played</summary><ul>{list.filter(s => s.played).map(s => <li key={s.id}>{s.title} · {s.artist} <button className="link-button" onClick={() => update(s.id, { played: false })}>Undo</button></li>)}</ul></details>}
  </div>
}

const toLines = (people: Person[]) => people.map(p => [p.name, p.table_name, p.seat || '', p.groups, p.intro].join(' | ').replace(/( \| )+$/, '')).join('\n')
const fromLines = (text: string) => text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
  const [name, table = '', seat = '', groups = '', ...intro] = line.split('|').map(part => part.trim())
  return { name, table, seat: Number(seat) || 0, groups, intro: intro.join(' | ') }
})

function Guests() {
  const people = useApi<Person[]>('staff/people')
  const overview = useApi<Overview>('staff/overview')
  const [text, setText] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  return <div className="host-section">
    {overview.data && <p className="stat-line"><strong>{overview.data.guests}</strong> joined · <strong>{overview.data.people}</strong> on the list · <strong>{overview.data.photos}</strong> photos · <strong>{overview.data.songs}</strong> songs</p>}
    <div className="card">
      <h2>Guest list &amp; seating plan</h2>
      <p className="hint">One guest per line: <code>Name | Table | Seat | Groups | A line about them</code>. Seats go round the table in order. Groups are comma-separated and let you message just those people (for example <em>Bridal party, Friday pub</em>).</p>
      <textarea className="mono" rows={14} value={text ?? (people.data ? toLines(people.data) : '')} onChange={e => setText(e.target.value)} placeholder={'Sam Taylor | Table 1 | 1 | Friday pub | Dan’s uni flatmate, makes a mean negroni\nPriya Shah | Table 1 | 2 | Bridal party | Imogen’s friend since primary school'} spellCheck={false} />
      <button className="button primary" onClick={async () => {
        try { const r = await api<{ count: number }>('staff/people', { method: 'PUT', body: { people: fromLines(text ?? (people.data ? toLines(people.data) : '')) } }); setStatus(`Saved ${r.count} guests.`); people.reload(); overview.reload() } catch (e) { setStatus((e as Error).message) }
      }}>Save guest list</button>
      {status && <p className="hint" role="status">{status}</p>}
    </div>
  </div>
}

function GamesAdmin({ config }: { config: Config | null }) {
  const battle = useApi<Battle>('battle', 8000)
  const predictions = useApi<Predictions>('predictions')
  const [size, setSize] = useState(8)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState('')
  const [kind, setKind] = useState<'choice' | 'number'>('choice')
  const [options, setOptions] = useState('')
  const run = async (fn: () => Promise<unknown>) => { setError(''); try { await fn(); battle.reload(); predictions.reload() } catch (e) { setError((e as Error).message) } }
  const b = battle.data
  return <div className="host-section">
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="card">
      <h2>Battle of the Bangers</h2>
      {b?.status === 'idle' && <>
        <p className="hint">Takes the most-voted song requests and puts them head to head.</p>
        <div className="choices">{[4, 8, 16].map(n => <button key={n} className={`chip${size === n ? ' on' : ''}`} onClick={() => setSize(n)}>{n} songs</button>)}</div>
        <button className="button primary" onClick={() => run(() => api('staff/battle/start', { body: { size } }))}>Start the battle</button>
      </>}
      {b?.status === 'voting' && <>
        <p className="hint">Round {b.round} is open: {b.matches.filter(m => m.round === b.round).map(m => `${m.a?.title} ${m.aVotes}–${m.bVotes} ${m.b?.title}`).join(' · ')}</p>
        <button className="button primary" onClick={() => run(() => api('staff/battle/advance', { method: 'POST' }))}>Close this round</button>
      </>}
      {b?.status === 'done' && <p>Champion: <strong>{b.champion?.title}</strong> by {b.champion?.artist}</p>}
      {b?.status !== 'idle' && <button className="link-button" onClick={() => confirm('Reset the battle and all its votes?') && run(() => api('staff/battle/reset', { method: 'POST' }))}>Reset battle</button>}
    </div>
    <div className="card">
      <h2>Predictions</h2>
      <label className="check"><input type="checkbox" checked={predictions.data?.locked ?? config?.predictionsLocked ?? false} onChange={e => run(() => api('staff/settings', { method: 'PATCH', body: { predictions_locked: e.target.checked } }))} /> Lock predictions (do this before the ceremony)</label>
      {predictions.data?.questions.map(q => <div key={q.id} className="admin-question">
        <p><strong>{q.question}</strong> <small>{q.entries} guesses</small></p>
        <div className="inline-form">
          {q.kind === 'choice' ? <select value={q.answer ?? ''} onChange={e => run(() => api(`staff/predictions/${q.id}`, { method: 'PATCH', body: { answer: e.target.value } }))}>
            <option value="">No answer yet</option>{q.options.map(o => <option key={o}>{o}</option>)}
          </select> : <input type="number" defaultValue={q.answer ?? ''} placeholder="Actual answer" onBlur={e => run(() => api(`staff/predictions/${q.id}`, { method: 'PATCH', body: { answer: e.target.value } }))} />}
          <button className="link-button" onClick={() => confirm('Delete this question?') && run(() => api(`staff/predictions/${q.id}`, { method: 'DELETE' }))}>Delete</button>
        </div>
      </div>)}
      <form className="add-question" onSubmit={e => { e.preventDefault(); run(async () => { await api('staff/predictions', { body: { question, kind, options: options.split(',').map(o => o.trim()) } }); setQuestion(''); setOptions('') }) }}>
        <h3>Add a question</h3>
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="What will the first song on the dancefloor be?" required />
        <div className="choices"><button type="button" className={`chip${kind === 'choice' ? ' on' : ''}`} onClick={() => setKind('choice')}>Multiple choice</button><button type="button" className={`chip${kind === 'number' ? ' on' : ''}`} onClick={() => setKind('number')}>Closest number</button></div>
        {kind === 'choice' && <input value={options} onChange={e => setOptions(e.target.value)} placeholder="Answers, separated by commas" required />}
        <button className="button">Add question</button>
      </form>
    </div>
  </div>
}

function SettingsAdmin({ onSignOut }: { onSignOut: () => void }) {
  const settings = useApi<Settings>('staff/settings')
  const codes = useApi<Code[]>('staff/codes')
  const [label, setLabel] = useState('')
  const [role, setRole] = useState<Role>('helper')
  const [shots, setShots] = useState('')
  const [joinCode, setJoinCode] = useState<string | null>(null)
  const s = settings.data
  const patch = async (change: Record<string, unknown>) => { settings.setData(await api<Settings>('staff/settings', { method: 'PATCH', body: change })) }
  if (!s) return <p className="muted">Loading…</p>
  const revealLocal = new Date(s.gallery_reveal_at)
  const local = new Date(revealLocal.getTime() - revealLocal.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  return <div className="host-section">
    <div className="card settings">
      <h2>On the day</h2>
      <label className="check"><input type="checkbox" checked={s.seating_revealed === '1'} onChange={e => patch({ seating_revealed: e.target.checked })} /> Reveal the seating plan to guests</label>
      <label className="check"><input type="checkbox" checked={s.songs_open === '1'} onChange={e => patch({ songs_open: e.target.checked })} /> Song requests open</label>
      <label>Gallery develops at<input type="datetime-local" defaultValue={local} onBlur={e => e.target.value && patch({ gallery_reveal_at: new Date(e.target.value).toISOString() })} /></label>
      <button className="button small" onClick={() => confirm('Develop every photo for everyone now?') && patch({ gallery_reveal_at: new Date().toISOString() })}>Develop the photos now</button>
      <label>Shots per guest<input type="number" min={1} max={60} defaultValue={s.shots} onChange={e => setShots(e.target.value)} onBlur={() => shots && patch({ shots: Number(shots) })} /></label>
      <label>Guest code (optional, printed on invitations)<input value={joinCode ?? s.join_code} onChange={e => setJoinCode(e.target.value)} onBlur={() => joinCode != null && patch({ join_code: joinCode })} placeholder="Leave blank so anyone with the link can join" /></label>
    </div>
    <div className="card">
      <h2>Helper &amp; DJ codes</h2>
      <p className="hint">Give the best man and maid of honour a helper code so they can send notifications too. The DJ code opens the live request board.</p>
      <ul className="codes">{codes.data?.map(c => <li key={c.code}><code>{c.code}</code> {c.label} <small>({c.role === 'dj' ? 'DJ' : 'can send notifications'})</small> <button className="link-button" onClick={async () => { await api(`staff/codes/${c.code}`, { method: 'DELETE' }); codes.reload() }}>Remove</button></li>)}</ul>
      <form className="inline-form" onSubmit={async e => { e.preventDefault(); await api('staff/codes', { body: { label, role } }); setLabel(''); codes.reload() }}>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Best man" required />
        <select value={role} onChange={e => setRole(e.target.value as Role)}><option value="helper">Helper</option><option value="dj">DJ</option></select>
        <button className="button">Create code</button>
      </form>
    </div>
    <button className="link-button" onClick={onSignOut}>Sign out of the host screen</button>
  </div>
}
