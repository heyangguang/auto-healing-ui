import { act, renderHook } from '@testing-library/react';
import { createImpersonationRequest } from '@/services/auto-healing/platform/impersonation';
import { fetchAllPages } from '@/utils/fetchAllPages';
import useImpersonationRequestModal from './useImpersonationRequestModal';

jest.mock('@/services/auto-healing/platform/impersonation', () => ({
  createImpersonationRequest: jest.fn(),
}));

jest.mock('@/services/auto-healing/platform/tenants', () => ({
  getTenants: jest.fn(),
}));

jest.mock('@/utils/fetchAllPages', () => ({
  fetchAllPages: jest.fn(),
}));

jest.mock('antd', () => ({
  message: {
    success: jest.fn(),
  },
}));

describe('useImpersonationRequestModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('surfaces tenant loading failures instead of silently opening an empty modal', async () => {
    const form = {
      resetFields: jest.fn(),
      validateFields: jest.fn(),
    };
    (fetchAllPages as jest.Mock).mockRejectedValueOnce(new Error('租户列表加载失败'));

    const { result } = renderHook(() => useImpersonationRequestModal(form, jest.fn()));
    let thrown: unknown;

    await act(async () => {
      try {
        await result.current.openModal();
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.tenantLoadError).toBe('租户列表加载失败');
  });

  it('rethrows create request failures and keeps the modal open', async () => {
    const form = {
      resetFields: jest.fn(),
      validateFields: jest.fn().mockResolvedValue({
        tenant_id: 'tenant-1',
        duration_minutes: 60,
        reason: '排查问题',
      }),
    };
    const triggerRefresh = jest.fn();
    (fetchAllPages as jest.Mock).mockResolvedValueOnce([{ id: 'tenant-1', name: '租户 A' }]);
    (createImpersonationRequest as jest.Mock).mockRejectedValueOnce(new Error('提交失败'));

    const { result } = renderHook(() => useImpersonationRequestModal(form, triggerRefresh));

    await act(async () => {
      await result.current.openModal();
    });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.handleSubmit();
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe('提交失败');
    expect(result.current.modalOpen).toBe(true);
    expect(triggerRefresh).not.toHaveBeenCalled();
    expect(form.resetFields).not.toHaveBeenCalled();
  });
});
