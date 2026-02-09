import { ScheduleOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getPendingApprovals, getPendingTriggers } from '@/services/auto-healing/healing';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatPendingItems: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawApprovals, loading: l1, refresh: r1 } = useRequest(() => getPendingApprovals({ page_size: 1 }), { formatResult: (r: any) => r });
    const { data: rawTriggers, loading: l2, refresh: r2 } = useRequest(() => getPendingTriggers({ page_size: 1 }), { formatResult: (r: any) => r });

    const approvals = rawApprovals as any;
    const triggers = rawTriggers as any;
    const approvalCount = approvals?.total ?? 0;
    const triggerCount = triggers?.total ?? 0;
    const total = approvalCount + triggerCount;

    return (
        <WidgetWrapper title="待办事项" icon={<ScheduleOutlined />} loading={l1 || l2} onRefresh={() => { r1(); r2(); }} isEditing={isEditing} onRemove={onRemove}>
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
