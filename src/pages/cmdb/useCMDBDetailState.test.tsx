import { act, renderHook, waitFor } from '@testing-library/react';
import { useCMDBDetailState } from './useCMDBDetailState';
import { getCMDBItem, getCMDBMaintenanceLogs } from '@/services/auto-healing/cmdb';

jest.mock('@/services/auto-healing/cmdb', () => ({
  getCMDBItem: jest.fn(),
  getCMDBMaintenanceLogs: jest.fn(),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useCMDBDetailState', () => {
  it('keeps the latest detail request when earlier requests resolve late', async () => {
    const detailA = createDeferred<AutoHealing.CMDBItem>();
    const detailB = createDeferred<AutoHealing.CMDBItem>();
    const logsA = createDeferred<AutoHealing.PaginatedResponse<AutoHealing.CMDBMaintenanceLog>>();
    const logsB = createDeferred<AutoHealing.PaginatedResponse<AutoHealing.CMDBMaintenanceLog>>();

    (getCMDBItem as jest.Mock)
      .mockReturnValueOnce(detailA.promise)
      .mockReturnValueOnce(detailB.promise);
    (getCMDBMaintenanceLogs as jest.Mock)
      .mockReturnValueOnce(logsA.promise)
      .mockReturnValueOnce(logsB.promise);

    const { result } = renderHook(() => useCMDBDetailState());
    const recordA = { id: 'cmdb-a', name: 'A' } as AutoHealing.CMDBItem;
    const recordB = { id: 'cmdb-b', name: 'B' } as AutoHealing.CMDBItem;

    await act(async () => {
      void result.current.openDetail(recordA);
      void result.current.openDetail(recordB);
    });

    expect(result.current.currentRow?.id).toBe('cmdb-b');
    expect(result.current.detailLoading).toBe(true);

    await act(async () => {
      detailB.resolve({ ...recordB, hostname: 'db-b' } as AutoHealing.CMDBItem);
      logsB.resolve({
        data: [{ id: 'log-b' } as AutoHealing.CMDBMaintenanceLog],
        total: 1,
        page: 1,
        page_size: 20,
      });
      await Promise.all([detailB.promise, logsB.promise]);
    });

    await waitFor(() => {
      expect(result.current.currentRow?.id).toBe('cmdb-b');
      expect(result.current.maintenanceLogs.map((log) => log.id)).toEqual(['log-b']);
      expect(result.current.detailLoading).toBe(false);
    });

    await act(async () => {
      detailA.resolve({ ...recordA, hostname: 'db-a' } as AutoHealing.CMDBItem);
      logsA.resolve({
        data: [{ id: 'log-a' } as AutoHealing.CMDBMaintenanceLog],
        total: 1,
        page: 1,
        page_size: 20,
      });
      await Promise.all([detailA.promise, logsA.promise]);
    });

    await waitFor(() => {
      expect(result.current.currentRow?.id).toBe('cmdb-b');
      expect(result.current.maintenanceLogs.map((log) => log.id)).toEqual(['log-b']);
    });
  });
});
