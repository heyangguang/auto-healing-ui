import { useCallback } from 'react';
import { message } from 'antd';
import {
  enterTenant,
  type ImpersonationRequest,
} from '@/services/auto-healing/platform/impersonation';
import { saveImpersonationState } from '@/store/impersonation';

export default function useImpersonationEnterAction(
  runAction: (requestId: string, operation: () => Promise<void>) => Promise<void>,
) {
  return useCallback(async (record: ImpersonationRequest) => {
    await runAction(record.id, async () => {
      const entered = await enterTenant(record.id);
      if (entered.status !== 'active' || !entered.session_expires_at) {
        throw new Error('Impersonation 会话未成功建立');
      }
      saveImpersonationState({
        requestId: entered.id,
        tenantId: entered.tenant_id,
        tenantName: entered.tenant_name,
        expiresAt: entered.session_expires_at,
        startedAt: entered.session_started_at || new Date().toISOString(),
      });
      localStorage.setItem('tenant-storage', JSON.stringify({
        currentTenantId: entered.tenant_id,
        currentTenantName: entered.tenant_name,
      }));
      message.success(`已进入「${entered.tenant_name}」租户视角`);
      setTimeout(() => { window.location.href = '/workbench'; }, 500);
    });
  }, [runAction]);
}
