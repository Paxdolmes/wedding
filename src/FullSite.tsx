import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { PhotoStory } from './PhotoStory'
import { Accommodation } from './Accommodation'
import { AfterParty, FoodAndDrink, ThursdayNote, Timeline } from './Details'
import { DressCode, Hero, SiteFooter, Together } from './Invitation'
import { SiteHeader } from './SiteHeader'
import { Venue } from './Venue'
import { usePageAnimations } from './usePageAnimations'
import './App.css'

/**
 * The whole site as we made it: the invitation, the day, the venue, food and drink, Friday, what to wear, where to stay
 * and our photos. Hidden for now behind `showFullSite` in `wedding.ts`, and loaded only when it's switched on.
 */
export default function FullSite({ open, onReplay }: { open: boolean; onReplay: () => void }) {
  const reduceMotion = useReducedMotion()
  const invitation = useRef<HTMLElement>(null)
  const page = useRef<HTMLDivElement>(null)
  usePageAnimations(page, true, open)
  useEffect(() => { if (open) invitation.current?.focus({ preventScroll: true }) }, [open])
  return <>
    <SiteHeader hidden={!open} />
    <motion.div ref={page} className="page" inert={!open} aria-hidden={!open || undefined} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : .9, ease: [.22, 1, .36, 1] }} style={{ transformOrigin: '50% 0' }}>
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
      <SiteFooter onReplay={onReplay} />
    </motion.div>
  </>
}
