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
    await expect(page.locator('h1:has-text("Görüşlər")')).toBeVisible({ timeout: 5000 })
  })

  test('can open booking modal', async ({ page }) => {
    await page.goto('/lawyers')
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/lawyers') && resp.status() === 200
    )
    const card = page.locator('[data-testid="lawyer-card"]').first()
    await expect(card).toBeVisible({ timeout: 15000 })
    await card.click()
    await page.waitForURL(/lawyers\//, { timeout: 5000 })
    // Booking button text is "Görüş planla"
    await page.click('button:has-text("Görüş planla")')
    // Modal title is also "Görüş planla", inside has "Tarix seçin" label
    await expect(page.locator('text=Tarix seçin')).toBeVisible({ timeout: 5000 })
  })
})
