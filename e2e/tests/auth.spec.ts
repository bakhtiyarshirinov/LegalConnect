import { test, expect } from '@playwright/test'

const TEST_CLIENT = { email: 'anar@test.az', password: 'Test!123' }

test.describe('Authentication', () => {
  test('client can login successfully', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_CLIENT.email)
    await page.fill('input[type="password"]', TEST_CLIENT.password)
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@test.az')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await expect(page.locator('text=səhvdir').or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 })
  })

  test('logout works', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_CLIENT.email)
    await page.fill('input[type="password"]', TEST_CLIENT.password)
    await page.click('button[type="submit"], button:has-text("Daxil Ol")')
    await page.waitForURL(/dashboard/, { timeout: 10000 })
    await page.click('[data-testid="user-menu"], button:has-text("Çıxış")')
    await expect(page).toHaveURL(/login/, { timeout: 5000 })
  })
})
