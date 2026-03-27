import { WarningOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

type HealingStatusItem = {
    status?: string;
    count?: number;
};

const StatIncidentPending: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('incidents');
    const pending = (data?.by_healing_status as HealingStatusItem[] | undefined)
        ?.find((s) => s.status === 'pending')?.count ?? 0;
    return (
        <WidgetWrapper title="待处理工单" icon={<WarningOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={pending} suffix="条" description="等待自愈处理" color="#faad14" />
        </WidgetWrapper>
    );
};
export default StatIncidentPending;
