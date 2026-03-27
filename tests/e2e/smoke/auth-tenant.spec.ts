import { expect, test } from '@playwright/test';
import { gotoApp } from '../utils/app';
import { loginThroughUi, mockTenantUserSession } from '../utils/mockApi';

test.describe('Auth And Tenant Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockTenantUserSession(page);
  });

  test('logs in and lands on workbench with tenant context', async ({ page }) => {
    await gotoApp(page, '/user/login');
    await loginThroughUi(page);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: /Tenant A/ })).toBeVisible();

    const tenantState = await page.evaluate(() => localStorage.getItem('tenant-storage'));
    expect(tenantState).toContain('tenant-1');
  });

  test('switches tenant context through the tenant switcher', async ({ page }) => {
    await gotoApp(page, '/user/login');
    await loginThroughUi(page);

    const trigger = page.getByRole('button', { name: /Tenant A/ });
    await expect(trigger).toBeVisible();
    await trigger.click();

    await expect(page.getByRole('listbox', { name: '租户列表' })).toBeVisible();
    await page.getByText('Tenant B').click();
    await page.waitForLoadState('networkidle');

    const tenantState = await page.evaluate(() => localStorage.getItem('tenant-storage'));
    expect(tenantState).toContain('tenant-2');
    await expect(page.getByRole('button', { name: /Tenant B/ })).toBeVisible();
  });
});
