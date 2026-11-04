import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { PhotoStory } from './PhotoStory'
import { Accommodation } from './Accommodation'
import { EnvelopeIntro } from './EnvelopeIntro'
import { Celebration } from './Celebration'
import { AfterParty, FoodAndDrink, ThursdayNote, Timeline } from './Details'
import { DressCode, Hero, SiteFooter, Together } from './Invitation'
import { SiteHeader } from './SiteHeader'
import { Venue } from './Venue'
import { usePageAnimations } from './usePageAnimations'
import './App.css'

export default function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [showInvitation, setShowInvitation] = useState(false)
  const [replay, setReplay] = useState(false)
  const reduceMotion = useReducedMotion()
  const invitation = useRef<HTMLElement>(null)
  const page = useRef<HTMLDivElement>(null)
  usePageAnimations(page, showInvitation, isOpen)
  useEffect(() => { if (isOpen) invitation.current?.focus({ preventScroll: true }) }, [isOpen])
  function closeInvitation() {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setReplay(true)
    setIsOpen(false)
    setShowInvitation(false)
  }
  return <>
    {!isOpen && <EnvelopeIntro replay={replay} onReveal={() => setShowInvitation(true)} onOpen={() => setIsOpen(true)} />}
    {!reduceMotion && <Celebration />}
    {showInvitation && <>
      <SiteHeader hidden={!isOpen} />
      <motion.div ref={page} className="page" inert={!isOpen} aria-hidden={!isOpen || undefined} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : .9, ease: [.22, 1, .36, 1] }} style={{ transformOrigin: '50% 0' }}>
        <main>
          <Hero ref={invitation} />
          <Together />
          <ThursdayNote />
          <Timeline />
          <Venue />
          <FoodAndDrink />
          <AfterParty />
          <DressCode />
          <Accommodation />
          <PhotoStory />
        </main>
        <SiteFooter onReplay={closeInvitation} />
      </motion.div>
    </>}
  </>
}
