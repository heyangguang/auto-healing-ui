import { act, renderHook } from '@testing-library/react';
import { enterTenant } from '@/services/auto-healing/platform/impersonation';
import { saveImpersonationState } from '@/store/impersonation';
import useImpersonationEnterAction from './useImpersonationEnterAction';

jest.mock('@/services/auto-healing/platform/impersonation', () => ({
  enterTenant: jest.fn(),
}));

jest.mock('@/store/impersonation', () => ({
  saveImpersonationState: jest.fn(),
}));

jest.mock('antd', () => ({
  message: {
    success: jest.fn(),
  },
}));

describe('useImpersonationEnterAction', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when the backend does not return an active impersonation session', async () => {
    (enterTenant as jest.Mock).mockResolvedValueOnce({
      id: 'req-1',
      tenant_id: 'tenant-1',
      tenant_name: '租户 A',
      status: 'approved',
    });
    const runAction = jest.fn(async (_requestId: string, operation: () => Promise<void>) => {
      await operation();
    });
    const record = { id: 'req-1' } as never;
    const { result } = renderHook(() => useImpersonationEnterAction(runAction));
    let thrown: unknown;

    await act(async () => {
      try {
        await result.current(record);
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('Impersonation 会话未成功建立');
    expect(saveImpersonationState).not.toHaveBeenCalled();
  });
});
