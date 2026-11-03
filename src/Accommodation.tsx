import { checkedOn, hotels, sampleDates, venueAccommodationGuide } from './accommodation'
import './Accommodation.css'
const pounds = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
const exactPounds = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)
export function Accommodation() {
  return (
    <section className="accommodation" aria-labelledby="accommodation-heading">
      <div className="accommodation-heading"><p className="eyebrow">Stay a little longer</p><h2 id="accommodation-heading">A lovely place to land.</h2><p>A few nearby places to rest your head after the celebrations.</p></div>
      <div className="price-guide"><strong>Planning prices · August 2027</strong><p>Per double room, for two adults sharing, for one Thursday night. Averages use 5, 12, 19 and 26 August 2027. These are a guide for your budget; prices and availability for our wedding on <strong>24 August 2028</strong> still need checking with each hotel.</p></div>
      <ul className="hotel-grid">
        {hotels.map(hotel => {
          const average = hotel.samples.length ? hotel.samples.reduce((a, b) => a + b, 0) / hotel.samples.length : null
          return <li className="hotel-card" key={hotel.name}>
            <span className="hotel-tier">{hotel.tier}</span><h3>{hotel.name}</h3><p className="hotel-location">{hotel.place} · approximately {hotel.miles} miles from Caswell House</p><p className="hotel-description">{hotel.description}</p>
            <div className="hotel-price">{average !== null ? <><strong>~{pounds(average)}</strong><span>average per room / night</span></> : <span>Ask the hotel for a quote</span>}</div>
            <p className="hotel-room">{hotel.room}</p><p className="hotel-terms">{hotel.terms}</p>
            <a className="hotel-link" href={hotel.url} target="_blank" rel="noopener noreferrer">Visit {hotel.name}<span className="visually-hidden"> (opens in a new tab)</span></a>
            {hotel.samples.length > 0 && <details className="sample-rates"><summary>See sampled Thursday prices</summary><dl>{hotel.samples.map((price, index) => <div key={sampleDates[index]}><dt>{sampleDates[index]}</dt><dd>{exactPounds(price)}</dd></div>)}</dl></details>}
          </li>
        })}
      </ul>
      <div className="stay-notes"><p><strong>A little planning goes a long way.</strong> Caswell House recommends booking taxis in advance. On-site rooms are arranged by invitation from the couple.</p><p>Hotels and approximate distances come from <a href={venueAccommodationGuide} target="_blank" rel="noopener noreferrer">Caswell House’s accommodation guide</a>. Prices checked {checkedOn}; rates and availability can change.</p></div>
    </section>
  )
}
