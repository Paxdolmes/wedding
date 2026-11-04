import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { useEffect, useRef, useState } from 'react'
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, photoUrl, session, uploadPhoto, type Gallery, type Me } from '../api'
import { developPhoto } from '../film'
import { formatWhen, useApi, useNow } from '../hooks'
import { colors, fonts } from '../theme'
import { Body, Button, Card, Heading, Hint, Screen, ScreenHead, Segmented } from '../ui'

const native = Platform.OS !== 'web'

export function CameraScreen({ me, onShot }: { me: Me; onShot: () => void }) {
  const gallery = useApi<Gallery>('photos', 60_000)
  const [view, setView] = useState<'camera' | 'gallery'>('camera')
  const [autoSwitched, setAutoSwitched] = useState(false)
  if (gallery.data?.revealed && !autoSwitched && !session.staff) { setAutoSwitched(true); setView('gallery') }
  return <Screen onRefresh={gallery.refresh} refreshing={gallery.refreshing}>
    <ScreenHead eyebrow={`${me.shots} shots for the weekend`} title="Disposable camera" />
    <Segmented value={view} onChange={setView} options={[{ value: 'camera', label: 'Camera' }, { value: 'gallery', label: 'Gallery' }]} />
    {view === 'camera' ? <DisposableCamera me={me} onShot={() => { onShot(); gallery.reload() }} /> : <GalleryView gallery={gallery.data} reload={gallery.reload} />}
  </Screen>
}

function DisposableCamera({ me, onShot }: { me: Me; onShot: () => void }) {
  const camera = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<'back' | 'front'>('back')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [used, setUsed] = useState(me.shotsUsed)
  const [message, setMessage] = useState('')
  const flash = useState(() => new Animated.Value(0))[0]
  const { width } = useWindowDimensions()
  const left = me.shots - used

  const shoot = async () => {
    if (busy || !ready || left <= 0 || !camera.current) return
    setBusy(true); setMessage('')
    flash.setValue(1)
    Animated.timing(flash, { toValue: 0, duration: 500, useNativeDriver: native }).start()
    if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.9 })
      setMessage('Winding on…')
      const result = await uploadPhoto(await developPhoto(picture))
      setUsed(result.shotsUsed)
      onShot()
      const remaining = me.shots - result.shotsUsed
      setMessage(remaining ? `Click, wind. ${remaining} left on the roll.` : 'That’s the whole roll! Your photos develop the morning after.')
    } catch (e) { setMessage((e as Error).message || 'That shot didn’t take. Try again.') } finally { setBusy(false) }
  }

  if (left <= 0) return <Card><Heading>Roll finished</Heading><Body muted>All {me.shots} shots taken. They’re being developed and arrive in the gallery the morning after the wedding.</Body><FilmStrip used={me.shots} total={me.shots} /></Card>
  if (!permission) return null
  if (!permission.granted) return <Card>
    <Heading>Your camera’s in the box</Heading>
    <Body muted>Allow camera access to take your {me.shots} shots. Nobody sees them (not even you) until the morning after.</Body>
    <Button label={permission.canAskAgain ? 'Allow camera' : 'Open Settings'} variant="primary" onPress={requestPermission} />
  </Card>

  const finderWidth = Math.min(width - 60, 560)
  return <View style={{ gap: 14 }}>
    <View style={s.body}>
      <View style={s.top}><Text style={s.brand}>I&amp;D · ISO 400</Text><View style={s.counter}><Text style={s.counterText}>{left} left</Text></View></View>
      <View style={[s.finder, { width: finderWidth, height: finderWidth * 4 / 3 }]}>
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing={facing} onCameraReady={() => setReady(true)} />
        <View style={s.vignette} pointerEvents="none" />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: flash }]} />
      </View>
      <View style={s.controls}>
        <Pressable style={s.flip} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} accessibilityLabel="Switch camera"><Text style={{ color: colors.cameraText, fontSize: 20 }}>⟲</Text></Pressable>
        <Pressable style={[s.shutter, (busy || !ready) && { opacity: 0.5 }]} onPress={shoot} disabled={busy || !ready} accessibilityRole="button" accessibilityLabel="Take photo">
          {({ pressed }) => <View style={[s.shutterInner, pressed && { transform: [{ scale: 0.88 }] }]} />}
        </Pressable>
        <View style={{ width: 48 }} />
      </View>
    </View>
    <Hint style={{ textAlign: 'center' }}>{message || 'No previews, no retakes. Just like the real thing.'}</Hint>
    <FilmStrip used={used} total={me.shots} />
  </View>
}

function FilmStrip({ used, total }: { used: number; total: number }) {
  return <View style={s.strip} accessible accessibilityLabel={`${used} of ${total} shots used`}>
    {Array.from({ length: total }, (_, i) => <View key={i} style={[s.frame, i < used && s.exposed]} />)}
  </View>
}

