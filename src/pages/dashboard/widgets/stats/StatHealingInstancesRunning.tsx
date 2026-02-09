import { PlayCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatHealingInstancesRunning: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    return (
        <WidgetWrapper title="运行中实例" icon={<PlayCircleOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.instances_running ?? 0} suffix="个" description={`总计 ${data?.instances_total ?? 0}`} color="#1677ff" />
        </WidgetWrapper>
    );
};
export default StatHealingInstancesRunning;
