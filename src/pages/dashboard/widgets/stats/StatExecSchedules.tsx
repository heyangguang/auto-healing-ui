import { ScheduleOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatExecSchedules: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('execution');
    return (
        <WidgetWrapper title="定时任务" icon={<ScheduleOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.schedules_total ?? 0} suffix="个" description={`启用 ${data?.schedules_enabled ?? 0}`} color="#13c2c2" />
        </WidgetWrapper>
    );
};
export default StatExecSchedules;
