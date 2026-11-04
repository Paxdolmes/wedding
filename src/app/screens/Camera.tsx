import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { api, photoUrl, session, type Gallery, type Me } from '../api'
import { canvasToJpeg, developFrame } from '../film'
import { formatWhen, useApi, useNow } from '../hooks'

export function CameraScreen({ me, onShot }: { me: Me; onShot: () => void }) {
  const gallery = useApi<Gallery>('photos', 60_000)
  const [view, setView] = useState<'camera' | 'gallery'>('camera')
  const [autoSwitched, setAutoSwitched] = useState(false)
  if (gallery.data?.revealed && !autoSwitched && !session.staff) { setAutoSwitched(true); setView('gallery') }

  return <div className="screen camera-screen">
    <header className="screen-head"><p className="eyebrow">{me.shots} shots for the weekend</p><h1>Disposable camera</h1></header>
    <div className="segmented" role="tablist">
      <button role="tab" aria-selected={view === 'camera'} onClick={() => setView('camera')}>Camera</button>
      <button role="tab" aria-selected={view === 'gallery'} onClick={() => setView('gallery')}>Gallery</button>
    </div>
    {view === 'camera' ? <Camera me={me} onShot={() => { onShot(); gallery.reload() }} /> : <GalleryView gallery={gallery.data} reload={gallery.reload} />}
  </div>
}

function Camera({ me, onShot }: { me: Me; onShot: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [live, setLive] = useState(false)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [flash, setFlash] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [used, setUsed] = useState(me.shotsUsed)
  const left = me.shots - used

  useEffect(() => {
    if (left <= 0 || !navigator.mediaDevices?.getUserMedia) return
    let stream: MediaStream | null = null
    let cancelled = false
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false }).then(s => {
      if (cancelled) { s.getTracks().forEach(t => t.stop()); return }
      stream = s
      if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}) }
      setLive(true)
    }).catch(() => setLive(false))
    return () => { cancelled = true; stream?.getTracks().forEach(t => t.stop()) }
  }, [facing, left])

  const upload = async (canvas: HTMLCanvasElement) => {
    const blob = await canvasToJpeg(canvas)
    const result = await api<{ shotsUsed: number }>('photos', { raw: blob })
    setUsed(result.shotsUsed)
    onShot()
    const remaining = me.shots - result.shotsUsed
    setMessage(remaining ? `Click, wind. ${remaining} left on the roll.` : 'That’s the whole roll! Your photos develop the morning after.')
  }

  const shoot = async () => {
    if (busy || left <= 0) return
    const v = video.current
    if (!live || !v?.videoWidth) { fileInput.current?.click(); return }
    setBusy(true); setMessage('')
    setFlash(f => f + 1)
    navigator.vibrate?.([12, 40, 20])
    try { await upload(developFrame(v, v.videoWidth, v.videoHeight)) } catch (e) { setMessage((e as Error).message) } finally { setBusy(false) }
  }

  const fromFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true); setMessage('')
    try {
      const bitmap = await createImageBitmap(file)
      await upload(developFrame(bitmap, bitmap.width, bitmap.height))
    } catch (e) { setMessage((e as Error).message) } finally { setBusy(false); if (fileInput.current) fileInput.current.value = '' }
  }

  if (left <= 0) return <div className="card roll-done"><h2>Roll finished</h2><p className="muted">All {me.shots} shots taken. They’re being developed and arrive in the gallery the morning after the wedding.</p><FilmStrip used={me.shots} total={me.shots} /></div>

  return <div className="disposable">
    <div className="camera-body">
      <div className="camera-top"><span className="brand">I&amp;D · ISO 400</span><span className="counter" aria-live="polite"><strong>{left}</strong> left</span></div>
      <div className="viewfinder">
        <video ref={video} playsInline muted autoPlay aria-label="Camera viewfinder" style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }} />
        {!live && <div className="viewfinder-off"><p>Tap the shutter to take a photo with your camera.</p></div>}
        <AnimatePresence>{flash > 0 && <motion.div key={flash} className="flash" initial={{ opacity: .95 }} animate={{ opacity: 0 }} transition={{ duration: .5 }} />}</AnimatePresence>
      </div>
      <div className="camera-controls">
        <button className="flip" onClick={() => setFacing(f => f === 'user' ? 'environment' : 'user')} aria-label="Switch camera" disabled={!live}>⟲</button>
        <button className="shutter" onClick={shoot} disabled={busy} aria-label="Take photo"><span /></button>
        <span className="flip-spacer" />
      </div>
      <input ref={fileInput} type="file" accept="image/*" capture="environment" hidden onChange={e => fromFile(e.target.files?.[0])} />
    </div>
    <p className="camera-message" aria-live="polite">{message || 'No previews, no retakes. Just like the real thing.'}</p>
    <FilmStrip used={used} total={me.shots} />
  </div>
}

