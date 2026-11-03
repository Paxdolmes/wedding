import { useEffect, useRef, useState } from 'react'
import { motion, useAnimate, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { OliveBranch } from './OliveBranch'
import './EnvelopeIntro.css'

export function EnvelopeIntro({ onOpen, replay }: { onOpen: () => void; replay: boolean }) {
  const [scope, animate] = useAnimate()
  const [opening, setOpening] = useState(false)
  const busy = useRef(false)
  const mounted = useRef(true)
  const trigger = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateY = useSpring(pointerX, { stiffness: 95, damping: 22 })
  const rotateX = useSpring(pointerY, { stiffness: 95, damping: 22 })

  useEffect(() => {
    mounted.current = true
    if (replay) trigger.current?.focus({ preventScroll: true })
    return () => { mounted.current = false }
  }, [replay])

  async function openEnvelope() {
    if (busy.current) return
    busy.current = true
    setOpening(true)
    pointerX.set(0)
    pointerY.set(0)
    if (reduced) { onOpen(); return }
    // Sequence physical stages explicitly so discrete stacking changes cannot
    // override transform keyframes while the card is still inside the pocket.
    await Promise.all([
      animate('.envelope-composition', { rotate: 0, y: '28%', scale: .9 }, { duration: .75, ease: [.22, 1, .36, 1] }),
      animate('.seal-assembly', { scale: [1, 1.16, 1.12], rotate: -18, y: -38, opacity: 0 }, { duration: .6 }),
      animate('.envelope-lettering', { opacity: 0 }, { duration: .35 }),
    ])
    if (!mounted.current) return
    await animate('.folding-flap', { rotateX: 180 }, { duration: 1.05, ease: [.45, 0, .2, 1] })
    if (!mounted.current) return
    ;(scope.current.querySelector('.flap-layer') as HTMLElement).style.zIndex = '1'
    await animate('.keepsake-card', { y: '-101%', rotate: -3 }, { duration: 1.2, ease: [.45, 0, .18, 1] })
    if (!mounted.current) return
    ;(scope.current.querySelector('.keepsake-card') as HTMLElement).style.zIndex = '8'
    await Promise.all([
      animate('.envelope-shell', { y: '55%', opacity: 0 }, { duration: .85, ease: [.4, 0, .6, 1] }),
      animate('.keepsake-card', { y: '-35%', rotate: 0, scale: 1.1 }, { duration: 1, ease: [.22, 1, .36, 1] }),
      animate('.envelope-shadow', { scale: .6, opacity: 0 }, { duration: 1 }),
    ])
    if (!mounted.current) return
    await animate('.envelope-composition', { opacity: 0, scale: 1.02 }, { duration: .45, delay: .35, ease: 'easeInOut' })
    if (mounted.current) onOpen()
  }

  return <main className="envelope-intro" ref={scope} aria-label="An invitation from Imogen and Dan" aria-busy={opening}>
    <div className="ambient-light" aria-hidden="true" />
    <motion.div className="envelope-tilt" style={{ rotateX, rotateY }} onPointerMove={event => {
      if (busy.current || reduced || event.pointerType !== 'mouse') return
      const bounds = event.currentTarget.getBoundingClientRect()
      pointerX.set(((event.clientX - bounds.left) / bounds.width - .5) * 9)
      pointerY.set(((event.clientY - bounds.top) / bounds.height - .5) * -7)
    }} onPointerLeave={() => { pointerX.set(0); pointerY.set(0) }}>
      <motion.div className="envelope-composition" initial={{ rotate: -5 }}>
        <div className="envelope-shadow" aria-hidden="true" />
        <div className="envelope-shell envelope-back" aria-hidden="true"><div className="envelope-liner"><OliveBranch /><OliveBranch /><OliveBranch /></div></div>
        <div className="keepsake-card" aria-hidden="true"><div className="keepsake-border"><OliveBranch className="card-branch" /><span className="card-overline">SAVE THE DATE</span><span className="card-names">Imogen <i>&</i> Dan</span><span className="card-rule" /><span className="card-date">24 AUGUST 2028</span><span className="card-venue">Caswell House · Oxfordshire</span></div></div>
        <div className="envelope-shell envelope-folds" aria-hidden="true"><div className="fold-left" /><div className="fold-right" /><div className="fold-bottom" /><div className="envelope-lettering"><span>Imogen & Dan</span><span>FOR YOU, WITH LOVE</span></div></div>
        <div className="envelope-shell flap-layer" aria-hidden="true"><div className="folding-flap"><div className="flap-face flap-front" /><div className="flap-face flap-inside"><OliveBranch /><OliveBranch /></div></div></div>
        <div className="seal-assembly" aria-hidden="true"><div className="wax-seal"><div className="seal-rim"><OliveBranch className="seal-branch seal-branch-left" /><span className="seal-monogram">I<span>&</span>D</span><OliveBranch className="seal-branch seal-branch-right" /></div></div><span className="seal-instruction">PRESS TO OPEN</span></div>
        <button ref={trigger} className="envelope-trigger" onClick={openEnvelope} disabled={opening} aria-label="Open your invitation" aria-describedby="envelope-instructions"><span id="envelope-instructions" className="visually-hidden">Press to break the seal and open Imogen and Dan’s save-the-date.</span></button>
      </motion.div>
    </motion.div>
    <span className="visually-hidden" role="status">{opening ? 'Opening your invitation…' : ''}</span>
  </main>
}
