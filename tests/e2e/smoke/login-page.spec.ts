import { expect, test } from '@playwright/test';
import { gotoApp } from '../utils/app';

test.describe('Login Page Smoke', () => {
  test('renders the login entrypoint', async ({ page }) => {
    await gotoApp(page, '/user/login');

    await expect(page).toHaveURL(/\/user\/login$/);
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
    await expect(page.getByPlaceholder('请输入登录账号')).toBeVisible();
    await expect(page.getByPlaceholder('请输入密码')).toBeVisible();
  });
});
