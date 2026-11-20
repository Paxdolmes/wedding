import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, stagger, useAnimate, useMotionValue, useReducedMotion, useSpring, type AnimationPlaybackControls } from 'motion/react'
import { OliveBranch } from './OliveBranch'
import { WaxSeal } from './WaxSeal'
import { DustMotes, LeafShadows } from './Ambience'
import { crackHalves, cutPath } from './crack'
import { scatterPetals, throwPetals } from './confetti'
import './EnvelopeIntro.css'

type Phase = 'sealed' | 'unsealing' | 'flap' | 'extracting' | 'settling' | 'unfolding' | 'revealing'
const silk = [.22, 1, .36, 1] as const
const paper = [.45, 0, .18, 1] as const
const wait = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000))
const crumbs = Array.from({ length: 7 }, (_, index) => ({
  left: 18 + index * 10.5 + (index % 3) * 1.5,
  x: (index - 5) * 9 + (index % 2 ? 14 : -10),
  rise: 18 + (index % 4) * 9,
  fall: 150 + (index % 5) * 40,
  spin: (index % 2 ? 1 : -1) * (120 + index * 25),
  size: 2.2 + (index % 3) * 1.1,
}))
/** A short buzz on phones that support it, as the seal cracks. */
const buzz = (pattern: number | number[]) => { try { navigator.vibrate?.(pattern) } catch { /* Not supported here. */ } }
/** Inline starting styles for the entrance, which reduced motion skips. */
const hidden = (style: CSSProperties, reduced: boolean | null) => reduced ? undefined : style

function FoldCover() {
  return <div className="gate-design"><div className="cover-emboss"><OliveBranch /><span>I <i>&</i> D</span><OliveBranch /></div><span className="cover-note">A little note,<br /><i>a lifetime of love.</i></span><span className="cover-date">24 · 08 · 2028</span></div>
}

