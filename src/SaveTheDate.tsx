import { useEffect, useRef, useState, type Ref } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { Countdown } from './Countdown'
import { ThursdayNote } from './ThursdayNote'
import { saveTheDateImages as images } from './saveTheDateImages'
import { googleCalendarLink, partyRoleFrom, weddingParty, type PartyRole } from './wedding'
import { throwPetals } from './confetti'
import './SaveTheDate.css'

const silk = [.22, 1, .36, 1] as const

// The painting spreads out from the middle like wet paint, and the names are written in from left to right. Both animate
// the mask itself rather than a CSS variable inside it: Safari doesn't always repaint a mask when only a variable changes,
// which showed the whole painting before its reveal. Each also starts invisible, so nothing can show early, and a browser
// without masks simply fades them in.
const paint = (spread: number) => `radial-gradient(farthest-corner at 50% 55%, rgba(0, 0, 0, 1) ${spread - 25}%, rgba(0, 0, 0, 0) ${spread}%)`
const ink = (edge: number) => `linear-gradient(90deg, rgba(0, 0, 0, 1) ${edge}%, rgba(0, 0, 0, 0) ${edge + 12}%)`

// Once the envelope has gone, the card prints itself in: the frame and sprigs settle, the painting blooms, each line of
// type rises in turn, the rules draw outwards and the names are written in ink.
const frame: Variants = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 1.6 } } }
const sprig = (rotate: number): Variants => ({ hidden: { opacity: 0, scale: .92, rotate }, shown: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 2.4, ease: silk } } })
const bloom: Variants = {
  hidden: { opacity: 0, maskImage: paint(0) },
  shown: { opacity: 1, maskImage: paint(125), transition: { duration: 2.8, ease: [.25, .6, .3, 1], opacity: { duration: .6, ease: 'easeOut' } } },
}
const line: Variants = { hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0, transition: { duration: 1.1, ease: silk } } }
const rule: Variants = { hidden: { scaleX: 0 }, shown: { scaleX: 1, transition: { duration: 1.1, ease: silk } } }
const handwriting: Variants = {
  hidden: { opacity: 0, maskImage: ink(-15) },
  shown: { opacity: 1, maskImage: ink(115), transition: { duration: 2, ease: [.4, .1, .3, 1], opacity: { duration: .3 } } },
}

const arrow = <svg className="std-arrow" viewBox="0 0 32 19" aria-hidden="true"><path d="M0 9.5h31M22.5 1l8.5 8.5-8.5 8.5" /></svg>

/** Save our date: opens a choice of Google Calendar or the calendar file, which Apple Calendar and Outlook open. */
function SaveOurDate() {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); button.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  return <motion.div className="std-save" ref={box} variants={line}>
    <button ref={button} type="button" className="std-button" aria-expanded={open} aria-controls={open ? 'std-calendars' : undefined} onClick={() => setOpen(value => !value)}>
      <span>Save our date</span>{arrow}<span className="visually-hidden"> — add it to your calendar</span>
    </button>
    {/* After the button in reading order, so Tab moves from it into the choices; drawn above it, joined to it like one card. */}
    <AnimatePresence>
      {open && <motion.ul id="std-calendars" className="std-calendars" aria-label="Add to your calendar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .3, ease: silk }}>
        <li><a href={googleCalendarLink} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><span>Google Calendar</span>{arrow}<span className="visually-hidden"> (opens in a new tab)</span></a></li>
        <li><a href="/save-the-date.ics" download="imogen-and-dan.ics" onClick={() => setOpen(false)}><span>Apple &amp; Outlook</span>{arrow}</a></li>
      </motion.ul>}
    </AnimatePresence>
  </motion.div>
}

