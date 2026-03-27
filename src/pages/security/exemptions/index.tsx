import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { history, useAccess } from '@umijs/max';
import { Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import StandardTable, { type StandardColumnDef } from '@/components/StandardTable';
import { getBlacklistExemptions, type ExemptionRecord } from '@/services/auto-healing/blacklistExemption';
import dayjs from 'dayjs';
import ExemptionDetailDrawer from './ExemptionDetailDrawer';
import {
    advancedSearchFields,
    buildStatsBar,
    formatTime,
    headerIcon,
    searchFields,
    SEVERITY_COLORS,
    STATUS_MAP,
} from './exemptionListConfig';

type ExemptionDateRange = [dayjs.Dayjs | null, dayjs.Dayjs | null];
type ExemptionSearchValue =
    | string
    | number
    | boolean
    | dayjs.Dayjs
    | ExemptionDateRange
    | null
    | undefined;

type ExemptionAdvancedSearch = Record<string, ExemptionSearchValue>;
type ExemptionRequestParams = {
    page: number;
    pageSize: number;
    searchField?: string;
    searchValue?: string;
    advancedSearch?: ExemptionAdvancedSearch;
    sorter?: { field: string; order: 'ascend' | 'descend' };
};

type ExemptionApiValue =
    | string
    | number
    | boolean
    | [string | undefined, string | undefined];

type ExemptionApiParams = {
    page: number;
    page_size: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
} & Record<string, ExemptionApiValue | undefined>;

/* ============================== Component ============================== */
const ExemptionListPage: React.FC = () => {
    const access = useAccess();
    const [refreshKey, setRefreshKey] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detail, setDetail] = useState<ExemptionRecord | null>(null);
    const [statsData, setStatsData] = useState({ total: 0, pending: 0, approved: 0 });

    useEffect(() => {
        void (async () => {
            try {
                const [allRes, pendingRes, approvedRes] = await Promise.all([
                    getBlacklistExemptions({ page: 1, page_size: 1 }),
                    getBlacklistExemptions({ page: 1, page_size: 1, status: 'pending' }),
                    getBlacklistExemptions({ page: 1, page_size: 1, status: 'approved' }),
                ]);
                setStatsData({
                    total: Number(allRes?.total ?? 0),
                    pending: Number(pendingRes?.total ?? 0),
                    approved: Number(approvedRes?.total ?? 0),
                });
            } catch {
                setStatsData({ total: 0, pending: 0, approved: 0 });
                message.error('加载豁免统计失败，请稍后重试');
            }
        })();
    }, [refreshKey]);

    /* ---------- Stats bar ---------- */
    const statsBar = useMemo(() => buildStatsBar(statsData.total, statsData.pending, statsData.approved), [statsData]);

    /* ---------- Columns ---------- */
    const columns: StandardColumnDef<ExemptionRecord>[] = useMemo(() => [
        {
            columnKey: 'task_name', columnTitle: '任务模板', dataIndex: 'task_name',
            width: 140, ellipsis: true,
        },
        {
            columnKey: 'rule_name', columnTitle: '豁免规则', dataIndex: 'rule_name',
            width: 120, ellipsis: true,
        },
        {
            columnKey: 'rule_severity', columnTitle: '级别', dataIndex: 'rule_severity', width: 68,
            render: (_, record) => <Tag color={SEVERITY_COLORS[record.rule_severity] || 'default'}>{record.rule_severity}</Tag>,
        },
        {
            columnKey: 'requester_name', columnTitle: '申请人', dataIndex: 'requester_name', width: 72, ellipsis: true,
        },
        {
            columnKey: 'status', columnTitle: '状态', dataIndex: 'status', width: 80,
            render: (_, record) => {
                const statusConfig = STATUS_MAP[record.status];
                return statusConfig
                    ? <Tag color={statusConfig.color} icon={statusConfig.icon} style={{ margin: 0 }}>{statusConfig.label}</Tag>
                    : <Tag>{record.status}</Tag>;
            },
            headerFilters: [
                { label: '待审批', value: 'pending' },
                { label: '已批准', value: 'approved' },
                { label: '已拒绝', value: 'rejected' },
                { label: '已过期', value: 'expired' },
            ],
        },
        {
            columnKey: 'validity_days', columnTitle: '有效期', dataIndex: 'validity_days', width: 65,
            render: (_, record) => `${record.validity_days} 天`,
        },
        {
            columnKey: 'expires_at', columnTitle: '到期时间', dataIndex: 'expires_at', width: 140,
            render: (_, record) => record.expires_at ? formatTime(record.expires_at) : '-',
        },
        {
            columnKey: 'created_at', columnTitle: '申请时间', dataIndex: 'created_at', width: 140,
            sorter: true,
            render: (_, record) => formatTime(record.created_at),
        },
    ], []);

    /* ---------- Data request ---------- */
    const handleRequest = useCallback(async (params: ExemptionRequestParams) => {
        const apiParams: ExemptionApiParams = {
            page: params.page,
            page_size: params.pageSize,
        };
        if (params.searchValue) {
            const searchField = params.searchField === 'rule_name' ? 'rule_name' : 'task_name';
            apiParams[searchField] = params.searchValue;
        }
        if (params.advancedSearch) {
            const normalized: Record<string, ExemptionApiValue> = {};
            Object.entries(params.advancedSearch).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return;
                // StandardTable dateRange passes [dayjs, dayjs]; serialize to plain date strings for query params.
                if (Array.isArray(value) && value.length === 2) {
                    const [from, to] = value;
                    if (!from && !to) return;
                    const fmt = (v: unknown): string | undefined => {
                        if (!v) return undefined;
                        return dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : String(v);
                    };
                    normalized[key] = [from ? fmt(from) : undefined, to ? fmt(to) : undefined];
                    return;
                }
                if (dayjs.isDayjs(value)) {
                    normalized[key] = value.format('YYYY-MM-DD');
                    return;
                }
                normalized[key] = value;
            });
            Object.assign(apiParams, normalized);
        }
        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }
        const res = await getBlacklistExemptions(apiParams);
        const items = res.data || [];
        const total = Number(res.total ?? 0);
        return { data: items, total };
    }, []);

    /* ---------- Drawer ---------- */
    const openDetail = useCallback((record: ExemptionRecord) => {
        setDetail(record);
        setDrawerOpen(true);
    }, []);

    /* ---------- Render ---------- */
    return (
        <>
            <StandardTable<ExemptionRecord>
                key={refreshKey}
                title="安全豁免"
                description="管理针对高危指令黑名单规则的豁免申请。提交后需管理员审批方可生效。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={16}
                preferenceKey="security_exemptions"
                primaryActionLabel="申请豁免"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateExemption}
                onPrimaryAction={() => history.push('/security/exemptions/create')}
            />

            <ExemptionDetailDrawer
                detail={detail}
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setDetail(null);
                }}
            />
        </>
    );
};

export default ExemptionListPage;
