import { test, expect } from '@playwright/test'

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'anar@test.az')
    await page.fill('input[type="password"]', 'Test!123')
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await page.waitForURL(/dashboard/, { timeout: 10000 })
  })

  test('chat page loads', async ({ page }) => {
    await page.goto('/chat')
    await expect(page.locator('h2:has-text("Mesajlar")')).toBeVisible({ timeout: 5000 })
  })
})