export function EnvelopeIntro({ onReveal, onOpen, replay }: { onReveal: () => void; onOpen: () => void; replay: boolean }) {
  const [scope, animate] = useAnimate()
  const [phase, setPhase] = useState<Phase>('sealed')
  const busy = useRef(false)
  const mounted = useRef(true)
  const entrance = useRef<{ begin: () => void; controls: AnimationPlaybackControls[] } | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const flapLayer = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateY = useSpring(pointerX, { stiffness: 65, damping: 24 })
  const rotateX = useSpring(pointerY, { stiffness: 65, damping: 24 })
  const flapAngle = useMotionValue(0)
  const opening = phase !== 'sealed'

  useEffect(() => {
    mounted.current = true
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (replay) trigger.current?.focus({ preventScroll: true })
    return () => { mounted.current = false; document.body.style.overflow = previousOverflow }
  }, [replay])

  // The envelope is set down on the table, the seal is pressed into the wax, and the address is written.
  useEffect(() => {
    if (reduced) return
    let cancelled = false
    const controls: AnimationPlaybackControls[] = []
    const begin = () => {
      if (controls.length) return
      controls.push(
        animate('.envelope-composition', { opacity: [0, 1], y: [56, 0], rotate: [-11, -5], scale: [.93, 1] }, { duration: 1.6, ease: silk }),
        animate('.envelope-shadow', { opacity: [0, .24], scale: [.75, 1] }, { duration: 1.6, ease: silk }),
        animate('.seal-assembly', { opacity: [0, 1, 1], scale: [1.55, .95, 1] }, { duration: .75, delay: 1, ease: [.3, 0, .2, 1], times: [0, .72, 1] }),
        animate('.seal-contact-shadow', { opacity: [0, .25] }, { duration: .4, delay: 1.5 }),
        animate('.seal-stamp-ring', { opacity: [0, .6, 0], scale: [.9, 1.5] }, { duration: .9, delay: 1.5, ease: 'easeOut' }),
        animate('.envelope-lettering > span', { '--ink': ['-15%', '115%'] }, { duration: 1.5, ease: [.4, .1, .3, 1], delay: stagger(.55, { startDelay: 1.45 }) }),
        animate('.press-hint', { opacity: [0, 1], y: [10, 0] }, { duration: 1, delay: 2.4, ease: silk }),
      )
    }
    entrance.current = { begin, controls }
    Promise.race([document.fonts?.ready, wait(.9)]).then(() => { if (!cancelled) begin() })
    return () => { cancelled = true; entrance.current = null }
  }, [animate, reduced])

  // Once the flap passes upright it belongs behind the card, not in front of it.
  useEffect(() => flapAngle.on('change', angle => {
    if (flapLayer.current) flapLayer.current.style.zIndex = angle > 90 ? '2' : '6'
  }), [flapAngle])

  async function openEnvelope() {
    if (busy.current) return
    busy.current = true
    pointerX.set(0)
    pointerY.set(0)
    if (reduced) { onReveal(); onOpen(); return }
    // A guest who taps straight away skips the rest of the entrance rather than racing it.
    if (entrance.current) { entrance.current.begin(); entrance.current.controls.forEach(control => control.complete()) }
    const root = scope.current as HTMLElement
    const card = root.querySelector('.keepsake-card') as HTMLElement
    setPhase('unsealing')

    // 1. A letter opener slides in from the right, its blade levelled at the seal.
    animate('.press-hint, .seal-glint, .seal-halo', { opacity: 0 }, { duration: .25 })
    await animate('.letter-opener', { opacity: [0, 1], x: ['85%', '55%'], rotate: [-9, -2] }, { duration: .45, ease: silk })
    if (!mounted.current) return

    // 2. The cut: the blade glides through the wax from right to left, the cut drawing on behind its tip and catching
    // the light. The whole seal gives way to its two halves under the blade.
    buzz(12)
    animate('.seal-press-glow', { opacity: [0, .5, 0], scale: [.9, 1.1, 1.25] }, { duration: .8, ease: 'easeOut' })
    animate('.letter-opener', { x: ['55%', '-16%'], rotate: [-2, 0] }, { duration: .55, ease: [.45, 0, .2, 1] })
    animate('.seal-crack .knife-cut', { strokeDashoffset: [1, 0] }, { duration: .55, ease: [.45, 0, .2, 1] })
    animate('.seal-crack .crack-glint', { strokeDashoffset: [1.2, -.2], opacity: [0, 1, 0] }, { duration: .55, delay: .35, ease: 'easeInOut' })
    animate('.seal-half-top, .seal-half-bottom', { opacity: 1 }, { duration: .01, delay: .08 })
    animate('.seal-whole', { opacity: 0 }, { duration: .01, delay: .09 })
    animate('.break-edge', { opacity: 1 }, { duration: .3, delay: .3 })
    // The wax gives a little either side of the blade as it passes.
    animate('.seal-half-top .wax-stamp', { y: ['0%', '-1.2%', '0%'] }, { duration: .55, ease: 'easeInOut' })
    animate('.seal-half-bottom .wax-stamp', { y: ['0%', '1.2%', '0%'] }, { duration: .55, ease: 'easeInOut' })
    await wait(.55)
    if (!mounted.current) return
    // The opener lifts away, up and to the left.
    animate('.letter-opener', { x: ['-16%', '-34%'], y: ['0%', '-260%'], rotate: [0, -14], opacity: [1, 0] }, { duration: .5, ease: [.4, 0, .6, 1] })
    await wait(.15)
    if (!mounted.current) return

    // 3. Part: the halves ease apart for a breath before the lower one lets go.
    animate('.seal-crack', { opacity: 0 }, { duration: .3 })
    animate('.seal-half-top .wax-stamp', { y: '-2.5%', rotate: -2 }, { duration: .4, ease: silk })
    await animate('.seal-half-bottom', { y: '4%', rotate: 2.5 }, { duration: .32, ease: silk })
    if (!mounted.current) return
    crumbs.forEach((crumb, index) => animate(`.wax-crumb-${index}`,
      { opacity: [0, .9, .9, 0], x: [0, crumb.x * .3, crumb.x * .8], y: [0, -crumb.rise * .5, crumb.fall], rotate: [0, crumb.spin] },
      { duration: 1 + (index % 3) * .15, ease: ['easeOut', 'easeIn'], times: [0, .12, .7, 1] }))
    // The lower half peels away, tipping back as it falls, and fades before it lands.
    animate('.seal-half-bottom', { y: '240%', x: '12%', rotate: 26, rotateX: 38, opacity: [1, 1, 0] }, { duration: 1.35, ease: [.55, 0, .85, .4], opacity: { duration: 1.35, times: [0, .7, 1] } })
    animate('.seal-contact-shadow', { scale: 1.4, opacity: 0 }, { duration: .8 })
    animate('.envelope-lettering', { opacity: .25 }, { duration: 1 })
    animate('.envelope-composition', { rotate: -1, y: '22%', scale: .92 }, { duration: 1.6, ease: silk, delay: .05 })
    await wait(.15)
    if (!mounted.current) return

    // 4. The flap lifts, carrying its half of the seal, and folds back behind the card.
    setPhase('flap')
    animate(flapAngle, 180, { duration: 1.25, ease: paper })
    animate('.flap-cast-shadow', { scaleY: [1, .3, 0], opacity: [.32, .5, 0] }, { duration: 1.2, ease: paper })
    animate('.flap-light', { opacity: [0, .7, 0] }, { duration: 1.25 })
    await wait(1.05)
    if (!mounted.current) return

    // 5. The card slides out of the pocket, flexing a little as it clears the edge.
    setPhase('extracting')
    animate('.paper-curl', { opacity: [0, .55, 0], scaleY: [.1, 1, .1] }, { duration: 1.3, ease: paper })
    animate('.pocket-shadow', { opacity: [.32, .12, 0] }, { duration: 1.3 })
    await animate('.keepsake-card', { y: '-104%', rotate: -2, rotateX: [0, -7, 0] }, { duration: 1.35, ease: paper })
    if (!mounted.current) return
    card.style.zIndex = '8'

    // 6. The envelope falls away while the card glides to the centre of the screen.
    // On a narrow phone the wings open part-way, like half-open doors, so the card can stay large.
    const wingAngle = window.innerWidth < 600 ? 128 : 164
    const openWidth = 1 + Math.abs(Math.cos((180 - wingAngle) * Math.PI / 180)) + (wingAngle < 150 ? .3 : .1)
    const unfoldedScale = Math.min(1, (window.innerWidth - 32) / (card.offsetWidth * openWidth), (window.innerHeight * .62) / card.offsetHeight)
    root.style.setProperty('--card-scale', String(unfoldedScale))
    setPhase('settling')
    const drop = (root.querySelector('.envelope-back') as HTMLElement).offsetHeight
    animate('.envelope-back, .envelope-folds, .flap-layer', { y: drop * 1.25, x: drop * .05, rotate: 4, opacity: [1, 1, 0] }, { duration: 1.1, ease: paper, opacity: { duration: 1.1, times: [0, .55, 1] } })
    animate('.envelope-shadow', { scale: .7, y: 50, opacity: 0 }, { duration: .9 })
    animate('.envelope-composition', { rotate: 0, y: '4%', scale: 1 }, { duration: 1.15, ease: silk })
    await animate('.keepsake-card', { y: '0%', rotate: 0, scale: unfoldedScale }, { duration: 1.15, ease: silk })
    if (!mounted.current) return

    // 7. The gatefold opens like a pair of doors, with a sweep of light across the card.
    setPhase('unfolding')
    animate('.gate-left', { rotateY: -wingAngle }, { duration: 1.3, ease: paper })
    animate('.gate-right', { rotateY: wingAngle }, { duration: 1.3, delay: .12, ease: paper })
    animate('.gate-shadow-left', { scaleX: [1, .35, 0], opacity: [.35, .2, 0] }, { duration: 1.3 })
    animate('.gate-shadow-right', { scaleX: [1, .35, 0], opacity: [.35, .2, 0] }, { duration: 1.3, delay: .12 })
    animate('.card-foil-light', { x: ['-130%', '130%'], opacity: [0, .55, 0] }, { duration: 1.6, delay: .25, ease: 'easeInOut' })
    animate('.card-names', { backgroundPositionX: ['100%', '0%'] }, { duration: 2.2, delay: .35, ease: 'easeInOut' })
    await wait(.67)
    if (!mounted.current) return

    // 8. As the wings open, petals are thrown and the card says it out loud.
    throwPetals()
    animate('.celebration-glow', { opacity: [0, 1, .75] }, { duration: 1.8, ease: 'easeOut' })
    animate('.invite-banner', { opacity: 1 }, { duration: .2 })
    animate('.invite-line', { '--wipe': ['-20%', '120%'] }, { duration: 1.5, ease: [.33, .1, .25, 1] })
    animate('.invite-line', { backgroundPositionX: ['100%', '0%'] }, { duration: 2.4, delay: .9, ease: 'easeInOut' })
    animate('.invite-flourish', { opacity: [0, 1], scaleX: [0, 1] }, { duration: 1.1, delay: .9, ease: silk })
    animate('.keepsake-card', { scale: [unfoldedScale, unfoldedScale * 1.025, unfoldedScale] }, { duration: .9, ease: 'easeInOut', delay: .3 })
    // A moment to take it in before the card comes forward.
    await wait(2.65)
    if (!mounted.current) return

    // 9. The card flies towards the viewer until its paper fills the screen, then the page is there.
    setPhase('revealing')
    const tilt = root.querySelector('.envelope-tilt') as HTMLElement
    const tiltBox = tilt.getBoundingClientRect()
    const cardBox = card.getBoundingClientRect()
    // Enough zoom for the centre panel alone to cover the screen with room to spare.
    const zoom = Math.max(window.innerWidth / cardBox.width, window.innerHeight / cardBox.height) * 1.6
    const tiltCentre = { x: tiltBox.left + tiltBox.width / 2, y: tiltBox.top + tiltBox.height / 2 }
    const cardCentre = { x: cardBox.left + cardBox.width / 2, y: cardBox.top + cardBox.height / 2 }
    const shift = { x: window.innerWidth / 2 - tiltCentre.x - zoom * (cardCentre.x - tiltCentre.x), y: window.innerHeight / 2 - tiltCentre.y - zoom * (cardCentre.y - tiltCentre.y) }
    animate('.invite-banner', { opacity: 0, y: -16 }, { duration: .35, ease: 'easeIn' })
    animate('.leaf-shadows, .dust-motes, .celebration-glow', { opacity: 0 }, { duration: .5, ease: 'easeIn' })
    animate('.keepsake-border', { opacity: 0 }, { duration: .35, delay: .72, ease: 'easeIn' })
    // A small wind-up before the rush forward makes the zoom feel thrown rather than slid.
    await animate(tilt, { scale: .97 }, { duration: .22, ease: 'easeOut' })
    if (!mounted.current) return
    animate(tilt, { scale: zoom, x: shift.x, y: shift.y }, { duration: 1.05, ease: [.7, 0, .84, 0] })
    await wait(.85)
    if (!mounted.current) return
    // The page mounts behind the now paper-filled screen and settles into place as the paper lifts away.
    onReveal()
    scatterPetals()
    await wait(.25)
    if (!mounted.current) return
    await Promise.all([
      animate('.envelope-intro-surface', { opacity: 0 }, { duration: .5, ease: 'easeOut' }),
      animate(tilt, { opacity: 0 }, { duration: .5, ease: 'easeOut' }),
    ])
    if (mounted.current) onOpen()
  }

  return <div className="envelope-intro" ref={scope} data-phase={phase} role="main" aria-label="An invitation from Imogen and Daniel" aria-busy={opening}>
    <div className="envelope-intro-surface" aria-hidden="true"><div className="ambient-light" /><div className="celebration-glow" /></div>
    <motion.div className="envelope-tilt" style={{ rotateX, rotateY }} onPointerMove={event => {
      if (busy.current || reduced || event.pointerType !== 'mouse') return
      const bounds = event.currentTarget.getBoundingClientRect()
      pointerX.set(((event.clientX - bounds.left) / bounds.width - .5) * 7)
      pointerY.set(((event.clientY - bounds.top) / bounds.height - .5) * -5)
    }} onPointerLeave={() => { pointerX.set(0); pointerY.set(0) }}>
      <motion.div className="envelope-composition" initial={reduced ? { rotate: -5 } : { rotate: -11, opacity: 0, y: 56, scale: .93 }}>
        <div className="envelope-shadow" aria-hidden="true" style={hidden({ opacity: 0 }, reduced)} />
        <div className="envelope-shell envelope-back" aria-hidden="true"><div className="envelope-liner"><OliveBranch /><OliveBranch /><OliveBranch /></div></div>
        <div className="keepsake-card" aria-hidden="true">
          <div className="card-stock"><div className="keepsake-border"><OliveBranch className="card-branch" /><span className="card-overline">SAVE THE DATE</span><span className="card-names">Imogen <i>&</i> Daniel</span><span className="card-rule" /><span className="card-date">24 AUGUST 2028</span><span className="card-venue">Caswell House · Oxfordshire</span></div><div className="card-foil-light" /></div>
          <div className="gate-shadow gate-shadow-left" /><div className="gate-shadow gate-shadow-right" />
          <div className="card-gate gate-left"><div className="gate-face gate-front"><FoldCover /></div><div className="gate-face gate-back"><OliveBranch /><span>With love,<br />always.</span></div></div>
          <div className="card-gate gate-right"><div className="gate-face gate-front"><FoldCover /></div><div className="gate-face gate-back"><OliveBranch /><span>Our next<br />chapter.</span></div></div>
          <div className="paper-curl" />
        </div>
        <div className="envelope-shell envelope-folds" aria-hidden="true"><div className="pocket-shadow" /><div className="fold-left" /><div className="fold-right" /><div className="fold-bottom" /><div className="envelope-lettering"><span style={hidden({ '--ink': '-15%' } as CSSProperties, reduced)}>Imogen & Daniel</span><span style={hidden({ '--ink': '-15%' } as CSSProperties, reduced)}>For you, with love</span></div></div>
        <div className="envelope-shell flap-cast-shadow" aria-hidden="true" />
        <div className="envelope-shell flap-layer" ref={flapLayer} aria-hidden="true">
          <motion.div className="folding-flap" style={{ rotateX: flapAngle }}>
            <div className="flap-face flap-front"><div className="flap-light" /></div>
            <div className="flap-face flap-inside"><OliveBranch /><OliveBranch /></div>
            <div className="seal-half-top"><WaxSeal part="top" /></div>
          </motion.div>
        </div>
        <div className="seal-contact-shadow" aria-hidden="true" style={hidden({ opacity: 0 }, reduced)} />
        <div className="seal-assembly" aria-hidden="true" style={hidden({ opacity: 0 }, reduced)}>
          <span className="seal-halo" />
          <span className="seal-stamp-ring" />
          <div className="seal-half-bottom"><WaxSeal part="bottom" /></div>
          <div className="seal-whole"><WaxSeal /></div>
          {/* A slim letter opener: silver blade, gold bolster and handle. It cuts the seal open. */}
          <svg className="letter-opener" viewBox="0 0 200 24" aria-hidden="true">
            <defs>
              <linearGradient id="opener-blade" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#fbfbf7" /><stop offset=".45" stopColor="#d9d9d2" /><stop offset=".55" stopColor="#a9a9a2" /><stop offset="1" stopColor="#7c7c76" /></linearGradient>
              <linearGradient id="opener-gold" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#f3e2ae" /><stop offset=".4" stopColor="#c8a95f" /><stop offset="1" stopColor="#7d683a" /></linearGradient>
            </defs>
            <path d="M0 12.4Q58 7.6 120 7.4L120 16.6Q58 16.2 0 12.4Z" fill="url(#opener-blade)" />
            <path d="M6 12.3Q60 9.6 118 9.4" stroke="#ffffff" strokeOpacity=".7" strokeWidth=".6" fill="none" />
            <rect x="118" y="5" width="7" height="14" rx="1.5" fill="url(#opener-gold)" />
            <rect x="125" y="7" width="73" height="10" rx="5" fill="url(#opener-gold)" />
            <path d="M131 12H192" stroke="#7d683a" strokeOpacity=".45" strokeWidth=".6" />
            <circle cx="193" cy="12" r="2.2" fill="#fff3cc" fillOpacity=".7" />
          </svg>
          <svg className="seal-crack" viewBox="0 0 140 140">
            <path className="knife-cut" d={cutPath} pathLength={1} />
            {crackHalves.map(d => <path key={`glint-${d}`} className="crack-glint" d={d} pathLength={1} transform="translate(0 -1.1)" />)}
          </svg>
          <span className="seal-press-glow" />
          {crumbs.map((crumb, index) => <span key={index} className={`wax-crumb wax-crumb-${index}`} style={{ left: `${crumb.left}%`, width: crumb.size * 2, height: crumb.size * 1.6 }} />)}
          <span className="seal-glint" />
        </div>
        <div className="invite-banner" aria-hidden="true"><span className="invite-line">You’re invited!</span><span className="invite-flourish"><OliveBranch /><i /><OliveBranch /></span></div>
        <button ref={trigger} className="envelope-trigger" onClick={openEnvelope} disabled={opening} aria-label="Open your invitation" aria-describedby="envelope-instructions"><span id="envelope-instructions" className="visually-hidden">Press to break the seal and open Imogen and Daniel’s save-the-date.</span></button>
      </motion.div>
    </motion.div>
    {!reduced && <><LeafShadows /><DustMotes /></>}
    <p className="press-hint" aria-hidden="true" style={hidden({ opacity: 0 }, reduced)}><span />Press the seal to open<span /></p>
    <span className="visually-hidden" role="status">{opening ? 'Opening your invitation…' : ''}</span>
  </div>
}
