import { useEffect, useRef } from 'react'
import { attachCanvas } from './confetti'

/** The full-screen canvas the petals, leaves and confetti are drawn on. */
export function Celebration() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => (canvas.current ? attachCanvas(canvas.current) : undefined), [])
  return <canvas ref={canvas} className="celebration" aria-hidden="true" />
}
