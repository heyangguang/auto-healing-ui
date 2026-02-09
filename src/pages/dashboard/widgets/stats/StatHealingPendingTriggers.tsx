import { SendOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatHealingPendingTriggers: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    return (
        <WidgetWrapper title="待触发工单" icon={<SendOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.pending_triggers ?? 0} suffix="条" description="等待手动触发" color="#fa541c" />
        </WidgetWrapper>
    );
};
export default StatHealingPendingTriggers;
