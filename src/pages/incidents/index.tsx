import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import { message, Modal } from 'antd';
import StandardTable from '@/components/StandardTable';
import {
    getIncidents, getIncident, getIncidentStats, resetIncidentScan, batchResetIncidentScan,
} from '@/services/auto-healing/incidents';
import { IncidentBatchToolbar } from './IncidentBatchToolbar';
import { IncidentDetailDrawer } from './IncidentDetailDrawer';
import { IncidentStatsBar } from './IncidentStatsBar';
import {
    advancedSearchFields,
    headerIcon,
    searchFields,
    type IncidentRequestParams,
} from './incidentPageConfig';
import { buildIncidentApiParams } from './incidentRequest';
import { createIncidentColumns } from './incidentTableColumns';
import './index.css';

/* ========== 组件 ========== */
const IncidentList: React.FC = () => {
    const access = useAccess();
    const canResetScan = Boolean(access.canSyncPlugin);
    const detailRequestSequenceRef = useRef(0);
    /* ---- 统计 ---- */
    const [stats, setStats] = useState<AutoHealing.IncidentStats | null>(null);
    const loadStats = useCallback(async () => {
        try {
            const res = await getIncidentStats();
            setStats(res);
        } catch { /* ignore */ }
    }, []);
    useEffect(() => { loadStats(); }, []);

    /* ---- 详情 Drawer ---- */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [currentRow, setCurrentRow] = useState<AutoHealing.Incident | null>(null);

    const reloadCurrentDetail = useCallback(async (incidentId: string) => {
        const requestSequence = detailRequestSequenceRef.current + 1;
        detailRequestSequenceRef.current = requestSequence;
        setDetailLoading(true);
        try {
            const detail = await getIncident(incidentId);
            if (requestSequence !== detailRequestSequenceRef.current) {
                return;
            }
            setCurrentRow(detail);
        } catch {
            if (requestSequence !== detailRequestSequenceRef.current) {
                return;
            }
        } finally {
            if (requestSequence === detailRequestSequenceRef.current) {
                setDetailLoading(false);
            }
        }
    }, []);

    const openDetail = useCallback(async (record: AutoHealing.Incident) => {
        const requestSequence = detailRequestSequenceRef.current + 1;
        detailRequestSequenceRef.current = requestSequence;
        setCurrentRow(record);
        setDrawerOpen(true);
        setDetailLoading(true);
        try {
            const detail = await getIncident(record.id);
            if (requestSequence !== detailRequestSequenceRef.current) {
                return;
            }
            setCurrentRow(detail);
        } catch {
            if (requestSequence !== detailRequestSequenceRef.current) {
                return;
            }
        } finally {
            if (requestSequence === detailRequestSequenceRef.current) {
                setDetailLoading(false);
            }
        }
    }, []);

    /* ---- 选中行（批量操作 — 跨页保持） ---- */
    const [selectedRowMap, setSelectedRowMap] = useState<Map<string, AutoHealing.Incident>>(new Map());
    const selectedRows = useMemo(() => Array.from(selectedRowMap.values()), [selectedRowMap]);

    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = useCallback(() => { setRefreshTrigger(n => n + 1); }, []);

    /* ======= 重置扫描 ======= */
    const handleResetScan = useCallback(async (record: AutoHealing.Incident) => {
        try {
            await resetIncidentScan(record.id);
            message.success('已重置扫描状态');
            if (currentRow?.id === record.id) {
                await reloadCurrentDetail(record.id);
            }
            triggerRefresh();
            void loadStats();
        } catch { /* global error handler */ }
    }, [currentRow?.id, loadStats, reloadCurrentDetail, triggerRefresh]);

    const handleBatchResetScan = useCallback(async () => {
        const ids = selectedRows.map(r => r.id);
        if (ids.length === 0) return;
        Modal.confirm({
            title: '批量重置扫描',
            content: `确定要重置 ${ids.length} 条工单的扫描状态吗？重置后将重新进行规则匹配。`,
            okText: '确定',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const res = await batchResetIncidentScan({ ids });
                    message.success(`成功重置 ${res.affected_count} 条工单`);
                    setSelectedRowMap(new Map());
                    if (currentRow?.id && ids.includes(currentRow.id)) {
                        await reloadCurrentDetail(currentRow.id);
                    }
                    triggerRefresh();
                    void loadStats();
                } catch { /* global error handler */ }
            },
        });
    }, [currentRow?.id, loadStats, reloadCurrentDetail, selectedRows, triggerRefresh]);

    const columns = useMemo(
        () => createIncidentColumns({
            canResetScan,
            onOpenDetail: openDetail,
            onResetScan: handleResetScan,
        }),
        [canResetScan, openDetail, handleResetScan],
    );

    /* ========== 数据请求 ========== */
    const handleRequest = useCallback(async (params: IncidentRequestParams) => {
        const res = await getIncidents(buildIncidentApiParams(params));
        const items = res.data || [];
        const total = res.total || 0;

        return { data: items, total };
    }, []);
    const statsBar = useMemo(() => <IncidentStatsBar stats={stats} />, [stats]);
    const batchToolbar = useMemo(
        () => (
            <IncidentBatchToolbar
                canResetScan={canResetScan}
                onClearSelection={() => setSelectedRowMap(new Map())}
                onResetScan={handleBatchResetScan}
                selectedCount={selectedRows.length}
            />
        ),
        [canResetScan, handleBatchResetScan, selectedRows.length],
    );

    return (
        <>
            <StandardTable<AutoHealing.Incident>
                refreshTrigger={refreshTrigger}
                tabs={[{ key: 'list', label: '工单列表' }]}
                title="工单管理"
                description="集中管理来自 ITSM 系统的工单，支持自动扫描匹配自愈规则并触发自动修复流程。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                extraToolbarActions={batchToolbar}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                rowSelection={{
                    selectedRowKeys: Array.from(selectedRowMap.keys()),
                    preserveSelectedRowKeys: true,
                    onChange: (keys: React.Key[], rows: AutoHealing.Incident[]) => {
                        const validRows = rows.filter(Boolean);
                        const keySet = new Set(keys.map(String));
                        setSelectedRowMap(prev => {
                            const next = new Map<string, AutoHealing.Incident>();
                            for (const [id, item] of prev) {
                                if (keySet.has(id)) next.set(id, item);
                            }
                            for (const row of validRows) {
                                if (row?.id && keySet.has(row.id)) next.set(row.id, row);
                            }
                            return next;
                        });
                    },
                }}
                request={handleRequest}
                defaultPageSize={20}
                preferenceKey="incidents_v2"
            />

            <IncidentDetailDrawer
                canResetScan={canResetScan}
                detailLoading={detailLoading}
                incident={currentRow}
                onClose={() => {
                    detailRequestSequenceRef.current += 1;
                    setDrawerOpen(false);
                    setCurrentRow(null);
                }}
                onResetScan={handleResetScan}
                open={drawerOpen}
            />
        </>
    );
};

export default IncidentList;
