import { CalendarOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatIncidentToday: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('incidents');
    return (
        <WidgetWrapper title="今日新增工单" icon={<CalendarOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.today ?? 0} suffix="条" description={`本周 ${data?.this_week ?? 0} 条`} color="#fa8c16" />
        </WidgetWrapper>
    );
};
export default StatIncidentToday;
