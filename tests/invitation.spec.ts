import { expect, test } from '@playwright/test'

test('starts with only an envelope and opens, downloads the calendar and replays', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('article')).toHaveCount(0)
  await expect(page.getByRole('banner')).toHaveCount(0)
  await expect(page.getByRole('contentinfo')).toHaveCount(0)
  await expect(page.getByRole('img')).toHaveCount(0)
  await expect(page.getByRole('button')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
  await page.getByRole('button', { name: 'Open your invitation' }).click()
  await expect(page.getByRole('button', { name: 'Open your invitation' })).toBeDisabled()
  const card = page.getByRole('article')
  await expect(card).toBeFocused({ timeout: 10000 })
  await expect(card).toContainText('Imogen & Dan')
  await expect(card).toContainText('24 August 2028')
  await expect(card).toContainText('Caswell House, Brize Norton')
  await expect(page.getByRole('region', { name: 'What to wear' })).toContainText('As long as you don’t feel beautiful in white.')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('link', { name: /Add to calendar/ }).click()
  expect((await downloadPromise).suggestedFilename()).toBe('imogen-and-dan.ics')
  const calendar = await (await page.request.get('/save-the-date.ics')).text()
  expect(calendar).toContain('DTSTART;VALUE=DATE:20280824')
  expect(calendar).toContain('DTEND;VALUE=DATE:20280825')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Open the envelope again' }).click()
  await expect(card).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open your invitation' })).toBeFocused()
  expect(await page.evaluate(() => scrollY)).toBe(0)
  await page.getByRole('button', { name: 'Open your invitation' }).click()
  await expect(card).toBeFocused({ timeout: 10000 })
  expect(errors).toEqual([])
})

test('keyboard access opens immediately with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Open your invitation' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('article')).toBeFocused({ timeout: 1500 })
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: /Add to calendar/ })).toBeFocused()
})

test('hotel cards have photos, travel estimates, directions and discreet price details', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open your invitation' }).click()
  const section = page.getByRole('region', { name: 'Stay a little longer.' })
  await expect(page.getByText('Planning prices · August 2027')).toHaveCount(0)
  await expect(section).toContainText('Guide prices per double room')
  await expect(section.getByRole('listitem')).toHaveCount(4)
  for (const hotel of await section.getByRole('listitem').all()) {
    await expect(hotel).toContainText(/miles.*min drive to Caswell House/)
    await expect(hotel.getByRole('link', { name: /Directions from/ })).toHaveAttribute('href', /travelmode=driving/)
    await hotel.getByRole('img').scrollIntoViewIfNeeded()
    await hotel.getByRole('img').evaluate((image: HTMLImageElement) => image.decode())
  }
  const lodge = section.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Travelodge Witney' }) })
  await expect(lodge).toContainText('~£101')
  await expect(lodge.locator('dl')).not.toBeVisible()
  await lodge.getByText('About this price').click()
  await expect(lodge.locator('dl')).toContainText('19 August 2027')
  await expect(lodge.locator('dl')).toContainText('£97.99')
  await expect(lodge).toContainText('not a quote for 24 August 2028')
  await expect(lodge.getByRole('link', { name: /View hotel/ })).toHaveAttribute('href', 'https://www.travelodge.co.uk/hotels/681/Witney-hotel')
  const duke = section.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'The Double Red Duke' }) })
  await expect(duke).toContainText('~£271')
  await expect(duke).toContainText('bed & breakfast')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('keeps all ten personal photos at their original aspect ratio', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open your invitation' }).click()
  const photos = page.locator('.engagement-photo img, .photo-gallery img')
  await expect(photos).toHaveCount(10)
  for (const photo of await photos.all()) {
    await photo.scrollIntoViewIfNeeded()
    await photo.evaluate((image: HTMLImageElement) => image.decode())
    const dimensions = await photo.evaluate((image: HTMLImageElement) => ({ natural: image.naturalWidth / image.naturalHeight, displayed: image.width / image.height }))
    expect(Math.abs(dimensions.natural - dimensions.displayed)).toBeLessThan(0.02)
  }
  const urls = await photos.evaluateAll(images => images.map(image => (image as HTMLImageElement).src))
  expect(new Set(urls).size).toBe(10)
})

test('unfolds both paper wings within the screen before handing focus to the page', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const measurements: { left: number; right: number; top: number; bottom: number }[] = []
    ;(window as unknown as { wingBounds: typeof measurements }).wingBounds = measurements
    const measure = () => {
      const intro = document.querySelector('.envelope-intro')
      if (!intro) return
      if (intro.getAttribute('data-phase') === 'unfolding') {
        for (const wing of document.querySelectorAll('.card-gate')) {
          const rect = wing.getBoundingClientRect()
          measurements.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom })
        }
      }
      requestAnimationFrame(measure)
    }
    requestAnimationFrame(measure)
  })
  await page.getByRole('button', { name: 'Open your invitation' }).click()
  await expect(page.locator('[data-phase="extracting"]')).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('article')).toHaveCount(0)
  await expect(page.locator('[data-phase="unfolding"]')).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('article')).toHaveCount(0)
  await expect(page.getByRole('article')).toBeFocused({ timeout: 5000 })
  const bounds = await page.evaluate(() => {
    const values = (window as unknown as { wingBounds: { left: number; right: number; top: number; bottom: number }[] }).wingBounds
    return { count: values.length, left: Math.min(...values.map(r => r.left)), right: Math.max(...values.map(r => r.right)), top: Math.min(...values.map(r => r.top)), bottom: Math.max(...values.map(r => r.bottom)), width: innerWidth, height: innerHeight }
  })
  expect(bounds.count).toBeGreaterThan(5)
  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(bounds.width)
  expect(bounds.top).toBeGreaterThanOrEqual(0)
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})
