import type { CSSProperties } from 'react'
import leftShadow from './assets/scene/leaf-shadow-left.webp'
import rightShadow from './assets/scene/leaf-shadow-right.webp'

/** Soft shadows of olive branches falling across the table, from trees just out of view. Pre-blurred images keep this cheap to animate. */
export function LeafShadows() {
  return <>
    <span className="leaf-shadows leaf-shadows-left" aria-hidden="true" style={{ backgroundImage: `url(${leftShadow})` }} />
    <span className="leaf-shadows leaf-shadows-right" aria-hidden="true" style={{ backgroundImage: `url(${rightShadow})` }} />
  </>
}

const motes = Array.from({ length: 22 }, (_, index) => ({
  left: (index * 37 + 11) % 100, top: (index * 53 + 7) % 82, size: 1.6 + (index % 4) * .9,
  duration: 10 + (index % 5) * 2.4, delay: -(index * 1.9), dx: (index % 2 ? 1 : -1) * (24 + (index % 4) * 14), dy: -(50 + (index % 5) * 22), opacity: .45 + (index % 3) * .2,
}))

/** Specks of gold dust drifting through the light. */
export function DustMotes() {
  return <div className="dust-motes" aria-hidden="true">{motes.map((mote, index) => <span key={index} style={{
    left: `${mote.left}%`, top: `${mote.top}%`, width: mote.size, height: mote.size, animationDuration: `${mote.duration}s`, animationDelay: `${mote.delay}s`,
    '--dx': `${mote.dx}px`, '--dy': `${mote.dy}px`, '--o': mote.opacity,
  } as CSSProperties} />)}</div>
}
