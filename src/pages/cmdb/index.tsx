import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccess } from '@umijs/max';
import { message } from 'antd';
import StandardTable from '@/components/StandardTable';
import SecretsSourceSelector from '@/components/SecretsSourceSelector';
import ConnectionTestResultModal from '@/components/ConnectionTestResultModal';
import {
    batchEnterMaintenance,
    batchResumeFromMaintenance,
    batchTestCMDBConnection,
    enterMaintenance,
    getCMDBItems,
    getCMDBStats,
    resumeFromMaintenance,
    testCMDBConnection,
} from '@/services/auto-healing/cmdb';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { CMDBBatchToolbar } from './CMDBBatchToolbar';
import { CMDBDetailDrawer } from './CMDBDetailDrawer';
import { CMDBMaintenanceModal } from './CMDBMaintenanceModal';
import {
    advancedSearchFields,
    type CMDBRequestParams,
    headerIcon,
    searchFields,
} from './cmdbPageConfig';
import { buildCMDBQueryParams } from './cmdbRequest';
import { CMDBStatsBar } from './CMDBStatsBar';
import { createCMDBColumns } from './cmdbTableColumns';
import { useCMDBDetailState } from './useCMDBDetailState';
import { useCMDBSelectionState } from './useCMDBSelectionState';
import './index.css';

