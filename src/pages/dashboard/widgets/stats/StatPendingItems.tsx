import { ScheduleOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatPendingItems: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    const approvalCount = data?.pending_approvals ?? 0;
    const triggerCount = data?.pending_triggers ?? 0;
    const total = approvalCount + triggerCount;

    return (
        <WidgetWrapper title="待办事项" icon={<ScheduleOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent
                value={total}
                suffix="项"
                description={`待审批 ${approvalCount} · 待触发 ${triggerCount}`}
                color={total > 0 ? '#ff4d4f' : '#52c41a'}
            />
        </WidgetWrapper>
    );
};
export default StatPendingItems;
