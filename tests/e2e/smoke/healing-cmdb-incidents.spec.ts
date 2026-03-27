import { expect, test } from '@playwright/test';
import { gotoApp } from '../utils/app';
import { loginThroughUi, mockTenantUserSession } from '../utils/mockApi';

test.describe('Healing CMDB Incidents Smoke', () => {
  test('navigates owner-scope list and detail pages', async ({ page }) => {
    await mockTenantUserSession(page);

    await gotoApp(page, '/user/login');
    await loginThroughUi(page);

    await gotoApp(page, '/resources/cmdb');
    await expect(page.getByRole('heading', { name: '资产管理' })).toBeVisible();
    await expect(page.getByText('db-prod-01')).toBeVisible();
    await page.getByText('db-prod-01').click();
    await expect(page.getByText('维护日志')).toBeVisible();
    await expect(page.getByText('巡检窗口', { exact: true })).toBeVisible();

    await gotoApp(page, '/resources/incidents');
    await expect(page.getByRole('heading', { name: '工单管理' })).toBeVisible();
    await expect(page.getByText('磁盘空间不足告警')).toBeVisible();
    await page.getByText('磁盘空间不足告警').click();
    await expect(page.getByText('自愈信息')).toBeVisible();
    await expect(page.locator('.incidents-detail-sub')).toHaveText('INC-1001');

    await gotoApp(page, '/healing/rules');
    await expect(page.getByRole('heading', { name: '自愈规则' })).toBeVisible();
    await expect(page.getByText('磁盘空间告警自动修复')).toBeVisible();
    await page.getByText('磁盘空间告警自动修复').click();
    await expect(page.getByText('匹配条件')).toBeVisible();
    await expect(page.locator('.rule-detail-value').filter({ hasText: '磁盘空间自动修复' }).first()).toBeVisible();

    await gotoApp(page, '/healing/instances');
    await expect(page.getByRole('heading', { name: '流程实例' })).toBeVisible();
    await expect(page.getByText('磁盘空间自动修复').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '详情' })).toBeVisible();
  });
});
