import { useCallback, useMemo } from 'react';
import type { RefObject } from 'react';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import type { ColumnSettingItem } from './ColumnSettingsModal';
import type { StandardColumnDef } from './types';

type HeaderCellProps = {
  width?: number | string;
  onResizeEnd: (finalWidth: number, allThWidths?: number[]) => void;
};

interface UseStandardTableColumnsParams<T extends object> {
  columnDefs?: StandardColumnDef<T>[];
  columnSettings: ColumnSettingItem[];
  columnWidths: Record<string, number>;
  updateColumnWidths: (
    updater: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>),
  ) => void;
  tableBodyRef: RefObject<HTMLDivElement | null>;
}

export function useStandardTableColumns<T extends object>({
  columnDefs,
  columnSettings,
  columnWidths,
  updateColumnWidths,
  tableBodyRef,
}: UseStandardTableColumnsParams<T>) {
  const handleResizeEnd = useCallback((key: string) => (finalWidth: number, allThWidths?: number[]) => {
    updateColumnWidths((previous) => {
      const next = { ...previous, [key]: finalWidth };

      const visibleKeys = columnSettings.filter((item) => item.visible).map((item) => item.key);
      const missingKeys = visibleKeys.filter((visibleKey) => visibleKey !== key && !(visibleKey in next));
      if (missingKeys.length > 0 && allThWidths && allThWidths.length > 0) {
        let thIndex = 0;
        if (tableBodyRef.current?.querySelector('.ant-table-selection-column')) {
          thIndex = 1;
        }
        for (const visibleKey of visibleKeys) {
          if (visibleKey !== key && !(visibleKey in next) && thIndex < allThWidths.length) {
            next[visibleKey] = allThWidths[thIndex];
          }
          thIndex += 1;
        }
      }

      return next;
    });
  }, [columnSettings, tableBodyRef, updateColumnWidths]);

  const visibleColumns = useMemo<ColumnsType<T>>(() => {
    const visibleKeys = columnSettings.filter((item) => item.visible).map((item) => item.key);
    const orderedColumns: ColumnsType<T> = [];

    for (const key of visibleKeys) {
      const definition = (columnDefs || []).find((column) => column.columnKey === key);
      if (!definition) {
        continue;
      }
      const {
        columnKey,
        columnTitle,
        fixedColumn,
        defaultVisible,
        headerFilters,
        ...antdColumn
      } = definition;
      const width = columnWidths[columnKey] ?? antdColumn.width;
      orderedColumns.push({
        ...antdColumn,
        title: columnTitle,
        key: columnKey,
        width,
        onHeaderCell: (): HeaderCellProps => ({
          width,
          onResizeEnd: handleResizeEnd(columnKey),
        }),
      } as ColumnType<T>);
    }

    return orderedColumns;
  }, [columnDefs, columnSettings, columnWidths, handleResizeEnd]);

  return {
    visibleColumns,
  };
}
