import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { api, type Me, type Seat } from '../api'
import { initials, useApi } from '../hooks'
import { colors, fonts, shadow } from '../theme'
import { Body, Button, Card, ErrorText, Eyebrow, Field, Heading, Hint, Screen, ScreenHead, Script } from '../ui'

const native = Platform.OS !== 'web'

export function SeatScreen({ me, onLinked }: { me: Me; onLinked: (me: Me) => void }) {
  const seat = useApi<Seat>('seat')
  const [opened, setOpened] = useState(false)
  const s = seat.data
  return <Screen onRefresh={seat.refresh} refreshing={seat.refreshing}>
    <ScreenHead eyebrow="Wedding breakfast" title="Find my seat" />
    {!s ? <Body muted>{seat.error || 'Finding your place card…'}</Body>
      : !s.linked ? <FindMe name={me.name} onLinked={next => { onLinked(next); seat.reload() }} />
      : !s.revealed ? <Card style={{ alignItems: 'center' }}>
        <Envelope />
        <Heading style={{ textAlign: 'center' }}>Your place card is sealed</Heading>
        <Body muted style={{ textAlign: 'center' }}>We’re still playing table Tetris. Your seat will be revealed on the day, and we’ll send you a notification when it is.</Body>
      </Card>
      : !s.table ? <Card><Heading>Almost there, {s.name?.split(' ')[0]}</Heading><Body muted>We haven’t put you at a table yet. Come and find us!</Body></Card>
      : !opened ? <View style={st.placeCard}>
        <View style={st.placeInner} pointerEvents="none" />
        <Eyebrow>A place has been set for</Eyebrow>
        <Script style={st.bigScript}>{s.name}</Script>
        <Button label="Find my seat" variant="primary" onPress={() => { if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setOpened(true) }} />
      </View>
      : <Reveal seat={s} />}
  </Screen>
}

function Envelope() {
  return <View style={st.envelope}>
    <View style={st.flap} />
    <View style={st.seal}><Text style={st.sealText}>I&amp;D</Text></View>
  </View>
}