function FilmStrip({ used, total }: { used: number; total: number }) {
  return <div className="film-strip" aria-label={`${used} of ${total} shots used`}>{Array.from({ length: total }, (_, i) => <span key={i} className={i < used ? 'exposed' : ''} />)}</div>
}

function GalleryView({ gallery, reload }: { gallery: Gallery | null; reload: () => void }) {
  const now = useNow(1000)
  const [open, setOpen] = useState<string | null>(null)
  if (!gallery) return <p className="muted">Loading…</p>
  if (!gallery.revealed) {
    const left = Date.parse(gallery.revealAt) - now
    const hours = Math.floor(left / 3600_000)
    return <div className="card developing">
      <div className="darkroom" aria-hidden="true"><span /><span /><span /></div>
      <h2>Still in the darkroom</h2>
      <p className="muted">Every guest’s photos develop together on {formatWhen(gallery.revealAt)}.{left > 0 && left < 72 * 3600_000 ? ` That’s ${hours > 0 ? `${hours} hr ` : ''}${Math.floor(left / 60_000) % 60} min away.` : ''}</p>
      <p><strong>{gallery.total}</strong> {gallery.total === 1 ? 'photo' : 'photos'} taken so far{gallery.mine ? `, ${gallery.mine} of them yours` : ''}.</p>
    </div>
  }
  const photos = gallery.photos ?? []
  if (!photos.length) return <p className="muted">No photos yet.</p>
  const current = photos.find(p => p.id === open)
  return <>
    <div className="gallery-grid">{photos.map((p, i) => <motion.button key={p.id} className="print" onClick={() => setOpen(p.id)} initial={{ opacity: 0, filter: 'brightness(2.4) sepia(1)' }} animate={{ opacity: 1, filter: 'brightness(1) sepia(0)' }} transition={{ delay: Math.min(i, 24) * .06, duration: 1.4 }}>
      <img src={photoUrl(p.id)} alt={`Photo by ${p.by}`} loading="lazy" />
    </motion.button>)}</div>
    {current && <div className="lightbox" role="dialog" aria-label={`Photo by ${current.by}`} onClick={() => setOpen(null)}>
      <img src={photoUrl(current.id)} alt="" />
      <p>{current.by} · {new Date(current.takenAt).toLocaleString('en-GB', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p>
      <div className="lightbox-actions" onClick={e => e.stopPropagation()}>
        <a className="button" href={photoUrl(current.id)} download={`imogen-and-dan-${current.id.slice(0, 6)}.jpg`}>Save</a>
        {session.staff?.role === 'host' && <button className="button ghost" onClick={async () => { if (confirm('Remove this photo from the gallery?')) { await api(`staff/photos/${current.id}`, { method: 'DELETE' }); setOpen(null); reload() } }}>Remove</button>}
        <button className="button ghost" onClick={() => setOpen(null)}>Close</button>
      </div>
    </div>}
  </>
}
