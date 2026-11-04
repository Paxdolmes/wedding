import { useId } from 'react'

/**
 * The I & D monogram: Imogen and Daniel either side of a gold script ampersand, ringed by
 * "Imogen & Daniel Holmes", the name they'll share, and the date in Roman numerals.
 */
export function Monogram({ size = 160, ring = true, className, title = 'Imogen and Daniel Holmes monogram' }: { size?: number; ring?: boolean; className?: string; title?: string }) {
  const id = useId().replace(/:/g, '')
  return <svg className={className} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={title}>
    <defs>
      <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#806b3e" /><stop offset=".38" stopColor="#c8a95f" /><stop offset=".5" stopColor="#ecd9a0" /><stop offset=".62" stopColor="#c8a95f" /><stop offset="1" stopColor="#806b3e" />
      </linearGradient>
      <path id={`${id}-ring`} d="M100 100 m-80 0 a80 80 0 1 1 160 0 a80 80 0 1 1 -160 0" />
    </defs>
    {ring && <>
      <circle cx="100" cy="100" r="96" fill="none" stroke={`url(#${id}-foil)`} strokeWidth="1.4" />
      <circle cx="100" cy="100" r="91.5" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth=".6" />
      <circle cx="100" cy="100" r="68" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth=".6" />
      <text fill="currentColor" fontFamily="var(--sans, 'Jost', sans-serif)" fontSize="9.2" letterSpacing="2.6" fontWeight="500">
        <textPath href={`#${id}-ring`} startOffset="0" textLength="498" lengthAdjust="spacing">IMOGEN &amp; DANIEL HOLMES · XXIV · VIII · MMXXVIII ·</textPath>
      </text>
    </>}
    <text x="69" y="122" textAnchor="middle" fill="currentColor" fontFamily="var(--serif, 'Cormorant Garamond', serif)" fontSize="66" fontWeight="500">I</text>
    <text x="131" y="122" textAnchor="middle" fill="currentColor" fontFamily="var(--serif, 'Cormorant Garamond', serif)" fontSize="66" fontWeight="500">D</text>
    <text x="100" y="131" textAnchor="middle" fill={`url(#${id}-foil)`} fontFamily="var(--script, 'Pinyon Script', cursive)" fontSize="70">&amp;</text>
    {/* A small olive sprig beneath, echoing the wax seal. */}
    <g transform="translate(100 146)" fill="none" stroke={`url(#${id}-foil)`} strokeWidth="1.1" strokeLinecap="round">
      <path d="M-22 0 Q0 -5 22 0" />
      {[-15, -7, 7, 15].map(x => <ellipse key={x} cx={x} cy={x < 0 ? -4.6 : -4.6} rx="3.4" ry="1.5" transform={`rotate(${x < 0 ? -28 : 28} ${x} -4.6)`} />)}
      {[-11, 11].map(x => <ellipse key={x} cx={x} cy="2.6" rx="3.2" ry="1.4" transform={`rotate(${x < 0 ? 24 : -24} ${x} 2.6)`} />)}
    </g>
  </svg>
}
