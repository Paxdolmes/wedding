import { useEffect, useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import type { InboxItem, Me } from '../api'
import { timeAgo, useApi, useNow } from '../hooks'
import { Monogram } from '../Monogram'
import { pushStatus, registerForPush, tabFromUrl, type PushStatus } from '../push'
import { isTab, type Tab } from '../tabs'
import { colors, fonts, shadow } from '../theme'
import { Body, Button, Card, ErrorText, Eyebrow, Heading, Hint, LinkButton, Pill, Screen, Script } from '../ui'

const CEREMONY = Date.parse('2028-08-24T14:00:00+01:00')
const CARRIAGES = Date.parse('2028-08-25T01:00:00+01:00')

export function HomeScreen({ me, go }: { me: Me; go: (tab: Tab) => void }) {
  const inbox = useApi<InboxItem[]>('inbox', 30_000)
  const now = useNow(1000)
  return <Screen onRefresh={inbox.refresh} refreshing={inbox.refreshing}>
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Monogram size={132} />
      <Eyebrow>Hello, {me.name.split(' ')[0]}</Eyebrow>
    </View>
    <Countdown now={now} />
    <PushCard />
    <Card>
      <View style={s.row}><Heading>From Imogen &amp; Dan</Heading>{!!inbox.data?.length && <Pill>{inbox.data.length}</Pill>}</View>
      {inbox.data?.length ? inbox.data.map((item, index) => <Pressable key={item.id} style={[s.message, index > 0 && s.messageRule]} onPress={() => { const t = tabFromUrl(item.url); if (isTab(t)) go(t) }}>
        <Text style={s.messageTitle}>{item.title}</Text>
        <Body>{item.body}</Body>
        <Hint>{item.sent_by} · {timeAgo(item.send_at, now)}</Hint>
      </Pressable>) : <Body muted>Nothing yet. Over the weekend we’ll let you know when the bar opens, when to find your seat and when the dancefloor needs you.</Body>}
    </Card>
    <View style={s.tiles}>
      <Tile kicker="On the day" title="Find my seat" text="Your table and who you’re sitting beside" onPress={() => go('seat')} />
      <Tile kicker={`${me.shots - me.shotsUsed} of ${me.shots} shots left`} title="Disposable camera" text="Developed the morning after" onPress={() => go('camera')} />
      <Tile kicker="Before & during" title="Song requests" text="And the Battle of the Bangers" onPress={() => go('music')} />
      <Tile kicker="Win bragging rights" title="Predictions" text="Who cries first? How long are the speeches?" onPress={() => go('games')} />
    </View>
    <View style={s.foot}>
      <LinkButton label="Our invitation & the day’s details" onPress={() => Linking.openURL('https://imogenanddan.com')} />
      <LinkButton label="Couple & helpers" onPress={() => go('host')} />
    </View>
  </Screen>
}

function Tile({ kicker, title, text, onPress }: { kicker: string; title: string; text: string; onPress: () => void }) {
  return <Pressable style={({ pressed }) => [s.tile, pressed && { transform: [{ scale: 0.98 }] }]} onPress={onPress} accessibilityRole="button">
    <Text style={s.kicker}>{kicker.toUpperCase()}</Text>
    <Text style={s.tileTitle}>{title}</Text>
    <Hint>{text}</Hint>
  </Pressable>
}

function Countdown({ now }: { now: number }) {
  if (now >= CARRIAGES) return <Card style={s.center}><Script>Thank you</Script><Body style={{ textAlign: 'center' }}>For dancing, laughing and celebrating with us. Everyone’s photos are in the camera gallery.</Body></Card>
  if (now >= CEREMONY - 10 * 3600_000) return <Card style={s.center}><Script>Today’s the day</Script><Body>{now < CEREMONY ? 'The ceremony begins at 2pm.' : 'We’re married! Now, to the bar.'}</Body></Card>
  const left = CEREMONY - now
  const parts = [
    { value: Math.floor(left / 86400_000), unit: 'DAYS' },
    { value: Math.floor(left / 3600_000) % 24, unit: 'HOURS' },
    { value: Math.floor(left / 60_000) % 60, unit: 'MINS' },
    { value: Math.floor(left / 1000) % 60, unit: 'SECS' },
  ]
  return <Card style={s.center}>
    <Eyebrow>Until we say “I do”</Eyebrow>
    <View style={{ flexDirection: 'row', alignSelf: 'stretch' }} accessible accessibilityLabel={`${parts[0].value} days until the wedding`}>
      {parts.map((part, i) => <View key={part.unit} style={[s.unit, i > 0 && s.unitRule]}>
        <Text style={s.number}>{part.value}</Text>
        <Text style={s.unitLabel}>{part.unit}</Text>
      </View>)}
    </View>
    <Hint>Thursday 24 August 2028 · 2pm · Caswell House</Hint>
  </Card>
}

function PushCard() {
  const [status, setStatus] = useState<PushStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { pushStatus().then(setStatus) }, [])
  if (!status || status === 'granted') return null
  if (status === 'unsupported') return null
  if (status === 'denied') return <Card style={{ backgroundColor: colors.sageMist }}>
    <Heading>Notifications are off</Heading>
    <Body muted>Turn them on in Settings so you don’t miss the bar opening, dinner or the dancefloor call.</Body>
    <Button label="Open Settings" small onPress={() => Linking.openSettings()} style={{ alignSelf: 'flex-start' }} />
  </Card>
  return <Card style={{ backgroundColor: colors.sageMist }}>
    <Heading>Don’t miss a thing</Heading>
    <Body>We’ll only send the good stuff: when the bar opens, when dinner’s served and when the dancefloor needs you.</Body>
    <ErrorText>{error}</ErrorText>
    <Button label="Turn on notifications" variant="primary" busy={busy} onPress={async () => {
      setBusy(true); setError('')
      try { setStatus(await registerForPush(true)) } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
    }} />
  </Card>
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  center: { alignItems: 'center' },
  message: { gap: 2, paddingVertical: 10 },
  messageRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
  messageTitle: { fontFamily: fonts.serifBold, fontSize: 19, color: colors.ink },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '47%', flexGrow: 1, minHeight: 150, backgroundColor: colors.card, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, padding: 16, gap: 4, ...shadow },
  kicker: { fontFamily: fonts.sansMedium, fontSize: 9.5, letterSpacing: 1.4, color: colors.gold },
  tileTitle: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 24, color: colors.ink },
  unit: { flex: 1, alignItems: 'center' },
  unitRule: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.ruleStrong },
  number: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 46, color: colors.ink, fontVariant: ['lining-nums', 'tabular-nums'] },
  unitLabel: { fontFamily: fonts.sans, fontSize: 10, letterSpacing: 1.8, color: colors.muted },
  foot: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
})
