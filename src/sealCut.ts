import type { useAnimate } from 'motion/react'

/*
 * The letter opener cutting the seal (designed with v0, then ported). About 1.9 s from tap to parted halves:
 *
 *   0.00 – 0.38  APPROACH      The opener glides in from the right, handle raised, hovering with a wide faint shadow.
 *                              A highlight slides along the blade as it travels.
 *   0.38 – 0.52  TOUCHDOWN     The blade lowers and its tip meets the rim of the wax; the shadow tightens to contact.
 *   0.52 – 0.68  ANTICIPATION  A held beat: the tip presses a hair into the wax, which gives a little (`onContact`).
 *   0.68 – 1.46  DRAW          The tip travels through the wax on `drawEase`: a slow bite, a glide, a catch over the
 *                              monogram (the thickest wax), release, a soft stop. The blade is masked by the wax so it
 *                              goes INTO the seal, leaving a silver edge in the slit. A hairline follows the tip and opens
 *                              a moment later, pale above and shadowed below, with a warm glint riding behind the tip.
 *                              Flecks of wax lift out as the tip passes.
 *   1.46 – 1.96  RELEASE       The blade lifts up and away about its tip with one flash of light, then fades. The seal
 *                              becomes its two halves, which part: top lifting towards you, bottom dropping back.
 *
 * Everything is driven by unitless custom properties on `.seal-assembly` (see SealCut.css): --tip, --trail, --ky,
 * --tilt, --ks, --lift, --bury and --flash. One clock moves the blade, its shadow, highlights and the cut together.
 */

type Animate = ReturnType<typeof useAnimate>[1]

/**
 * Wax flecks lifted out of the cut. `x` is where along the cut (seal units, 0–140) a fleck is released; `size` is its
 * width as a % of the seal; `dx` and `rise` are its drift and peak height as a % of its own size; `spin` is in degrees.
 */
export const flecks = [
  { x: 118, size: 1.5, dx: 260, rise: -520, spin: 140 },
  { x: 101, size: 2.1, dx: 180, rise: -690, spin: -200 },
  { x: 88, size: 1.2, dx: -120, rise: -430, spin: 90 },
  { x: 74, size: 1.8, dx: 340, rise: -580, spin: 260 },
  { x: 63, size: 1.1, dx: 90, rise: -760, spin: -120 },
  { x: 47, size: 1.7, dx: -210, rise: -480, spin: 180 },
  { x: 33, size: 1.3, dx: 280, rise: -640, spin: -240 },
  { x: 19, size: 1.9, dx: 150, rise: -540, spin: 110 },
  { x: 8, size: 1.1, dx: -160, rise: -400, spin: -90 },
] as const

type Knot = readonly [t: number, p: number]

/** A smooth curve through (time, progress) knots that never runs backwards, so "stick and release" can be written as data. */
function curveThrough(knots: readonly Knot[]) {
  const n = knots.length
  const slope = knots.slice(1).map(([t, p], i) => (p - knots[i][1]) / (t - knots[i][0]))
  const tangent = knots.map((_, i) => i === 0 || i === n - 1 ? 0 : Math.min((slope[i - 1] + slope[i]) / 2, 3 * slope[i - 1], 3 * slope[i]))
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let i = 0
    while (i < n - 2 && x > knots[i + 1][0]) i++
    const [t0, p0] = knots[i]
    const [t1, p1] = knots[i + 1]
    const h = t1 - t0
    const u = (x - t0) / h
    const u2 = u * u
    const u3 = u2 * u
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * tangent[i] + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * tangent[i + 1]
  }
}

/** The draw-through: slow bite, quick glide, a catch just before halfway, a clean release, a soft stop at the far edge. */
const drawEase = curveThrough([[0, 0], [.1, .02], [.28, .17], [.43, .37], [.52, .42], [.7, .66], [.88, .93], [1, 1]])

