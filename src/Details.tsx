import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { afterParty, menu, timeline, wines } from './dayDetails'
import { OliveSprig } from './OliveBranch'
import { SectionHeading } from './SectionHeading'
import crabtree from './assets/venue/crabtree.webp'
import './paperEdge.css'
import './Details.css'

const arrow = <svg className="arrow-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" /></svg>

export function Timeline() {
  return <section className="section band timeline-section" id="the-day" aria-labelledby="timeline-heading">
    <div className="section-inner">
      <SectionHeading numeral="ii" label="Thursday 24 August 2028" id="timeline-heading" title={<>The day, <em>hour by hour</em></>}>A rough plan for now. Exact times will follow.</SectionHeading>
      <div className="timeline-wrap">
        <span className="timeline-spine" aria-hidden="true" />
        <ol className="timeline">{timeline.map(item => <li key={item.title} className={item.time ? 'is-set' : undefined}>
          <span className={`timeline-time${item.time ? ' foil' : ''}`}>{item.time || 'Time to follow'}</span>
          <span className="timeline-dot" aria-hidden="true" />
          <div className="timeline-event"><h3>{item.title}</h3><p>{item.note}</p></div>
        </li>)}</ol>
      </div>
    </div>
  </section>
}

export function FoodAndDrink() {
  return <section className="section band band-sage food-section" id="food" aria-labelledby="food-heading">
    <div className="section-inner">
      <SectionHeading numeral="iv" label="Food & drink on the night" id="food-heading" title={<>Come hungry, <em>stay thirsty</em></>} />
      <div className="food-grid">
        <div className="menu-card"><div className="menu-paper"><div className="menu-frame"><div className="menu-inner">
          <p className="label">Caswell House · 24 · viii · 28</p>
          <h3 className="menu-title foil">Menu</h3>
          <OliveSprig className="menu-sprig" />
          <dl>{menu.map(item => <div key={item.course} className={item.dish === 'To be confirmed' ? 'is-pending' : 'is-set'}><dt>{item.course}</dt><dd>{item.dish}</dd></div>)}</dl>
          <p className="menu-note">Dietary requirements? We’ll ask when we send the invitations.</p>
        </div></div></div></div>
        <div className="wine-list" data-reveal>
          <p className="label">In our glasses</p>
          <h3>We’re excited to share some of our <em>favourite wines</em> with you at dinner.</h3>
          <ul>{wines.map(wine => <li key={wine.kind}><span className="wine-kind">{wine.kind}</span><span className="wine-name">{wine.name}</span><span className="wine-origin">{wine.origin}</span></li>)}</ul>
        </div>
      </div>
    </div>
  </section>
}

