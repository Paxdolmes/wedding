import { motion } from 'motion/react'
import { useState } from 'react'
import { api, type Battle, type Config, type Match, type Song } from '../api'
import { useApi } from '../hooks'

export function MusicScreen({ config }: { config: Config | null }) {
  const [view, setView] = useState<'requests' | 'battle'>('requests')
  return <div className="screen music">
    <header className="screen-head"><p className="eyebrow">Our DJ is listening</p><h1>Music</h1></header>
    <div className="segmented" role="tablist">
      <button role="tab" aria-selected={view === 'requests'} onClick={() => setView('requests')}>Requests</button>
      <button role="tab" aria-selected={view === 'battle'} onClick={() => setView('battle')}>Battle of the Bangers</button>
    </div>
    {view === 'requests' ? <Requests open={config?.songsOpen ?? true} /> : <BattleView />}
  </div>
}

function Requests({ open }: { open: boolean }) {
  const songs = useApi<Song[]>('songs', 8000)
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [note, setNote] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const result = await api<{ duplicate: boolean }>('songs', { body: { title, artist } })
      setNote(result.duplicate ? 'Great minds! Someone already asked for that, so we added your vote.' : 'Requested! Get your friends to vote for it.')
      setTitle(''); setArtist(''); songs.reload()
    } catch (e) { setNote((e as Error).message) }
  }
  const vote = async (song: Song) => {
    songs.setData(list => list?.map(s => s.id === song.id ? { ...s, voted: !s.voted, votes: s.votes + (s.voted ? -1 : 1) } : s) ?? null)
    try { await api(`songs/${song.id}/vote`, { method: 'POST' }) } catch { /* the next refresh corrects it */ }
    songs.reload()
  }
  return <>
    {open ? <form className="card request-form" onSubmit={submit}>
      <h2>Request a song</h2>
      <label>Song<input value={title} onChange={e => setTitle(e.target.value)} placeholder="Mr. Brightside" required maxLength={100} /></label>
      <label>Artist<input value={artist} onChange={e => setArtist(e.target.value)} placeholder="The Killers" required maxLength={80} /></label>
      <button className="button primary">Request it</button>
      {note && <p className="hint" role="status">{note}</p>}
    </form> : <p className="card muted">Requests are closed for now.</p>}
    <section aria-labelledby="chart-title">
      <h2 id="chart-title" className="section-title">The dancefloor chart</h2>
      {!songs.data?.length ? <p className="muted">No requests yet. Be the first!</p> : <ol className="chart">
        {songs.data.map((song, index) => <motion.li key={song.id} layout className={song.played ? 'played' : undefined}>
          <span className="rank">{index + 1}</span>
          <div className="song"><strong>{song.title}</strong><span>{song.artist}{song.played ? ' · Played' : ` · asked for by ${song.requestedBy}`}</span></div>
          <button className={`vote${song.voted ? ' on' : ''}`} onClick={() => vote(song)} aria-pressed={song.voted} aria-label={`${song.voted ? 'Remove vote for' : 'Vote for'} ${song.title}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>{song.votes}
          </button>
        </motion.li>)}
      </ol>}
    </section>
  </>
}

const roundName = (round: number, rounds: number, size: number) => {
  const fromEnd = rounds - round
  if (round === rounds && size === 1) return 'The final'
  if (fromEnd === 0) return ['The final', 'Semi-finals', 'Quarter-finals'][Math.log2(size)] ?? `Round ${round}`
  return `Round ${round}`
}

function BattleView() {
  const battle = useApi<Battle>('battle', 6000)
  const b = battle.data
  if (!b) return <p className="muted">Loading…</p>
  if (b.status === 'idle') return <div className="card battle-intro">
    <p className="script">Battle of the Bangers</p>
    <p>Before the big day, the most-requested songs go head to head, round by round, until one ultimate crowd-pleaser is left standing. The DJ will make sure the winner gets played.</p>
    <p className="muted">It starts soon. Request your favourites and vote for them to get them into the bracket.</p>
  </div>
  const current = b.matches.filter(m => m.round === b.round)
  const pick = async (match: Match, songId: number) => {
    battle.setData(prev => prev && { ...prev, matches: prev.matches.map(m => m.id === match.id ? { ...m, myPick: songId, aVotes: m.aVotes + (songId === m.a?.id ? 1 : 0) - (m.myPick === m.a?.id ? 1 : 0), bVotes: m.bVotes + (songId === m.b?.id ? 1 : 0) - (m.myPick === m.b?.id ? 1 : 0) } : m) })
    try { await api('battle/vote', { body: { matchId: match.id, pick: songId } }) } catch { /* corrected on refresh */ }
    battle.reload()
  }
  return <div className="battle">
    {b.champion && <motion.div className="card champion" initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <p className="eyebrow">The ultimate banger</p>
      <p className="script big">{b.champion.title}</p>
      <p>{b.champion.artist}</p>
    </motion.div>}
    {b.status === 'voting' && <>
      <h2 className="section-title">{roundName(b.round, b.round, current.length)} · pick your winners</h2>
      {current.map(match => <MatchCard key={match.id} match={match} onPick={pick} />)}
    </>}
    {b.matches.some(m => m.winner) && <details className="card">
      <summary>Earlier rounds</summary>
      {b.matches.filter(m => m.winner).map(m => <p key={m.id} className="past-match"><strong>{m.winner === m.a?.id ? m.a?.title : m.b?.title}</strong> beat {m.winner === m.a?.id ? m.b?.title : m.a?.title} ({Math.max(m.aVotes, m.bVotes)}–{Math.min(m.aVotes, m.bVotes)})</p>)}
    </details>}
  </div>
}

function MatchCard({ match, onPick }: { match: Match; onPick: (match: Match, id: number) => void }) {
  const total = match.aVotes + match.bVotes
  const side = (song: Match['a'], votes: number) => {
    if (!song) return null
    const share = total ? Math.round(votes / total * 100) : 0
    const mine = match.myPick === song.id
    return <button className={`contender${mine ? ' picked' : ''}`} onClick={() => onPick(match, song.id)} aria-pressed={mine}>
      {match.myPick != null && <motion.span className="share-bar" initial={{ width: 0 }} animate={{ width: `${share}%` }} />}
      <strong>{song.title}</strong><span>{song.artist}</span>
      {match.myPick != null && <em>{share}%</em>}
    </button>
  }
  return <div className="match">{side(match.a, match.aVotes)}<span className="versus">vs</span>{side(match.b, match.bVotes)}</div>
}
