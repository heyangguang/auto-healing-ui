import { HeartOutlined } from '@ant-design/icons';
import React from 'react';
import { getStatusCount } from '../dashboardOverviewHelpers';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatHealingRate: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('incidents');
    const healed = getStatusCount(data?.by_healing_status, 'healed');
    const failed = getStatusCount(data?.by_healing_status, 'failed');
    const rate = Number(data?.healing_rate ?? 0).toFixed(1);
    return (
        <WidgetWrapper title="自愈成功率" icon={<HeartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent
                value={rate}
                suffix="%"
                description={`成功 ${healed} · 失败 ${failed}`}
                color={Number(rate) >= 50 ? '#52c41a' : '#faad14'}
            />
        </WidgetWrapper>
    );
};
export default StatHealingRate;
