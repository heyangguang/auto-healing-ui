import { message } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import { getCMDBItemIds, getCMDBItems } from '@/services/auto-healing/cmdb';
import type { CMDBQueryParams, CMDBSelectableItem } from './cmdbPageConfig';
import { normalizeSelectableItem } from './cmdbPageConfig';

export function useCMDBSelectionState() {
    const [selectedRowMap, setSelectedRowMap] = useState<Map<string, CMDBSelectableItem>>(new Map());
    const latestFilterRef = useRef<CMDBQueryParams>({});
    const selectedRows = useMemo(() => Array.from(selectedRowMap.values()), [selectedRowMap]);

    const clearSelection = useCallback(() => {
        setSelectedRowMap(new Map());
    }, []);

    const updateLatestFilters = useCallback((filters: CMDBQueryParams) => {
        latestFilterRef.current = filters;
    }, []);

    const handleSelectAll = useCallback(async () => {
        try {
            const { page, page_size, ...filters } = latestFilterRef.current;
            const hasTextFilters = Boolean(
                filters.name
                || filters.name__exact
                || filters.hostname
                || filters.hostname__exact
                || filters.ip_address
                || filters.ip_address__exact,
            );

            let items: CMDBSelectableItem[] = [];
            if (hasTextFilters) {
                let currentPage = 1;
                while (true) {
                    const response = await getCMDBItems({ ...filters, page: currentPage, page_size: 200 });
                    const batch = (response.data || []).map(normalizeSelectableItem);
                    items.push(...batch);
                    const total = response.total || batch.length;
                    if (items.length >= total || batch.length === 0) {
                        break;
                    }
                    currentPage += 1;
                }
            } else {
                const response = await getCMDBItemIds(filters);
                items = (response || []).map(normalizeSelectableItem);
            }

            const next = new Map<string, CMDBSelectableItem>();
            items.forEach((item) => next.set(item.id, item));
            setSelectedRowMap(next);
            message.success(`已全选 ${items.length} 项`);
        } catch {
            // handled by global error handler
        }
    }, []);

    const replaceSelectedStatus = useCallback((id: string, status: string) => {
        setSelectedRowMap((prev) => {
            if (!prev.has(id)) {
                return prev;
            }
            const next = new Map(prev);
            const selected = next.get(id);
            if (!selected) {
                return prev;
            }
            next.set(id, normalizeSelectableItem({ ...selected, status }));
            return next;
        });
    }, []);

    const rowSelection = useMemo(() => ({
        selectedRowKeys: Array.from(selectedRowMap.keys()),
        preserveSelectedRowKeys: true,
        onChange: (keys: React.Key[], rows: AutoHealing.CMDBItem[]) => {
            const validRows = rows.filter(Boolean);
            const keySet = new Set(keys.map(String));
            setSelectedRowMap((prev) => {
                const next = new Map<string, CMDBSelectableItem>();
                for (const [id, item] of prev) {
                    if (keySet.has(id)) next.set(id, item);
                }
                for (const row of validRows) {
                    if (row?.id && keySet.has(row.id)) {
                        next.set(row.id, normalizeSelectableItem(row));
                    }
                }
                return next;
            });
        },
    }), [selectedRowMap]);

    return {
        clearSelection,
        handleSelectAll,
        replaceSelectedStatus,
        rowSelection,
        selectedRows,
        updateLatestFilters,
    };
}
