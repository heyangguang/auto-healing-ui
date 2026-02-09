import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Button } from 'antd';
import { ReloadOutlined, HistoryOutlined } from '@ant-design/icons';
import TaskNavigator from './components/TaskNavigator';
import ExecutionStream from './components/ExecutionStream';
import ForensicDrawer from './components/ForensicDrawer';
import { getExecutionRuns } from '@/services/auto-healing/execution';

const ExecutionLogs: React.FC = () => {
    // State
    const [runs, setRuns] = useState<AutoHealing.ExecutionRun[]>([]);
    const [loadingRuns, setLoadingRuns] = useState(false);

    // Selection State
    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
    const [searchKeyword, setSearchKeyword] = useState<string>(''); // For Execution Stream Search
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined); // For Execution Stream Status
    const [triggerFilter, setTriggerFilter] = useState<string | undefined>(undefined);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

    const [selectedRunId, setSelectedRunId] = useState<string | undefined>(undefined);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [totalRuns, setTotalRuns] = useState(0);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 50;

    // Run Fetching
    const fetchRuns = async (currentPage: number, isReset: boolean) => {
        if (loadingRuns) return;
        setLoadingRuns(true);
        try {
            const params: any = {
                page: currentPage,
                page_size: PAGE_SIZE,
                search: searchKeyword,
                status: statusFilter,
                triggered_by: triggerFilter,
                started_after: dateRange ? dateRange[0].toISOString() : undefined,
                started_before: dateRange ? dateRange[1].toISOString() : undefined,
            };

            if (selectedTaskId) {
                params.task_id = selectedTaskId;
            }

            const res = await getExecutionRuns(params);
            const data = res.data || [];

            if (isReset) {
                setRuns(data);
            } else {
                setRuns(prev => [...prev, ...data]);
            }

            setHasMore(data.length === PAGE_SIZE);
            setPage(currentPage);

            // 后端返回格式是 { data, total, page, page_size }
            setTotalRuns(res.total || data.length);

        } catch (error) {
            console.error(error);
            if (isReset) setRuns([]);
        } finally {
            setLoadingRuns(false);
        }
    };

    useEffect(() => {
        fetchRuns(1, true);
    }, [selectedTaskId, searchKeyword, statusFilter, triggerFilter, dateRange]);

    const handleRefresh = () => {
        fetchRuns(1, true);
    };

    const handleLoadMore = () => {
        if (!loadingRuns && hasMore) {
            fetchRuns(page + 1, false);
        }
    };

    return (
        <PageContainer
            header={{
                title: <><HistoryOutlined /> 执行日志 / LOGS</>,
                subTitle: '全系统取证时间轴',
                extra: [] // Remove extra refresh button, moved to stream toolbar
            }}
            style={{ width: '100%', height: 'calc(100vh - 56px)' }}
        >
            <div style={{ height: 'calc(100vh - 180px)', border: '1px solid #f0f0f0', display: 'flex', background: '#fff' }}>
                {/* Left Pane: Task Navigator (25%) */}
                <div style={{ width: '25%', minWidth: 300, maxWidth: 380, height: '100%' }}>
                    <TaskNavigator
                        loading={false}
                        selectedTaskId={selectedTaskId}
                        onSelectTask={setSelectedTaskId}
                    />
                </div>

                {/* Right Pane: Execution Stream (75%) */}
                <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                    <ExecutionStream
                        runs={runs}
                        total={totalRuns}
                        loading={loadingRuns}
                        onSelectRun={(run) => {
                            // Ensure loading state reset before opening
                            setSelectedRunId(run.id);
                            setDrawerOpen(true);
                        }}
                        onSearch={setSearchKeyword}
                        onStatusChange={setStatusFilter}
                        onTriggerChange={setTriggerFilter}
                        onDateRangeChange={setDateRange}
                        onRefresh={handleRefresh}
                        hasMore={hasMore}
                        onLoadMore={handleLoadMore}
                    />
                </div>
            </div>

            <ForensicDrawer
                open={drawerOpen}
                runId={selectedRunId}
                onClose={() => setDrawerOpen(false)}
            />
        </PageContainer>
    );
};

export default ExecutionLogs;
