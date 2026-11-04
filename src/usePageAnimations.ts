import { useEffect, useLayoutEffect, type RefObject } from 'react'

// GSAP and the page choreography load in the background while the envelope is on screen, keeping the first download small.
let animations: typeof import('./pageAnimations') | undefined
import('./pageAnimations').then(module => { animations = module }, () => {})

/**
 * Runs the page's entrance and scroll animations once the invitation is shown.
 * If they haven't loaded by then (a very quick click on a slow connection), the page simply appears without them.
 */
export function usePageAnimations(page: RefObject<HTMLDivElement | null>, shown: boolean, open: boolean) {
  useLayoutEffect(() => {
    const root = page.current
    if (!shown || !root || !animations) return
    return animations.animatePage(root)
  }, [page, shown])

  useEffect(() => {
    if (!open || !animations) return
    return animations.measureScroll()
  }, [open])
}
