import { useEffect, useState } from 'react'
import { afterParty, menu, timeline, wines } from './details'
import { OliveBranch } from './OliveBranch'
import './Details.css'

export function ThursdayNote() {
  return <aside className="thursday-note" aria-labelledby="thursday-heading">
    <p className="eyebrow">A small apology</p>
    <h2 id="thursday-heading">Yes, it’s a <em>Thursday.</em></h2>
    <p>We know, we know. We’re sorry! Book the Friday off and think of it as a very long weekend that starts early.</p>
    <span>We promise it’ll be worth it.</span>
  </aside>
}

export function Timeline() {
  return <section className="timeline-section" id="the-day" aria-labelledby="timeline-heading">
    <div className="section-heading"><p className="eyebrow">Thursday 24 August 2028</p><h2 id="timeline-heading">The day, <em>hour by hour</em></h2><p>A rough plan for now. Exact times will follow.</p></div>
    <ol className="timeline">{timeline.map(item => <li key={item.title} className={item.time ? 'is-set' : undefined}>
      <span className="timeline-time">{item.time || <i>Time to follow</i>}</span>
      <span className="timeline-dot" aria-hidden="true" />
      <div><h3>{item.title}</h3><p>{item.note}</p></div>
    </li>)}</ol>
  </section>
}

export function FoodAndDrink() {
  return <section className="food-section" aria-labelledby="food-heading">
    <div className="section-heading"><p className="eyebrow">Food & drink on the night</p><h2 id="food-heading">Come hungry, <em>stay thirsty</em></h2></div>
    <div className="food-grid">
      <div className="menu-card">
        <OliveBranch className="menu-branch" />
        <p className="eyebrow">The menu</p>
        <dl>{menu.map(item => <div key={item.course} className={item.dish === 'To be confirmed' ? 'is-pending' : undefined}><dt>{item.course}</dt><dd>{item.dish}</dd></div>)}</dl>
        <span className="menu-note">Dietary requirements? We’ll ask when we send the invitations.</span>
      </div>
      <div className="wine-list">
        <p className="eyebrow">In our glasses</p>
        <h3>We’re excited to share some of our <em>favourite wines</em> with you at dinner.</h3>
        <ul>{wines.map(wine => <li key={wine.kind}><span className="wine-kind">{wine.kind}</span><span className="wine-name">{wine.name}</span><span className="wine-origin">{wine.origin}</span></li>)}</ul>
      </div>
    </div>
  </section>
}

const since = (from: number, now: number) => {
  const seconds = Math.max(0, Math.floor((now - from) / 1000))
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 }
}
const pad = (value: number) => String(value).padStart(2, '0')

export function AfterParty() {
  const firstDate = new Date(afterParty.firstDate).getTime()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const elapsed = since(firstDate, now)
  return <section className="after-party" aria-labelledby="after-party-heading">
    <div className="after-party-copy">
      <p className="eyebrow">Friday 25 August · Keep the party going</p>
      <h2 id="after-party-heading">One more drink, <em>where it all began</em></h2>
      <p>For those of you who want to keep the party going, we’re planning on gathering in the beer garden at {afterParty.pub} on Friday evening. It’s where we had our very first date.</p>
    </div>
    <div className="first-date-counter">
      <p className="eyebrow">Our first date was</p>
      <strong>{elapsed.days.toLocaleString('en-GB')}</strong>
      <span className="counter-unit">days ago</span>
      <span className="counter-clock" aria-hidden="true">{pad(elapsed.hours)}<i>h</i> {pad(elapsed.minutes)}<i>m</i> {pad(elapsed.seconds)}<i>s</i></span>
      <span className="counter-date">12 October 2023 · 7:29pm</span>
    </div>
  </section>
}
