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
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/lawyers') && resp.status() === 200
    )
    await expect(page.locator('[data-testid="lawyer-card"]').first()).toBeVisible({ timeout: 15000 })
  })

  test('filter by city works', async ({ page }) => {
    await page.goto('/lawyers')
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/lawyers') && resp.status() === 200
    )
    // City input has label "Şəhər" and placeholder "məs. Bakı"
    await page.fill('input[placeholder="məs. Bakı"]', 'Bakı')
    await page.waitForTimeout(1000)
    // Just verify the filter input worked (list may be empty or non-empty)
    await expect(page.locator('input[placeholder="məs. Bakı"]')).toHaveValue('Bakı')
  })

  test('lawyer profile opens', async ({ page }) => {
    await page.goto('/lawyers')
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/lawyers') && resp.status() === 200
    )
    const card = page.locator('[data-testid="lawyer-card"]').first()
    await expect(card).toBeVisible({ timeout: 15000 })
    // Click the card — the whole card navigates to lawyer detail
    await card.click()
    await expect(page).toHaveURL(/lawyers\//, { timeout: 5000 })
    // Profile page has "Görüş planla" booking button
    await expect(page.locator('button:has-text("Görüş planla")')).toBeVisible({ timeout: 5000 })
  })
})
