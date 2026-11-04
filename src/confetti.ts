/**
 * A small particle engine for the opening celebration: petals, olive leaves, gold confetti and a
 * champagne spray, drawn on one full-screen canvas. `Celebration.tsx` owns the canvas; anything can
 * call `throwPetals()` or `sprayChampagne()` to add particles to it.
 */

type Kind = 'petal' | 'leaf' | 'confetti' | 'fleck' | 'droplet' | 'foam' | 'bubble' | 'sparkle'
type Particle = {
  kind: Kind; x: number; y: number; vx: number; vy: number; size: number; color: string
  spin: number; angle: number; flip: number; flipSpeed: number; sway: number; swayPhase: number
  life: number; maxLife: number; delay: number; fall: number
}
type Emitter = { x: number; y: number; angle: number; frames: number; total: number; speed: number }

const palette: Record<Kind, string[]> = {
  petal: ['#efc9c0', '#f6ddd5', '#fffaf1', '#e8b9ad', '#f3d3c8', '#fbeee8'],
  leaf: ['#7d8761', '#98a37a', '#67704f', '#b3ba95'],
  confetti: ['#c8a95f', '#dcc48c', '#b99a53', '#e9dcb6'],
  fleck: ['#d6bd7b', '#fff6dc', '#c8a95f'],
  droplet: ['#f1d58a', '#e8c76a', '#f7e6b0', '#dcb257'],
  foam: ['#fffdf6', '#fff8e6', '#fffaf0'],
  bubble: ['#fffdf2'],
  sparkle: ['#fff3c4', '#f1d58a', '#ffffff'],
}
// How each kind moves: [drag per frame, gravity per frame, life range].
const physics: Record<Kind, [number, number, number, number]> = {
  petal: [.962, .16, 210, 330], leaf: [.962, .16, 210, 330], confetti: [.975, .24, 210, 330], fleck: [.975, .24, 160, 260],
  droplet: [.985, .3, 70, 120], foam: [.94, .05, 40, 85], bubble: [.97, -.035, 110, 200], sparkle: [.93, .02, 40, 80],
}
const sizes: Record<Kind, [number, number]> = {
  petal: [13, 22], leaf: [14, 24], confetti: [7, 12], fleck: [3, 5], droplet: [2.2, 4.6], foam: [3, 8], bubble: [2.5, 6], sparkle: [5, 10],
}

const random = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]
const particles: Particle[] = []
const emitters: Emitter[] = []
let canvas: HTMLCanvasElement | null = null
let context: CanvasRenderingContext2D | null = null
let frame = 0
let previous = 0
let width = 0
let height = 0

function make(kind: Kind, x: number, y: number, vx: number, vy: number, delay = 0, scale = 1): Particle {
  const [min, max] = sizes[kind]
  const [, , shortest, longest] = physics[kind]
  return {
    kind, x, y, vx, vy, size: random(min, max) * scale, color: pick(palette[kind]), spin: random(-.12, .12), angle: random(0, Math.PI * 2),
    flip: random(0, Math.PI * 2), flipSpeed: random(.05, .14), sway: random(.4, 1.3), swayPhase: random(0, Math.PI * 2),
    life: 0, maxLife: random(shortest, longest), delay, fall: 1,
  }
}

