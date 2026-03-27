import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { history } from '@umijs/max';
import {
    getTenantStats,
    getTenantTrends,
    type PlatformTenantStatsItem,
    type PlatformTenantStatsSummary,
    type PlatformTenantTrendResponse,
} from '@/services/auto-healing/platform/tenants';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import {
    TenantOverviewCoreStatsRow,
    TenantOverviewEmptyState,
    TenantOverviewHeaderCard,
    TenantOverviewSummaryRow,
    TenantOverviewTopListsRow,
} from './TenantOverviewRows';
import {
    TenantOverviewCoverageRow,
    TenantOverviewRankingsRow,
    TenantOverviewTrendsRow,
} from './TenantOverviewAnalyticsRows';
import './index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type TenantStatsItem = PlatformTenantStatsItem;
type TenantStatsSummary = PlatformTenantStatsSummary;
type TrendData = PlatformTenantTrendResponse;

const TenantOverviewPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [tenants, setTenants] = useState<TenantStatsItem[]>([]);
    const [summary, setSummary] = useState<TenantStatsSummary>({
        total_tenants: 0, active_tenants: 0, disabled_tenants: 0,
        total_users: 0, total_rules: 0, total_instances: 0, total_templates: 0,
    });
    const [trendData, setTrendData] = useState<TrendData>({
        dates: [],
        operations: [],
        audit_logs: [],
        task_executions: [],
    });
    const statsRequestSeqRef = useRef(0);

    const fetchStats = useCallback(async () => {
        const requestSeq = statsRequestSeqRef.current + 1;
        statsRequestSeqRef.current = requestSeq;
        setLoading(true);
        setLoadFailed(false);
        try {
            const [statsResult, trendsResult] = await Promise.allSettled([
                getTenantStats(),
                getTenantTrends({ days: 7 }),
            ]);
            if (statsRequestSeqRef.current !== requestSeq) return;

            if (statsResult.status === 'fulfilled') {
                setTenants(statsResult.value.tenants);
                setSummary(statsResult.value.summary);
            } else {
                setLoadFailed(true);
                message.error('租户运营总览加载失败，请刷新重试');
            }

            if (trendsResult.status === 'fulfilled') {
                setTrendData(trendsResult.value);
            } else {
                setTrendData({ dates: [], operations: [], audit_logs: [], task_executions: [] });
                message.warning('租户趋势数据加载失败，已保留主数据');
            }
        } catch {
            if (statsRequestSeqRef.current === requestSeq) {
                setLoadFailed(true);
                message.error('租户运营总览加载失败，请刷新重试');
            }
        } finally {
            if (statsRequestSeqRef.current === requestSeq) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        void fetchStats();
    }, [fetchStats]);

    const byResource = useMemo(
        () => [...tenants].sort((left, right) => (
            (right.rule_count || 0) + (right.instance_count || 0) + (right.template_count || 0)
            - ((left.rule_count || 0) + (left.instance_count || 0) + (left.template_count || 0))
        )),
        [tenants],
    );

    const byAudit = useMemo(
        () => [...tenants].sort((left, right) => (right.audit_log_count || 0) - (left.audit_log_count || 0)),
        [tenants],
    );

    const totalAudit = useMemo(
        () => tenants.reduce((sum, tenant) => sum + (tenant.audit_log_count || 0), 0),
        [tenants],
    );
    const hasAnyData = useMemo(
        () => tenants.length > 0
            || summary.total_tenants > 0
            || summary.total_users > 0
            || summary.total_rules > 0
            || summary.total_templates > 0
            || trendData.dates.length > 0,
        [summary, tenants, trendData.dates.length],
    );



    return (
        <div className="tenant-overview-dashboard">
            {loadFailed && !loading && !hasAnyData ? (
                <TenantOverviewEmptyState loading={loading} onRefresh={fetchStats} />
            ) : (
                <>
                    <TenantOverviewHeaderCard summary={summary} onRefresh={fetchStats} />
                    <TenantOverviewCoreStatsRow summary={summary} totalAudit={totalAudit} />
                    <TenantOverviewSummaryRow tenants={tenants} summary={summary} totalAudit={totalAudit} />
                    <TenantOverviewTopListsRow tenants={tenants} summary={summary} byAudit={byAudit} />
                    <TenantOverviewRankingsRow
                        tenants={tenants}
                        byResource={byResource}
                        onSelectTenant={(tenantId) => history.push(`/platform/tenants/${tenantId}/members`)}
                    />
                    <TenantOverviewTrendsRow trendData={trendData} />
                    <TenantOverviewCoverageRow tenants={tenants} />
                </>
            )}
        </div>
    );
};

export default TenantOverviewPage;
