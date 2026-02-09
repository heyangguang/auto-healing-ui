import { AlertOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getIncidentStats } from '@/services/auto-healing/incidents';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatIncidentTotal: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(getIncidentStats, { formatResult: (r: any) => r });
    const data = rawData as any;
    return (
        <WidgetWrapper title="工单总数" icon={<AlertOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent
                value={data?.total ?? 0}
                suffix="条"
                description={`已扫描 ${data?.scanned ?? 0} · 已匹配 ${data?.matched ?? 0}`}
                color="#1677ff"
            />
        </WidgetWrapper>
    );
};
export default StatIncidentTotal;
