import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { api, session, type Battle, type Predictions, type Role, type Song, type StaffSession } from '../api'
import { formatWhen, timeAgo, useApi } from '../hooks'
import { Monogram } from '../Monogram'
import { presets } from '../presets'
import { colors, fonts } from '../theme'
import { Body, Button, Card, Chip, Choices, ErrorText, Eyebrow, Field, Heading, Hint, LinkButton, Screen, Segmented, Title } from '../ui'

type Overview = { guests: number; subscribed: number; people: number; photos: number; songs: number; tables: string[]; groups: string[] }
type Sent = { id: number; title: string; body: string; audience: { kind: string; values?: string[] }; sent_by: string; send_at: number; status: string; delivered: number; failed: number }
type Section = 'send' | 'dj' | 'day'

const confirm = (title: string, message: string) => new Promise<boolean>(resolve => {
  if (Platform.OS === 'web') { resolve(window.confirm(`${title}\n\n${message}`)); return }
  Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel', onPress: () => resolve(false) }, { text: 'Yes', onPress: () => resolve(true) }])
})

const sectionsFor = (role: Role): { value: Section; label: string }[] => role === 'host'
  ? [{ value: 'send', label: 'Send' }, { value: 'dj', label: 'DJ' }, { value: 'day', label: 'On the day' }]
  : role === 'helper' ? [{ value: 'send', label: 'Send' }] : [{ value: 'dj', label: 'DJ' }]

export function HostScreen({ onExit }: { onExit: () => void }) {
  const [staff, setStaff] = useState<StaffSession | null>(session.staff)
  const [section, setSection] = useState<Section>(staff ? sectionsFor(staff.role)[0].value : 'send')
  if (!staff) return <Login onExit={onExit} onIn={async next => { await session.setStaff(next); setStaff(next); setSection(sectionsFor(next.role)[0].value) }} />
  const sections = sectionsFor(staff.role)
  return <Screen padBottom={40}>
    <View style={s.head}>
      <Monogram size={54} ring={false} />
      <View style={{ flex: 1 }}><Eyebrow>{staff.role === 'host' ? 'Host' : staff.role === 'dj' ? 'DJ booth' : 'Helper'}</Eyebrow><Title style={{ fontSize: 28, lineHeight: 32 }}>{staff.label}</Title></View>
      <LinkButton label="Guest view" onPress={onExit} />
    </View>
    {sections.length > 1 && <Segmented value={section} onChange={setSection} options={sections} />}
    {section === 'send' && <Send />}
    {section === 'dj' && <DjBoard />}
    {section === 'day' && <Day />}
    <View style={{ alignItems: 'center', gap: 12, marginTop: 10 }}>
      {staff.role === 'host' && <LinkButton label="Edit the guest list, seating plan and helper codes on the website" onPress={() => Linking.openURL('https://imogenanddan.com/app/#host')} />}
      <LinkButton label="Sign out" onPress={async () => { await api('staff/logout', { method: 'POST' }).catch(() => {}); await session.setStaff(null); setStaff(null) }} />
    </View>
  </Screen>
}

function Login({ onIn, onExit }: { onIn: (staff: StaffSession) => void; onExit: () => void }) {
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen padBottom={40}>
      <View style={{ alignItems: 'center', gap: 12, paddingTop: 10 }}>
        <Monogram size={150} />
        <Title>Couple &amp; helpers</Title>
        <Body style={{ textAlign: 'center' }}>Imogen and Dan sign in with their passcode. The best man, maid of honour and DJ use the code Imogen and Dan gave them.</Body>
      </View>
      <Card>
        <Field label="Passcode or helper code" value={code} onChangeText={setCode} secureTextEntry autoCapitalize="none" />
        <Field label="Your name on notifications (couple only)" value={label} onChangeText={setLabel} placeholder="Imogen & Dan" />
        <ErrorText>{error}</ErrorText>
        <Button label="Sign in" variant="primary" busy={busy} disabled={!code} onPress={async () => {
          setBusy(true); setError('')
          try { onIn(await api<StaffSession>('staff/login', { body: { code: code.trim(), label } })) } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
        }} />
      </Card>
      <View style={{ alignItems: 'center' }}><LinkButton label="Back to the guest app" onPress={onExit} /></View>
    </Screen>
  </KeyboardAvoidingView>
}

const delays = [{ label: 'Now', minutes: 0 }, { label: 'In 10 min', minutes: 10 }, { label: 'In 30 min', minutes: 30 }, { label: 'In 1 hour', minutes: 60 }]

