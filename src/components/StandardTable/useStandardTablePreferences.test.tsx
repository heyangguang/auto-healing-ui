import { act, renderHook, waitFor } from '@testing-library/react';
import { useStandardTablePreferences } from './useStandardTablePreferences';
import { getPreferences, patchPreferences } from '@/services/auto-healing/preferences';

jest.mock('@/services/auto-healing/preferences', () => ({
  getPreferences: jest.fn(),
  patchPreferences: jest.fn(),
}));

const columnDefs = [
  { columnKey: 'name', columnTitle: '名称' },
  { columnKey: 'status', columnTitle: '状态' },
];

describe('useStandardTablePreferences', () => {
  beforeEach(() => {
    (getPreferences as jest.Mock).mockResolvedValue({
      preferences: {},
    });
    (patchPreferences as jest.Mock).mockResolvedValue({
      preferences: {},
    });
  });

  it('loads saved column widths and visibility from user preferences', async () => {
    (getPreferences as jest.Mock).mockResolvedValueOnce({
      preferences: {
        user_table_column_widths: { name: 240 },
        user_table_columns: ['status'],
      },
    });

    const { result } = renderHook(() =>
      useStandardTablePreferences(columnDefs, 'user_table'),
    );

    await waitFor(() => {
      expect(result.current.prefsLoaded).toBe(true);
    });

    expect(result.current.columnWidths).toEqual({ name: 240 });
    expect(result.current.columnSettings).toEqual([
      { key: 'status', title: '状态', fixed: false, visible: true },
      { key: 'name', title: '名称', fixed: false, visible: false },
    ]);
  });

  it('persists column width and visible columns through debounced preference saves', async () => {
    const { result } = renderHook(() =>
      useStandardTablePreferences(columnDefs, 'user_table'),
    );

    await waitFor(() => {
      expect(result.current.prefsLoaded).toBe(true);
    });

    act(() => {
      result.current.updateColumnWidths({ name: 180 });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    act(() => {
      result.current.applyColumnSettings([
        { key: 'name', title: '名称', fixed: false, visible: true },
        { key: 'status', title: '状态', fixed: false, visible: false },
      ]);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    expect(patchPreferences).toHaveBeenNthCalledWith(1, {
      user_table_column_widths: { name: 180 },
    });
    expect(patchPreferences).toHaveBeenNthCalledWith(2, {
      user_table_columns: ['name'],
    });
  });
});
