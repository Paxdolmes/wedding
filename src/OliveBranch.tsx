export function OliveBranch({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 150 180" fill="none" aria-hidden="true">
    <path d="M36 165C44 127 80 100 107 25M59 117L39 90M76 91L105 83M90 63L72 44" stroke="currentColor" strokeWidth="1.2" />
    <g fill="currentColor" fillOpacity=".14" stroke="currentColor" strokeWidth=".8"><path d="M43 145C14 136 9 111 16 103C36 111 46 126 43 145ZM51 130C77 136 95 123 100 107C76 106 58 115 51 130ZM62 110C35 106 27 87 30 71C50 75 61 91 62 110ZM76 92C103 98 121 82 126 68C104 66 85 78 76 92ZM86 73C65 62 61 44 67 30C84 40 90 54 86 73ZM96 54C121 54 134 36 135 22C114 25 101 36 96 54ZM106 29C97 15 101 3 111 1C120 13 115 22 106 29Z" /></g>
    <g fill="currentColor"><ellipse cx="45" cy="99" rx="4" ry="6" transform="rotate(-30 45 99)"/><ellipse cx="102" cy="88" rx="4" ry="6" transform="rotate(40 102 88)"/></g>
  </svg>
}

// Leaves along a gently curving stem: x, y and angle, alternating above and below.
const sprigLeaves: [number, number, number][] = [[24, 32, -36], [40, 32, 32], [57, 30, -32], [74, 30, 28], [91, 29, -28], [108, 29, 25], [125, 28.5, -24], [142, 29, 21], [158, 29.5, -18]]

/** A horizontal olive sprig drawn in a hairline, made of separate strokes so it can be drawn on. */
export function OliveSprig({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return <svg className={className} viewBox="0 0 190 56" fill="none" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M6 33C50 30 110 26 184 28" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" />
    {sprigLeaves.map(([x, y, angle]) => <g key={x} transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M0 0C5-5.5 15-5.5 21 0C15 5.5 5 5.5 0 0Z" stroke="currentColor" strokeWidth=".8" fill="currentColor" fillOpacity=".08" />
      <path d="M2 0H18" stroke="currentColor" strokeWidth=".5" strokeOpacity=".6" />
    </g>)}
    <ellipse cx="68" cy="40" rx="3.6" ry="2.8" fill="currentColor" fillOpacity=".25" />
    <ellipse cx="120" cy="18" rx="3.4" ry="2.6" fill="currentColor" fillOpacity=".25" />
  </svg>
}

/** Two mirrored sprigs either side of a small gold lozenge. */
export function SprigDivider({ className = '' }: { className?: string }) {
  return <div className={`sprig-divider ${className}`} aria-hidden="true"><OliveSprig flip /><i /><OliveSprig /></div>
}
