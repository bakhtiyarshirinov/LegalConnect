import { test, expect } from '@playwright/test'

test.describe('Admin Portal', () => {
  test('admin can login', async ({ page }) => {
    await page.goto('http://localhost:5175/login')
    await page.fill('input[type="email"]', 'admin@legalconnect.az')
    await page.fill('input[type="password"]', 'Test!123')
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })

  test('pending lawyers visible', async ({ page }) => {
    await page.goto('http://localhost:5175/login')
    await page.fill('input[type="email"]', 'admin@legalconnect.az')
    await page.fill('input[type="password"]', 'Test!123')
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await page.waitForURL(/dashboard/, { timeout: 10000 })
    await page.goto('http://localhost:5175/lawyers')
    await expect(
      page.locator('text=Təsdiq Gözləyir').or(page.locator('text=Vəkillər'))
    ).toBeVisible({ timeout: 5000 })
  })
})
