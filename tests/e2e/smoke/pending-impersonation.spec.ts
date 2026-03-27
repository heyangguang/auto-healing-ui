import { expect, test } from '@playwright/test';
import { gotoApp } from '../utils/app';
import { loginThroughUi, mockTenantUserSession } from '../utils/mockApi';
import {
  mockPlatformOwnerScopeApis,
  mockTenantOwnerScopeApis,
} from '../utils/ownerScopeMockApi';

test.describe('Pending And Impersonation Owner Scope Smoke', () => {
  test('tenant owner pages render pending-center, approvals and system messages flows', async ({ page }) => {
    await mockTenantUserSession(page, {
      currentUser: {
        permissions: ['*'],
      },
    });
    await mockTenantOwnerScopeApis(page);

    await gotoApp(page, '/user/login');
    await loginThroughUi(page);

    await gotoApp(page, '/pending/triggers');
    await expect(page.getByRole('heading', { name: '自愈审批' })).toBeVisible();
    await expect(page.getByText('磁盘空间不足')).toBeVisible();
    await page.getByText('磁盘空间不足').click();
    const triggerDialog = page.getByRole('dialog', { name: '工单详情' });
    await expect(triggerDialog).toBeVisible();
    await expect(triggerDialog.getByText('INC-1001', { exact: true })).toBeVisible();

    await gotoApp(page, '/pending/exemptions');
    await expect(page.getByRole('heading', { name: '豁免审批' })).toBeVisible();
    await expect(page.getByText('高危清理任务')).toBeVisible();
    await page.getByText('高危清理任务').click();
    await expect(page.getByText('豁免申请详情')).toBeVisible();
    await expect(page.getByText('sudo rm -rf /')).toBeVisible();

    await gotoApp(page, '/pending/impersonation');
    await expect(page.getByRole('heading', { name: '访问审批' })).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
    await page.getByText('Alice').click();
    await expect(page.getByText('访问请求详情')).toBeVisible();

    await gotoApp(page, '/system/messages');
    await expect(page.getByRole('heading', { name: '站内通知' })).toBeVisible();
    await expect(page.getByText('系统升级通知')).toBeVisible();
    await page.getByText('系统升级通知').click();
    await expect(page.getByText('消息内容')).toBeVisible();
  });

  test('platform owner pages render message composer and impersonation modal', async ({ page }) => {
    await mockTenantUserSession(page, {
      currentUser: {
        access: 'admin',
        is_platform_admin: true,
        permissions: ['*'],
      },
    });
    await mockPlatformOwnerScopeApis(page);

    await gotoApp(page, '/user/login');
    await loginThroughUi(page);

    await gotoApp(page, '/platform/messages');
    await expect(page.getByRole('heading', { name: '平台消息' })).toBeVisible();
    await expect(page.getByText('发送新消息')).toBeVisible();
    await page.getByText('指定租户').click();
    await expect(page.getByText('选择租户')).toBeVisible();

    await gotoApp(page, '/platform/impersonation');
    await expect(page.getByRole('heading', { name: '租户访问管理' })).toBeVisible();
    await expect(page.getByText('Tenant A', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '申请访问' }).click();
    await expect(page.getByText('申请租户访问', { exact: true })).toBeVisible();
  });
});
