import { lazy, Suspense, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { EnvelopeIntro } from './EnvelopeIntro'
import { Celebration } from './Celebration'
import { SaveTheDate } from './SaveTheDate'
import { preloadSaveTheDateImages } from './saveTheDateImages'
import { showFullSite } from './wedding'

// Only the save-the-date is live for now, so guests never download the rest. In development `?full` shows it all.
const full = showFullSite || (import.meta.env.DEV && new URLSearchParams(location.search).has('full'))
// Whichever page is coming starts loading straight away, so it's ready by the time the envelope is open.
const fullSite = full ? import('./FullSite') : undefined
const FullSite = lazy(() => fullSite!)
if (!full) preloadSaveTheDateImages()

export default function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [showPage, setShowPage] = useState(false)
  const [replay, setReplay] = useState(false)
  const reduceMotion = useReducedMotion()
  function closeInvitation() {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setReplay(true)
    setIsOpen(false)
    setShowPage(false)
  }
  return <>
    {!isOpen && <EnvelopeIntro replay={replay} onReveal={() => setShowPage(true)} onOpen={() => setIsOpen(true)} />}
    {!reduceMotion && <Celebration />}
    {showPage && (full ? <Suspense><FullSite open={isOpen} onReplay={closeInvitation} /></Suspense> : <SaveTheDate open={isOpen} />)}
  </>
}
