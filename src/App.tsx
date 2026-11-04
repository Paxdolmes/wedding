import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { wedding } from './wedding'
import { EngagementPhoto, PhotoStory } from './PhotoStory'
import { Accommodation } from './Accommodation'
import { EnvelopeIntro } from './EnvelopeIntro'
import { OliveBranch } from './OliveBranch'
import './App.css'

export default function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [showInvitation, setShowInvitation] = useState(false)
  const [replay, setReplay] = useState(false)
  const reduceMotion = useReducedMotion()
  const invitation = useRef<HTMLElement>(null)
  useEffect(() => { if (isOpen) invitation.current?.focus({ preventScroll: true }) }, [isOpen])
  function closeInvitation() {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setReplay(true)
    setIsOpen(false)
    setShowInvitation(false)
  }
  return <>
    {!isOpen && <EnvelopeIntro replay={replay} onReveal={() => setShowInvitation(true)} onOpen={() => setIsOpen(true)} />}
    {showInvitation && <motion.div className="page" inert={!isOpen} aria-hidden={!isOpen || undefined} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : .9 }}>
    <header className="masthead"><span className="monogram" aria-label={wedding.names}>I <i>&</i> D</span><a href="#the-details" className="eyebrow">A day to remember <svg className="arrow-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" /></svg></a></header>
    <main>
      <article className="invitation" ref={invitation} tabIndex={-1} aria-labelledby="couple-names">
        <OliveBranch className="invitation-branch" /><p className="eyebrow">With full hearts, we invite you to</p><p className="save-the-date">save the date</p><h1 id="couple-names">Imogen <span>&</span> Dan</h1>
        <div className="date-lockup"><span>Thursday</span><time dateTime="2028-08-24">24<span> August </span>2028</time><span>Oxfordshire</span></div>
        <p className="wedding-location">{wedding.location}</p><p className="invitation-note">One day. Our favourite people.<br />The beginning of our forever.</p>
        <a className="calendar-link" href="/save-the-date.ics" download="imogen-and-dan.ics">Save our date <svg className="arrow-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" /></svg><span className="visually-hidden"> — Add to calendar</span></a>
        <a className="discover-link" href="#the-details"><span>The lovely details</span><span aria-hidden="true">↓</span></a>
      </article>
      <section className="together-section" id="the-details" aria-labelledby="together-heading"><div className="together-copy"><p className="eyebrow">Our next chapter</p><h2 id="together-heading">All the adventures.<br />All the little things.<br /><em>Always, you.</em></h2><p>We’re getting married, and we can’t imagine celebrating without you.</p><p>Join us at Caswell House on 24 August 2028.<br />More details will follow. For now, keep the day for us.</p><span className="signature">With love, Imogen & Dan</span></div><EngagementPhoto /></section>
      <section className="dress-code" aria-labelledby="dress-code-heading"><OliveBranch className="dress-branch" /><h2 id="dress-code-heading" className="eyebrow">What to wear</h2><p>Whatever makes you<br /><em>feel beautiful.</em></p><span>As long as you don’t feel beautiful in white.</span></section>
      <Accommodation /><PhotoStory />
    </main>
    <footer><span className="footer-names">Imogen & Dan</span><span className="eyebrow">24 August 2028 · Caswell House</span><button type="button" className="text-button" onClick={closeInvitation}>Open the envelope again <span aria-hidden="true">↺</span></button></footer>
  </motion.div>}
  </>
}
