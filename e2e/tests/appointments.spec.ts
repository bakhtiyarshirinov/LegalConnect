import { test, expect } from '@playwright/test'

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'anar@test.az')
    await page.fill('input[type="password"]', 'Test!123')
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await page.waitForURL(/dashboard/, { timeout: 10000 })
  })

  test('appointments page loads', async ({ page }) => {
    await page.goto('/appointments')
    await expect(page.locator('text=Görüşlər').or(page.locator('h1, h2').first())).toBeVisible({ timeout: 5000 })
  })

  test('can open booking modal', async ({ page }) => {
    await page.goto('/lawyers')
    await expect(page.locator('[data-testid="lawyer-card"]').first()).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Profili Gör")').first().click()
    await page.waitForURL(/lawyers\//, { timeout: 5000 })
    await page.click('button:has-text("Görüş Planla")')
    await expect(page.locator('text=Tarix Seçin').or(page.locator('[role="dialog"]'))).toBeVisible({ timeout: 5000 })
  })
})
