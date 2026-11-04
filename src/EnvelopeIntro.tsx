import { useEffect, useRef, useState } from 'react'
import { motion, useAnimate, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { OliveBranch } from './OliveBranch'
import { WaxSeal } from './WaxSeal'
import './EnvelopeIntro.css'

type Phase = 'sealed' | 'unsealing' | 'flap' | 'extracting' | 'settling' | 'unfolding' | 'revealing'
const silk = [.22, 1, .36, 1] as const
const paper = [.45, 0, .18, 1] as const

function FoldCover() {
  return <div className="gate-design"><div className="cover-emboss"><OliveBranch /><span>I <i>&</i> D</span><OliveBranch /></div><span className="cover-note">A little note,<br /><i>a lifetime of love.</i></span><span className="cover-date">24 · 08 · 2028</span></div>
}

export function EnvelopeIntro({ onReveal, onOpen, replay }: { onReveal: () => void; onOpen: () => void; replay: boolean }) {
  const [scope, animate] = useAnimate()
  const [phase, setPhase] = useState<Phase>('sealed')
  const busy = useRef(false)
  const mounted = useRef(true)
  const trigger = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateY = useSpring(pointerX, { stiffness: 65, damping: 24 })
  const rotateX = useSpring(pointerY, { stiffness: 65, damping: 24 })
  const opening = phase !== 'sealed'

  useEffect(() => {
    mounted.current = true
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (replay) trigger.current?.focus({ preventScroll: true })
    return () => { mounted.current = false; document.body.style.overflow = previousOverflow }
  }, [replay])

  async function openEnvelope() {
    if (busy.current) return
    busy.current = true
    pointerX.set(0)
    pointerY.set(0)
    if (reduced) { onReveal(); onOpen(); return }
    setPhase('unsealing')
    // Compress the wax before lifting it; paper reacts a fraction later.
    await animate('.seal-assembly', { scale: .94, y: 2 }, { duration: .16, ease: 'easeOut' })
    if (!mounted.current) return
    await Promise.all([
      animate('.envelope-composition', { rotate: -1, y: '28%', scale: .9 }, { duration: 1, ease: silk }),
      animate('.seal-assembly', { scale: 1.13, rotate: -22, rotateY: -28, x: '22%', y: '-45%', opacity: [1, 1, 0] }, { duration: .8, ease: paper }),
      animate('.seal-contact-shadow', { scale: 1.45, opacity: 0 }, { duration: .85 }),
      animate('.envelope-lettering', { opacity: .3 }, { duration: .9 }),
    ])
    if (!mounted.current) return
    setPhase('flap')
    await Promise.all([
      animate('.folding-flap', { rotateX: [0, 170, 180] }, { duration: 1.15, times: [0, .83, 1], ease: paper }),
      animate('.flap-cast-shadow', { scaleY: [1, .24, 0], opacity: [.32, .52, 0] }, { duration: 1.1, ease: paper }),
      animate('.flap-light', { opacity: [0, .7, 0] }, { duration: 1.15 }),
    ])
    if (!mounted.current) return
    ;(scope.current.querySelector('.flap-layer') as HTMLElement).style.zIndex = '1'
    setPhase('extracting')
    await Promise.all([
      animate('.keepsake-card', { y: '-101%', rotate: -2.5, rotateX: [0, -8, 0] }, { duration: 1.3, ease: paper }),
      animate('.paper-curl', { opacity: [0, .6, 0], scaleY: [.1, 1, .1] }, { duration: 1.3, ease: paper }),
      animate('.pocket-shadow', { opacity: [.32, .1, 0] }, { duration: 1.3 }),
    ])
    if (!mounted.current) return
    const card = scope.current.querySelector('.keepsake-card') as HTMLElement
    card.style.zIndex = '8'
    // Leave room for both paper wings on a small screen before unfolding them.
    const unfoldedScale = Math.min(1, (window.innerWidth - 44) / (card.offsetWidth * 2.2 * .9))
    setPhase('settling')
    await Promise.all([
      animate('.envelope-shell', { x: '4%', y: '65%', rotate: 6, opacity: 0 }, { duration: 1.05, ease: paper }),
      animate('.keepsake-card', { y: '-35%', rotate: 0, scale: unfoldedScale }, { duration: 1.05, ease: silk }),
      animate('.envelope-shadow', { scale: .7, y: 50, opacity: 0 }, { duration: 1 }),
      animate('.envelope-composition', { rotate: 0 }, { duration: 1, ease: silk }),
    ])
    if (!mounted.current) return
    setPhase('unfolding')
    await Promise.all([
      animate('.gate-left', { rotateY: -164 }, { duration: 1.35, ease: paper }),
      animate('.gate-right', { rotateY: 164 }, { duration: 1.35, delay: .13, ease: paper }),
      animate('.gate-shadow-left', { scaleX: [1, .35, 0], opacity: [.35, .2, 0] }, { duration: 1.35 }),
      animate('.gate-shadow-right', { scaleX: [1, .35, 0], opacity: [.35, .2, 0] }, { duration: 1.35, delay: .13 }),
      animate('.card-foil-light', { x: ['-130%', '130%'], opacity: [0, .55, 0] }, { duration: 1.7, delay: .15, ease: 'easeInOut' }),
    ])
    if (!mounted.current) return
    setPhase('revealing')
    // Mount the real invitation beneath the stationery before dissolving it,
    // avoiding a blank frame between the animation and the accessible page.
    onReveal()
    await Promise.all([
      animate('.keepsake-card', { scale: Math.min(unfoldedScale * 1.08, 1.08), y: '-38%' }, { duration: .95, ease: silk }),
      animate('.envelope-intro-surface', { opacity: 0 }, { duration: .95, ease: 'easeInOut' }),
      animate('.envelope-tilt', { opacity: 0 }, { duration: .75, delay: .1, ease: 'easeInOut' }),
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
        <div className="envelope-shell flap-layer" aria-hidden="true"><div className="folding-flap"><div className="flap-face flap-front"><div className="flap-light" /></div><div className="flap-face flap-inside"><OliveBranch /><OliveBranch /></div></div></div>
        <div className="seal-contact-shadow" aria-hidden="true" />
        <div className="seal-assembly" aria-hidden="true"><WaxSeal /><span className="seal-instruction">PRESS TO OPEN</span></div>
        <button ref={trigger} className="envelope-trigger" onClick={openEnvelope} disabled={opening} aria-label="Open your invitation" aria-describedby="envelope-instructions"><span id="envelope-instructions" className="visually-hidden">Press to break the seal and open Imogen and Dan’s save-the-date.</span></button>
      </motion.div>
    </motion.div>
    <span className="visually-hidden" role="status">{opening ? 'Opening your invitation…' : ''}</span>
  </div>
}
