import { expect, test } from '@playwright/test';
import { gotoApp } from '../utils/app';
import {
  loginThroughUi,
  mockAdminRbacSession,
  mockTenantUserSession,
} from '../utils/mockApi';

test.describe('Admin RBAC Smoke', () => {
  test('logs in and renders system permissions data', async ({ page }) => {
    await mockTenantUserSession(page, {
      currentUser: {
        access: 'admin',
        roles: ['admin'],
        permissions: ['dashboard:view', 'user:list', 'role:list', 'audit:list'],
      },
    });

    await gotoApp(page, '/user/login');
    await loginThroughUi(page);
    await expect(page).not.toHaveURL(/\/user\/login$/);

    await page.goto('/system/permissions', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/system\/permissions$/);
    await expect(page.getByText('查看用户').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('user:list').first()).toBeVisible();
  });

  test('logs in and renders platform tenant overview data', async ({ page }) => {
    await mockAdminRbacSession(page);

    await gotoApp(page, '/user/login');
    await loginThroughUi(page);

    await expect(page).toHaveURL(/\/platform\/tenant-overview$/);
    await expect(page.getByText('租户运营总览').first()).toBeVisible();
    await expect(page.getByText('Tenant Atlas').first()).toBeVisible();
    await expect(page.getByText('活跃 1 · 停用 1')).toBeVisible();
  });
});
