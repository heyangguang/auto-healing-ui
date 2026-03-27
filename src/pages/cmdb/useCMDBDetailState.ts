import { useCallback, useRef, useState } from 'react';
import { getCMDBItem, getCMDBMaintenanceLogs } from '@/services/auto-healing/cmdb';

export function useCMDBDetailState() {
    const requestSequenceRef = useRef(0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [currentRow, setCurrentRow] = useState<AutoHealing.CMDBItem | null>(null);
    const [maintenanceLogs, setMaintenanceLogs] = useState<AutoHealing.CMDBMaintenanceLog[]>([]);

    const openDetail = useCallback(async (record: AutoHealing.CMDBItem) => {
        const requestSequence = requestSequenceRef.current + 1;
        requestSequenceRef.current = requestSequence;
        setCurrentRow(record);
        setMaintenanceLogs([]);
        setDrawerOpen(true);
        setDetailLoading(true);

        try {
            const [detail, logResponse] = await Promise.all([
                getCMDBItem(record.id),
                getCMDBMaintenanceLogs(record.id, { page: 1, page_size: 20 }),
            ]);

            if (requestSequence !== requestSequenceRef.current) {
                return;
            }

            setCurrentRow(detail);
            setMaintenanceLogs(logResponse.data || []);
        } catch {
            if (requestSequence !== requestSequenceRef.current) {
                return;
            }

            setMaintenanceLogs([]);
        } finally {
            if (requestSequence === requestSequenceRef.current) {
                setDetailLoading(false);
            }
        }
    }, []);

    const closeDetail = useCallback(() => {
        requestSequenceRef.current += 1;
        setDrawerOpen(false);
        setCurrentRow(null);
        setMaintenanceLogs([]);
        setDetailLoading(false);
    }, []);

    return {
        closeDetail,
        currentRow,
        detailLoading,
        drawerOpen,
        maintenanceLogs,
        openDetail,
    };
}
