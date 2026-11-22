import {defineConfig} from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL: 'http://localhost:5199',
    channel: process.env.SKILLBOOK_BROWSER || 'chromium',
  },
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    env: {VITE_API_BASE_URL: process.env.SKILLBOOK_TEST_API || ''},
  },
})
