import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { saveTheDateImages as images } from './saveTheDateImages'
import './SaveTheDate.css'

const silk = [.22, 1, .36, 1] as const

// Once the envelope has gone, the card prints itself in: the painting spreads like wet paint, the sprigs settle into
// their corners, each line of type rises in turn, the rules draw outwards and the names are written in ink.
const frame: Variants = { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 1.6 } } }
const sprig = (rotate: number): Variants => ({ hidden: { opacity: 0, scale: .92, rotate }, shown: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 2.4, ease: silk } } })
const bloom: Variants = { hidden: { '--bloom': 0 }, shown: { '--bloom': 1.25, transition: { duration: 2.8, ease: [.25, .6, .3, 1] } } }
const line: Variants = { hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0, transition: { duration: 1.1, ease: silk } } }
const rule: Variants = { hidden: { scaleX: 0 }, shown: { scaleX: 1, transition: { duration: 1.1, ease: silk } } }
const ink: Variants = { hidden: { '--ink': '-15%' }, shown: { '--ink': '115%', transition: { duration: 2, ease: [.4, .1, .3, 1] } } }

const arrow = <svg className="std-arrow" viewBox="0 0 32 19" aria-hidden="true"><path d="M0 9.5h31M22.5 1l8.5 8.5-8.5 8.5" /></svg>

/** For now the whole website is this one card: Caswell House in watercolour, the date, and a button to keep it. */
export function SaveTheDate({ open }: { open: boolean }) {
  const reduced = useReducedMotion()
  const card = useRef<HTMLElement>(null)
  useEffect(() => { if (open) card.current?.focus({ preventScroll: true }) }, [open])
  return <motion.div className="std-page" inert={!open} aria-hidden={!open || undefined} initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0 : .9, ease: silk }}>
    <main>
      <motion.article ref={card} className="std" tabIndex={-1} aria-labelledby="std-title std-names" initial={reduced ? false : 'hidden'} animate="shown" variants={{ shown: { transition: { staggerChildren: .09, delayChildren: .5 } } }}>
        <motion.div className="std-frame" aria-hidden="true" variants={frame} />
        <motion.img className="std-sprig std-sprig-top" src={images.leavesTopLeft} alt="" width="376" height="276" aria-hidden="true" variants={sprig(-5)} />
        <motion.img className="std-sprig std-sprig-bottom" src={images.leavesBottomRight} alt="" width="300" height="277" aria-hidden="true" variants={sprig(5)} />
        <motion.img className="std-painting" src={images.painting} alt="A watercolour of Caswell House: honey-coloured Cotswold stone houses and barns around a gravel courtyard, with gardens and trees all around." width="950" height="502" decoding="async" variants={bloom} />
        <motion.p className="std-caps std-intro" variants={line}>With full hearts,<br />we’d like to invite you to</motion.p>
        <motion.h1 className="std-title" id="std-title" variants={line}><span>Save</span> <em>the</em> <span>date</span></motion.h1>
        <motion.i className="std-rule" aria-hidden="true" variants={rule} />
        <motion.p className="std-caps std-for" variants={line}>For the wedding of</motion.p>
        <motion.p className="std-names" id="std-names" variants={ink}>Imogen <span>&amp;</span> Dan</motion.p>
        <motion.i className="std-rule" aria-hidden="true" variants={rule} />
        <motion.p className="std-when" variants={line}><span className="std-day">Thursday</span><span className="visually-hidden">, </span><time className="std-date" dateTime="2028-08-24">24 August 2028</time></motion.p>
        <motion.i className="std-rule" aria-hidden="true" variants={rule} />
        <motion.p className="std-place" variants={line}><span className="std-venue">Caswell House</span><span className="visually-hidden">, </span><span className="std-county">Oxfordshire</span></motion.p>
        <motion.a className="std-button" href="/save-the-date.ics" download="imogen-and-dan.ics" variants={line}><span>Save our date</span>{arrow}<span className="visually-hidden"> — Add to calendar</span></motion.a>
      </motion.article>
    </main>
  </motion.div>
}
