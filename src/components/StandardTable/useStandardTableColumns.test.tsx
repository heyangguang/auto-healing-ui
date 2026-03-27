import { renderHook } from '@testing-library/react';
import { useStandardTableColumns } from './useStandardTableColumns';

describe('useStandardTableColumns', () => {
  it('projects visible columns in saved order and applies persisted widths', () => {
    const tableBodyRef = {
      current: null,
    } as React.RefObject<HTMLDivElement | null>;

    const { result } = renderHook(() =>
      useStandardTableColumns({
        columnDefs: [
          { columnKey: 'name', columnTitle: '名称', width: 120, dataIndex: 'name' },
          { columnKey: 'status', columnTitle: '状态', width: 80, dataIndex: 'status' },
        ],
        columnSettings: [
          { key: 'status', title: '状态', fixed: false, visible: true },
          { key: 'name', title: '名称', fixed: false, visible: false },
        ],
        columnWidths: { status: 180 },
        updateColumnWidths: jest.fn(),
        tableBodyRef,
      }),
    );

    expect(result.current.visibleColumns).toHaveLength(1);
    expect(result.current.visibleColumns[0]).toMatchObject({
      title: '状态',
      key: 'status',
      width: 180,
      dataIndex: 'status',
    });
  });
});
