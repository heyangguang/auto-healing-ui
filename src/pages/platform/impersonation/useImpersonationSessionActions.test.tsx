import { act, renderHook } from '@testing-library/react';
import {
  cancelImpersonationRequest,
  exitTenant,
  terminateSession,
} from '@/services/auto-healing/platform/impersonation';
import {
  clearImpersonationState,
  loadImpersonationState,
} from '@/store/impersonation';
import useImpersonationSessionActions from './useImpersonationSessionActions';

jest.mock('@/services/auto-healing/platform/impersonation', () => ({
  cancelImpersonationRequest: jest.fn(),
  exitTenant: jest.fn(),
  terminateSession: jest.fn(),
}));

jest.mock('@/store/impersonation', () => ({
  clearImpersonationState: jest.fn(),
  loadImpersonationState: jest.fn(),
}));

jest.mock('antd', () => ({
  message: {
    success: jest.fn(),
  },
}));

describe('useImpersonationSessionActions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('only clears local impersonation state when terminating the active local session', async () => {
    (terminateSession as jest.Mock).mockResolvedValueOnce({ message: 'ok' });
    (loadImpersonationState as jest.Mock).mockReturnValue({
      isImpersonating: true,
      session: { requestId: 'req-current' },
    });
    const runAction = jest.fn(async (_requestId: string, operation: () => Promise<void>) => {
      await operation();
    });
    const triggerRefresh = jest.fn();
    const { result } = renderHook(() => useImpersonationSessionActions(runAction, triggerRefresh));

    await act(async () => {
      await result.current.handleTerminate({ id: 'req-other', status: 'approved' } as never);
    });

    expect(clearImpersonationState).not.toHaveBeenCalled();
    expect(triggerRefresh).toHaveBeenCalled();
  });

  it('clears local impersonation state when exiting the active local session', async () => {
    (exitTenant as jest.Mock).mockResolvedValueOnce({ message: 'ok' });
    (loadImpersonationState as jest.Mock).mockReturnValue({
      isImpersonating: true,
      session: { requestId: 'req-active' },
    });
    const runAction = jest.fn(async (_requestId: string, operation: () => Promise<void>) => {
      await operation();
    });
    const { result } = renderHook(() => useImpersonationSessionActions(runAction, jest.fn()));

    await act(async () => {
      await result.current.handleExit({ id: 'req-active', status: 'active' } as never);
    });

    expect(clearImpersonationState).toHaveBeenCalled();
  });

  it('cancels a pending request without touching local impersonation state', async () => {
    (cancelImpersonationRequest as jest.Mock).mockResolvedValueOnce({ message: 'ok' });
    const runAction = jest.fn(async (_requestId: string, operation: () => Promise<void>) => {
      await operation();
    });
    const triggerRefresh = jest.fn();
    const { result } = renderHook(() => useImpersonationSessionActions(runAction, triggerRefresh));

    await act(async () => {
      await result.current.handleCancel({ id: 'req-pending', status: 'pending' } as never);
    });

    expect(clearImpersonationState).not.toHaveBeenCalled();
    expect(triggerRefresh).toHaveBeenCalled();
  });
});
