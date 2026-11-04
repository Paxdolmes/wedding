import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { api, type Battle, type Config, type Match, type Song } from '../api'
import { useApi } from '../hooks'
import { colors, fonts, shadow } from '../theme'
import { Body, Button, Card, Eyebrow, Field, Heading, Hint, Screen, ScreenHead, Script, Segmented } from '../ui'

export function MusicScreen({ config }: { config: Config | null }) {
  const [view, setView] = useState<'requests' | 'battle'>('requests')
  const songs = useApi<Song[]>('songs', 8000)
  const battle = useApi<Battle>('battle', 6000)
  return <Screen onRefresh={() => { songs.refresh(); battle.refresh() }} refreshing={songs.refreshing}>
    <ScreenHead eyebrow="Our DJ is listening" title="Music" />
    <Segmented value={view} onChange={setView} options={[{ value: 'requests', label: 'Requests' }, { value: 'battle', label: 'Battle of the Bangers' }]} />
    {view === 'requests' ? <Requests open={config?.songsOpen ?? true} songs={songs} /> : <BattleView battle={battle} />}
  </Screen>
}

function Requests({ open, songs }: { open: boolean; songs: ReturnType<typeof useApi<Song[]>> }) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [note, setNote] = useState('')
  const submit = async () => {
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
    {open ? <Card>
      <Heading>Request a song</Heading>
      <Field label="Song" value={title} onChangeText={setTitle} placeholder="Mr. Brightside" maxLength={100} />
      <Field label="Artist" value={artist} onChangeText={setArtist} placeholder="The Killers" maxLength={80} returnKeyType="send" onSubmitEditing={submit} />
      <Button label="Request it" variant="primary" onPress={submit} disabled={!title.trim() || !artist.trim()} />
      {!!note && <Hint>{note}</Hint>}
    </Card> : <Card><Body muted>Requests are closed for now.</Body></Card>}
    <Heading>The dancefloor chart</Heading>
    {!songs.data?.length ? <Body muted>No requests yet. Be the first!</Body> : songs.data.map((song, index) => <View key={song.id} style={[s.row, song.played && { opacity: 0.6 }]}>
      <Text style={s.rank}>{index + 1}</Text>
      <View style={{ flex: 1 }}><Text style={s.title} numberOfLines={1}>{song.title}</Text><Text style={s.sub} numberOfLines={1}>{song.artist}{song.played ? ' · Played' : ` · asked for by ${song.requestedBy}`}</Text></View>
      <Pressable onPress={() => vote(song)} style={[s.vote, song.voted && s.voteOn]} accessibilityRole="button" accessibilityState={{ selected: song.voted }} accessibilityLabel={`${song.voted ? 'Remove vote for' : 'Vote for'} ${song.title}`}>
        <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill={song.voted ? '#8c3b2b' : 'none'} stroke={song.voted ? '#8c3b2b' : colors.ink} strokeWidth={1.6} /></Svg>
        <Text style={[s.voteText, song.voted && { color: '#8c3b2b' }]}>{song.votes}</Text>
      </Pressable>
    </View>)}
  </>
}

function BattleView({ battle }: { battle: ReturnType<typeof useApi<Battle>> }) {
  const b = battle.data
  if (!b) return <Body muted>Loading…</Body>
  if (b.status === 'idle') return <Card style={{ alignItems: 'center' }}>
    <Script>Battle of the Bangers</Script>
    <Body style={{ textAlign: 'center' }}>Before the big day, the most-requested songs go head to head, round by round, until one ultimate crowd-pleaser is left standing. The DJ will make sure the winner gets played.</Body>
    <Hint style={{ textAlign: 'center' }}>It starts soon. Request your favourites and vote for them to get them into the bracket.</Hint>
  </Card>
  const current = b.matches.filter(m => m.round === b.round)
  const pick = async (match: Match, songId: number) => {
    battle.setData(prev => prev && { ...prev, matches: prev.matches.map(m => m.id === match.id ? { ...m, myPick: songId, aVotes: m.aVotes + (songId === m.a?.id ? 1 : 0) - (m.myPick === m.a?.id ? 1 : 0), bVotes: m.bVotes + (songId === m.b?.id ? 1 : 0) - (m.myPick === m.b?.id ? 1 : 0) } : m) })
    try { await api('battle/vote', { body: { matchId: match.id, pick: songId } }) } catch { /* corrected on refresh */ }
    battle.reload()
  }
  const roundName = current.length === 1 ? 'The final' : current.length === 2 ? 'Semi-finals' : current.length === 4 ? 'Quarter-finals' : `Round ${b.round}`
  return <>
    {b.champion && <Card style={{ alignItems: 'center', backgroundColor: '#f8efd6' }}>
      <Eyebrow>The ultimate banger</Eyebrow>
      <Script style={{ fontSize: 44, lineHeight: 60, textAlign: 'center' }}>{b.champion.title}</Script>
      <Body>{b.champion.artist}</Body>
    </Card>}
    {b.status === 'voting' && <>
      <Heading>{roundName} · pick your winners</Heading>
      {current.map(match => <MatchCard key={match.id} match={match} onPick={pick} />)}
    </>}
    {b.matches.some(m => m.winner) && <Card>
      <Eyebrow>Earlier rounds</Eyebrow>
      {b.matches.filter(m => m.winner).map(m => <Hint key={m.id}>{m.winner === m.a?.id ? m.a?.title : m.b?.title} beat {m.winner === m.a?.id ? m.b?.title : m.a?.title} ({Math.max(m.aVotes, m.bVotes)}–{Math.min(m.aVotes, m.bVotes)})</Hint>)}
    </Card>}
  </>
}

function MatchCard({ match, onPick }: { match: Match; onPick: (match: Match, id: number) => void }) {
  const total = match.aVotes + match.bVotes
  const side = (song: Match['a'], votes: number) => {
    if (!song) return <View style={{ flex: 1 }} />
    const share = total ? Math.round(votes / total * 100) : 0
    const mine = match.myPick === song.id
    return <Pressable onPress={() => onPick(match, song.id)} style={[s.contender, mine && s.picked]} accessibilityRole="button" accessibilityState={{ selected: mine }}>
      {match.myPick != null && <View style={[s.share, { width: `${share}%` }]} />}
      <Text style={s.contTitle}>{song.title}</Text>
      <Text style={s.sub}>{song.artist}</Text>
      {match.myPick != null && <Text style={s.percent}>{share}%</Text>}
    </Pressable>
  }
  return <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 8 }}>
    {side(match.a, match.aVotes)}
    <Text style={s.versus}>vs</Text>
    {side(match.b, match.bVotes)}
  </View>
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 11 },
  rank: { width: 26, textAlign: 'center', fontFamily: fonts.serif, fontSize: 22, color: colors.gold, fontVariant: ['lining-nums'] },
  title: { fontFamily: fonts.serifBold, fontSize: 18, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  vote: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  voteOn: { backgroundColor: '#f6dcd5', borderColor: '#d99a8b' },
  voteText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  contender: { flex: 1, minHeight: 116, justifyContent: 'center', alignItems: 'center', gap: 3, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.card, overflow: 'hidden', ...shadow, shadowOpacity: 0.08 },
  picked: { borderColor: colors.ink, borderWidth: 2 },
  share: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.sageMist },
  contTitle: { fontFamily: fonts.serifBold, fontSize: 18, lineHeight: 21, color: colors.ink, textAlign: 'center' },
  percent: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink, marginTop: 4 },
  versus: { alignSelf: 'center', fontFamily: fonts.script, fontSize: 30, lineHeight: 42, color: colors.gold },
})
