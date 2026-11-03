import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { wedding } from './wedding'
import { EngagementPhoto, PhotoStory } from './PhotoStory'
import { Accommodation } from './Accommodation'
import './App.css'

function Sprig() {
  return <svg viewBox="0 0 100 70" fill="none" aria-hidden="true" className="sprig"><path d="M20 62Q52 46 79 9M43 46Q25 44 24 28Q42 28 43 46ZM57 32Q42 26 44 12Q59 17 57 32ZM59 32Q75 36 86 22Q70 19 59 32ZM43 47Q59 54 72 42Q57 36 43 47Z" stroke="currentColor" strokeWidth="1.2" /></svg>
}

export default function App() {
  const [isOpen, setIsOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const invitation = useRef<HTMLElement>(null)
  const seal = useRef<HTMLButtonElement>(null)
  function closeInvitation() {
    setIsOpen(false)
    requestAnimationFrame(() => seal.current?.focus())
  }
  return (
    <div className="page">
      <header className="masthead"><span className="monogram" aria-label={wedding.names}>I <i>&</i> D</span><span className="eyebrow">A celebration of us</span></header>
      <main>
        <div className="introduction"><p className="eyebrow">Together with our favourite people</p><h1>A little note,<br /><em>a lifetime of love.</em></h1><p>Something wonderful is beginning. This one’s for you.</p></div>
        <div className={isOpen ? 'invitation-with-photo' : undefined}>
          <div className={`letter-stage ${isOpen ? 'is-open' : ''}`}>
            <div className="envelope">
              <div className="envelope-lining" />
              <motion.div className="envelope-flap" aria-hidden="true" animate={{ rotateX: isOpen ? 180 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.7, ease: 'easeInOut' }} />
              <div className="envelope-pocket" aria-hidden="true" />
              {isOpen && <motion.article id="invitation" className="invitation" ref={invitation} tabIndex={-1} aria-labelledby="couple-names" initial={{ opacity: 0, y: reduceMotion ? -75 : 0 }} animate={{ opacity: 1, y: -75 }} transition={{ duration: reduceMotion ? 0 : 0.85, delay: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }} onAnimationComplete={() => invitation.current?.focus({ preventScroll: true })}>
                <Sprig /><p className="eyebrow">Save the date</p><h2 id="couple-names">{wedding.names}</h2><div className="fine-rule" /><p className="wedding-date">{wedding.dateLabel}</p><p className="wedding-location">{wedding.location}</p><a className="calendar-link" href="/save-the-date.ics" download="imogen-and-dan.ics">Add to calendar</a>
              </motion.article>}
              <button ref={seal} type="button" className="wax-seal" onClick={() => setIsOpen(true)} aria-label="Open your invitation" aria-expanded={isOpen} hidden={isOpen}><span aria-hidden="true">I & D</span></button>
              <span className="envelope-address" aria-hidden="true">For you, with love</span>
            </div>
            <div className="letter-actions">{isOpen ? <button type="button" className="text-button" onClick={closeInvitation}>Close & open again <span aria-hidden="true">↺</span></button> : <><p className="opening-hint">Tap the seal to open your letter</p><button type="button" className="text-button" onClick={() => setIsOpen(true)}>Read the invitation</button></>}</div>
          </div>
          {isOpen && <EngagementPhoto />}
        </div>
        {isOpen && <><section className="dress-code" aria-labelledby="dress-code-heading"><h2 id="dress-code-heading" className="eyebrow">What to wear</h2><p>Whatever makes you feel beautiful.<br /><em>As long as you don’t feel beautiful in white.</em></p></section><Accommodation /><PhotoStory /></>}
      </main>
      <footer><span>Made with love</span><span>{wedding.names}</span></footer>
    </div>
  )
}