function GalleryView({ gallery, reload }: { gallery: Gallery | null; reload: () => void }) {
  const now = useNow(1000)
  const [open, setOpen] = useState<string | null>(null)
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  if (!gallery) return <Body muted>Loading…</Body>
  if (!gallery.revealed) {
    const left = Date.parse(gallery.revealAt) - now
    return <View style={s.darkroom}>
      <View style={{ flexDirection: 'row', gap: 10 }}>{[0, 1, 2].map(i => <Developing key={i} delay={i * 600} />)}</View>
      <Heading style={{ color: '#f1e3d4', textAlign: 'center' }}>Still in the darkroom</Heading>
      <Body style={{ color: '#cdb8a7', textAlign: 'center' }}>Everyone’s photos develop together on {formatWhen(gallery.revealAt)}.{left > 0 && left < 72 * 3600_000 ? ` That’s ${Math.floor(left / 3600_000)} hr ${Math.floor(left / 60_000) % 60} min away.` : ''}</Body>
      <Body style={{ color: '#f1e3d4' }}>{gallery.total} {gallery.total === 1 ? 'photo' : 'photos'} taken so far{gallery.mine ? `, ${gallery.mine} of them yours` : ''}.</Body>
    </View>
  }
  const photos = gallery.photos ?? []
  if (!photos.length) return <Body muted>No photos yet.</Body>
  const tile = (Math.min(width, 620) - 32 - 12) / 3
  const current = photos.find(p => p.id === open)
  return <>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {photos.map(p => <Pressable key={p.id} onPress={() => setOpen(p.id)} style={[s.print, { width: tile }]} accessibilityLabel={`Photo by ${p.by}`}>
        <Image source={photoUrl(p.id)} style={{ width: tile - 8, height: (tile - 8) * 4 / 3 }} contentFit="cover" transition={900} />
      </Pressable>)}
    </View>
    <Modal visible={!!current} animationType="fade" transparent onRequestClose={() => setOpen(null)}>
      {current && <Pressable style={[s.lightbox, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} onPress={() => setOpen(null)}>
        <View style={s.bigPrint}><Image source={photoUrl(current.id)} style={{ width: Math.min(width - 60, 520), height: Math.min(width - 60, 520) * 4 / 3 }} contentFit="contain" /></View>
        <Text style={s.caption}>{current.by} · {new Date(current.takenAt).toLocaleString('en-GB', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</Text>
        {session.staff?.role === 'host' && <Button label="Remove photo" small onPress={async () => { await api(`staff/photos/${current.id}`, { method: 'DELETE' }); setOpen(null); reload() }} style={{ borderColor: colors.cameraText }} />}
        <Hint style={{ color: '#c9c1aa' }}>Tap anywhere to close</Hint>
      </Pressable>}
    </Modal>
  </>
}

function Developing({ delay }: { delay: number }) {
  const glow = useState(() => new Animated.Value(0))[0]
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: false }), Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: false })]))
    loop.start()
    return () => loop.stop()
  }, [delay, glow])
  return <Animated.View style={{ width: 54, height: 72, borderRadius: 3, backgroundColor: glow.interpolate({ inputRange: [0, 1], outputRange: ['#7a2f22', '#a8563a'] }) }} />
}

const s = StyleSheet.create({
  body: { backgroundColor: colors.camera, borderRadius: 26, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 6 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 6, paddingBottom: 12 },
  brand: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 2, color: colors.goldBright },
  counter: { backgroundColor: '#111', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3 },
  counterText: { fontFamily: Platform.select({ ios: 'Courier New', default: 'monospace' }), fontWeight: '700', fontSize: 14, color: '#ff9d47', textShadowColor: 'rgba(255,122,26,0.7)', textShadowRadius: 6 },
  finder: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#0d0f0a' },
  vignette: { ...StyleSheet.absoluteFill, borderRadius: 14, borderWidth: 18, borderColor: 'rgba(0,0,0,0.25)' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingTop: 16, paddingHorizontal: 8 },
  flip: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(239,230,207,0.35)', alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 3, borderColor: colors.cameraText, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.goldBright, borderWidth: 2, borderColor: '#806b3e' },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 8, backgroundColor: '#2a2219', borderRadius: 6 },
  frame: { width: '8.6%', aspectRatio: 1, borderRadius: 2, backgroundColor: '#4a3c2a' },
  exposed: { backgroundColor: '#c47634' },
  darkroom: { alignItems: 'center', gap: 12, padding: 22, borderRadius: 18, backgroundColor: '#24181a' },
  print: { padding: 4, paddingBottom: 14, backgroundColor: '#fffdf7', borderRadius: 2, shadowColor: '#3f4a2b', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  lightbox: { flex: 1, backgroundColor: 'rgba(20,23,15,0.95)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  bigPrint: { padding: 8, paddingBottom: 26, backgroundColor: '#fffdf7' },
  caption: { fontFamily: fonts.sans, fontSize: 14, color: colors.cameraText },
})