/** Below the card: how long to go, the apology for the Thursday on its scrap of paper, and a promise of more to come. Each part rises in as it scrolls into view. */
function MoreToCome() {
  const reduced = useReducedMotion()
  return <motion.section id="std-more" className="std-more" aria-label="Days to go and more to come" initial={reduced ? false : 'hidden'} whileInView="shown" viewport={{ once: true, amount: .15 }} variants={{ shown: { transition: { staggerChildren: .12 } } }}>
    <motion.div className="std-frame" aria-hidden="true" variants={frame} />
    {/* The second card has mirrored sprigs, top right and bottom left. */}
    <motion.img className="std-sprig std-sprig-top-right" src={images.leavesTopRight} alt="" width="376" height="276" aria-hidden="true" variants={sprig(5)} />
    <motion.img className="std-sprig std-sprig-bottom-left" src={images.leavesBottomLeft} alt="" width="300" height="277" aria-hidden="true" variants={sprig(-5)} />
    <motion.p className="std-note" variants={line}>One day. Our favourite people.<br />The beginning of our forever.</motion.p>
    {/* The Thursday note exactly as on the full invitation. */}
    <motion.div className="std-note-wrap" variants={line}><ThursdayNote /></motion.div>
    <motion.i className="std-rule" aria-hidden="true" variants={rule} />
    <motion.div className="std-to-come" variants={line}>
      <p className="std-small-caps">More information to come</p>
      <p>Timings, travel and places to stay will follow closer to the day. For now, please keep the date free for us.</p>
      <p className="std-signature"><span>With love,</span> <span>Imogen <i>&amp;</i> Daniel</span></p>
    </motion.div>
  </motion.section>
}

// The groomsman's card is staged like a proposal: each moment arrives at its own time (seconds after the card appears).
const at = (delay: number, variants: Variants): Variants => {
  const { transition = {}, ...target } = variants.shown as { transition?: Record<string, unknown> }
  // Per-value timings (like the quicker fade under the handwriting) get the same delay.
  const timed = Object.fromEntries(Object.entries(transition).map(([key, value]) => [key, value && typeof value === 'object' && !Array.isArray(value) ? { ...value, delay } : value]))
  return { hidden: variants.hidden, shown: { ...target, transition: { ...timed, delay } } }
}
const pop: Variants = { hidden: { opacity: 0, scale: .6 }, shown: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 14 } } }

/** On the groomsman's link, the first card pops the question, with a drumroll, gold ink and confetti; the save-the-date follows below. */
function TheQuestion({ role, ref }: { role: PartyRole; ref: Ref<HTMLElement> }) {
  const reduced = useReducedMotion()
  const { from, partner, question } = weddingParty[role]
  const [answered, setAnswered] = useState(false)
  const reply = useRef<HTMLParagraphElement>(null)
  useEffect(() => { if (answered) reply.current?.focus({ preventScroll: true }) }, [answered])
  const sayYes = () => { setAnswered(true); throwPetals() }
  return <motion.article ref={ref} className="std-ask" tabIndex={-1} aria-labelledby="std-ask-question" initial={reduced ? false : 'hidden'} animate="shown">
    <motion.div className="std-frame" aria-hidden="true" variants={at(.6, frame)} />
    <motion.img className="std-sprig std-sprig-top" src={images.leavesTopLeft} alt="" width="376" height="276" aria-hidden="true" variants={at(.7, sprig(-5))} />
    <motion.img className="std-sprig std-sprig-bottom" src={images.leavesBottomRight} alt="" width="300" height="277" aria-hidden="true" variants={at(.8, sprig(5))} />
    <motion.p className="std-small-caps" variants={at(1, line)}>{from} has a question…</motion.p>
    <motion.p className="std-ask-tease" variants={at(2, line)}>It’s a big one.</motion.p>
    <h1 className="std-ask-question" id="std-ask-question">
      <motion.span className="std-ask-lead" variants={at(3.1, handwriting)}>{question[0]}</motion.span>
      {' '}
      {/* The word itself arrives after a beat, in gold, and the confetti goes off as it lands. */}
      <motion.span className="std-ask-role" variants={at(5, pop)} onAnimationComplete={definition => { if (definition === 'shown' && !reduced) throwPetals() }}>
        <motion.span className="foil" variants={at(5, handwriting)}>{question[1]}</motion.span>
      </motion.span>
    </h1>
    <motion.i className="std-rule" aria-hidden="true" variants={at(6.2, rule)} />
    <motion.p className="std-ask-note" variants={at(6.4, line)}>You’re one of the people I can’t imagine the day without. I’d love you by my side as I marry {partner} on Thursday 24 August 2028.</motion.p>
    <motion.div className="std-ask-answer" variants={at(7, line)}>
      {answered
        ? <p className="std-ask-reply" ref={reply} tabIndex={-1} role="status"><span>Knew it.</span> Thank you. I couldn’t do it without you, and there’s more to come soon.</p>
        : <div className="std-ask-buttons"><button type="button" onClick={sayYes}>Yes</button><button type="button" onClick={sayYes}>Obviously, yes</button></div>}
    </motion.div>
    <motion.p className="std-signature" variants={at(7.4, line)}><span>With love,</span> <span>{from} x</span></motion.p>
    <motion.a className="std-more-cue" href="#std-card" aria-label="Our save-the-date, below" variants={at(7.8, line)}><svg viewBox="0 0 16 10" aria-hidden="true"><path d="M1 1.5l7 7 7-7" /></svg></motion.a>
  </motion.article>
}

