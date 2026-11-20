import { useId } from 'react'
import { cutPath, sealOutline } from './crack'
import { flecks } from './sealCut'
import './SealCut.css'

/*
 * The letter opener and the cut it makes, inside `.seal-assembly` after the halves and `.seal-whole`.
 * One 140 × 140 overlay sits exactly on the seal, so every coordinate is in seal units and scales with it. The knife
 * and the incision are driven by custom properties on `.seal-assembly` (SealCut.css), which src/sealCut.ts animates.
 */

const BLADE = 'M0 0C9 -2.2 26 -6.4 52 -8.4L148 -9.2V9.2L56 8.6C28 7.4 9 3.4 0 0Z'
const BOLSTER = 'M147 -10.2L153 -10.6C158 -9 162 -7.6 165 -7V7C162 7.6 158 9 153 10.6L147 10.2Z'
const HANDLE =
  'M164 -6.8C182 -6.8 202 -8.2 224 -8.2C238 -8.2 248 -6.4 252 -3.4C254.4 -1.6 254.4 1.6 252 3.4C248 6.4 238 8.2 224 8.2C202 8.2 182 6.8 164 6.8Z'

/** The letter opener (silver blade, gold bolster and handle), the incision it leaves and the wax flecks it lifts. */
export function SealCutLayers() {
  const uid = useId().replace(/[^\w-]/g, '')
  const id = (name: string) => `${uid}-${name}`
  const ref = (name: string) => `url(#${id(name)})`

  return (
    <>
      <svg className="seal-cut" viewBox="0 0 140 140" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={id('wax')}>
            <path d={sealOutline} />
          </clipPath>
          <clipPath id={id('blade-clip')}>
            <path d={BLADE} />
          </clipPath>
          <clipPath id={id('handle-clip')}>
            <path d={HANDLE} />
          </clipPath>

          {/* Black where the wax is: the blade is hidden inside the seal. `--bury` fades this out when the blade lifts free. */}
          <mask id={id('buried')} maskUnits="userSpaceOnUse" x="-400" y="-300" width="1000" height="800">
            <rect x="-400" y="-300" width="1000" height="800" fill="#fff" />
            <path className="knife-buried" d={sealOutline} fill="#000" />
          </mask>

          <filter id={id('blur-near')} filterUnits="userSpaceOnUse" x="-20" y="-40" width="320" height="80">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
          <filter id={id('blur-far')} filterUnits="userSpaceOnUse" x="-30" y="-50" width="340" height="110">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
          <filter id={id('soft')} x="-5%" y="-300%" width="110%" height="700%">
            <feGaussianBlur stdDeviation="0.45" />
          </filter>

          <linearGradient id={id('steel-up')} gradientUnits="userSpaceOnUse" x1="0" y1="-9.2" x2="0" y2="0">
            <stop stopColor="#f8fafc" />
            <stop offset=".45" stopColor="#d5dbe1" />
            <stop offset="1" stopColor="#a6afb9" />
          </linearGradient>
          <linearGradient id={id('steel-down')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="9.2">
            <stop stopColor="#858f9b" />
            <stop offset=".55" stopColor="#b9c1ca" />
            <stop offset="1" stopColor="#eef1f4" />
          </linearGradient>
          <linearGradient id={id('reflection')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="148" y2="0">
            <stop stopColor="#fff" stopOpacity="0" />
            <stop offset=".16" stopColor="#fff" stopOpacity=".5" />
            <stop offset=".3" stopColor="#2a3644" stopOpacity=".24" />
            <stop offset=".5" stopColor="#fff" stopOpacity="0" />
            <stop offset=".66" stopColor="#fff" stopOpacity=".34" />
            <stop offset=".82" stopColor="#2a3644" stopOpacity=".2" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id('gold')} gradientUnits="userSpaceOnUse" x1="0" y1="-10.6" x2="0" y2="10.6">
            <stop stopColor="#fff2bd" />
            <stop offset=".18" stopColor="#f1d17f" />
            <stop offset=".45" stopColor="#c99a3d" />
            <stop offset=".72" stopColor="#8b6220" />
            <stop offset=".88" stopColor="#c89b43" />
            <stop offset="1" stopColor="#f4da90" />
          </linearGradient>
          <linearGradient id={id('shine')} x1="0" x2="1" y1="0" y2="0">
            <stop stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={id('silver-slit')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="140" y2="0">
            <stop stopColor="#e9eef2" />
            <stop offset=".5" stopColor="#ffffff" />
            <stop offset="1" stopColor="#c3ccd4" />
          </linearGradient>
          <radialGradient id={id('give-light')}>
            <stop stopColor="#e6e9bf" stopOpacity=".55" />
            <stop offset="1" stopColor="#e6e9bf" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('give-dark')}>
            <stop stopColor="#141c0d" stopOpacity=".6" />
            <stop offset="1" stopColor="#141c0d" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('glint')}>
            <stop stopColor="#fff8dc" />
            <stop offset=".35" stopColor="#ffdf95" stopOpacity=".75" />
            <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
          </radialGradient>

          <g id={id('silhouette')}>
            <path d={BLADE} />
            <path d={BOLSTER} />
            <path d={HANDLE} />
          </g>
        </defs>

        {/* THE INCISION – clipped to the wax so nothing draws on the paper. */}
        <g className="seal-incision" clipPath={ref('wax')}>
          <g className="cut-give">
            <g className="cut-give-at-tip">
              <ellipse cx="-3" cy="-3.4" rx="12" ry="3.6" fill={ref('give-light')} />
              <ellipse cx="-3" cy="3.6" rx="12" ry="3.8" fill={ref('give-dark')} />
            </g>
          </g>

          <path className="cut-line cut-line-trailing cut-shade" d={cutPath} pathLength={1} filter={ref('soft')} />
          <path className="cut-line cut-line-trailing cut-gap" d={cutPath} pathLength={1} />
          <path className="cut-line cut-line-tip cut-hairline" d={cutPath} pathLength={1} />
          <path className="cut-line cut-line-trailing cut-lip" d={cutPath} pathLength={1} />
          <path className="cut-line cut-line-tip cut-blade" d={cutPath} pathLength={1} stroke={ref('silver-slit')} />

          <g className="cut-glint">
            <g className="cut-glint-behind-tip">
              <ellipse rx="10" ry="1.7" fill={ref('glint')} />
              <ellipse rx="3.4" ry="0.8" fill="#fffdf0" />
            </g>
          </g>
        </g>

        {/* THE KNIFE – masked so the part inside the wax disappears into the incision. */}
        <g className="seal-knife" mask={ref('buried')}>
          <g className="knife-track">
            <g className="knife-shadow knife-shadow-far" filter={ref('blur-far')}>
              <use href={`#${id('silhouette')}`} fill="#3a2a15" />
            </g>
            <g className="knife-shadow knife-shadow-near" filter={ref('blur-near')}>
              <use href={`#${id('silhouette')}`} fill="#2e2010" />
            </g>

            <g className="knife-body">
              <path d={BLADE} transform="translate(0 .8)" fill="#59626d" />
              <path d={BLADE} fill="#8a949f" />
              <path d="M0 0C9 -2.2 26 -6.4 52 -8.4L148 -9.2V.3Z" fill={ref('steel-up')} />
              <path d="M0 0L148 .3V9.2L56 8.6C28 7.4 9 3.4 0 0Z" fill={ref('steel-down')} />
              <path d="M0 0C9 3.4 28 7.4 56 8.6L148 9.2V7.7L58 7.1C30 6 10 2.6 0 0Z" fill="#f6f8fa" opacity=".8" />
              <rect x="0" y="-10" width="148" height="20" fill={ref('reflection')} clipPath={ref('blade-clip')} />
              <path d="M30 -4.6C60 -5.2 100 -5.5 142 -5.6" fill="none" stroke="#7b8590" strokeWidth=".32" opacity=".7" />
              <path d="M30 -4.1C60 -4.7 100 -5 142 -5.1" fill="none" stroke="#fff" strokeWidth=".3" opacity=".6" />
              <path d="M3 .12L148 .3" fill="none" stroke="#fff" strokeWidth=".4" opacity=".85" />
              <path d="M3 .45L148 .6" fill="none" stroke="#5e6874" strokeWidth=".25" opacity=".55" />
              <path d={BLADE} fill="none" stroke="#5c6672" strokeWidth=".3" />

              <g clipPath={ref('blade-clip')}>
                <g className="blade-shine">
                  <polygon points="0,-11 5,-11 15,11 10,11" fill={ref('shine')} />
                  <polygon points="24,-11 26,-11 36,11 34,11" fill={ref('shine')} opacity=".55" />
                </g>
                <polygon className="blade-flash" points="46,-11 70,-11 90,11 66,11" fill={ref('shine')} />
              </g>

              <path d={BOLSTER} fill={ref('gold')} stroke="#7a5518" strokeWidth=".3" />
              <path d="M155 -9.6V9.6M158 -8.4V8.4" stroke="#6f4d14" strokeWidth=".3" opacity=".7" />
              <path d="M156.3 -9.4V9.4M159.3 -8.2V8.2" stroke="#fff0b0" strokeWidth=".25" opacity=".55" />

              <path d={HANDLE} fill={ref('gold')} />
              <g clipPath={ref('handle-clip')}>
                <path d="M172 -3.5H240" stroke="#6f4d14" strokeWidth=".32" opacity=".75" />
                <path d="M172 -3.1H240" stroke="#fff0b0" strokeWidth=".26" opacity=".6" />
                <path d="M170 -1.9v3.8M172.4 -1.9v3.8M232 -1.9v3.8M234.4 -1.9v3.8" stroke="#6f4d14" strokeWidth=".3" opacity=".7" />
                <path d="M171 -6.1C190 -6.5 215 -7 242 -5.6" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity=".5" />
                <g className="handle-shine">
                  <polygon points="0,-9 4,-9 11,9 7,9" fill={ref('shine')} />
                </g>
              </g>
              <path d={HANDLE} fill="none" stroke="#6f4d14" strokeWidth=".35" />
            </g>
          </g>
        </g>
      </svg>

      {flecks.map((fleck, i) => (
        <span
          key={fleck.x}
          className={`cut-fleck cut-fleck-${i}`}
          style={{ left: `${(fleck.x / 140) * 100}%`, width: `${fleck.size}%` }}
        />
      ))}
    </>
  )
}
