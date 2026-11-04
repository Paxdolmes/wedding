import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger, SplitText)
ScrollTrigger.config({ ignoreMobileResize: true })

const once = (trigger: Element, start = 'top 86%') => ({ trigger, start, once: true })
const all = <T extends Element = HTMLElement>(root: Element, selector: string) => [...root.querySelectorAll<T>(selector)]

/** The invitation writes itself in: the sprig draws, the names rise letter by letter, the details follow. */
function heroEntrance(root: HTMLElement) {
  const title = root.querySelector('.hero-names')
  const names = title ? SplitText.create(title, { type: 'chars', charsClass: 'hero-char', ignore: '.amp' }) : null
  gsap.timeline({ delay: .3, defaults: { duration: 1.2, ease: 'power3.out' } })
    .from(all(root, '.hero-frame'), { opacity: 0, scale: 1.02, duration: 1.8 }, 0)
    .from(all(root, '.hero-frame i'), { scale: 0, duration: .9, stagger: .08, ease: 'back.out(2.2)' }, .6)
    .from(all(root, '.hero-sprig path'), { drawSVG: 0, duration: 1.7, stagger: .05, ease: 'power2.inOut' }, .05)
    .from(all(root, '.hero-sprig ellipse'), { scale: 0, transformOrigin: '50% 50%', duration: .7, stagger: .2, ease: 'back.out(3)' }, 1.3)
    .from(all(root, '.hero-label'), { opacity: 0, letterSpacing: '.6em', duration: 1.6, clearProps: 'letterSpacing' }, .2)
    .from(all(root, '.hero-script'), { opacity: 0, y: 18, filter: 'blur(8px)', duration: 1.4 }, .4)
    .from(names?.chars ?? [], { opacity: 0, yPercent: 60, rotation: 6, filter: 'blur(12px)', duration: 1.5, stagger: { each: .05, from: 'center' }, ease: 'power4.out', onComplete: () => names?.revert() }, .55)
    .from(all(root, '.hero-names .amp'), { opacity: 0, scale: .5, rotation: -14, filter: 'blur(10px)', duration: 1.5, ease: 'power3.out' }, .85)
    .from(all(root, '.date-lockup i'), { scaleY: 0, duration: 1.1, ease: 'power2.inOut' }, 1.15)
    .from(all(root, '.date-lockup > span, .date-lockup time'), { opacity: 0, y: 12, stagger: .1 }, 1.2)
    .from(all(root, '.wedding-location, .invitation-note, .calendar-link, .countdown, .discover-link'), { opacity: 0, y: 18, stagger: .1 }, 1.4)
}

/** Each chapter's numeral rules draw outwards, its label breathes in and the title rises line by line from a mask. */
function chapterHeadings(root: HTMLElement) {
  for (const numeral of all(root, '.section-numeral')) {
    gsap.timeline({ scrollTrigger: once(numeral) })
      .from(numeral.querySelectorAll('span'), { scaleX: 0, duration: 1.3, ease: 'power3.inOut' })
      .from(numeral.querySelector('i'), { opacity: 0, y: 10, duration: 1, ease: 'power3.out' }, .2)
  }
  for (const heading of all(root, '.section-heading, .dress-code .section-inner')) {
    const timeline = gsap.timeline({ scrollTrigger: once(heading) })
    const label = heading.querySelector(':scope > .label')
    const title = heading.querySelector(':scope > h2:not(.label)')
    const lede = heading.querySelector(':scope > .section-lede')
    if (label) timeline.from(label, { opacity: 0, letterSpacing: '.6em', duration: 1.4, ease: 'power3.out', clearProps: 'letterSpacing' }, .1)
    if (title) {
      const lines = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'split-line' })
      timeline.from(lines.lines, { yPercent: 110, duration: 1.2, stagger: .12, ease: 'power4.out', onComplete: () => lines.revert() }, .2)
    }
    if (lede) timeline.from(lede, { opacity: 0, y: 16, duration: 1.1, ease: 'power3.out' }, .55)
  }
}