/** For now the whole website is this one card: Caswell House in watercolour, the date, and a way to keep it. */
export function SaveTheDate({ open }: { open: boolean }) {
  const reduced = useReducedMotion()
  const card = useRef<HTMLElement>(null)
  const ask = useRef<HTMLElement>(null)
  const [role] = useState(() => partyRoleFrom(location.pathname))
  useEffect(() => { if (open) (ask.current ?? card.current)?.focus({ preventScroll: true }) }, [open])
  return <motion.div className="std-page" inert={!open} aria-hidden={!open || undefined} initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0 : .9, ease: silk }}>
    <main>
      {role && <TheQuestion role={role} ref={ask} />}
      {/* The page settles into place over .9s; the painting's reveal begins only once it has (.65s + 3 × .09s). */}
      <motion.article ref={card} id="std-card" className="std" tabIndex={-1} aria-labelledby="std-title std-names" initial={reduced ? false : 'hidden'} animate="shown" variants={{ shown: { transition: { staggerChildren: .09, delayChildren: .65 } } }}>
        <motion.div className="std-frame" aria-hidden="true" variants={frame} />
        <motion.img className="std-sprig std-sprig-top" src={images.leavesTopLeft} alt="" width="376" height="276" aria-hidden="true" variants={sprig(-5)} />
        <motion.img className="std-sprig std-sprig-bottom" src={images.leavesBottomRight} alt="" width="300" height="277" aria-hidden="true" variants={sprig(5)} />
        <motion.img className="std-painting" src={images.painting} alt="A watercolour of Caswell House: honey-coloured Cotswold stone houses and barns around a gravel courtyard, with gardens and trees all around." width="950" height="502" decoding="async" variants={bloom} />
        <motion.p className="std-caps std-intro" variants={line}>With full hearts,<br />we’d like to invite you to</motion.p>
        <motion.h1 className="std-title" id="std-title" variants={line}><span>Save</span> <em>the</em> <span>date</span></motion.h1>
        <motion.i className="std-rule" aria-hidden="true" variants={rule} />
        <motion.p className="std-caps std-for" variants={line}>For the wedding of</motion.p>
        <motion.p className="std-names" id="std-names" variants={handwriting}>Imogen <span>&amp;</span> Daniel</motion.p>
        <motion.i className="std-rule" aria-hidden="true" variants={rule} />
        <motion.p className="std-when" variants={line}><span className="std-day">Thursday</span><span className="visually-hidden">, </span><time className="std-date" dateTime="2028-08-24">24 August 2028</time></motion.p>
        <motion.i className="std-rule" aria-hidden="true" variants={rule} />
        <motion.p className="std-place" variants={line}><span className="std-venue">Caswell House</span><span className="visually-hidden">, </span><span className="std-county">Oxfordshire</span></motion.p>
        {/* The days to go, exactly as on the full invitation. */}
        <motion.div className="std-days" variants={line}><Countdown /></motion.div>
        <SaveOurDate />
        {/* A small arrow on the frame's bottom edge: there's more below. */}
        <motion.a className="std-more-cue" href="#std-more" aria-label="More below" variants={line}><svg viewBox="0 0 16 10" aria-hidden="true"><path d="M1 1.5l7 7 7-7" /></svg></motion.a>
      </motion.article>
      <MoreToCome />
    </main>
  </motion.div>
}
