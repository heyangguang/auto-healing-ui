import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsyncModalSelector } from './useAsyncModalSelector';

describe('useAsyncModalSelector', () => {
  it('loads data, updates filters and restores selection by detail request', async () => {
    const loadList = jest
      .fn()
      .mockResolvedValueOnce({ items: [{ id: '1', name: 'A' }], total: 1 })
      .mockResolvedValueOnce({ items: [{ id: '2', name: 'B' }], total: 1 });
    const loadDetail = jest.fn().mockResolvedValue({ id: 'selected', name: 'Selected' });

    const { result } = renderHook(() =>
      useAsyncModalSelector({
        open: true,
        value: 'selected',
        initialFilters: { status: undefined as string | undefined },
        loadList,
        loadDetail,
        getId: (item: any) => item.id,
      }),
    );

    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: '1', name: 'A' }]);
    });

    await waitFor(() => {
      expect(result.current.selectedId).toBe('selected');
    });

    act(() => {
      result.current.handleFilterChange('status', 'active');
    });

    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: '2', name: 'B' }]);
    });
  });
});
