import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { api, type Prediction, type Predictions } from '../api'
import { useApi } from '../hooks'
import { colors, fonts } from '../theme'
import { Body, Button, Card, Chip, Choices, Field, Heading, Hint, Pill, Screen, ScreenHead } from '../ui'

export function GamesScreen() {
  const predictions = useApi<Predictions>('predictions', 20_000)
  const p = predictions.data
  return <Screen onRefresh={predictions.refresh} refreshing={predictions.refreshing}>
    <ScreenHead eyebrow="The wedding predictions competition" title="Place your bets" />
    {!p ? <Body muted>{predictions.error || 'Loading…'}</Body> : <>
      <Body>{p.locked ? 'Predictions are locked in. Results are revealed as the day unfolds.' : 'Answer before the big day. The closest guesses win points, and the top scorer wins bragging rights (and maybe a bottle of something).'}</Body>
      {p.leaderboard.length > 0 && <Card>
        <Heading>Leaderboard</Heading>
        {p.leaderboard.map((row, i) => <View key={i} style={s.leader}>
          <Text style={s.place}>{i + 1}</Text>
          <Text style={[s.leaderName, row.me && { textDecorationLine: 'underline' }]}>{row.name}</Text>
          <Text style={s.points}>{row.points} pts</Text>
        </View>)}
      </Card>}
      {p.questions.map(q => <Question key={q.id} q={q} locked={p.locked} onSaved={predictions.reload} />)}
    </>}
  </Screen>
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
  const closed = locked || settled
  return <Card style={settled ? { backgroundColor: '#fbf6ea' } : undefined}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}><Heading style={{ flex: 1, fontSize: 21 }}>{q.question}</Heading><Pill>{q.points} pts</Pill></View>
    {q.kind === 'choice'
      ? <Choices>{q.options.map(option => <Chip key={option} label={option} on={value === option} highlight={settled && option === q.answer} disabled={closed} onPress={() => save(option)} />)}</Choices>
      : <View style={{ gap: 10 }}>
        <Field label="Your guess" value={value} onChangeText={setValue} keyboardType="decimal-pad" editable={!closed} placeholder="0" />
        {!closed && <Button label="Save guess" small onPress={() => save(value)} style={{ alignSelf: 'flex-start' }} />}
      </View>}
    <Hint>{settled ? `Answer: ${q.answer}${q.kind === 'choice' && q.mine ? (q.mine === q.answer ? ' · You got it!' : ' · Not this time') : ''}` : status || `${q.entries} ${q.entries === 1 ? 'guess' : 'guesses'} so far`}</Hint>
  </Card>
}

const s = StyleSheet.create({
  leader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  place: { width: 22, fontFamily: fonts.serif, fontSize: 20, color: colors.gold, fontVariant: ['lining-nums'] },
  leaderName: { flex: 1, fontFamily: fonts.serifBold, fontSize: 18, color: colors.ink },
  points: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkSoft },
})
