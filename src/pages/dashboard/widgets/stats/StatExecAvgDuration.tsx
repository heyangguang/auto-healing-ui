import { ClockCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatExecAvgDuration: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('execution');
    const seconds = Number(data?.avg_duration_sec ?? 0);
    const display = seconds >= 60 ? `${(seconds / 60).toFixed(1)}m` : `${seconds.toFixed(0)}s`;
    return (
        <WidgetWrapper title="平均执行时长" icon={<ClockCircleOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={display} description="已完成任务的平均时长" color="#722ed1" />
        </WidgetWrapper>
    );
};
export default StatExecAvgDuration;
