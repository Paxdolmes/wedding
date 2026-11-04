import type { ReactNode } from 'react'

/**
 * The heading every chapter of the page shares: a gold roman numeral between hairlines,
 * a small tracked label, a light display title and an optional italic line beneath.
 */
export function SectionHeading({ numeral, label, id, title, children, align = 'center', tone = 'light' }: {
  numeral: string; label: string; id: string; title: ReactNode; children?: ReactNode; align?: 'center' | 'left'; tone?: 'light' | 'dark'
}) {
  return <div className={`section-heading is-${align} is-${tone}`}>
    <div className="section-numeral" aria-hidden="true"><span /><i className="foil">{numeral}</i><span /></div>
    {/* A ' · ' in the label becomes a line break on narrow screens, rather than a dot left hanging at the end of a line. */}
    <p className="label">{label.split(' · ').map((part, index) => <span key={part}>{index > 0 && <span className="label-sep" aria-hidden="true"> · </span>}{part}</span>)}</p>
    <h2 id={id}>{title}</h2>
    {children && <p className="section-lede">{children}</p>}
  </div>
}