const CMDBList: React.FC = () => {
    const access = useAccess();
    const { closeDetail, currentRow, detailLoading, drawerOpen, maintenanceLogs, openDetail } = useCMDBDetailState();
    const { clearSelection, handleSelectAll, replaceSelectedStatus, rowSelection, selectedRows, updateLatestFilters } = useCMDBSelectionState();

    const [stats, setStats] = useState<AutoHealing.CMDBStats | null>(null);
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [selectSourceModalOpen, setSelectSourceModalOpen] = useState(false);
    const [singleTestTarget, setSingleTestTarget] = useState<AutoHealing.CMDBItem | null>(null);
    const [testing, setTesting] = useState(false);
    const [testResults, setTestResults] = useState<AutoHealing.CMDBBatchConnectionTestResult | null>(null);
    const [testResultModalOpen, setTestResultModalOpen] = useState(false);
    const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [maintenanceTarget, setMaintenanceTarget] = useState<AutoHealing.CMDBItem | null>(null);
    const [maintenanceReason, setMaintenanceReason] = useState('');
    const [maintenanceEndAt, setMaintenanceEndAt] = useState<string>();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = useCallback(() => {
        setRefreshTrigger((count) => count + 1);
    }, []);

    const loadStats = useCallback(async () => {
        try {
            const response = await getCMDBStats();
            setStats(response);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        void loadStats();
    }, [loadStats]);

    useEffect(() => {
        getSecretsSources()
            .then((response) => {
                setSecretsSources(response.data || []);
            })
            .catch(() => {
                // ignore
            });
    }, []);

    const openMaintenanceModal = useCallback((record: AutoHealing.CMDBItem | null) => {
        setMaintenanceTarget(record);
        setMaintenanceModalOpen(true);
    }, []);

    const handleOpenTestModal = useCallback((target: AutoHealing.CMDBItem | null) => {
        setSingleTestTarget(target);
        setSelectSourceModalOpen(true);
    }, []);

    const handleRunTest = useCallback(async (sourceId: string) => {
        setTesting(true);
        try {
            if (singleTestTarget) {
                const response = await testCMDBConnection(singleTestTarget.id, sourceId);
                setTestResults({
                    total: 1,
                    success: response.success ? 1 : 0,
                    failed: response.success ? 0 : 1,
                    results: [response],
                });
            } else {
                const ids = selectedRows.map((row) => row.id);
                const response = await batchTestCMDBConnection(ids, sourceId);
                setTestResults(response);
            }
            setSelectSourceModalOpen(false);
            setTestResultModalOpen(true);
        } catch {
            // handled by global error handler
        } finally {
            setTesting(false);
        }
    }, [selectedRows, singleTestTarget]);

    const handleEnterMaintenance = useCallback(async () => {
        if (!maintenanceReason) {
            message.warning('请输入维护原因');
            return;
        }

        try {
            if (maintenanceTarget) {
                await enterMaintenance(maintenanceTarget.id, maintenanceReason, maintenanceEndAt);
                if (drawerOpen && currentRow?.id === maintenanceTarget.id) {
                    await openDetail(maintenanceTarget);
                }
                message.success('已进入维护模式');
            } else {
                const ids = selectedRows.map((row) => row.id);
                const response = await batchEnterMaintenance(ids, maintenanceReason, maintenanceEndAt);
                if (drawerOpen && currentRow && ids.includes(currentRow.id)) {
                    await openDetail(currentRow);
                }
                message.success(`批量维护成功 (${response.success}/${response.total} 台)`);
            }

            setMaintenanceModalOpen(false);
            setMaintenanceReason('');
            setMaintenanceEndAt(undefined);
            clearSelection();
            triggerRefresh();
            void loadStats();
        } catch {
            // handled by global error handler
        }
    }, [clearSelection, currentRow?.id, drawerOpen, loadStats, maintenanceEndAt, maintenanceReason, maintenanceTarget, openDetail, selectedRows, triggerRefresh]);

    const handleResumeMaintenance = useCallback(async (record: AutoHealing.CMDBItem) => {
        try {
            await resumeFromMaintenance(record.id);
            replaceSelectedStatus(record.id, 'active');
            message.success('已退出维护模式');
            triggerRefresh();
            void loadStats();
            return true;
        } catch {
            // handled by global error handler
            return false;
        }
    }, [loadStats, replaceSelectedStatus, triggerRefresh]);

    const handleBatchResume = useCallback(async () => {
        const ids = selectedRows
            .filter((row) => row.status === 'maintenance')
            .map((row) => row.id);
        if (ids.length === 0) {
            message.warning('没有处于维护模式的主机');
            return;
        }

        try {
            const response = await batchResumeFromMaintenance(ids);
            if (drawerOpen && currentRow && ids.includes(currentRow.id)) {
                await openDetail(currentRow);
            }
            message.success(`批量恢复成功 (${response.success}/${response.total} 台)`);
            clearSelection();
            triggerRefresh();
            void loadStats();
        } catch {
            // handled by global error handler
        }
    }, [clearSelection, loadStats, selectedRows, triggerRefresh]);

    const columns = useMemo(() => createCMDBColumns({
        canTestPlugin: Boolean(access.canTestPlugin),
        canUpdatePlugin: Boolean(access.canUpdatePlugin),
        onOpenDetail: openDetail,
        onOpenMaintenance: openMaintenanceModal,
        onOpenTestModal: handleOpenTestModal,
        onResumeMaintenance: handleResumeMaintenance,
    }), [
        access.canTestPlugin,
        access.canUpdatePlugin,
        handleOpenTestModal,
        handleResumeMaintenance,
        openDetail,
        openMaintenanceModal,
    ]);

    const handleRequest = useCallback(async (params: CMDBRequestParams) => {
        const queryParams = buildCMDBQueryParams(params);
        updateLatestFilters(queryParams);
        const response = await getCMDBItems(queryParams);
        return {
            data: response.data || [],
            total: response.total || 0,
        };
    }, [updateLatestFilters]);

    const statsBar = useMemo(() => <CMDBStatsBar stats={stats} />, [stats]);
    const batchToolbar = useMemo(() => (
        <CMDBBatchToolbar canTestPlugin={Boolean(access.canTestPlugin)} canUpdatePlugin={Boolean(access.canUpdatePlugin)}
            onBatchResume={handleBatchResume} onClearSelection={clearSelection}
            onOpenMaintenance={() => openMaintenanceModal(null)} onOpenTestModal={() => handleOpenTestModal(null)}
            onSelectAll={handleSelectAll} selectedCount={selectedRows.length} />
    ), [
        access.canTestPlugin,
        access.canUpdatePlugin,
        clearSelection,
        handleBatchResume,
        handleOpenTestModal,
        handleSelectAll,
        openMaintenanceModal,
        selectedRows.length,
    ]);

    return (
        <>
            <StandardTable<AutoHealing.CMDBItem>
                refreshTrigger={refreshTrigger}
                tabs={[{ key: 'list', label: '资产列表' }]}
                title="资产管理"
                description="管理和监控所有 IT 基础设施资产，支持 SSH 连接测试、维护模式切换和批量操作。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                extraToolbarActions={batchToolbar}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                rowSelection={rowSelection}
                request={handleRequest}
                defaultPageSize={20}
                preferenceKey="cmdb_assets_v2"
            />

            <CMDBDetailDrawer
                canTestPlugin={Boolean(access.canTestPlugin)}
                canUpdatePlugin={Boolean(access.canUpdatePlugin)}
                item={currentRow}
                loading={detailLoading}
                maintenanceLogs={maintenanceLogs}
                onClose={closeDetail}
                onOpenMaintenance={openMaintenanceModal}
                onOpenTestModal={handleOpenTestModal}
                onResumeMaintenance={handleResumeMaintenance}
                open={drawerOpen}
            />

            <SecretsSourceSelector
                open={selectSourceModalOpen}
                sources={secretsSources}
                targetName={singleTestTarget?.name}
                batchCount={singleTestTarget ? undefined : selectedRows.length}
                loading={testing}
                onConfirm={handleRunTest}
                onCancel={() => setSelectSourceModalOpen(false)}
            />

            <ConnectionTestResultModal
                open={testResultModalOpen}
                results={testResults}
                cmdbItems={singleTestTarget ? [singleTestTarget] : selectedRows}
                onClose={() => setTestResultModalOpen(false)}
            />

            <CMDBMaintenanceModal
                endAt={maintenanceEndAt}
                onCancel={() => {
                    setMaintenanceModalOpen(false);
                    setMaintenanceReason('');
                    setMaintenanceEndAt(undefined);
                }}
                onConfirm={handleEnterMaintenance}
                onEndAtChange={setMaintenanceEndAt}
                onReasonChange={setMaintenanceReason}
                open={maintenanceModalOpen}
                reason={maintenanceReason}
                selectedCount={selectedRows.length}
                target={maintenanceTarget}
            />
        </>
    );
};

export default CMDBList;
