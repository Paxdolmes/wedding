import { useState } from 'react'
import { api, type Prediction, type Predictions } from '../api'
import { useApi } from '../hooks'

export function GamesScreen() {
  const predictions = useApi<Predictions>('predictions', 20_000)
  const p = predictions.data
  return <div className="screen games">
    <header className="screen-head"><p className="eyebrow">The wedding predictions competition</p><h1>Place your bets</h1></header>
    {!p ? <p className="muted">Loading…</p> : <>
      <p className="lede">{p.locked ? 'Predictions are locked in. Results are revealed as the day unfolds.' : 'Answer before the big day. The closest guesses win points, and the top scorer wins bragging rights (and maybe a bottle of something).'}</p>
      {p.leaderboard.length > 0 && <section className="card leaderboard">
        <h2>Leaderboard</h2>
        <ol>{p.leaderboard.map((row, i) => <li key={i} className={row.me ? 'me' : undefined}><span>{i + 1}</span><strong>{row.name}</strong><em>{row.points} pts</em></li>)}</ol>
      </section>}
      {p.questions.map(q => <Question key={q.id} q={q} locked={p.locked} onSaved={predictions.reload} />)}
    </>}
  </div>
}

function Question({ q, locked, onSaved }: { q: Prediction; locked: boolean; onSaved: () => void }) {
  const [value, setValue] = useState(q.mine ?? '')
  const [status, setStatus] = useState('')
  const save = async (next: string) => {
    setValue(next)
    if (next === '') return
    try { await api(`predictions/${q.id}/answer`, { body: { value: next } }); setStatus('Saved'); onSaved() } catch (e) { setStatus((e as Error).message) }
  }
  const settled = q.answer != null
  const correct = settled && (q.kind === 'number' ? null : q.mine === q.answer)
  return <section className={`card question${settled ? ' settled' : ''}`}>
    <div className="card-head"><h2>{q.question}</h2><span className="pill">{q.points} pts</span></div>
    {q.kind === 'choice' ? <div className="choices" role="radiogroup" aria-label={q.question}>{q.options.map(option => <button key={option} role="radio" aria-checked={value === option} disabled={locked || settled}
      className={`chip${value === option ? ' on' : ''}${settled && option === q.answer ? ' answer' : ''}`} onClick={() => save(option)}>{option}</button>)}</div>
      : <form className="inline-form" onSubmit={e => { e.preventDefault(); save(value) }}>
        <input type="number" inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} disabled={locked || settled} aria-label={q.question} placeholder="Your guess" />
        <button className="button" disabled={locked || settled}>Save</button>
      </form>}
    <p className="hint" aria-live="polite">
      {settled ? <>Answer: <strong>{q.answer}</strong>{correct === true ? ' · You got it!' : correct === false && q.mine ? ' · Not this time' : ''}</> : status || `${q.entries} ${q.entries === 1 ? 'guess' : 'guesses'} so far`}
    </p>
  </section>
}
