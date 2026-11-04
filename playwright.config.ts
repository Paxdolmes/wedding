import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests', fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:5173', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: [
    { command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
    // The guest app's backend (worker/), which Vite proxies /api to.
    { command: 'mkdir -p dist && rm -rf .wrangler/test-state && npx wrangler dev --ip 127.0.0.1 --port 8787 --persist-to .wrangler/test-state --var HOST_PASSCODE:test-passcode', url: 'http://127.0.0.1:8787/api/config', reuseExistingServer: !process.env.CI, timeout: 60_000 },
  ],
})
