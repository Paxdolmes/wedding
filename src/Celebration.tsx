import { useEffect, useRef } from 'react'

type Kind = 'petal' | 'leaf' | 'confetti' | 'fleck'
type Particle = {
  kind: Kind; x: number; y: number; vx: number; vy: number; size: number; color: string
  spin: number; angle: number; flip: number; flipSpeed: number; sway: number; swayPhase: number
  life: number; maxLife: number; delay: number
}

const palette: Record<Kind, string[]> = {
  petal: ['#efc9c0', '#f6ddd5', '#fffaf1', '#e8b9ad', '#f3d3c8'],
  leaf: ['#7d8761', '#98a37a', '#67704f', '#b3ba95'],
  confetti: ['#c8a95f', '#dcc48c', '#b99a53', '#e9dcb6'],
  fleck: ['#d6bd7b', '#fff6dc', '#c8a95f'],
}
const random = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

function particle(kind: Kind, x: number, y: number, vx: number, vy: number, delay: number, scale: number): Particle {
  const size = { petal: random(13, 22), leaf: random(14, 24), confetti: random(7, 12), fleck: random(3, 5) }[kind] * scale
  return {
    kind, x, y, vx, vy, size, color: pick(palette[kind]), spin: random(-.12, .12), angle: random(0, Math.PI * 2),
    flip: random(0, Math.PI * 2), flipSpeed: random(.05, .14), sway: random(.4, 1.3), swayPhase: random(0, Math.PI * 2),
    life: 0, maxLife: random(210, 330), delay,
  }
}

function draw(context: CanvasRenderingContext2D, p: Particle) {
  const fade = Math.min(1, (p.maxLife - p.life) / 50, p.life / 6)
  context.save()
  context.globalAlpha = Math.max(0, fade)
  context.translate(p.x, p.y)
  context.rotate(p.angle)
  // Turning over in the air: a flat shape seen edge-on gets thin.
  context.scale(1, Math.max(.12, Math.abs(Math.cos(p.flip))))
  context.fillStyle = p.color
  const s = p.size
  if (p.kind === 'petal') {
    context.beginPath()
    context.moveTo(0, -s * .55)
    context.bezierCurveTo(s * .62, -s * .5, s * .5, s * .45, 0, s * .55)
    context.bezierCurveTo(-s * .5, s * .45, -s * .62, -s * .5, 0, -s * .55)
    context.fill()
    context.fillStyle = '#e6bfb4'
    context.globalAlpha *= .35
    context.beginPath()
    context.ellipse(0, s * .3, s * .12, s * .22, 0, 0, Math.PI * 2)
    context.fill()
  } else if (p.kind === 'leaf') {
    context.beginPath()
    context.moveTo(-s * .6, 0)
    context.quadraticCurveTo(0, -s * .32, s * .6, 0)
    context.quadraticCurveTo(0, s * .32, -s * .6, 0)
    context.fill()
    context.strokeStyle = '#fffbea55'
    context.lineWidth = .6
    context.beginPath()
    context.moveTo(-s * .5, 0)
    context.lineTo(s * .5, 0)
    context.stroke()
  } else if (p.kind === 'confetti') {
    context.fillRect(-s / 2, -s * .22, s, s * .44)
  } else {
    context.beginPath()
    context.arc(0, 0, s / 2, 0, Math.PI * 2)
    context.fill()
  }
  context.restore()
}

/** A burst of petals, olive leaves and gold confetti, thrown from both lower corners and drifting down from above. */
export function Celebration({ trigger }: { trigger: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const element = canvas.current
    if (!trigger || !element) return
    const context = element.getContext('2d')
    if (!context) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    element.width = width * ratio
    element.height = height * ratio
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    const scale = Math.min(1.15, Math.max(.75, width / 1100))
    const speed = Math.sqrt(height) * .9
    const small = width < 600
    const particles: Particle[] = []
    // Two hand-thrown bursts from the lower corners, aimed up and across.
    for (const side of [-1, 1]) {
      const originX = side < 0 ? width * -.02 : width * 1.02
      for (let i = 0; i < (small ? 110 : 170); i++) {
        const angle = (side < 0 ? -Math.PI / 2 + .3 : -Math.PI / 2 - .3) + random(-.32, .32) + side * -.05
        const velocity = speed * random(.55, 1.05)
        const kind = pick<Kind>(['petal', 'petal', 'petal', 'petal', 'petal', 'leaf', 'confetti', 'fleck'])
        particles.push(particle(kind, originX, height * random(.88, 1.02), Math.cos(angle) * velocity * (small ? .7 : 1), Math.sin(angle) * velocity, random(0, 10), scale))
      }
    }
    // A softer shower of petals from above, like a handful tossed over the guests.
    for (let i = 0; i < (small ? 110 : 180); i++) {
      particles.push(particle(pick<Kind>(['petal', 'petal', 'petal', 'petal', 'leaf', 'fleck']), random(0, width), random(-120, -10), random(-.6, .6), random(.5, 2), random(10, 220), scale))
    }
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const step = Math.min(2.5, (now - previous) / 16.67)
      previous = now
      context.clearRect(0, 0, width, height)
      let alive = 0
      for (const p of particles) {
        if (p.delay > 0) { p.delay -= step; alive++; continue }
        p.life += step
        if (p.life > p.maxLife || p.y > height + 40) continue
        alive++
        const light = p.kind === 'petal' || p.kind === 'leaf'
        const drag = light ? .962 : .975
        p.vx *= Math.pow(drag, step)
        p.vy = p.vy * Math.pow(drag, step) + (light ? .16 : .24) * step
        // Petals and leaves flutter side to side once they slow down.
        const flutter = light ? Math.sin(p.life * .06 + p.swayPhase) * p.sway : 0
        p.x += (p.vx + flutter) * step
        p.y += p.vy * step
        p.angle += p.spin * step + (light ? flutter * .01 : 0)
        p.flip += p.flipSpeed * step
        draw(context, p)
      }
      if (alive) frame = requestAnimationFrame(tick)
      else context.clearRect(0, 0, width, height)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); context.clearRect(0, 0, width, height) }
  }, [trigger])
  return <canvas ref={canvas} className="celebration" aria-hidden="true" />
}
