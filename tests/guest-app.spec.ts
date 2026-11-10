import { expect, test } from '@playwright/test'

const unique = () => Math.random().toString(36).slice(2, 7)

test('a guest joins, requests and votes for a song, and makes a prediction', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/app/')
  await expect(page.getByRole('img', { name: /monogram/ }).first()).toBeVisible()
  await page.getByLabel('Your name').fill(`Guest ${unique()}`)
  await page.getByRole('button', { name: 'Join the weekend' }).click()
  await expect(page.getByLabel(/days until the wedding/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'From Imogen & Dan' })).toBeVisible()

  await page.getByRole('link', { name: 'Music' }).click()
  const song = `Song ${unique()}`
  await page.getByRole('textbox', { name: 'Song', exact: true }).fill(song)
  await page.getByRole('textbox', { name: 'Artist', exact: true }).fill('The Testers')
  await page.getByRole('button', { name: 'Request it' }).click()
  const vote = page.getByRole('button', { name: `Remove vote for ${song}` })
  await expect(vote).toHaveAttribute('aria-pressed', 'true')
  await vote.click()
  await expect(page.getByRole('button', { name: `Vote for ${song}` })).toHaveAttribute('aria-pressed', 'false')

  await page.getByRole('link', { name: 'Predictions' }).click()
  const question = page.getByRole('radiogroup', { name: 'Who cries first?' })
  await question.getByRole('radio', { name: 'Imogen' }).click()
  await expect(question.getByRole('radio', { name: 'Imogen' })).toHaveAttribute('aria-checked', 'true')

  await page.getByRole('link', { name: 'My seat' }).click()
  await expect(page.getByRole('heading', { name: 'Find my seat' })).toBeVisible()
  await page.getByRole('link', { name: 'Camera' }).click()
  const filmBox = page.getByRole('region', { name: /20 shots/ })
  await expect(filmBox).toContainText('Use them all, but make them count')
  await expect(filmBox).toContainText('Shared with everyone')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await filmBox.getByRole('button', { name: 'Load the film' }).click()
  await expect(page.getByRole('button', { name: 'Take photo' })).toBeVisible()
  await expect(page.getByText('20 shots. Use them all, but make them count.')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('the couple sign in and send a notification that lands in guests’ messages', async ({ page, browser }) => {
  await page.goto('/app/#host')
  await page.getByLabel(/Passcode/).fill('test-passcode')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Imogen & Dan' })).toBeVisible()
  const title = `🪩 Dancefloor ${unique()}`
  await page.getByLabel('Title').fill(title)
  await page.getByRole('textbox', { name: 'Message' }).fill('The dancefloor is looking suspiciously empty. Fix that.')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Send now' }).click()
  await expect(page.getByRole('status')).toContainText('Sending to')
  await expect(page.locator('.sent-list')).toContainText(title)

  const guest = await (await browser.newContext()).newPage()
  await guest.goto('/app/')
  await guest.getByLabel('Your name').fill(`Guest ${unique()}`)
  await guest.getByRole('button', { name: 'Join the weekend' }).click()
  await expect(guest.getByText(title)).toBeVisible()
})

test('the API locks out guessing at the host code, turns away fake photos and outside links, and its answers are locked down', async ({ request }) => {
  const config = await request.get('/api/config')
  expect(config.headers()['x-content-type-options']).toBe('nosniff')
  expect(config.headers()['x-frame-options']).toBe('DENY')
  expect(config.headers()['referrer-policy']).toBe('no-referrer')

  // Ten wrong codes from one connection, then even the right code has to wait; another connection is unaffected.
  // Cloudflare sets CF-Connecting-IP itself in production; here each run uses its own made-up addresses.
  const address = () => `2001:db8::${Math.floor(Math.random() * 0xffff).toString(16)}:${Math.floor(Math.random() * 0xffff).toString(16)}`
  const guesser = address()
  const login = (code: string, ip: string) => request.post('/api/staff/login', { data: { code }, headers: { 'CF-Connecting-IP': ip } })
  for (let i = 0; i < 10; i++) expect((await login(`WRONG${i}`, guesser)).status()).toBe(403)
  const locked = await login('test-passcode', guesser)
  expect(locked.status()).toBe(429)
  expect((await locked.json()).error).toMatch(/wait 15 minutes/)
  const signedIn = await login('test-passcode', address())
  expect(signedIn.status()).toBe(200)
  const staff = { 'X-Staff-Token': (await signedIn.json()).token }

  // A "photo" that isn't really a JPEG is refused, whatever it claims to be.
  const { token } = await (await request.post('/api/join', { data: { name: `Photo ${unique()}` } })).json()
  const fake = await request.post('/api/photos', { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/jpeg' }, data: Buffer.from(`<html><script>alert(1)</script>${' '.repeat(2000)}</html>`) })
  expect(fake.status()).toBe(400)

  // Tapping a notification can only ever open a page of this site.
  const title = `Link ${unique()}`
  const created = await request.post('/api/staff/notifications', { headers: staff, data: { title, body: 'Testing links', url: 'https://example.com/elsewhere', sendAt: '2099-01-01T12:00:00.000Z' } })
  expect(created.status()).toBe(200)
  const sent = await (await request.get('/api/staff/notifications', { headers: staff })).json() as { id: number; title: string; url: string }[]
  const note = sent.find(n => n.title === title)
  expect(note?.url).toBe('/app/#home')
  await request.delete(`/api/staff/notifications/${note?.id}`, { headers: staff })
})
