import watercolour from './assets/venue/caswell-watercolour.webp'
import courtyard from './assets/venue/courtyard.webp'
import willow from './assets/venue/willow-stream.webp'
import lounge from './assets/venue/garden-lounge.webp'
import bench from './assets/venue/bench.webp'
import './Venue.css'

const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Caswell House, Brize Norton, OX18 3NJ')

export function Venue() {
  return <section className="venue-section" id="the-venue" aria-labelledby="venue-heading">
    <div className="section-heading"><p className="eyebrow">Where we’ll say I do</p><h2 id="venue-heading">Caswell House</h2><p>Honey-coloured Cotswold stone, walled gardens and willow-lined water, tucked into the fields near Brize Norton, Oxfordshire.</p></div>
    <figure className="venue-watercolour"><img src={watercolour} alt="A watercolour painting of Caswell House from above: stone farmhouse and long barn, a green lawn and autumn trees, with fields beyond." width="1360" height="907" loading="lazy" decoding="async" /></figure>
    <div className="venue-gallery">
      <figure className="venue-photo venue-wide"><img src={courtyard} alt="Aerial view of Caswell House’s stone barns around a gravel courtyard with a tree at its centre." width="1360" height="907" loading="lazy" decoding="async" /><figcaption>The barns and courtyard</figcaption></figure>
      <figure className="venue-photo"><img src={willow} alt="Weeping willows trailing over a still stream beside an old stone wall." width="680" height="1020" loading="lazy" decoding="async" /><figcaption>Down by the willows</figcaption></figure>
      <figure className="venue-photo"><img src={lounge} alt="Cream armchairs and cane chairs on the lawn beneath a fringed parasol, with champagne on ice." width="678" height="1020" loading="lazy" decoding="async" /><figcaption>Fizz on the lawn</figcaption></figure>
      <figure className="venue-photo venue-bench"><img src={bench} alt="A white swing bench in front of a Cotswold stone wall, framed by lavender." width="679" height="1020" loading="lazy" decoding="async" /><figcaption>A little bench <em>for a little kiss</em></figcaption></figure>
    </div>
    <a className="venue-map" href={map} target="_blank" rel="noopener noreferrer">Caswell House, Brize Norton, OX18 3NJ <span className="visually-hidden">(open in Google Maps in a new tab)</span><svg className="arrow-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" /></svg></a>
  </section>
}
