/**
 * Renders the I & D monogram into every app icon (iPhone/Android app in mobile/assets, web app in public/app/icons).
 * Run with `node scripts/render-icons.mjs` after changing the monogram (in the cloud, set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium).
 */
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const b64 = f => 'data:font/woff2;base64,' + readFileSync(f).toString('base64')
const fonts = `
@font-face { font-family: Serif; src: url(${b64(root + '/node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2')}); font-weight: 300 700; }
@font-face { font-family: Sans; src: url(${b64(root + '/node_modules/@fontsource-variable/jost/files/jost-latin-wght-normal.woff2')}); font-weight: 100 900; }`
// mode: full (ring), plain (no ring). ink colour, foil on/off
function svg({ ring = true, ink = '#3f4a2b', foil = true }) {
  const gold = foil ? 'url(#foil)' : ink
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs><linearGradient id="foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#806b3e"/><stop offset=".38" stop-color="#c8a95f"/><stop offset=".5" stop-color="#ecd9a0"/><stop offset=".62" stop-color="#c8a95f"/><stop offset="1" stop-color="#806b3e"/></linearGradient>
  <path id="ring" d="M100 100 m-80 0 a80 80 0 1 1 160 0 a80 80 0 1 1 -160 0"/></defs>
  ${ring ? `<circle cx="100" cy="100" r="96" fill="none" stroke="${gold}" stroke-width="1.6"/>
  <circle cx="100" cy="100" r="91.5" fill="none" stroke="${ink}" stroke-opacity=".4" stroke-width=".7"/>
  <circle cx="100" cy="100" r="68" fill="none" stroke="${ink}" stroke-opacity=".4" stroke-width=".7"/>
  <text fill="${ink}" font-family="Sans" font-size="9.2" letter-spacing="2.6" font-weight="500"><textPath href="#ring" textLength="498" lengthAdjust="spacing">IMOGEN &amp; DANIEL HOLMES · XXIV · VIII · MMXXVIII ·</textPath></text>` : ''}
  <text x="65" y="122" text-anchor="middle" fill="${ink}" font-family="Serif" font-size="66" font-weight="500">I</text>
  <text x="135" y="122" text-anchor="middle" fill="${ink}" font-family="Serif" font-size="66" font-weight="500">D</text>
  <text x="100" y="119" text-anchor="middle" fill="${gold}" font-family="Serif" font-size="44" font-weight="500">&amp;</text>
  <g transform="translate(100 146)" fill="none" stroke="${gold}" stroke-width="1.2" stroke-linecap="round"><path d="M-22 0 Q0 -5 22 0"/>
  ${[-15,-7,7,15].map(x => `<ellipse cx="${x}" cy="-4.6" rx="3.4" ry="1.5" transform="rotate(${x<0?-28:28} ${x} -4.6)"/>`).join('')}
  ${[-11,11].map(x => `<ellipse cx="${x}" cy="2.6" rx="3.2" ry="1.4" transform="rotate(${x<0?24:-24} ${x} 2.6)"/>`).join('')}</g></svg>`
}
const jobs = [
  // name, size, background, scale of mark, options
  ['mobile/assets/icon.png', 1024, '#f7f4eb', .84, {}],
  ['mobile/assets/android-icon-foreground.png', 1024, null, .6, {}],
  ['mobile/assets/android-icon-background.png', 1024, '#f7f4eb', 0, {}],
  ['mobile/assets/android-icon-monochrome.png', 1024, null, .6, { ink: '#ffffff', foil: false }],
  ['mobile/assets/splash-icon.png', 1024, null, .9, {}],
  ['mobile/assets/notification-icon.png', 96, null, .96, { ring: false, ink: '#ffffff', foil: false }],
  ['mobile/assets/favicon.png', 48, '#f7f4eb', .96, { ring: false }],
  ['public/app/icons/icon-192.png', 192, '#f7f4eb', .86, {}],
  ['public/app/icons/icon-512.png', 512, '#f7f4eb', .86, {}],
  ['public/app/icons/maskable-512.png', 512, '#f7f4eb', .66, {}],
  ['public/app/icons/apple-touch-icon.png', 180, '#f7f4eb', .84, {}],
  ['public/app/icons/badge-96.png', 96, null, .96, { ring: false, ink: '#ffffff', foil: false }],
]
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {})
const page = await browser.newPage()
for (const [name, size, bg, scale, opts] of jobs) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><head><style>${fonts} html,body{margin:0;width:${size}px;height:${size}px;background:${bg ?? 'transparent'};display:grid;place-items:center} div{width:${size*scale}px;height:${size*scale}px}</style></head><body><div>${scale ? svg(opts) : ''}</div></body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
  const out = root + '/' + name
  mkdirSync(out.split('/').slice(0, -1).join('/'), { recursive: true })
  await page.screenshot({ path: out, omitBackground: !bg })
}
await browser.close()
console.log('ok')
