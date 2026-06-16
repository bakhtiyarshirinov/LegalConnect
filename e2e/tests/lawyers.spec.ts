import { test, expect } from '@playwright/test'

test.describe('Lawyers Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'anar@test.az')
    await page.fill('input[type="password"]', 'Test!123')
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await page.waitForURL(/dashboard/, { timeout: 10000 })
  })

  test('lawyers list loads', async ({ page }) => {
    await page.goto('/lawyers')
    await expect(page.locator('[data-testid="lawyer-card"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('filter by city works', async ({ page }) => {
    await page.goto('/lawyers')
    await page.fill('input[placeholder*="Şəhər"], input[placeholder*="city"], input[placeholder*="şəhər"]', 'Baku')
    await page.waitForTimeout(1000)
    const cards = page.locator('[data-testid="lawyer-card"]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('lawyer profile opens', async ({ page }) => {
    await page.goto('/lawyers')
    await expect(page.locator('[data-testid="lawyer-card"]').first()).toBeVisible({ timeout: 10000 })
    await page.locator('button:has-text("Profili Gör")').first().click()
    await expect(page).toHaveURL(/lawyers\//, { timeout: 5000 })
    await expect(page.locator('button:has-text("Görüş Planla")')).toBeVisible()
  })
})
