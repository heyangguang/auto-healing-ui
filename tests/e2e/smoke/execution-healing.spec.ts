import { expect, test } from '@playwright/test';
import { gotoApp } from '../utils/app';
import { loginThroughUi, mockTenantUserSession } from '../utils/mockApi';

test.describe('Execution And Healing Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockTenantUserSession(page);
  });

  test('opens execution template list and template detail drawer', async ({ page }) => {
    await gotoApp(page, '/user/login');
    await loginThroughUi(page);
    await gotoApp(page, '/execution/templates');

    await expect(page.getByRole('heading', { name: '任务模板' })).toBeVisible();
    await expect(page.getByRole('button', { name: '创建任务模板' })).toBeVisible();
    await expect(page.getByText('主机健康检查')).toBeVisible();

    await page.getByText('主机健康检查').click();

    await expect(page.getByText('任务模板详情')).toBeVisible();
    await expect(page.getByText('基线巡检', { exact: true })).toBeVisible();
  });

  test('opens healing flow list and flow detail drawer', async ({ page }) => {
    await gotoApp(page, '/user/login');
    await loginThroughUi(page);
    await gotoApp(page, '/healing/flows');

    await expect(page.getByRole('heading', { name: '自愈流程' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新建流程' })).toBeVisible();
    await expect(page.getByText('磁盘空间自动修复')).toBeVisible();

    await page.getByText('磁盘空间自动修复').click();

    await expect(page.getByText('节点类型概要')).toBeVisible();
    await expect(page.getByText('执行清理模板')).toBeVisible();
  });
});
