import { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { api, session, type Config, type Me } from '../api'
import { Monogram } from '../Monogram'
import { registerForPush } from '../push'
import { Body, Button, Card, ErrorText, Eyebrow, Field, Hint, LinkButton, Screen, Title } from '../ui'
import { colors, fonts } from '../theme'

export function JoinScreen({ config, onJoined, onHost }: { config: Config | null; onJoined: (me: Me) => void; onHost: () => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const join = async () => {
    setBusy(true); setError('')
    try {
      const result = await api<{ token: string; me: Me }>('join', { body: { name, code } })
      await session.setGuestToken(result.token)
      onJoined(result.me)
      registerForPush(true).catch(() => {})
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen padBottom={40}>
      <View style={{ alignItems: 'center', gap: 14, paddingTop: 20 }}>
        <Monogram size={190} />
        <Eyebrow>24 August 2028 · Caswell House</Eyebrow>
        <Title style={{ textAlign: 'center' }}>Welcome to our{'\n'}<Title style={{ fontFamily: fonts.serifItalic, color: colors.inkSoft }}>wedding weekend</Title></Title>
        <Body style={{ textAlign: 'center' }}>Your seat, a disposable camera, song requests and a little friendly competition, all in one place. We’ll send you the odd notification too, so you never miss the important bits.</Body>
      </View>
      <Card>
        <Field label="Your name" value={name} onChangeText={setName} placeholder="First and last name" autoComplete="name" textContentType="name" autoCapitalize="words" returnKeyType="go" onSubmitEditing={join} />
        {config?.joinCodeRequired && <Field label="Guest code" value={code} onChangeText={setCode} placeholder="From your invitation" autoCapitalize="characters" />}
        <ErrorText>{error}</ErrorText>
        <Button label={busy ? 'Joining…' : 'Join the weekend'} variant="primary" onPress={join} busy={busy} disabled={name.trim().length < 2} />
        <Hint>Use the name on your invitation so we can find your seat.</Hint>
      </Card>
      <View style={{ alignItems: 'center' }}><LinkButton label="Imogen, Dan, best man, maid of honour or DJ? Sign in" onPress={onHost} /></View>
    </Screen>
  </KeyboardAvoidingView>
}
