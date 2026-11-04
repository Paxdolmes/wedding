/**
 * Turns a camera frame into a disposable-camera print: crop to 3:4, faded warm tones, lifted blacks,
 * grain, a soft vignette, a light leak and the orange date stamp in the corner.
 */
export function developFrame(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, takenAt = new Date()): HTMLCanvasElement {
  const ratio = 3 / 4
  let sw = sourceWidth, sh = sourceHeight
  if (sw / sh > ratio) sw = sh * ratio; else sh = sw / ratio
  const sx = (sourceWidth - sw) / 2, sy = (sourceHeight - sh) / 2
  const width = Math.round(Math.min(1200, sw)), height = Math.round(width / ratio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height)

  const image = ctx.getImageData(0, 0, width, height)
  const px = image.data
  const cx = width / 2, cy = height / 2, maxD = Math.hypot(cx, cy)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      let r = px[i], g = px[i + 1], b = px[i + 2]
      // Desaturate a little.
      const lum = .299 * r + .587 * g + .114 * b
      r = lum + (r - lum) * .82; g = lum + (g - lum) * .82; b = lum + (b - lum) * .82
      // Gentle S-curve for contrast, then lift the blacks and warm the whole frame.
      r = curve(r); g = curve(g); b = curve(b)
      r = 22 + r * .9 * 1.06
      g = 18 + g * .9 * 1.0
      b = 26 + b * .9 * .84
      // Vignette.
      const d = Math.hypot(x - cx, y - cy) / maxD
      const v = 1 - .42 * d * d * d
      // Grain.
      const n = (Math.random() - .5) * 22
      px[i] = clamp(r * v + n); px[i + 1] = clamp(g * v + n); px[i + 2] = clamp(b * v + n)
    }
  }
  ctx.putImageData(image, 0, 0)

  // A warm light leak from one edge, different every shot.
  ctx.globalCompositeOperation = 'screen'
  const fromLeft = Math.random() > .5
  const leak = ctx.createRadialGradient(fromLeft ? 0 : width, height * (.2 + Math.random() * .6), 0, fromLeft ? 0 : width, height * .5, width * (.5 + Math.random() * .3))
  leak.addColorStop(0, `rgba(255, 120, 40, ${.32 + Math.random() * .2})`)
  leak.addColorStop(.45, 'rgba(255, 60, 30, .12)')
  leak.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = leak
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'

  // The date stamp, '28 8 24 style.
  const stamp = `'${String(takenAt.getFullYear()).slice(2)} ${takenAt.getMonth() + 1} ${takenAt.getDate()}`
  const size = Math.round(width * .05)
  ctx.font = `600 ${size}px "Courier New", ui-monospace, monospace`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(255, 110, 30, .85)'
  ctx.shadowBlur = size * .5
  ctx.fillStyle = 'rgba(255, 158, 64, .92)'
  ctx.fillText(stamp, width - size * 1.2, height - size * 1.1)
  ctx.shadowBlur = 0
  return canvas
}

const clamp = (value: number) => value < 0 ? 0 : value > 255 ? 255 : value
const curve = (value: number) => { const t = value / 255; return 255 * (t * t * (3 - 2 * t) * .55 + t * .45) }

export const canvasToJpeg = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Couldn’t save that shot.')), 'image/jpeg', .82))