/** The inverse of `drawEase`: how far through the draw the tip has covered `progress` of the cut. */
function timeAtProgress(progress: number) {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (drawEase(mid) < progress) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

const silk = [.22, 1, .36, 1] as const
const SEAL = '.seal-assembly'
const RIM = 133 // the tip's x at the wax rim, on the crack line
const FAR_SIDE = -5 // the tip's x once it is through the other side
const hold = (seconds: number) => new Promise<void>(resolve => setTimeout(resolve, seconds * 1000))

/** Plays the cut. Resolves with the halves just parted; `alive` stops it early if the envelope has gone. */
export async function cutSeal(animate: Animate, { onContact, alive }: { onContact: () => void; alive: () => boolean }) {
  // 1. Approach
  animate('.seal-knife', { opacity: [0, 1] }, { duration: .16, ease: 'easeOut' })
  await animate(SEAL, { '--tip': [232, 141], '--ky': [-9, -3], '--tilt': [-14, -8], '--ks': [1.03, 1.015], '--lift': [1, .8] }, { duration: .38, ease: silk })
  if (!alive()) return

  // 2. Touchdown: the tip finds the rim and the shadow tightens.
  await animate(SEAL, { '--tip': [141, 135], '--ky': [-3, 0], '--tilt': [-8, -4], '--ks': [1.015, 1], '--lift': [.8, 0] }, { duration: .14, ease: [.3, 0, .2, 1] })
  if (!alive()) return

  // 3. Anticipation: a held beat while the wax gives.
  onContact()
  animate('.cut-give', { opacity: [0, .65] }, { duration: .16, ease: 'easeOut' })
  await animate(SEAL, { '--tip': [135, RIM], '--tilt': [-4, -3] }, { duration: .16, ease: 'easeInOut' })
  if (!alive()) return

  // 4. The draw through the wax.
  const draw = .78
  animate(SEAL, { '--tip': [RIM, FAR_SIDE] }, { duration: draw, ease: drawEase })
  animate(SEAL, { '--trail': [RIM, FAR_SIDE] }, { duration: draw, delay: .12, ease: drawEase })
  animate(SEAL, { '--tilt': [-3, -3.6, -3.6, -1.6, -1.2] }, { duration: draw, times: [0, .4, .52, .62, 1], ease: 'easeInOut' })
  animate('.cut-glint', { opacity: [0, 1, 1, 0] }, { duration: draw + .2, times: [0, .1, .78, 1] })
  flecks.forEach((fleck, i) => {
    const selector = `.cut-fleck-${i}`
    const delay = draw * timeAtProgress((RIM - fleck.x) / (RIM - FAR_SIDE))
    animate(selector, { opacity: [0, 1, 1, 0], scale: [.5, 1, 1, .8] }, { duration: .6, delay, times: [0, .12, .7, 1] })
    animate(selector, { y: ['0%', `${fleck.rise}%`, '90%'] }, { duration: .6, delay, times: [0, .38, 1], ease: ['easeOut', 'easeIn'] })
    animate(selector, { x: ['0%', `${fleck.dx}%`], rotate: [0, fleck.spin] }, { duration: .6, delay, ease: 'easeOut' })
  })
  await hold(draw)
  if (!alive()) return

  // 5. Release: the blade lifts out with one flash of light, and the seal parts into its halves.
  animate('.seal-knife', { opacity: [1, 0] }, { duration: .34, delay: .12, ease: 'easeIn' })
  // The blade rises out of the slit, so the wax mask lets go of it only as fast as it clears the surface.
  animate(SEAL, { '--bury': [1, .55, 0] }, { duration: .26, times: [0, .4, 1], ease: 'easeIn' })
  animate(SEAL, { '--tip': [FAR_SIDE, -46], '--tilt': [-1.2, -19] }, { duration: .5, ease: [.5, 0, .3, 1] })
  animate(SEAL, { '--ky': [0, -84], '--ks': [1, 1.07], '--lift': [0, 1] }, { duration: .5, ease: [.3, 0, .25, 1] })
  animate(SEAL, { '--flash': [0, 1, 0] }, { duration: .34, times: [0, .3, 1] })
  animate('.cut-blade, .cut-give', { opacity: 0 }, { duration: .18 })
  animate('.seal-half-top, .seal-half-bottom', { opacity: 1 }, { duration: .01 })
  animate('.seal-whole', { opacity: 0 }, { duration: .01 })
  animate('.break-edge', { opacity: [0, 1] }, { duration: .3 })
  animate('.seal-incision', { opacity: [1, 0] }, { duration: .3, delay: .1 })
  const part = { duration: .42, ease: silk }
  await Promise.all([
    animate('.seal-half-top .wax-stamp', { y: ['0%', '-2.6%'], rotateX: [0, 7], transformPerspective: 520 }, part),
    animate('.seal-half-bottom .wax-stamp', { y: ['0%', '2.6%'], rotateX: [0, -5], transformPerspective: 520 }, part),
    hold(.5),
  ])
}