/** Card flips open, the table grows in, chairs fly out to their places and your neighbours slide in. */
function Reveal({ seat }: { seat: Seat }) {
  const mates = seat.tablemates ?? []
  const card = useState(() => new Animated.Value(0))[0]
  const table = useState(() => new Animated.Value(0))[0]
  const chairs = useState(() => mates.map(() => new Animated.Value(0)))[0]
  const people = useState(() => new Animated.Value(0))[0]
  const halo = useState(() => new Animated.Value(0))[0]

  useEffect(() => {
    Animated.sequence([
      Animated.timing(card, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
      Animated.spring(table, { toValue: 1, friction: 6, tension: 60, useNativeDriver: native }),
      Animated.stagger(70, chairs.map(chair => Animated.spring(chair, { toValue: 1, friction: 7, tension: 70, useNativeDriver: native }))),
      Animated.timing(people, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
    ]).start(() => { if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) })
    Animated.loop(Animated.sequence([
      Animated.timing(halo, { toValue: 1, duration: 1100, useNativeDriver: native }),
      Animated.timing(halo, { toValue: 0, duration: 1100, useNativeDriver: native }),
    ])).start()
  }, [card, table, chairs, people, halo])

  const size = 300, radius = 112
  return <View style={{ gap: 18 }}>
    <Animated.View style={[st.placeCard, { opacity: card, transform: [{ perspective: 900 }, { rotateX: card.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) }] }]}>
      <View style={st.placeInner} pointerEvents="none" />
      <Eyebrow>You’re on</Eyebrow>
      <Script style={st.bigScript}>{seat.table}</Script>
      {!!seat.seat && <Hint>Seat {seat.seat}</Hint>}
    </Animated.View>

    <View style={{ width: size, height: size, alignSelf: 'center' }} accessible accessibilityLabel={`${seat.table}: ${mates.map(m => m.name).join(', ')}`}>
      <Animated.View style={[st.tableTop, { left: size / 2 - 66, top: size / 2 - 66, transform: [{ scale: table }] }]}>
        <Text style={st.tableLabel} numberOfLines={2}>{seat.table}</Text>
      </Animated.View>
      {mates.map((mate, index) => {
        const angle = (index / mates.length) * Math.PI * 2 - Math.PI / 2
        const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius
        const r = mate.me ? 19 : 15
        return <Animated.View key={mate.id} style={{ position: 'absolute', left: size / 2 - r, top: size / 2 - r, opacity: chairs[index],
          transform: [{ translateX: chairs[index].interpolate({ inputRange: [0, 1], outputRange: [0, x] }) }, { translateY: chairs[index].interpolate({ inputRange: [0, 1], outputRange: [0, y] }) }, { scale: chairs[index].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
          {mate.me && <Animated.View style={[st.halo, { opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.15] }), transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }]} />}
          <View style={[st.chair, { width: r * 2, height: r * 2, borderRadius: r }, mate.me && st.chairMe]}><Text style={[st.chairText, mate.me && { color: colors.paper }]}>{initials(mate.name)}</Text></View>
        </Animated.View>
      })}
    </View>

    {!!seat.neighbours?.length && <Animated.View style={{ gap: 12, opacity: people, transform: [{ translateY: people.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      <Heading>Sitting beside you</Heading>
      {seat.neighbours.map(n => <Card key={n.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
        <View style={st.avatar}><Text style={st.avatarText}>{initials(n.name)}</Text></View>
        <View style={{ flex: 1, gap: 4 }}><Text style={st.name}>{n.name}</Text><Body>{n.intro || 'Ask them how they know us!'}</Body></View>
      </Card>)}
      {mates.length > 3 && <Card><Eyebrow>Everyone on {seat.table}</Eyebrow>{mates.map(m => <Body key={m.id} style={m.me ? { fontFamily: fonts.serifBold } : undefined}>{m.name}{m.me ? ' (you)' : ''}</Body>)}</Card>}
    </Animated.View>}
  </View>
}

function FindMe({ name, onLinked }: { name: string; onLinked: (me: Me) => void }) {
  const [query, setQuery] = useState(name)
  const [results, setResults] = useState<{ id: number; name: string }[] | null>(null)
  const [error, setError] = useState('')
  const search = async () => { try { setResults(await api(`people?q=${encodeURIComponent(query)}`)); setError('') } catch (e) { setError((e as Error).message) } }
  return <Card>
    <Heading>Which name is yours?</Heading>
    <Body muted>We couldn’t match “{name}” to the guest list. Search for the name on your invitation.</Body>
    <Field label="Your name" value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={search} />
    <Button label="Search" onPress={search} />
    <ErrorText>{error}</ErrorText>
    {results && (results.length ? results.map(r => <Pressable key={r.id} style={st.result} onPress={async () => {
      try { onLinked(await api<Me>('me/link', { body: { personId: r.id } })) } catch (e) { setError((e as Error).message) }
    }}><Text style={st.name}>{r.name}</Text></Pressable>) : <Hint>No one by that name yet. The seating plan may not be up, so check back closer to the day.</Hint>)}
  </Card>
}

const st = StyleSheet.create({
  placeCard: { alignItems: 'center', gap: 10, paddingVertical: 32, paddingHorizontal: 20, backgroundColor: '#fffdf7', borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, ...shadow, shadowOpacity: 0.2 },
  placeInner: { position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderWidth: 1, borderColor: 'rgba(200,169,95,0.45)', borderRadius: 3 },
  bigScript: { fontSize: 46, lineHeight: 64, textAlign: 'center' },
  envelope: { width: 170, height: 117, borderRadius: 6, backgroundColor: '#f4ecd9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadow },
  flap: { position: 'absolute', top: -60, width: 130, height: 130, backgroundColor: '#efe4cb', transform: [{ rotate: '45deg' }], borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule },
  seal: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#5d6b3c', alignItems: 'center', justifyContent: 'center', marginTop: 14, borderWidth: 3, borderColor: '#4b5730' },
  sealText: { fontFamily: fonts.serif, fontSize: 16, color: '#e9e4cf' },
  tableTop: { position: 'absolute', width: 132, height: 132, borderRadius: 66, backgroundColor: colors.sageMist, borderWidth: 1, borderColor: colors.sage, alignItems: 'center', justifyContent: 'center', padding: 12 },
  tableLabel: { fontFamily: fonts.script, fontSize: 24, lineHeight: 34, color: colors.ink, textAlign: 'center' },
  chair: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.ruleStrong, alignItems: 'center', justifyContent: 'center' },
  chairMe: { backgroundColor: colors.ink, borderColor: colors.goldBright, borderWidth: 2 },
  chairText: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.inkSoft },
  halo: { position: 'absolute', left: -6, top: -6, right: -6, bottom: -6, borderRadius: 30, borderWidth: 1.5, borderColor: colors.goldBright },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.sageMist, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.inkSoft, letterSpacing: 1 },
  name: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink },
  result: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.ruleStrong, alignItems: 'center' },
})