/** Everything marked data-reveal drifts up into place as it scrolls into view, in small groups. */
function reveals(root: HTMLElement) {
  const items = all(root, '[data-reveal]')
  gsap.set(items, { opacity: 0, y: 28 })
  ScrollTrigger.batch(items, { start: 'top 90%', once: true, onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, stagger: .12, ease: 'power3.out', clearProps: 'transform' }) })
}

/** Photo prints are laid down at a slight angle and develop from a washed-out sepia to full colour. */
function prints(root: HTMLElement) {
  for (const print of all(root, '.photo-print, .venue-photo, .thursday-note, .menu-card')) {
    const timeline = gsap.timeline({ scrollTrigger: once(print, 'top 92%') })
    timeline.from(print, { opacity: 0, y: 56, rotation: '+=4', duration: 1.5, ease: 'power3.out', clearProps: 'transform,opacity' })
    const image = print.querySelector('img')
    if (image) timeline.from(image, { filter: 'sepia(.7) saturate(.35) brightness(1.2) contrast(.82) blur(3px)', duration: 2.6, ease: 'power2.out', clearProps: 'filter' }, .1)
  }
  // The venue photographs drift a little slower than the page, as if seen through a window.
  for (const frame of all(root, '.venue-photo .frame')) {
    gsap.fromTo(frame.querySelector('img'), { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } })
  }
  const painting = root.querySelector('.venue-watercolour img')
  if (painting) gsap.fromTo(painting, { '--bloom': 0, scale: 1.04 }, { '--bloom': 1.25, scale: 1, duration: 3, ease: 'power2.out', scrollTrigger: once(painting, 'top 80%') })
}

/** The order of the day: the line draws down the page as you read, and each moment arrives as the line reaches it. */
function timeline(root: HTMLElement) {
  const wrap = root.querySelector('.timeline-wrap')
  const spine = wrap?.querySelector('.timeline-spine')
  if (!wrap || !spine) return
  gsap.from(spine, { scaleY: 0, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 72%', end: 'bottom 62%', scrub: .8 } })
  for (const item of all(wrap, '.timeline li')) {
    gsap.timeline({ scrollTrigger: once(item, 'top 74%') })
      .from(item.querySelector('.timeline-dot'), { scale: 0, duration: .8, ease: 'back.out(2.6)' })
      .from(item.querySelectorAll('.timeline-time, .timeline-event'), { opacity: 0, y: 18, duration: 1.1, stagger: .08, ease: 'power3.out' }, .05)
  }
}

/** Friday's festoon lights come on one by one; the footer seal is pressed into the paper. */
function details(root: HTMLElement) {
  const festoon = root.querySelector('.festoon')
  if (festoon) gsap.from(festoon.querySelectorAll('.bulb'), { opacity: .12, duration: .35, stagger: { each: .08, from: 'random' }, ease: 'power1.out', scrollTrigger: once(festoon, 'top 70%') })
  const seal = root.querySelector('.footer-seal')
  if (seal) gsap.timeline({ scrollTrigger: once(seal, 'top 92%') })
    .from(seal, { opacity: 0, scale: 1.9, rotation: -16, duration: .65, ease: 'power3.in' })
    .to(seal, { scale: .95, duration: .09, yoyo: true, repeat: 1, ease: 'power1.inOut' })
}

/** Every entrance and scroll animation on the page; returns a function that undoes them. With reduced motion the page is simply there. */
export function animatePage(root: HTMLElement) {
  const media = gsap.matchMedia(root)
  media.add('(prefers-reduced-motion: no-preference)', () => {
    heroEntrance(root)
    chapterHeadings(root)
    reveals(root)
    prints(root)
    timeline(root)
    details(root)
  })
  return () => media.revert()
}

/** Trigger positions are measured once the envelope has gone and the page can scroll, and again when the fonts have settled. */
export function measureScroll() {
  ScrollTrigger.refresh()
  let live = true
  document.fonts?.ready.then(() => { if (live) ScrollTrigger.refresh() })
  return () => { live = false }
}
