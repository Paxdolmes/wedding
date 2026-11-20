/*
 * The groomsman's proposal, designed with v0 and fitted to this site. Choreography (seconds after START, which allows
 * for the envelope still fading out when the card mounts behind it)
 *
 *  0.00  Candle glow warms up behind everything, then flickers gently (CSS).
 *  0.15  A blush wax seal is PRESSED into the page: drops in, squashes, settles,
 *        with a soft ripple ring. "Daniel has a question…" fades in at 0.55.
 *  1.00  Drumroll: three tiny gold diamonds light up one after another (1.0 / 1.2 / 1.4)
 *        while a gold glint slides across the wax (1.0 -> 1.8).
 *  1.45  A hairline of golden light seeps along a crack in the seal.
 *  1.90  THE BIG MOMENT: the seal splits in two and falls away, a bloom of light
 *        opens behind the stage, gold motes drift up, and onCelebrate() fires.
 *  2.00  The whole question "Will you be my groomsman?" resolves from blur to sharp
 *        as ONE unit (no word is withheld), then a gold-foil glint sweeps across the
 *        entire line once (2.5 -> 3.9) and leaves it in warm ink.
 *  3.10  Gold flourish draws outwards from the centre.
 *  3.70  The note fades up.
 *  4.50  "Yes" / "Obviously, yes" rise in (buttons are not in the DOM before this).
 *  4.90  Signature.
 *
 *  Answering: buttons swap for the reply ("Knew it." is written on with a left-to-right
 *  ink wipe + foil glint, then the thank-you), focus moves to the role="status" reply,
 *  and onCelebrate() fires again.
 *
 *  prefers-reduced-motion: the final state renders instantly, no seal, no motion, and
 *  onCelebrate() is NOT called (flip `if (!reduce)` in the two places if you want the
 *  burst regardless).
 *
 *  All timings live in T below and are also handed to the CSS as custom properties.
 */

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import './GroomsmanProposal.css'

/** The card mounts behind the envelope's last moments; the sequence starts once it has gone. */
const START = 0.9
const T = {
  seal: START + 0.15,
  eyebrow: START + 0.55,
  dots: [START + 1.0, START + 1.2, START + 1.4],
  glint: START + 1.0,
  crack: START + 1.45,
  break: START + 1.9,
  question: START + 2.0,
  sheen: START + 2.5,
  flourish: START + 3.1,
  note: START + 3.7,
  buttons: START + 4.5,
  signature: START + 4.9,
} as const

const EASE = [0.22, 1, 0.36, 1] as const

const MOTES = [
  { x: 8, y: 62, d: 0.0, s: 4 },
  { x: 17, y: 28, d: 0.12, s: 3 },
  { x: 29, y: 80, d: 0.22, s: 5 },
  { x: 40, y: 18, d: 0.05, s: 3 },
  { x: 52, y: 88, d: 0.3, s: 4 },
  { x: 63, y: 22, d: 0.16, s: 5 },
  { x: 74, y: 74, d: 0.08, s: 3 },
  { x: 84, y: 34, d: 0.26, s: 4 },
  { x: 92, y: 66, d: 0.18, s: 3 },
  { x: 46, y: 50, d: 0.34, s: 3 },
]

type Phase = 'sealed' | 'open' | 'gone'

