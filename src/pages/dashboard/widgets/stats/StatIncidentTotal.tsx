import { AlertOutlined } from '@ant-design/icons';
import React from 'react';
import { getIncidentScannedCount } from '../dashboardOverviewHelpers';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatIncidentTotal: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('incidents');
    const scanned = getIncidentScannedCount(data);
    return (
        <WidgetWrapper title="工单总数" icon={<AlertOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent
                value={data?.total ?? 0}
                suffix="条"
                description={`已扫描 ${scanned} · 未扫描 ${data?.unscanned ?? 0}`}
                color="#1677ff"
            />
        </WidgetWrapper>
    );
};
export default StatIncidentTotal;
