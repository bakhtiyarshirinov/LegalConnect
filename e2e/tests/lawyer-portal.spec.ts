import { test, expect } from '@playwright/test'

test.describe('Lawyer Portal', () => {
  test.use({ baseURL: 'http://localhost:5174' })

  test('lawyer can login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'kamran@test.az')
    await page.fill('input[type="password"]', 'Test!123')
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })

  test('lawyer dashboard loads stats', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'kamran@test.az')
    await page.fill('input[type="password"]', 'Test!123')
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await page.waitForURL(/dashboard/, { timeout: 10000 })
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 })
  })

  test('schedule page loads', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'kamran@test.az')
    await page.fill('input[type="password"]', 'Test!123')
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await page.waitForURL(/dashboard/, { timeout: 10000 })
    await page.goto('/schedule')
    // h1 text is "Mənim cədvəlim"
    await expect(page.locator('h1:has-text("cədvəl")')).toBeVisible({ timeout: 5000 })
  })
})