function draw(c: CanvasRenderingContext2D, p: Particle) {
  const fade = Math.min(1, (p.maxLife - p.life) / Math.min(50, p.maxLife * .4), p.life / 4)
  if (fade <= 0) return
  c.save()
  c.globalAlpha = fade
  c.translate(p.x, p.y)
  const s = p.size
  if (p.kind === 'droplet') {
    // A bead of champagne stretched along its direction of travel, with a bright highlight.
    const speed = Math.hypot(p.vx, p.vy)
    c.rotate(Math.atan2(p.vy, p.vx))
    c.fillStyle = p.color
    c.globalAlpha = fade * .85
    c.beginPath()
    c.ellipse(0, 0, s * (1 + Math.min(speed, 20) * .16), s * .55, 0, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#fffdf0'
    c.globalAlpha = fade * .9
    c.beginPath()
    c.arc(s * .35, -s * .15, s * .22, 0, Math.PI * 2)
    c.fill()
  } else if (p.kind === 'foam') {
    const grow = 1 + p.life / p.maxLife * .8
    const gradient = c.createRadialGradient(0, 0, 0, 0, 0, s * grow)
    gradient.addColorStop(0, p.color)
    gradient.addColorStop(.55, p.color + 'cc')
    gradient.addColorStop(1, p.color + '00')
    c.fillStyle = gradient
    c.beginPath()
    c.arc(0, 0, s * grow, 0, Math.PI * 2)
    c.fill()
  } else if (p.kind === 'bubble') {
    c.strokeStyle = '#fffdf2'
    c.lineWidth = .9
    c.globalAlpha = fade * .8
    c.beginPath()
    c.arc(0, 0, s, 0, Math.PI * 2)
    c.stroke()
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.arc(-s * .35, -s * .35, s * .22, 0, Math.PI * 2)
    c.fill()
  } else if (p.kind === 'sparkle') {
    // A four-pointed glint that twinkles as it fades.
    const twinkle = .55 + .45 * Math.sin(p.life * .35 + p.swayPhase)
    c.rotate(p.angle)
    c.scale(twinkle, twinkle)
    c.fillStyle = p.color
    c.beginPath()
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2
      c.lineTo(Math.cos(a) * s, Math.sin(a) * s)
      c.lineTo(Math.cos(a + Math.PI / 4) * s * .18, Math.sin(a + Math.PI / 4) * s * .18)
    }
    c.closePath()
    c.fill()
  } else {
    c.rotate(p.angle)
    // Turning over in the air: a flat shape seen edge-on gets thin.
    c.scale(1, Math.max(.12, Math.abs(Math.cos(p.flip))))
    c.fillStyle = p.color
    if (p.kind === 'petal') {
      c.beginPath()
      c.moveTo(0, -s * .55)
      c.bezierCurveTo(s * .62, -s * .5, s * .5, s * .45, 0, s * .55)
      c.bezierCurveTo(-s * .5, s * .45, -s * .62, -s * .5, 0, -s * .55)
      c.fill()
      c.fillStyle = '#e6bfb4'
      c.globalAlpha *= .35
      c.beginPath()
      c.ellipse(0, s * .3, s * .12, s * .22, 0, 0, Math.PI * 2)
      c.fill()
    } else if (p.kind === 'leaf') {
      c.beginPath()
      c.moveTo(-s * .6, 0)
      c.quadraticCurveTo(0, -s * .32, s * .6, 0)
      c.quadraticCurveTo(0, s * .32, -s * .6, 0)
      c.fill()
      c.strokeStyle = '#fffbea55'
      c.lineWidth = .6
      c.beginPath()
      c.moveTo(-s * .5, 0)
      c.lineTo(s * .5, 0)
      c.stroke()
    } else if (p.kind === 'confetti') {
      c.fillRect(-s / 2, -s * .22, s, s * .44)
    } else {
      c.beginPath()
      c.arc(0, 0, s / 2, 0, Math.PI * 2)
      c.fill()
    }
  }
  c.restore()
}

/** One spurt of champagne from the bottle's neck, fanned around `angle`. */
function spurt(e: Emitter, count: number, spread: number, scale: number) {
  for (let i = 0; i < count; i++) {
    const a = e.angle + random(-spread, spread)
    const v = e.speed * random(.45, 1.05)
    const kind = pick<Kind>(['droplet', 'droplet', 'droplet', 'foam', 'foam', 'sparkle'])
    particles.push(make(kind, e.x + random(-2, 2), e.y + random(-2, 2), Math.cos(a) * v * (kind === 'foam' ? .55 : 1), Math.sin(a) * v * (kind === 'foam' ? .55 : 1), 0, scale))
  }
}

