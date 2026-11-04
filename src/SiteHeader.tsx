import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SprigDivider } from './OliveBranch'
import './SiteHeader.css'

const sections = [
  { href: '#the-day', label: 'The day' },
  { href: '#the-venue', label: 'Venue' },
  { href: '#food', label: 'Food & drink' },
  { href: '#friday', label: 'Friday' },
  { href: '#stay', label: 'Where to stay' },
  { href: '#moments', label: 'Moments' },
]

/** The monogram and section links. Transparent over the invitation, then a frosted bar once you scroll. */
export function SiteHeader({ hidden }: { hidden: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const progress = useRef<HTMLSpanElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 24)
      const length = document.documentElement.scrollHeight - window.innerHeight
      if (progress.current) progress.current.style.transform = `scaleX(${length > 0 ? Math.min(1, window.scrollY / length) : 0})`
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  // Underline whichever chapter is in the middle of the screen.
  useEffect(() => {
    // The invitation and its opening chapter come first, so nothing is underlined until The day.
    const targets = ['#top', '#the-details', ...sections.map(section => section.href)].map(href => document.querySelector(href)).filter(Boolean) as Element[]
    const chapters = new Set(sections.map(section => section.href))
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const href = `#${entry.target.id}`
      if (entry.isIntersecting) setActive(chapters.has(href) ? href : '')
    }), { rootMargin: '-45% 0px -50% 0px' })
    targets.forEach(target => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstLink.current?.focus()
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', close)
    const button = menuButton.current
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', close); button?.focus({ preventScroll: true }) }
  }, [menuOpen])

  return <header className={`site-header${scrolled ? ' is-scrolled' : ''}`} inert={hidden} aria-hidden={hidden || undefined}>
    <a className="monogram" href="#top" aria-label="Imogen and Dan, back to the top">I<span className="foil">&amp;</span>D</a>
    <nav aria-label="Wedding details"><ul>{sections.map(section => <li key={section.href}>
      <a href={section.href} aria-current={active === section.href ? 'location' : undefined}>{section.label}</a>
    </li>)}</ul></nav>
    <button ref={menuButton} type="button" className="menu-button" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(true)}>Menu</button>
    <span className="scroll-progress" ref={progress} aria-hidden="true" />
    {menuOpen && createPortal(<div id="site-menu" className="site-menu" role="dialog" aria-modal="true" aria-label="Wedding details">
      <div className="site-menu-bar"><span className="monogram" aria-hidden="true">I<span className="foil">&amp;</span>D</span><button type="button" onClick={() => setMenuOpen(false)}>Close</button></div>
      <ul>{sections.map((section, index) => <li key={section.href} style={{ animationDelay: `${.08 + index * .06}s` }}>
        <a ref={index ? undefined : firstLink} href={section.href} onClick={() => setMenuOpen(false)}>{section.label}</a>
      </li>)}</ul>
      <div className="site-menu-foot"><SprigDivider /><p className="label">24 August 2028 · Caswell House</p></div>
    </div>, document.body)}
  </header>
}
