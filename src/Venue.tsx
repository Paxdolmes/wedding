import watercolour from './assets/venue/caswell-watercolour.webp'
import courtyard from './assets/venue/courtyard.webp'
import willow from './assets/venue/willow-stream.webp'
import lounge from './assets/venue/garden-lounge.webp'
import bench from './assets/venue/bench.webp'
import { SectionHeading } from './SectionHeading'
import './Venue.css'

const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Caswell House, Brize Norton, OX18 3NJ')

export function Venue() {
  return <section className="section venue-section" id="the-venue" aria-labelledby="venue-heading">
    <div className="section-inner">
      <SectionHeading numeral="iii" label="Where we’ll say I do" id="venue-heading" title="Caswell House">Honey-coloured Cotswold stone, walled gardens and willow-lined water, tucked into the Oxfordshire countryside.</SectionHeading>
      <figure className="venue-watercolour"><img src={watercolour} alt="A watercolour painting of Caswell House from above: stone farmhouse and long barn, a green lawn and autumn trees, with fields beyond." width="1360" height="907" loading="lazy" decoding="async" /><figcaption className="label">Caswell House, in watercolour</figcaption></figure>
      <div className="venue-gallery">
        <figure className="venue-photo venue-wide"><div className="frame"><img src={courtyard} alt="Aerial view of Caswell House’s stone barns around a gravel courtyard with a tree at its centre." width="1360" height="907" loading="lazy" decoding="async" /></div><figcaption><span>The barns and courtyard</span></figcaption></figure>
        <figure className="venue-photo"><div className="frame"><img src={willow} alt="Weeping willows trailing over a still stream beside an old stone wall." width="680" height="1020" loading="lazy" decoding="async" /></div><figcaption><span>Down by the willows</span></figcaption></figure>
        <figure className="venue-photo"><div className="frame"><img src={lounge} alt="Cream armchairs and cane chairs on the lawn beneath a fringed parasol, with champagne on ice." width="678" height="1020" loading="lazy" decoding="async" /></div><figcaption><span>Fizz on the lawn</span></figcaption></figure>
        <figure className="venue-photo venue-bench"><div className="frame"><img src={bench} alt="A white swing bench in front of a Cotswold stone wall, framed by lavender." width="679" height="1020" loading="lazy" decoding="async" /></div><figcaption><span className="bench-caption">A little bench <em>for a little kiss</em></span></figcaption></figure>
      </div>
      <a className="venue-map ink-link" href={map} target="_blank" rel="noopener noreferrer" data-reveal>Caswell House, Oxfordshire, OX18 3NJ <span className="visually-hidden">(open in Google Maps in a new tab)</span><svg className="arrow-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" /></svg></a>
    </div>
  </section>
}