function tick(now: number) {
  if (!context) return
  const step = Math.min(2.5, (now - previous) / 16.67)
  previous = now
  context.clearRect(0, 0, width, height)
  const scale = Math.min(1.15, Math.max(.75, width / 1100))
  for (let i = emitters.length - 1; i >= 0; i--) {
    const e = emitters[i]
    // The gush is strongest just after the cork leaves and tails off.
    const strength = e.frames / e.total
    spurt(e, Math.round(7 * strength * step), .22 + (1 - strength) * .1, scale)
    if (Math.random() < .5 * step) particles.push(make('bubble', e.x + random(-6, 6), e.y + random(-6, 6), random(-.8, .8), random(-1.6, -.4), 0, scale))
    e.speed *= Math.pow(.985, step)
    e.frames -= step
    if (e.frames <= 0) emitters.splice(i, 1)
  }
  let alive = 0
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    if (p.delay > 0) { p.delay -= step; alive++; continue }
    p.life += step
    if (p.life > p.maxLife || p.y > height + 60 || p.y < -400) { particles.splice(i, 1); continue }
    alive++
    const [drag, gravity] = physics[p.kind]
    p.vx *= Math.pow(drag, step)
    p.vy = p.vy * Math.pow(drag, step) + gravity * p.fall * step
    // Petals, leaves and bubbles flutter side to side once they slow down.
    const light = p.kind === 'petal' || p.kind === 'leaf' || p.kind === 'bubble'
    const flutter = light ? Math.sin(p.life * .06 + p.swayPhase) * p.sway * (p.kind === 'bubble' ? .4 : 1) : 0
    p.x += (p.vx + flutter) * step
    p.y += p.vy * step
    p.angle += p.spin * step + (light ? flutter * .01 : 0)
    p.flip += p.flipSpeed * step
    draw(context, p)
  }
  if (alive || emitters.length) frame = requestAnimationFrame(tick)
  else { frame = 0; context.clearRect(0, 0, width, height) }
}

function start() {
  if (!canvas || !context || frame) return
  previous = performance.now()
  frame = requestAnimationFrame(tick)
}

/** Connects the engine to its canvas, sized to the viewport. Returns a function that disconnects it. */
export function attachCanvas(element: HTMLCanvasElement) {
  canvas = element
  context = element.getContext('2d')
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight
    element.width = width * ratio
    element.height = height * ratio
    context?.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)
  return () => {
    window.removeEventListener('resize', resize)
    cancelAnimationFrame(frame)
    frame = 0
    particles.length = 0
    emitters.length = 0
    context?.clearRect(0, 0, width, height)
    canvas = null
    context = null
  }
}

/** Petals, olive leaves and gold confetti thrown from both lower corners, with a shower from above. */
export function throwPetals() {
  if (!context) return
  const scale = Math.min(1.15, Math.max(.75, width / 1100))
  const speed = Math.sqrt(height) * .9
  const small = width < 600
  for (const side of [-1, 1]) {
    const originX = side < 0 ? width * -.02 : width * 1.02
    for (let i = 0; i < (small ? 110 : 170); i++) {
      const angle = (side < 0 ? -Math.PI / 2 + .3 : -Math.PI / 2 - .3) + random(-.32, .32) + side * -.05
      const velocity = speed * random(.55, 1.05)
      const kind = pick<Kind>(['petal', 'petal', 'petal', 'petal', 'petal', 'leaf', 'confetti', 'fleck'])
      particles.push(make(kind, originX, height * random(.88, 1.02), Math.cos(angle) * velocity * (small ? .7 : 1), Math.sin(angle) * velocity, random(0, 10), scale))
    }
  }
  // A softer shower of petals from above, like a handful tossed over the guests.
  for (let i = 0; i < (small ? 110 : 180); i++) {
    particles.push(make(pick<Kind>(['petal', 'petal', 'petal', 'petal', 'leaf', 'fleck']), random(0, width), random(-120, -10), random(-.6, .6), random(.5, 2), random(10, 220), scale))
  }
  start()
}

/** The cork's away: a burst of champagne, foam and glints from (x, y) heading along `angle` (radians), then a tailing gush. */
export function sprayChampagne(x: number, y: number, angle: number) {
  if (!context) return
  const scale = Math.min(1.15, Math.max(.75, width / 1100))
  const speed = Math.sqrt(height) * (width < 600 ? .75 : .95)
  const emitter = { x, y, angle, frames: 55, total: 55, speed }
  spurt({ ...emitter, speed: speed * 1.15 }, width < 600 ? 70 : 110, .32, scale)
  for (let i = 0; i < 26; i++) particles.push(make('sparkle', x + random(-24, 24), y + random(-24, 24), random(-1.5, 1.5), random(-1.5, 1.5), random(0, 12), scale))
  emitters.push(emitter)
  start()
}

/** A few last petals drifting slowly down over the page as it appears. */
export function scatterPetals() {
  if (!context) return
  const scale = Math.min(1.15, Math.max(.75, width / 1100))
  for (let i = 0; i < (width < 600 ? 24 : 40); i++) {
    const petal = make(pick<Kind>(['petal', 'petal', 'petal', 'leaf']), random(0, width), random(-80, -16), random(-.4, .4), random(.2, .7), random(0, 300), scale * .9)
    petal.fall = random(.25, .4)
    petal.maxLife = random(520, 720)
    particles.push(petal)
  }
  start()
}
