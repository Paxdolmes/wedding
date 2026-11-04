/**
 * Develops a camera shot into a disposable-camera print on the phone, with Skia: crop to 3:4, faded warm tones,
 * lifted blacks, grain, a vignette, a light leak that's different every time and the orange date stamp.
 */
import { BlurStyle, FilterMode, ImageFormat, matchFont, MipmapMode, Skia, TileMode } from '@shopify/react-native-skia'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Platform } from 'react-native'

const FILM = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float2 size;
uniform float seed;
uniform float2 leak;
uniform float leakRadius;
uniform float leakStrength;

float rand(float2 p) { return fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453); }

half4 main(float2 p) {
  float3 c = image.eval(p).rgb;
  float lum = dot(c, float3(0.299, 0.587, 0.114));
  c = mix(float3(lum), c, 0.82);
  c = c * c * (3.0 - 2.0 * c) * 0.55 + c * 0.45;
  c = float3(0.086 + c.r * 0.954, 0.071 + c.g * 0.9, 0.102 + c.b * 0.756);
  float d = length(p - size * 0.5) / length(size * 0.5);
  c *= 1.0 - 0.42 * d * d * d;
  float l = (1.0 - smoothstep(0.0, leakRadius, length(p - leak))) * leakStrength;
  c = 1.0 - (1.0 - c) * (1.0 - float3(1.0, 0.47, 0.16) * l);
  c += (rand(p * 0.73 + seed) - 0.5) * 0.086;
  return half4(half3(clamp(c, 0.0, 1.0)), 1.0);
}`)

export async function developPhoto(picture: { uri: string; width: number; height: number }, takenAt = new Date()): Promise<Uint8Array> {
  // Crop to a 3:4 portrait print and shrink to 1200px wide before developing.
  const ratio = 3 / 4
  let cropW = picture.width, cropH = picture.height
  if (cropW / cropH > ratio) cropW = Math.round(cropH * ratio); else cropH = Math.round(cropW / ratio)
  const context = ImageManipulator.manipulate(picture.uri)
  context.crop({ originX: Math.round((picture.width - cropW) / 2), originY: Math.round((picture.height - cropH) / 2), width: cropW, height: cropH })
  context.resize({ width: Math.min(1200, cropW) })
  const rendered = await context.renderAsync()
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.95, base64: true })
  if (!saved.base64) throw new Error('Couldn’t develop that shot.')

  const source = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(saved.base64))
  if (!source || !FILM) throw new Error('Couldn’t develop that shot.')
  const width = source.width(), height = source.height()
  const surface = Skia.Surface.Make(width, height)
  if (!surface) throw new Error('Couldn’t develop that shot.')
  const canvas = surface.getCanvas()

  const fromLeft = Math.random() > 0.5
  const shader = FILM.makeShaderWithChildren(
    [width, height, Math.random() * 100, fromLeft ? 0 : width, height * (0.2 + Math.random() * 0.6), width * (0.5 + Math.random() * 0.3), 0.32 + Math.random() * 0.2],
    [source.makeShaderOptions(TileMode.Clamp, TileMode.Clamp, FilterMode.Linear, MipmapMode.None)],
  )
  const paint = Skia.Paint()
  paint.setShader(shader)
  canvas.drawRect(Skia.XYWHRect(0, 0, width, height), paint)

  // The date stamp, '28 8 24 style, with a little glow.
  const stamp = `'${String(takenAt.getFullYear()).slice(2)} ${takenAt.getMonth() + 1} ${takenAt.getDate()}`
  const size = Math.round(width * 0.05)
  const font = matchFont({ fontFamily: Platform.select({ ios: 'Courier New', default: 'monospace' }), fontSize: size, fontWeight: 'bold' })
  const x = width - size * 1.2 - font.measureText(stamp).width, y = height - size * 1.1
  const glow = Skia.Paint()
  glow.setColor(Skia.Color('rgba(255, 110, 30, 0.85)'))
  glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, size * 0.25, true))
  canvas.drawText(stamp, x, y, glow, font)
  const ink = Skia.Paint()
  ink.setColor(Skia.Color('rgba(255, 158, 64, 0.92)'))
  canvas.drawText(stamp, x, y, ink, font)

  surface.flush()
  return surface.makeImageSnapshot().encodeToBytes(ImageFormat.JPEG, 82)
}
