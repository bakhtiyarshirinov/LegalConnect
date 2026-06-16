import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'client',
      use: { baseURL: 'http://localhost:5173' },
      testMatch: ['auth.spec.ts', 'lawyers.spec.ts', 'appointments.spec.ts', 'chat.spec.ts'],
    },
    {
      name: 'lawyer',
      use: { baseURL: 'http://localhost:5174' },
      testMatch: ['lawyer-portal.spec.ts'],
    },
    {
      name: 'admin',
      use: { baseURL: 'http://localhost:5175' },
      testMatch: ['admin.spec.ts'],
    },
  ],
})