function Send() {
  const overview = useApi<Overview>('staff/overview', 30_000)
  const sent = useApi<Sent[]>('staff/notifications', 10_000)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/app/#home')
  const [kind, setKind] = useState<'all' | 'tables' | 'groups'>('all')
  const [values, setValues] = useState<string[]>([])
  const [delay, setDelay] = useState(0)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const o = overview.data
  const options = kind === 'tables' ? o?.tables ?? [] : kind === 'groups' ? o?.groups ?? [] : []
  const audience = kind === 'all' ? 'everyone' : values.join(', ')
  const send = async () => {
    if (!await confirm(delay ? 'Schedule this?' : 'Send this now?', `“${title}” to ${audience}${delay ? ` in ${delay} minutes` : ''}.`)) return
    setBusy(true); setStatus('')
    try {
      const result = await api<{ scheduled: boolean; recipients: number | null }>('staff/notifications', { body: { title, body, url, audience: kind === 'all' ? { kind } : { kind, values }, sendAt: delay ? new Date(Date.now() + delay * 60_000).toISOString() : undefined } })
      setStatus(result.scheduled ? 'Scheduled.' : `Sending to ${result.recipients} ${result.recipients === 1 ? 'phone' : 'phones'}.`)
      setTitle(''); setBody(''); setDelay(0); sent.reload()
    } catch (e) { setStatus((e as Error).message) } finally { setBusy(false) }
  }
  return <>
    {o && <Hint><Text style={{ fontFamily: fonts.sansMedium, color: colors.ink }}>{o.subscribed}</Text> of {o.guests} guests have notifications on</Hint>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -16 }}>
      <View style={{ width: 8 }} />
      {presets.map(p => <Chip key={p.title} label={p.title} onPress={() => { setTitle(p.title); setBody(p.body); setUrl(p.url) }} />)}
      <View style={{ width: 8 }} />
    </ScrollView>
    <Card>
      <Field label="Title" value={title} onChangeText={setTitle} maxLength={80} placeholder="🍸 The bar is open" />
      <Field label="Message" value={body} onChangeText={setBody} maxLength={240} multiline placeholder="Your first drink is on us." />
      <Eyebrow>Send to</Eyebrow>
      <Choices>{(['all', 'tables', 'groups'] as const).map(k => <Chip key={k} label={k === 'all' ? 'Everyone' : k === 'tables' ? 'Tables' : 'Groups'} on={kind === k} onPress={() => { setKind(k); setValues([]) }} />)}</Choices>
      {kind !== 'all' && (options.length ? <Choices>{options.map(v => <Chip key={v} label={v} on={values.includes(v)} onPress={() => setValues(list => list.includes(v) ? list.filter(x => x !== v) : [...list, v])} />)}</Choices>
        : <Hint>Add {kind} to the guest list on the website first.</Hint>)}
      <Eyebrow>When</Eyebrow>
      <Choices>{delays.map(d => <Chip key={d.label} label={d.label} on={delay === d.minutes} onPress={() => setDelay(d.minutes)} />)}</Choices>
      <Button label={delay ? 'Schedule' : 'Send now'} variant="primary" busy={busy} disabled={!title.trim() || !body.trim() || (kind !== 'all' && !values.length)} onPress={send} />
      {!!status && <Hint>{status}</Hint>}
    </Card>
    <Heading>Sent &amp; scheduled</Heading>
    {sent.data?.map(n => <Card key={n.id} style={{ gap: 4 }}>
      <Text style={s.sentTitle}>{n.title}</Text>
      <Body>{n.body}</Body>
      <Hint>{n.status === 'scheduled' ? `Scheduled for ${formatWhen(n.send_at)}` : `${timeAgo(n.send_at)} · ${n.delivered} delivered${n.failed ? `, ${n.failed} failed` : ''}`} · {n.audience.kind === 'all' ? 'Everyone' : n.audience.values?.join(', ')} · {n.sent_by}</Hint>
      {n.status === 'scheduled' && <LinkButton label="Cancel" onPress={async () => { await api(`staff/notifications/${n.id}`, { method: 'DELETE' }); sent.reload() }} />}
    </Card>)}
  </>
}

