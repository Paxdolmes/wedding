import { checkedOn, hotels, sampleDates, venueAccommodationGuide } from './hotels'
import { SectionHeading } from './SectionHeading'
import './Accommodation.css'
const pounds = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
const exactPounds = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)
const directions = (hotel: typeof hotels[number]) => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(hotel.name + ', ' + hotel.place + ', UK')}&destination=${encodeURIComponent('Caswell House, Brize Norton, OX18 3NJ')}&travelmode=driving`
const averagePrice = (hotel: typeof hotels[number]) => hotel.samples.reduce((a, b) => a + b, 0) / hotel.samples.length
// Most to least expensive.
const byPrice = [...hotels].sort((a, b) => averagePrice(b) - averagePrice(a))
export function Accommodation() {
  return <section className="section band accommodation" id="stay" aria-labelledby="accommodation-heading">
    <div className="section-inner">
    <SectionHeading numeral="vii" label="Make a night of it" id="accommodation-heading" title="Where to stay">A cosy room. A slow morning. A few lovely places close to our celebration.</SectionHeading>
    <p className="guide-note">Guide prices per double room, per night. Check your dates with the hotel.</p>
    <ul className="hotel-grid">{byPrice.map(hotel => {
      const average = averagePrice(hotel)
      return <li className="hotel-card" key={hotel.name} data-reveal>
        <div className="hotel-photo"><img src={hotel.image} alt={hotel.imageAlt} width="850" height="540" loading="lazy" decoding="async" /><a className="hotel-photo-credit" href={hotel.url} target="_blank" rel="noopener noreferrer">Photo: {hotel.name}</a></div>
        <div className="hotel-content"><p className="hotel-tier"><i aria-hidden="true" />{hotel.tier}</p><p className="hotel-place label">{hotel.place}</p><h3>{hotel.name}</h3><p className="hotel-location">Approx. {hotel.miles} miles <span aria-hidden="true">·</span> {hotel.drive} drive to Caswell House</p><p className="hotel-description">{hotel.description}</p>
          <div className="hotel-price"><strong>~{pounds(average)}</strong><span>per double room / night</span></div><p className="hotel-room">{hotel.room}</p>
          <div className="hotel-actions"><a className="hotel-link" href={hotel.url} target="_blank" rel="noopener noreferrer">View hotel <span className="visually-hidden">— {hotel.name} (opens in a new tab)</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" /></svg></a><a className="directions-link" href={directions(hotel)} target="_blank" rel="noopener noreferrer">Directions<span className="visually-hidden"> from {hotel.name} to Caswell House (opens in a new tab)</span></a></div>
          <details className="sample-rates"><summary>About this price</summary><p>{hotel.terms}</p><p>Average of four Thursday nights in August 2027, for two adults sharing. A guide, not a quote for 24 August 2028. Checked {checkedOn}.</p><dl>{hotel.samples.map((price, index) => <div key={sampleDates[index]}><dt>{sampleDates[index]}</dt><dd>{exactPounds(price)}</dd></div>)}</dl></details>
        </div>
      </li>
    })}</ul>
    <div className="stay-notes" data-reveal><p>Please book your taxi in advance, so the only thing left to think about is the last dance.</p><span>Distances follow <a href={venueAccommodationGuide} target="_blank" rel="noopener noreferrer">Caswell House’s local guide</a>. Driving times are approximate planning estimates; check Directions for your route and traffic. On-site rooms are by invitation.</span></div>
    </div>
  </section>
}