/** "Will you be my groomsman?", revealed all at once from under a broken wax seal. `onCelebrate` throws the page's petals and confetti. */
export function GroomsmanProposal({ onCelebrate }: { onCelebrate: () => void }) {
  const reduce = useReducedMotion() ?? false
  const [phase, setPhase] = useState<Phase>('sealed')
  const [ready, setReady] = useState(false)
  const [answered, setAnswered] = useState(false)

  const celebrate = useRef(onCelebrate)
  useEffect(() => {
    celebrate.current = onCelebrate
  })

  useEffect(() => {
    if (reduce) return
    const timers = [
      window.setTimeout(() => {
        setPhase('open')
        celebrate.current()
      }, T.break * 1000),
      window.setTimeout(() => setPhase('gone'), (T.break + 1.1) * 1000),
      window.setTimeout(() => setReady(true), T.buttons * 1000),
    ]
    return () => timers.forEach(window.clearTimeout)
  }, [reduce])

  const showActions = reduce || ready

  const answer = () => {
    setAnswered(true)
    if (!reduce) celebrate.current()
  }

  const reveal = (delay: number, duration = 0.8) =>
    reduce ? { duration: 0 } : { delay, duration, ease: EASE }

  const rise = (delay: number) => ({
    initial: reduce ? (false as const) : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: reveal(delay),
  })

  const cssTimings = {
    '--ga-glint-delay': `${T.glint}s`,
    '--ga-crack-delay': `${T.crack}s`,
    '--ga-sheen-delay': `${T.sheen}s`,
    '--ga-glow-delay': `${START}s`,
  } as CSSProperties

  return (
    <div className="ga-root" style={cssTimings}>
      <div className="ga-glow" aria-hidden="true" />

      <div className="ga-content">
        <motion.p
          className="ga-eyebrow"
          initial={reduce ? false : { opacity: 0, letterSpacing: '0.52em' }}
          animate={{ opacity: 1, letterSpacing: '0.34em' }}
          transition={reveal(T.eyebrow, 1.1)}
        >
          Daniel has a question…
        </motion.p>

        <div className="ga-stage">
          {!reduce && <Bloom phase={phase} />}

          <motion.h1
            id="ga-question"
            className="ga-question"
            initial={reduce ? false : { opacity: 0, y: 10, scale: 1.04, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            transition={reveal(T.question, 1.0)}
          >
            Will you be my groomsman?
          </motion.h1>

          {!reduce && phase !== 'gone' && <WaxSeal phase={phase} />}
          {!reduce && phase !== 'sealed' && <Motes />}
        </div>

        <Flourish reduce={reduce} />

        <motion.p className="ga-note" {...rise(T.note)}>
          You’re one of the people I can’t imagine the day without. I’d love you by my side as I
          marry Imogen on Thursday 24 August 2028.
        </motion.p>

        <div className="ga-actions">
          <AnimatePresence mode="wait">
            {showActions && !answered && (
              <motion.div
                key="ask"
                className="ga-buttons"
                exit={reduce ? undefined : { opacity: 0, y: -6, transition: { duration: 0.25 } }}
              >
                {['Yes', 'Obviously, yes'].map((label, i) => (
                  <motion.button
                    key={label}
                    type="button"
                    className={i === 0 ? 'ga-btn ga-btn--plain' : 'ga-btn ga-btn--grand'}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reveal(i * 0.12, 0.6)}
                    whileHover={reduce ? undefined : { y: -2 }}
                    whileTap={reduce ? undefined : { scale: 0.97 }}
                    onClick={answer}
                  >
                    {label}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {answered && (
              <motion.div
                key="reply"
                className="ga-reply"
                role="status"
                tabIndex={-1}
                ref={(el) => {
                  el?.focus({ preventScroll: true })
                }}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reveal(0, 0.2)}
              >
                <motion.span
                  className="ga-reply-big"
                  initial={reduce ? false : { clipPath: 'inset(-15% 100% -15% -5%)' }}
                  animate={{ clipPath: 'inset(-15% -8% -15% -5%)' }}
                  transition={reveal(0.1, 0.95)}
                >
                  Knew it.
                </motion.span>
                <motion.span
                  className="ga-reply-text"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reveal(0.85, 0.7)}
                >
                  Thank you. I couldn’t do it without you, and there’s more to come soon.
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.p className="ga-signature" {...rise(T.signature)}>
          <span className="ga-with-love">With love,</span>
          <span className="ga-names">Daniel <i>&amp;</i> Imogen x</span>
        </motion.p>
      </div>
    </div>
  )
}

function SealFace() {
  return (
    <span className="ga-seal-face">
      <span className="ga-seal-ring" />
      <span className="ga-seal-mono">
        D<i>&amp;</i>I
      </span>
    </span>
  )
}

function WaxSeal({ phase }: { phase: Phase }) {
  const open = phase === 'open'
  const part = { duration: 0.8, ease: [0.5, 0, 0.9, 0.55] as const }

  return (
    <>
      <motion.div
        className="ga-seal"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 1.45, y: -22 }}
        animate={{ opacity: [0, 1, 1], scale: [1.45, 0.92, 1], y: [-22, 1, 0] }}
        transition={{ delay: T.seal, duration: 0.55, times: [0, 0.6, 1], ease: 'easeOut' }}
      >
        <motion.span
          className="ga-seal-ripple"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.8, 1.3, 1.75] }}
          transition={{ delay: T.seal + 0.3, duration: 1, ease: 'easeOut' }}
        />
        <motion.div
          className="ga-seal-half"
          animate={open ? { x: -40, y: 28, rotate: -18, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={part}
        >
          <div className="ga-seal-clip ga-seal-clip--l">
            <SealFace />
          </div>
        </motion.div>
        <motion.div
          className="ga-seal-half"
          animate={open ? { x: 36, y: 32, rotate: 15, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={part}
        >
          <div className="ga-seal-clip ga-seal-clip--r">
            <SealFace />
          </div>
        </motion.div>
        {!open && (
          <svg className="ga-crack" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline className="ga-crack-glow" points="52,0 46,22 54,40 47,62 53,80 49,100" />
            <polyline className="ga-crack-core" points="52,0 46,22 54,40 47,62 53,80 49,100" />
          </svg>
        )}
      </motion.div>

      <motion.div
        className="ga-dots"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.25, delay: open ? 0 : T.seal + 0.5 }}
      >
        {T.dots.map((delay) => (
          <motion.span
            key={delay}
            initial={{ opacity: 0.18, scale: 0.7 }}
            animate={{ opacity: [0.18, 1, 0.4], scale: [0.7, 1.3, 1] }}
            transition={{ delay, duration: 0.55, times: [0, 0.4, 1] }}
          />
        ))}
      </motion.div>
    </>
  )
}

function Bloom({ phase }: { phase: Phase }) {
  if (phase === 'sealed') return null
  return (
    <motion.div
      className="ga-bloom"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: [0, 0.95, 0], scale: [0.2, 1, 1.5] }}
      transition={{ duration: 2, times: [0, 0.3, 1], ease: 'easeOut' }}
    />
  )
}

function Motes() {
  return (
    <div className="ga-motes" aria-hidden="true">
      {MOTES.map((m, i) => (
        <motion.span
          key={i}
          className="ga-mote"
          style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: -(36 + (i % 4) * 14) }}
          transition={{ delay: m.d, duration: 1.9, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function Flourish({ reduce }: { reduce: boolean }) {
  const gradientId = useId()
  const stroke = `url(#${gradientId})`
  const d = 'M102 9 C90 9 86 3 74 4 C62 5 60 14 48 13 C38 12 32 7 22 8 C14 9 10 13 4 12'
  const draw = (delay: number) => ({
    initial: reduce ? (false as const) : { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: reduce ? { duration: 0 } : { delay, duration: 1.1, ease: EASE },
  })

  return (
    <svg className="ga-flourish" viewBox="0 0 220 18" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="220" y2="0">
          <stop offset="0" stopColor="#806b3e" />
          <stop offset="0.2" stopColor="#9d8d64" />
          <stop offset="0.38" stopColor="#c8a95f" />
          <stop offset="0.48" stopColor="#ecd9a0" />
          <stop offset="0.58" stopColor="#c8a95f" />
          <stop offset="0.78" stopColor="#9d8d64" />
          <stop offset="1" stopColor="#806b3e" />
        </linearGradient>
      </defs>
      <motion.path d={d} fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" {...draw(T.flourish)} />
      <g transform="translate(220 0) scale(-1 1)">
        <motion.path d={d} fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" {...draw(T.flourish)} />
      </g>
      <motion.path
        d="M110 5 L114 9 L110 13 L106 9 Z"
        fill={stroke}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduce ? { duration: 0 } : { delay: T.flourish, duration: 0.5 }}
      />
    </svg>
  )
}