function DjBoard() {
  const songs = useApi<Song[]>('songs', 5000)
  const update = async (id: number, change: { played?: boolean; hidden?: boolean }) => { await api(`staff/songs/${id}`, { method: 'PATCH', body: change }); songs.reload() }
  const list = songs.data ?? []
  return <>
    <Hint>Live requests, most votes first. Refreshes every few seconds.</Hint>
    {list.filter(x => !x.played).map((song, i) => <Card key={song.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
      <Text style={s.rank}>{i + 1}</Text>
      <View style={{ flex: 1 }}><Text style={s.sentTitle}>{song.title}</Text><Hint>{song.artist} · {song.votes} {song.votes === 1 ? 'vote' : 'votes'}</Hint></View>
      <Button label="Played" small onPress={() => update(song.id, { played: true })} />
      <LinkButton label="Hide" onPress={() => update(song.id, { hidden: true })} />
    </Card>)}
    {list.some(x => x.played) && <Card><Eyebrow>Already played</Eyebrow>{list.filter(x => x.played).map(x => <View key={x.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Hint>{x.title} · {x.artist}</Hint><LinkButton label="Undo" onPress={() => update(x.id, { played: false })} /></View>)}</Card>}
  </>
}

function Day() {
  const settings = useApi<Record<string, string>>('staff/settings')
  const battle = useApi<Battle>('battle', 8000)
  const predictions = useApi<Predictions>('predictions')
  const [error, setError] = useState('')
  const st = settings.data
  const patch = async (change: Record<string, unknown>) => { try { settings.setData(await api('staff/settings', { method: 'PATCH', body: change })); setError('') } catch (e) { setError((e as Error).message) } }
  const run = async (fn: () => Promise<unknown>) => { setError(''); try { await fn(); battle.reload(); predictions.reload() } catch (e) { setError((e as Error).message) } }
  if (!st) return <Body muted>Loading…</Body>
  const b = battle.data
  return <>
    <ErrorText>{error}</ErrorText>
    <Card>
      <Heading>Switches</Heading>
      <Toggle label="Reveal the seating plan" value={st.seating_revealed === '1'} onChange={v => patch({ seating_revealed: v })} />
      <Toggle label="Song requests open" value={st.songs_open === '1'} onChange={v => patch({ songs_open: v })} />
      <Toggle label="Lock predictions" value={st.predictions_locked === '1'} onChange={v => patch({ predictions_locked: v })} />
      <Hint>Photos develop {formatWhen(st.gallery_reveal_at)}.</Hint>
      <Button label="Develop the photos now" small style={{ alignSelf: 'flex-start' }} onPress={async () => { if (await confirm('Develop every photo?', 'Everyone will see the whole gallery straight away.')) patch({ gallery_reveal_at: new Date().toISOString() }) }} />
    </Card>
    <Card>
      <Heading>Battle of the Bangers</Heading>
      {b?.status === 'idle' && <Choices>{[4, 8, 16].map(n => <Chip key={n} label={`Start with ${n}`} onPress={() => run(() => api('staff/battle/start', { body: { size: n } }))} />)}</Choices>}
      {b?.status === 'voting' && <>
        {b.matches.filter(m => m.round === b.round).map(m => <Hint key={m.id}>{m.a?.title} {m.aVotes}–{m.bVotes} {m.b?.title}</Hint>)}
        <Button label="Close this round" variant="primary" onPress={() => run(() => api('staff/battle/advance', { method: 'POST' }))} />
      </>}
      {b?.status === 'done' && <Body>Champion: {b.champion?.title} by {b.champion?.artist}</Body>}
      {b && b.status !== 'idle' && <LinkButton label="Reset the battle" onPress={async () => { if (await confirm('Reset the battle?', 'All its votes will be lost.')) run(() => api('staff/battle/reset', { method: 'POST' })) }} />}
    </Card>
    <Card>
      <Heading>Prediction answers</Heading>
      {predictions.data?.questions.map(q => <View key={q.id} style={{ gap: 8, paddingTop: 6 }}>
        <Text style={s.sentTitle}>{q.question}</Text>
        {q.kind === 'choice'
          ? <Choices>{q.options.map(o => <Chip key={o} label={o} on={q.answer === o} onPress={() => run(() => api(`staff/predictions/${q.id}`, { method: 'PATCH', body: { answer: q.answer === o ? '' : o } }))} />)}</Choices>
          : <NumberAnswer initial={q.answer ?? ''} onSave={value => run(() => api(`staff/predictions/${q.id}`, { method: 'PATCH', body: { answer: value } }))} />}
      </View>)}
    </Card>
  </>
}

function NumberAnswer({ initial, onSave }: { initial: string; onSave: (value: string) => void }) {
  const [value, setValue] = useState(initial)
  return <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
    <View style={{ flex: 1 }}><Field label="Actual answer" value={value} onChangeText={setValue} keyboardType="decimal-pad" /></View>
    <Button label="Save" small onPress={() => onSave(value)} />
  </View>
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    <Body style={{ flex: 1 }}>{label}</Body>
    <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.ink, false: colors.sageMist }} thumbColor={colors.card} />
  </View>
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sentTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: colors.ink },
  rank: { width: 24, fontFamily: fonts.serif, fontSize: 22, color: colors.gold, textAlign: 'center', fontVariant: ['lining-nums'] },
})
