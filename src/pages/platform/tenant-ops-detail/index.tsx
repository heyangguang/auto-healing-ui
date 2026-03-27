import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table } from 'antd';
import StandardTable from '@/components/StandardTable';
import { getTenantStats } from '@/services/auto-healing/platform/tenants';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import '../../../pages/execution/git-repos/index.css';
import './index.css';
import TenantOpsColumns from './TenantOpsColumns';
import TenantOpsExpandedRow from './TenantOpsExpandedRow';
import TenantOpsStatsBar from './TenantOpsStatsBar';
import {
    tenantOpsHeaderIcon,
    tenantOpsSearchFields,
    toSafeCount,
    type TenantOpsSearchParams,
    type TenantStatsItem,
} from './tenantMetrics';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const TenantOpsDetailPage: React.FC = () => {
    const [searchParams, setSearchParams] = useState<TenantOpsSearchParams>({});
    const [tenants, setTenants] = useState<TenantStatsItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { tenants: tenantStats } = await getTenantStats();
            setTenants(tenantStats);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredTenants = useMemo(() => {
        let result = [...tenants];
        const { name, code, status } = searchParams;
        if (name) {
            result = result.filter((tenant) => tenant.name.toLowerCase().includes(name.toLowerCase()));
        }
        if (code) {
            result = result.filter((tenant) => tenant.code.toLowerCase().includes(code.toLowerCase()));
        }
        if (status) {
            result = result.filter((tenant) => tenant.status === status);
        }
        return result;
    }, [tenants, searchParams]);

    const stats = useMemo(() => {
        const total = filteredTenants.length;
        const active = filteredTenants.filter((tenant) => tenant.status === 'active').length;
        const inactive = total - active;
        const totalMembers = filteredTenants.reduce((sum, tenant) => sum + toSafeCount(tenant.member_count), 0);
        const totalRules = filteredTenants.reduce((sum, tenant) => sum + toSafeCount(tenant.rule_count), 0);
        const totalAudit = filteredTenants.reduce((sum, tenant) => sum + toSafeCount(tenant.audit_log_count), 0);
        return { total, active, inactive, totalMembers, totalRules, totalAudit };
    }, [filteredTenants]);

    const handleSearch = useCallback((params: {
        filters?: { field: string; value: string }[];
        advancedSearch?: Record<string, unknown>;
    }) => {
        const nextParams: TenantOpsSearchParams = {};
        if (params.filters?.length) {
            params.filters.forEach((filter) => {
                if (!filter.value) {
                    return;
                }
                if (filter.field === 'name' || filter.field === 'code') {
                    nextParams[filter.field] = filter.value;
                }
                if ((filter.field === 'status' || filter.field === '__enum__status') && (filter.value === 'active' || filter.value === 'disabled')) {
                    nextParams.status = filter.value;
                }
            });
        }

        if (params.advancedSearch) {
            const name = params.advancedSearch.name;
            const code = params.advancedSearch.code;
            const status = params.advancedSearch.status;

            if (typeof name === 'string' && name) {
                nextParams.name = name;
            }
            if (typeof code === 'string' && code) {
                nextParams.code = code;
            }
            if (status === 'active' || status === 'disabled') {
                nextParams.status = status;
            }
        }
        setSearchParams(nextParams);
    }, []);

    return (
        <StandardTable<TenantStatsItem>
            title="租户运营明细"
            description="查看所有租户的详细运营数据，点击展开可查看自动化、基础设施、运营模块的详细配置情况"
            headerIcon={tenantOpsHeaderIcon}
            headerExtra={<TenantOpsStatsBar stats={stats} />}
            searchFields={tenantOpsSearchFields}
            onSearch={handleSearch}
        >
            <Table<TenantStatsItem>
                rowKey="id"
                dataSource={filteredTenants}
                columns={TenantOpsColumns()}
                loading={loading}
                pagination={filteredTenants.length > 15 ? {
                    defaultPageSize: 15,
                    showSizeChanger: true,
                    pageSizeOptions: ['15', '30', '50'],
                    showTotal: (total) => `共 ${total} 条`,
                    size: 'small',
                } : false}
                size="middle"
                scroll={{ x: 1100 }}
                expandable={{
                    expandedRowRender: (record) => <TenantOpsExpandedRow record={record} />,
                    expandRowByClick: true,
                }}
            />
        </StandardTable>
    );
};

export default TenantOpsDetailPage;