// Strings of festoon lights swagging across the top of the Friday section: three near, two further back for depth.
// Each swag hangs from just above the band, so the lights seem to carry on overhead.
const swags = [
  { from: [-70, -16], control: [165, 150], to: [400, -16], bulbs: 9, depth: 'near' },
  { from: [400, -16], control: [600, 164], to: [800, -16], bulbs: 9, depth: 'near' },
  { from: [800, -16], control: [1035, 150], to: [1270, -16], bulbs: 9, depth: 'near' },
  { from: [160, -12], control: [400, 104], to: [640, -12], bulbs: 7, depth: 'far' },
  { from: [560, -12], control: [800, 104], to: [1040, -12], bulbs: 7, depth: 'far' },
] as const
const point = ({ from, control, to }: (typeof swags)[number], t: number) => ({
  x: (1 - t) ** 2 * from[0] + 2 * (1 - t) * t * control[0] + t * t * to[0],
  y: (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * control[1] + t * t * to[1],
})
const bulbs = swags.flatMap(swag => Array.from({ length: swag.bulbs }, (_, index) => ({ ...point(swag, (index + .5) / swag.bulbs), depth: swag.depth })))

function Festoon() {
  return <svg className="festoon" viewBox="0 0 1200 120" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
    <defs><radialGradient id="festoon-glow"><stop stopColor="#ffe3a3" stopOpacity=".75" /><stop offset=".35" stopColor="#f6c86b" stopOpacity=".28" /><stop offset="1" stopColor="#f6c86b" stopOpacity="0" /></radialGradient></defs>
    {(['far', 'near'] as const).map(depth => <g key={depth} className={`festoon-layer is-${depth}`}>
      {swags.filter(swag => swag.depth === depth).map(({ from, control, to }) => <path key={from[0]} className="festoon-cord" d={`M${from[0]} ${from[1]}Q${control[0]} ${control[1]} ${to[0]} ${to[1]}`} />)}
      {bulbs.filter(bulb => bulb.depth === depth).map(({ x, y }, index) => <g key={index} className="bulb" transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})${depth === 'far' ? ' scale(.62)' : ''}`}>
        <circle className="bulb-glow" r="26" fill="url(#festoon-glow)" style={depth === 'near' ? { animationDelay: `${-(index * .73) % 3.4}s` } : undefined} />
        <path d="M0 0v7" stroke="#141a0e" strokeWidth="1.2" />
        <rect x="-2.4" y="5" width="4.8" height="4" rx="1" fill="#2b2a1e" />
        <ellipse cy="14" rx="4.6" ry="6" fill="#ffe9b3" />
        <ellipse cx="-1.4" cy="12" rx="1.3" ry="2.2" fill="#fffaf0" />
      </g>)}
    </g>)}
  </svg>
}

const since = (from: number, now: number) => {
  const seconds = Math.max(0, Math.floor((now - from) / 1000))
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 }
}
const pad = (value: number) => String(value).padStart(2, '0')

export function AfterParty() {
  const reduced = useReducedMotion()
  const firstDate = new Date(afterParty.firstDate).getTime()
  const [now, setNow] = useState(() => Date.now())
  // The day count rolls up from nothing the first time it comes into view.
  const [counted, setCounted] = useState(reduced ? 1 : 0)
  const counter = useRef<HTMLDivElement>(null)
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => {
    const element = counter.current
    if (reduced || !element) { setCounted(1); return }
    let stop = () => {}
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      stop = animate(0, 1, { duration: 2.6, ease: [.16, 1, .3, 1], onUpdate: setCounted }).stop
    }, { threshold: .5 })
    observer.observe(element)
    return () => { observer.disconnect(); stop() }
  }, [reduced])
  const elapsed = since(firstDate, now)
  return <section className="section after-party" id="friday" aria-labelledby="after-party-heading">
    <Festoon />
    <div className="section-inner after-party-grid">
      <div className="after-party-copy">
        <SectionHeading numeral="v" label="Friday 25 August · Keep the party going" id="after-party-heading" align="left" tone="dark" title={<>One more drink, <em>where it all began</em></>} />
        <p data-reveal>For those of you who want to keep the party going, we’re planning on gathering in the beer garden at {afterParty.pub} in {afterParty.area} on Friday evening. It’s where we had our very first date.</p>
        <a className="after-party-map" href={afterParty.map} target="_blank" rel="noopener noreferrer" data-reveal>Find {afterParty.pub} <span className="visually-hidden">(opens Google Maps in a new tab)</span>{arrow}</a>
        <div className="first-date-counter" ref={counter} data-reveal>
          <p className="label">Our first date was</p>
          <p className="counter-figure"><strong className="foil">{Math.round(elapsed.days * counted).toLocaleString('en-GB')}</strong><span>days ago</span></p>
          <span className="counter-clock" aria-hidden="true">{pad(elapsed.hours)}<i>h</i> {pad(elapsed.minutes)}<i>m</i> {pad(elapsed.seconds)}<i>s</i></span>
          <span className="counter-date">12 October 2023 · 7:29pm</span>
        </div>
      </div>
      <figure className="photo-print crabtree-photo"><img src={crabtree} alt="The Crabtree pub at dusk, its brick front lit by gold lanterns." width="289" height="312" loading="lazy" decoding="async" /><figcaption>Where it all began</figcaption></figure>
    </div>
  </section>
}
