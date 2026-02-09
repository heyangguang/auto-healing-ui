import { SyncOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatPluginSyncRate: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('plugins');
    return (
        <WidgetWrapper title="同步成功率" icon={<SyncOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={Number(data?.sync_success_rate ?? 0).toFixed(1)} suffix="%" description="插件同步成功率" color="#52c41a" />
        </WidgetWrapper>
    );
};
export default StatPluginSyncRate;
