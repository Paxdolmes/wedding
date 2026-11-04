import { useEffect, useState, type Ref } from 'react'
import { wedding } from './wedding'
import { EngagementPhoto } from './PhotoStory'
import { OliveSprig, SprigDivider } from './OliveBranch'
import { SectionHeading } from './SectionHeading'
import { WaxSeal } from './WaxSeal'

const weddingDay = new Date('2028-08-24T14:00:00+01:00').getTime()
const arrow = <svg className="arrow-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" /></svg>

function useDaysToGo() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer) }, [])
  return Math.max(0, Math.ceil((weddingDay - now) / 86_400_000))
}

/** The invitation itself, framed like the card: the first thing on the page once the envelope is open. */
export function Hero({ ref }: { ref: Ref<HTMLElement> }) {
  const days = useDaysToGo()
  return <article className="hero" id="top" ref={ref} tabIndex={-1} aria-labelledby="couple-names">
    <div className="hero-frame" aria-hidden="true"><i /><i /><i /><i /></div>
    <OliveSprig className="hero-sprig" />
    <p className="label hero-label">With full hearts, we invite you to</p>
    <p className="hero-script foil">save the date</p>
    <h1 id="couple-names" className="hero-names"><span className="hero-name">Imogen</span> <span className="amp foil">&amp;</span> <span className="hero-name">Dan</span></h1>
    <div className="date-lockup"><span>Thursday</span><i aria-hidden="true" /><time dateTime="2028-08-24">24 August 2028</time><i aria-hidden="true" /><span>Oxfordshire</span></div>
    <p className="wedding-location">{wedding.location}</p>
    <p className="invitation-note">One day. Our favourite people.<br />The beginning of our forever.</p>
    <a className="calendar-link" href="/save-the-date.ics" download="imogen-and-dan.ics"><span>Save our date</span>{arrow}<span className="visually-hidden"> — Add to calendar</span></a>
    <p className="countdown"><span className="countdown-days foil">{days.toLocaleString('en-GB')}</span><span className="label">days to go</span></p>
    <a className="discover-link" href="#the-details"><span>The lovely details</span><i aria-hidden="true" /></a>
  </article>
}

export function Together() {
  return <section className="section together" id="the-details" aria-labelledby="together-heading">
    <div className="section-inner together-grid">
      <EngagementPhoto />
      <div className="together-copy">
        <SectionHeading numeral="i" label="Our next chapter" id="together-heading" align="left" title={<>All the adventures.<br />All the little things.<br /><em>Always, you.</em></>} />
        <blockquote className="important-note" data-reveal><p>If you’re reading this, you’re one of the people who matter most to us.</p></blockquote>
        <p data-reveal>We’re getting married, and we can’t imagine celebrating without you. Join us at Caswell House on 24 August 2028.</p>
        <p data-reveal>More details will follow. For now, keep the day for us.</p>
        <p className="signature" data-reveal><span>With love,</span><span>Imogen &amp; Dan</span></p>
      </div>
    </div>
  </section>
}

export function DressCode() {
  return <section className="section dress-code" aria-labelledby="dress-code-heading">
    <div className="section-inner">
      <div className="section-numeral" aria-hidden="true"><span /><i className="foil">vi</i><span /></div>
      <h2 id="dress-code-heading" className="label">What to wear</h2>
      <p className="dress-statement" data-reveal>Whatever makes you <em>feel beautiful.</em></p>
      <p className="dress-note" data-reveal>As long as you don’t feel beautiful in <span className="dress-white">white</span>.</p>
      <SprigDivider />
    </div>
  </section>
}

export function SiteFooter({ onReplay }: { onReplay: () => void }) {
  return <footer className="site-footer">
    <div className="footer-seal" aria-hidden="true"><WaxSeal /></div>
    <p className="footer-names">Imogen <span className="foil">&amp;</span> Dan</p>
    <p className="label">24 August 2028 · Caswell House</p>
    <OliveSprig className="footer-sprig" />
    <button type="button" className="replay-button" onClick={onReplay}>Open the envelope again <span aria-hidden="true">↺</span></button>
  </footer>
}
