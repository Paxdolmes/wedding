import { useId } from 'react'

/** The jagged line the wax breaks along, in the seal's 140 × 140 coordinate space. */
export const crackPath = 'M-6 66L8 67.5L15 64.5L24 67L31 65L37 68.5L46 66L52 63.5L60 67L67 65.5L73 69L81 66L88 64L95 67.5L104 66.5L110 63.5L119 67L127 65L135 67.5L146 66'
const crackPoints = crackPath.slice(1).split('L').map(point => point.split(' ').map(Number))
const points = (lift: number) => crackPoints.map(([x, y]) => `${x},${y - lift}`).reverse().join(' ')
const clips = {
  top: `-6,-12 146,-12 ${points(0)}`,
  // The lower half overlaps the crack slightly so no hairline seam shows while the seal is whole.
  bottom: `-6,152 146,152 ${points(.9)}`,
}

/** A cast wax edge, raised rim and recessed letterpress monogram. Pass `part` to draw one broken half. */
export function WaxSeal({ part }: { part?: 'top' | 'bottom' }) {
  const id = useId().replaceAll(':', '')
  return <svg className={`wax-stamp${part ? ` wax-${part}` : ''}`} viewBox="0 0 140 140" aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-wax`} cx="30%" cy="18%" r="90%"><stop stopColor="#a2a880"/><stop offset=".26" stopColor="#7a855b"/><stop offset=".65" stopColor="#56643e"/><stop offset="1" stopColor="#36482b"/></radialGradient>
      <linearGradient id={`${id}-edge`} x1="0" x2=".8" y1="0" y2="1"><stop stopColor="#c2c49c"/><stop offset=".4" stopColor="#738052"/><stop offset="1" stopColor="#26391f"/></linearGradient>
      <radialGradient id={`${id}-face`} cx="37%" cy="24%" r="85%"><stop stopColor="#829067"/><stop offset="1" stopColor="#4d5f38"/></radialGradient>
      <path id={`${id}-circle`} d="M24 70a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/>
      {part && <clipPath id={`${id}-clip`}><polygon points={clips[part]} /></clipPath>}
    </defs>
    <g clipPath={part ? `url(#${id}-clip)` : undefined}>
      <path className="wax-outline" d="M71 5C81 3 89 10 96 12C106 13 108 23 116 28C125 33 125 44 131 52C135 60 130 68 134 77C136 87 127 93 124 102C121 112 111 112 103 121C96 127 87 125 78 132C68 137 61 131 52 131C42 132 35 124 27 121C18 117 19 107 12 100C5 94 9 84 5 74C1 65 9 58 9 49C8 39 19 34 23 26C27 18 38 19 45 11C53 5 62 9 71 5Z" fill={`url(#${id}-wax)`} stroke={`url(#${id}-edge)`} strokeWidth="2"/>
      <circle cx="70" cy="70" r="52" fill="none" stroke="#b5bd8b" strokeOpacity=".35" strokeWidth="1"/>
      <circle cx="70" cy="71" r="48" fill={`url(#${id}-face)`} stroke="#354929" strokeWidth="2.5"/>
      <circle cx="70" cy="69.5" r="49.5" fill="none" stroke="#b2bb89" strokeOpacity=".65" strokeWidth="1"/>
      <text className="seal-ring-text" fill="#c6c99b" opacity=".64"><textPath href={`#${id}-circle`} startOffset="5%">IMOGEN &amp; DAN · 24 AUGUST 2028 ·</textPath></text>
      <g className="stamp-engraving" fontFamily="Cormorant Garamond, Georgia, serif" textAnchor="middle">
        <g fill="#b5be90" opacity=".65" transform="translate(.6 1)"><text x="55" y="83" fontSize="42">I</text><text x="85" y="83" fontSize="42">D</text><text x="69" y="89" fontSize="23" fontStyle="italic">&amp;</text></g>
        <g fill="#314426"><text x="55" y="83" fontSize="42">I</text><text x="85" y="83" fontSize="42">D</text><text x="69" y="89" fontSize="23" fontStyle="italic">&amp;</text></g>
      </g>
      <path d="M38 93Q70 115 102 93M40 96l2-9m4 12 2-9m4 12 2-9m6 12 1-9m8 10v-8m8 7-1-9m8 6-2-9m8 5-3-9" stroke="#b5be90" strokeOpacity=".45" strokeWidth=".8" fill="none"/>
      {/* The broken face: a dark fracture with a pale lip catching the light. */}
      {part === 'top' && <path className="break-edge" d={crackPath} fill="none" stroke="#c9cda4" strokeOpacity=".7" strokeWidth="1.2" transform="translate(0 -1.2)"/>}
      {part === 'bottom' && <path className="break-edge" d={crackPath} fill="none" stroke="#1f2c17" strokeOpacity=".7" strokeWidth="1.6" transform="translate(0 1)"/>}
    </g>
  </svg>
}
