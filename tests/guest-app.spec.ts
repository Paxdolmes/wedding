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
