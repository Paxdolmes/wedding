import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium'
import { CormorantGaramond_500Medium_Italic } from '@expo-google-fonts/cormorant-garamond/500Medium_Italic'
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold'
import { Jost_400Regular } from '@expo-google-fonts/jost/400Regular'
import { Jost_500Medium } from '@expo-google-fonts/jost/500Medium'
import { PinyonScript_400Regular } from '@expo-google-fonts/pinyon-script/400Regular'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { api, session, type Config, type Me } from './src/api'
import { registerForPush, tabFromUrl } from './src/push'
import { CameraScreen } from './src/screens/Camera'
import { GamesScreen } from './src/screens/Games'
import { HomeScreen } from './src/screens/Home'
import { HostScreen } from './src/screens/Host'
import { JoinScreen } from './src/screens/Join'
import { MusicScreen } from './src/screens/Music'
import { SeatScreen } from './src/screens/Seat'
import { isTab, tabs, type Tab } from './src/tabs'
import { useNotificationTap } from './src/useNotificationTap'
import { colors, fonts } from './src/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function App() {
  return <SafeAreaProvider><StatusBar style="dark" /><Root /></SafeAreaProvider>
}

function Root() {
  const [fontsLoaded] = useFonts({ CormorantGaramond_500Medium, CormorantGaramond_500Medium_Italic, CormorantGaramond_600SemiBold, Jost_400Regular, Jost_500Medium, PinyonScript_400Regular })
  const [ready, setReady] = useState(false)
  const [config, setConfig] = useState<Config | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [tab, setTab] = useState<Tab>('home')
  const tappedUrl = useNotificationTap()

  const loadMe = useCallback(async () => {
    if (!session.guestToken) { setMe(null); return }
    try { setMe(await api<Me>('me')) } catch (e) { if ((e as { status?: number }).status === 401) { await session.setGuestToken(null); setMe(null) } }
  }, [])

  useEffect(() => {
    (async () => {
      await session.load()
      await Promise.all([api<Config>('config').then(setConfig).catch(() => {}), loadMe()])
      setReady(true)
      // Keep this phone's push token fresh without prompting.
      if (session.guestToken) registerForPush(false).catch(() => {})
    })()
  }, [loadMe])

  // Tapping a notification opens the screen it points to.
  useEffect(() => {
    const target = tabFromUrl(tappedUrl)
    if (isTab(target)) setTab(target)
  }, [tappedUrl])

  useEffect(() => { if (ready && fontsLoaded) SplashScreen.hideAsync().catch(() => {}) }, [ready, fontsLoaded])
  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.paper }} />

  if (tab === 'host') return <HostScreen onExit={() => setTab('home')} />
  if (!me) return <JoinScreen config={config} onJoined={next => { setMe(next); setTab('home') }} onHost={() => setTab('host')} />

  return <View style={{ flex: 1, backgroundColor: colors.paper }}>
    <View style={{ flex: 1 }}>
      {tab === 'home' && <HomeScreen me={me} go={setTab} />}
      {tab === 'seat' && <SeatScreen me={me} onLinked={setMe} />}
      {tab === 'camera' && <CameraScreen me={me} onShot={loadMe} />}
      {tab === 'music' && <MusicScreen config={config} />}
      {tab === 'games' && <GamesScreen />}
    </View>
    <TabBar tab={tab} onChange={setTab} />
  </View>
}

function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const insets = useSafeAreaInsets()
  return <View style={[bar.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
    {tabs.map(item => {
      const active = tab === item.id
      return <Pressable key={item.id} style={bar.item} onPress={() => onChange(item.id)} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={item.label}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={active ? colors.ink : colors.muted} strokeWidth={active ? 1.9 : 1.5} strokeLinecap="round" strokeLinejoin="round"><Path d={item.icon} /></Svg>
        <Text style={[bar.label, active && { color: colors.ink }]}>{item.label}</Text>
      </Pressable>
    })}
  </View>
}

const bar = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', paddingTop: 8, backgroundColor: Platform.OS === 'web' ? 'rgba(247,244,235,0.94)' : 'rgba(247,244,235,0.97)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.ruleStrong },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  label: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted, letterSpacing: 0.3 },
})
