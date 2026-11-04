import { useId } from 'react'
import './Champagne.css'

// The bottle is drawn upright in a 100 × 400 box; the scene tilts it.
const glass = 'M36 34H64V43H61.5V112C61.5 140 87 150 87 196V380Q87 394 73 394H27Q13 394 13 380V196C13 150 38.5 140 38.5 112V43H36Z'
// Foil over the neck and shoulder, finished with a torn, zigzag edge. Clipped to the glass.
const foil = 'M0 28H100V136' + Array.from({ length: 20 }, (_, index) => `L${95 - index * 5} ${index % 2 ? 136 + (index % 4 ? .5 : 0) : 141.5 + (index % 3) * .6}`).join('') + 'L0 136Z'
const corkShape = 'M39.5 37C38 26 39.5 13 50 12C60.5 13 62 26 60.5 37Z'

function Cork({ id }: { id: string }) {
  return <>
    <path d={corkShape} fill={`url(#${id}-cork)`} />
    <path d="M42 34C41 26 42.5 17 49 15" fill="none" stroke="#fff6dd" strokeOpacity=".4" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M44 20v15M50 15v21M56 20v15" stroke="#8f7347" strokeOpacity=".25" strokeWidth=".6" />
    <ellipse cx="50" cy="13.6" rx="8.6" ry="2.7" fill={`url(#${id}-foil)`} stroke="#6b5629" strokeOpacity=".5" strokeWidth=".4" />
    <path d="M38.5 36.5Q50 39.5 61.5 36.5" fill="none" stroke="#4d3d1c" strokeOpacity=".45" strokeWidth=".8" />
  </>
}

function Gradients({ id }: { id: string }) {
  return <>
    <linearGradient id={`${id}-glass`} x1="0" x2="1">
      <stop offset="0" stopColor="#0d1710" /><stop offset=".16" stopColor="#263a24" /><stop offset=".3" stopColor="#3d5535" />
      <stop offset=".48" stopColor="#21331f" /><stop offset=".8" stopColor="#142117" /><stop offset="1" stopColor="#09110b" />
    </linearGradient>
    <linearGradient id={`${id}-foil`} x1="0" x2="1">
      <stop offset="0" stopColor="#6e5a2c" /><stop offset=".22" stopColor="#cfb36d" /><stop offset=".4" stopColor="#f8ebbd" />
      <stop offset=".58" stopColor="#c9a95e" /><stop offset=".84" stopColor="#8b7140" /><stop offset="1" stopColor="#5a4722" />
    </linearGradient>
    <linearGradient id={`${id}-label`} x1="0" x2="1">
      <stop offset="0" stopColor="#bfb495" /><stop offset=".2" stopColor="#efe7d3" /><stop offset=".42" stopColor="#fffcf3" />
      <stop offset=".7" stopColor="#f1e9d6" /><stop offset="1" stopColor="#ada283" />
    </linearGradient>
    <linearGradient id={`${id}-cork`} x1="0" x2="1">
      <stop offset="0" stopColor="#9c7e52" /><stop offset=".35" stopColor="#dcc59a" /><stop offset=".7" stopColor="#c4a674" /><stop offset="1" stopColor="#8a6c43" />
    </linearGradient>
    <linearGradient id={`${id}-shade`} x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset=".75" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".45" />
    </linearGradient>
  </>
}

/** A bottle of the couple's own fizz, with a cork that the scene pops. Decorative only. */
export function ChampagneBottle() {
  const id = useId().replaceAll(':', '')
  const url = (name: string) => `url(#${id}-${name})`
  return <div className="champagne" aria-hidden="true">
    <div className="champagne-bottle">
      <svg className="bottle-svg" viewBox="0 0 100 400">
        <defs><Gradients id={id} /><clipPath id={`${id}-clip`}><path d={glass} /></clipPath></defs>
        <path d={glass} fill={url('glass')} />
        <g clipPath={url('clip')}>
          {/* Glass: a long window highlight, a softer one on the shoulder, and a cool rim light. */}
          <path d="M32 147C25 160 21 176 20.5 198" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M20.5 206V374" stroke="#fff" strokeOpacity=".2" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M26.5 214V300" stroke="#fff" strokeOpacity=".09" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M84.6 204V376" stroke="#d6e7bf" strokeOpacity=".17" strokeWidth="1.6" />
          <rect x="0" y="0" width="100" height="400" fill={url('shade')} />
          <path d={foil} fill={url('foil')} />
          <path d="M43.5 46 43 132M56.5 46l.4 86M47.5 60 47 128" stroke="#5f4c25" strokeOpacity=".28" strokeWidth=".5" />
          <path d="M0 99h100M0 107h100" stroke="#5f4c25" strokeOpacity=".35" strokeWidth=".6" />
          <rect x="0" y="99" width="100" height="8" fill="#8a7038" fillOpacity=".35" />
          <text x="50" y="105.3" className="bottle-collar" textAnchor="middle">I &amp; D</text>
          {/* The label wraps round the bottle, so it darkens towards both edges. */}
          <rect x="0" y="232" width="100" height="104" fill={url('label')} />
          <path d="M0 238.5h100M0 329.5h100" stroke="#b39a5c" strokeWidth=".7" />
          <path d="M0 241h100M0 327h100" stroke="#b39a5c" strokeOpacity=".5" strokeWidth=".35" />
          <text x="50" y="256" className="bottle-overline" textAnchor="middle">CUVÉE DE MARIAGE</text>
          <text x="50" y="283" className="bottle-names" textAnchor="middle">Imogen &amp; Dan</text>
          <path d="M40 292h20M50 289.5l2.5 2.5-2.5 2.5-2.5-2.5Z" stroke="#b39a5c" strokeWidth=".5" fill="#c8a95f" fillOpacity=".7" />
          <text x="50" y="306" className="bottle-overline" textAnchor="middle">BRUT · MMXXVIII</text>
          <text x="50" y="318" className="bottle-place" textAnchor="middle">Caswell House</text>
          <path d="M20.5 238V330" stroke="#fff" strokeOpacity=".22" strokeWidth="3" />
          <ellipse cx="50" cy="392" rx="32" ry="5" fill="#000" fillOpacity=".4" />
        </g>
        <g className="bottle-cork"><Cork id={id} /></g>
      </svg>
      <span className="neck-marker" />
      <span className="pop-flash" />
      <svg className="pop-rays" viewBox="-50 -50 100 100">{Array.from({ length: 11 }, (_, index) => {
        const angle = (-160 + index * 14) * Math.PI / 180
        return <path key={index} d={`M${Math.cos(angle) * 18} ${Math.sin(angle) * 18}L${Math.cos(angle) * (34 + (index % 3) * 6)} ${Math.sin(angle) * (34 + (index % 3) * 6)}`} />
      })}</svg>
      <span className="pop-mist" />
    </div>
  </div>
}

/** The cork in flight once it has left the bottle. */
export function FlyingCork() {
  const id = useId().replaceAll(':', '')
  return <span className="flying-cork" aria-hidden="true">
    <svg viewBox="37 10 26 30"><defs><Gradients id={id} /></defs><Cork id={id} /></svg>
  </span>
}
