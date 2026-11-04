import { useEffect, useRef, useState } from 'react'
import { motion, stagger, useAnimate, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { OliveBranch } from './OliveBranch'
import { WaxSeal } from './WaxSeal'
import { crackBranches, crackHalves } from './crack'
import './EnvelopeIntro.css'

type Phase = 'sealed' | 'unsealing' | 'flap' | 'extracting' | 'settling' | 'unfolding' | 'celebrating' | 'revealing'
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
const invited = 'You’re invited!'

function FoldCover() {
  return <div className="gate-design"><div className="cover-emboss"><OliveBranch /><span>I <i>&</i> D</span><OliveBranch /></div><span className="cover-note">A little note,<br /><i>a lifetime of love.</i></span><span className="cover-date">24 · 08 · 2028</span></div>
}

export function EnvelopeIntro({ onReveal, onOpen, onCelebrate, replay }: { onReveal: () => void; onOpen: () => void; onCelebrate: () => void; replay: boolean }) {
  const [scope, animate] = useAnimate()
  const [phase, setPhase] = useState<Phase>('sealed')
  const busy = useRef(false)
  const mounted = useRef(true)
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
    const root = scope.current as HTMLElement
    const card = root.querySelector('.keepsake-card') as HTMLElement
    const halves = '.seal-whole .wax-stamp, .seal-half-top .wax-stamp, .seal-half-bottom .wax-stamp'
    setPhase('unsealing')

    // 1. Press: the wax gives under the thumb and warms a little.
    animate('.seal-instruction, .seal-glint', { opacity: 0 }, { duration: .25 })
    animate('.seal-press-glow', { opacity: [0, .55, 0], scale: [.85, 1.15, 1.3] }, { duration: .9, ease: 'easeOut' })
    await animate(halves, { scale: .95, y: '1.5%' }, { duration: .24, ease: [.3, 0, .2, 1] })
    if (!mounted.current) return

    // 2. Crack: a hairline runs outwards from the centre, branches, and catches the light.
    animate('.seal-crack .crack-main', { strokeDashoffset: [1, 0] }, { duration: .34, ease: [.2, .7, .3, 1] })
    animate('.seal-crack .crack-branch', { strokeDashoffset: [1, 0] }, { duration: .22, delay: .16, ease: 'easeOut' })
    animate('.seal-crack .crack-glint', { strokeDashoffset: [1.2, -.2], opacity: [0, 1, 0] }, { duration: .55, delay: .2, ease: 'easeInOut' })
    // Swap the whole seal for its two halves underneath the crack line.
    animate('.seal-half-top, .seal-half-bottom', { opacity: 1 }, { duration: .01, delay: .1 })
    animate('.seal-whole', { opacity: 0 }, { duration: .01, delay: .11 })
    animate('.break-edge', { opacity: 1 }, { duration: .3, delay: .2 })
    animate(halves, { scale: 1, y: '0%' }, { duration: .45, ease: [.34, 1.4, .64, 1] })
    await wait(.5)
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
    await wait(.75)
    if (!mounted.current) return

    // 8. Hooray: petals and confetti fly, and the card announces itself.
    setPhase('celebrating')
    onCelebrate()
    animate('.invite-banner', { opacity: 1 }, { duration: .2 })
    animate('.invite-banner .hooray', { opacity: [0, 1], y: [8, 0] }, { duration: .5, ease: silk })
    animate('.invite-banner .letter', { opacity: [0, 1], y: [22, 0], rotate: [-6, 0], filter: ['blur(4px)', 'blur(0px)'] }, { duration: .6, ease: silk, delay: stagger(.035, { startDelay: .12 }) })
    animate('.keepsake-card', { scale: [unfoldedScale, unfoldedScale * 1.025, unfoldedScale] }, { duration: .9, ease: 'easeInOut', delay: .4 })
    await wait(2.1)
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
    animate('.keepsake-border', { opacity: 0 }, { duration: .35, delay: .72, ease: 'easeIn' })
    // A small wind-up before the rush forward makes the zoom feel thrown rather than slid.
    await animate(tilt, { scale: .97 }, { duration: .22, ease: 'easeOut' })
    if (!mounted.current) return
    animate(tilt, { scale: zoom, x: shift.x, y: shift.y }, { duration: 1.05, ease: [.7, 0, .84, 0] })
    await wait(.85)
    if (!mounted.current) return
    // The page mounts behind the now paper-filled screen and settles into place as the paper lifts away.
    onReveal()
    await wait(.25)
    if (!mounted.current) return
    await Promise.all([
      animate('.envelope-intro-surface', { opacity: 0 }, { duration: .5, ease: 'easeOut' }),
      animate(tilt, { opacity: 0 }, { duration: .5, ease: 'easeOut' }),
    ])
    if (mounted.current) onOpen()
  }

  return <div className="envelope-intro" ref={scope} data-phase={phase} role="main" aria-label="An invitation from Imogen and Dan" aria-busy={opening}>
    <div className="envelope-intro-surface" aria-hidden="true"><div className="ambient-light" /></div>
    <motion.div className="envelope-tilt" style={{ rotateX, rotateY }} onPointerMove={event => {
      if (busy.current || reduced || event.pointerType !== 'mouse') return
      const bounds = event.currentTarget.getBoundingClientRect()
      pointerX.set(((event.clientX - bounds.left) / bounds.width - .5) * 7)
      pointerY.set(((event.clientY - bounds.top) / bounds.height - .5) * -5)
    }} onPointerLeave={() => { pointerX.set(0); pointerY.set(0) }}>
      <motion.div className="envelope-composition" initial={{ rotate: -5 }}>
        <div className="envelope-shadow" aria-hidden="true" />
        <div className="envelope-shell envelope-back" aria-hidden="true"><div className="envelope-liner"><OliveBranch /><OliveBranch /><OliveBranch /></div></div>
        <div className="keepsake-card" aria-hidden="true">
          <div className="card-stock"><div className="keepsake-border"><OliveBranch className="card-branch" /><span className="card-overline">SAVE THE DATE</span><span className="card-names">Imogen <i>&</i> Dan</span><span className="card-rule" /><span className="card-date">24 AUGUST 2028</span><span className="card-venue">Caswell House · Oxfordshire</span></div><div className="card-foil-light" /></div>
          <div className="gate-shadow gate-shadow-left" /><div className="gate-shadow gate-shadow-right" />
          <div className="card-gate gate-left"><div className="gate-face gate-front"><FoldCover /></div><div className="gate-face gate-back"><OliveBranch /><span>With love,<br />always.</span></div></div>
          <div className="card-gate gate-right"><div className="gate-face gate-front"><FoldCover /></div><div className="gate-face gate-back"><OliveBranch /><span>Our next<br />chapter.</span></div></div>
          <div className="paper-curl" />
        </div>
        <div className="envelope-shell envelope-folds" aria-hidden="true"><div className="pocket-shadow" /><div className="fold-left" /><div className="fold-right" /><div className="fold-bottom" /><div className="envelope-lettering"><span>Imogen & Dan</span><span>FOR YOU, WITH LOVE</span></div></div>
        <div className="envelope-shell flap-cast-shadow" aria-hidden="true" />
        <div className="envelope-shell flap-layer" ref={flapLayer} aria-hidden="true">
          <motion.div className="folding-flap" style={{ rotateX: flapAngle }}>
            <div className="flap-face flap-front"><div className="flap-light" /></div>
            <div className="flap-face flap-inside"><OliveBranch /><OliveBranch /></div>
            <div className="seal-half-top"><WaxSeal part="top" /></div>
          </motion.div>
        </div>
        <div className="seal-contact-shadow" aria-hidden="true" />
        <div className="seal-assembly" aria-hidden="true">
          <div className="seal-half-bottom"><WaxSeal part="bottom" /></div>
          <div className="seal-whole"><WaxSeal /></div>
          <svg className="seal-crack" viewBox="0 0 140 140">
            {crackHalves.map(d => <path key={d} className="crack-main" d={d} pathLength={1} />)}
            {crackBranches.map(d => <path key={d} className="crack-branch" d={d} pathLength={1} />)}
            {crackHalves.map(d => <path key={`lip-${d}`} className="crack-main crack-lip" d={d} pathLength={1} transform="translate(0 -1.1)" />)}
            {crackHalves.map(d => <path key={`glint-${d}`} className="crack-glint" d={d} pathLength={1} transform="translate(0 -1.1)" />)}
          </svg>
          <span className="seal-press-glow" />
          {crumbs.map((crumb, index) => <span key={index} className={`wax-crumb wax-crumb-${index}`} style={{ left: `${crumb.left}%`, width: crumb.size * 2, height: crumb.size * 1.6 }} />)}
          <span className="seal-glint" />
          <span className="seal-instruction">PRESS TO OPEN</span>
        </div>
        <div className="invite-banner" aria-hidden="true"><span className="hooray">Hooray!</span><span className="invite-line">{[...invited].map((letter, index) => <span key={index} className="letter">{letter === ' ' ? ' ' : letter}</span>)}</span></div>
        <button ref={trigger} className="envelope-trigger" onClick={openEnvelope} disabled={opening} aria-label="Open your invitation" aria-describedby="envelope-instructions"><span id="envelope-instructions" className="visually-hidden">Press to break the seal and open Imogen and Dan’s save-the-date.</span></button>
      </motion.div>
    </motion.div>
    <span className="visually-hidden" role="status">{opening ? 'Opening your invitation…' : ''}</span>
  </div>
}
